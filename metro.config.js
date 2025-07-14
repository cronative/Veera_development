const { getDefaultConfig } = require('expo/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // Enable CSS support for web
  isCSSEnabled: true,
});

// Add resolver for problematic Node.js modules
config.resolver = {
  ...config.resolver,
  blacklistRE: exclusionList([
    /node_modules\/ws\/.*/,
  ]),
  extraNodeModules: {
    ...config.resolver.extraNodeModules,
    stream: require.resolve('./shims/empty.js'),
    crypto: require.resolve('./shims/empty.js'),
    http: require.resolve('./shims/empty.js'),
    https: require.resolve('./shims/empty.js'),
    net: require.resolve('./shims/empty.js'),
    tls: require.resolve('./shims/empty.js'),
    zlib: require.resolve('./shims/empty.js'),
    path: require.resolve('./shims/empty.js'),
    fs: require.resolve('./shims/empty.js'),
    os: require.resolve('./shims/empty.js'),
    ws: require.resolve('./shims/empty.js'),
  },
};

module.exports = config;