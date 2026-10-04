// The Bedrock Converse tool loop. Kept independent of the AWS SDK client (the
// Converse call is injected) so it can be unit-tested with a scripted mock.

import { TOOL_SPECS, runTool, type HouseholdRepo, type ToolContext, type AgentCard } from './tools';

export const MAX_TOOL_TURNS = 6;

export const SYSTEM_PROMPT = `You are Plaque & Plan's dental care scheduling assistant for one family.

Rules you must always follow:
- Use the tools for EVERY number. Never state a dollar amount, date, or count unless it came from a tool result. If you need a figure, call a tool.
- Call getHousehold before referring to members, ids, or pending care.
- Never diagnose, give medical or dental advice, or suggest treatment. If asked, say you can only help with cost and scheduling and suggest they ask their dentist.
- Never delay or move urgent care to save money. Urgent items are scheduled as soon as possible.
- Speak in plain language at about a 6th-grade reading level. Keep answers short.
- When the user asks to book or schedule something, use scheduleVisit after you know the member id and treatment item id.
- End every answer with exactly one suggested next step.`;

// Minimal Converse message shapes (a subset of the Bedrock Converse API).
export interface ConverseContentBlock {
  text?: string;
  toolUse?: { toolUseId: string; name: string; input: Record<string, unknown> };
  toolResult?: {
    toolUseId: string;
    content: { json?: unknown; text?: string }[];
    status?: 'success' | 'error';
  };
}

export interface ConverseMessage {
  role: 'user' | 'assistant';
  content: ConverseContentBlock[];
}

export interface ConverseRequest {
  system: { text: string }[];
  messages: ConverseMessage[];
  toolConfig: { tools: typeof TOOL_SPECS };
}

export interface ConverseResponse {
  output: { message: ConverseMessage };
  stopReason: 'end_turn' | 'tool_use' | 'max_tokens' | 'stop_sequence' | string;
}

/** The injected Bedrock Converse call. */
export type ConverseFn = (req: ConverseRequest) => Promise<ConverseResponse>;

export interface AgentReply {
  text: string;
  cards: AgentCard[];
}

/**
 * Run the tool loop until the model stops asking for tools (or we hit the cap).
 * Returns the final text plus any cards emitted by tool runs.
 */
export async function runConversation(
  userMessage: string,
  repo: HouseholdRepo,
  converse: ConverseFn,
): Promise<AgentReply> {
  const ctx: ToolContext = { cards: [] };

  const messages: ConverseMessage[] = [
    { role: 'user', content: [{ text: userMessage }] },
  ];

  let finalText = '';

  for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
    const response = await converse({
      system: [{ text: SYSTEM_PROMPT }],
      messages,
      toolConfig: { tools: TOOL_SPECS },
    });

    const assistantMsg = response.output.message;
    messages.push(assistantMsg);

    const toolUses = assistantMsg.content.filter((b) => b.toolUse);

    // Capture any text the model produced this turn (used as the final answer
    // when it stops requesting tools).
    const textThisTurn = assistantMsg.content
      .map((b) => b.text)
      .filter((t): t is string => Boolean(t))
      .join('\n')
      .trim();
    if (textThisTurn) finalText = textThisTurn;

    if (response.stopReason !== 'tool_use' || toolUses.length === 0) {
      break; // model is done
    }

    // Run each requested tool and feed results back as a single user turn.
    const toolResults: ConverseContentBlock[] = [];
    for (const block of toolUses) {
      const { toolUseId, name, input } = block.toolUse!;
      let result: unknown;
      let status: 'success' | 'error' = 'success';
      try {
        result = await runTool(name, input ?? {}, repo, ctx);
        if (result && typeof result === 'object' && 'error' in (result as object)) {
          status = 'error';
        }
      } catch (err) {
        status = 'error';
        result = { error: err instanceof Error ? err.message : 'tool failed' };
      }
      toolResults.push({
        toolResult: { toolUseId, content: [{ json: result }], status },
      });
    }
    messages.push({ role: 'user', content: toolResults });
  }

  if (!finalText) {
    finalText =
      "I couldn't finish that just now. Try asking again, for example: \"When should we schedule the kids' cleanings?\"";
  }

  return { text: finalText, cards: ctx.cards };
}
