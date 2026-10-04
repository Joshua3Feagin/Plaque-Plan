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

// 3. Resolve nested dependencies too. Some packages (e.g. aws-amplify) install
//    their own deps under their local node_modules (…/aws-amplify/node_modules/
//    @aws-amplify/auth). Hierarchical lookup must stay ON so Metro can walk up
//    to find them; disabling it breaks the aws-amplify web bundle.
config.resolver.disableHierarchicalLookup = false;

// 4. Honor the "exports" field in package.json. aws-amplify imports subpaths like
//    "@aws-amplify/auth/cognito" that are only declared via package `exports`
//    maps; without this, Metro's web bundler can't resolve them.
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
