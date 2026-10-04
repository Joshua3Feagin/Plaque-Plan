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

// 5. Force a single copy of React and the renderer across the whole bundle.
//    The dependency tree otherwise contains react 18.2.0, 18.3.1 AND 19.x in
//    nested node_modules (OneDrive scrambled the install); mixing React copies
//    throws at runtime with "Objects are not valid as a React child". Resolve
//    each singleton once from the app's perspective, then HARD-REDIRECT every
//    import of them (including deep ones like "react/jsx-runtime") to that one
//    copy via resolveRequest — which takes priority over nested node_modules,
//    unlike extraNodeModules.
const singletons = ['react', 'react-dom'];
const singletonRoots = {};
const singletonEntries = {};
for (const name of singletons) {
  try {
    const pkgJson = require.resolve(`${name}/package.json`, { paths: [projectRoot] });
    singletonRoots[name] = path.dirname(pkgJson);
    // The real entry file (honours "main"); used for the bare import case.
    singletonEntries[name] = require.resolve(name, { paths: [projectRoot] });
  } catch {
    // Leave unresolved packages to Metro's default resolution.
  }
}

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  for (const name of singletons) {
    const root = singletonRoots[name];
    if (!root) continue;
    if (moduleName === name) {
      // Bare import, e.g. "react" -> the one copy's real entry file.
      return { type: 'sourceFile', filePath: singletonEntries[name] };
    }
    if (moduleName.startsWith(name + '/')) {
      // Subpath import, e.g. "react/jsx-runtime" -> resolve within the one copy.
      const subpath = moduleName.slice(name.length + 1);
      try {
        const filePath = require.resolve(path.join(root, subpath));
        return { type: 'sourceFile', filePath };
      } catch {
        // Fall through to default resolution if the subpath isn't a file.
      }
    }
  }
  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
