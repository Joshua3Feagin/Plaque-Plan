import pypdf, os, glob, sys

out_dir = "Benefits/_extracted"
os.makedirs(out_dir, exist_ok=True)

for pdf_path in sorted(glob.glob("Benefits/*.pdf")):
    base = os.path.splitext(os.path.basename(pdf_path))[0]
    try:
        reader = pypdf.PdfReader(pdf_path)
        text = []
        for i, page in enumerate(reader.pages):
            text.append(f"\n----- PAGE {i+1} -----\n")
            text.append(page.extract_text() or "")
        full = "".join(text)
    except Exception as e:
        full = f"[ERROR extracting {pdf_path}: {e}]"
    out_file = os.path.join(out_dir, base + ".txt")
    with open(out_file, "w", encoding="utf-8") as f:
        f.write(full)
    print(f"{base}: {len(full)} chars -> {out_file}")
