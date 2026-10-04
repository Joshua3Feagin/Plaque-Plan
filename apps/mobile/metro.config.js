// Metro config for the Plaque & Plan monorepo.
// Watches the repo root so the app can import workspace packages like
// @maxout/engine, and resolves modules from both the app and the root.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files in the monorepo.
config.watchFolders = [workspaceRoot];

// 2. Resolve modules from the app first, then the workspace root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Avoid resolving the same package from two locations.
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
