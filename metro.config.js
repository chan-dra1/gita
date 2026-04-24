// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Exclude server-only modules from the web client bundle
config.resolver = config.resolver || {};
config.resolver.blockList = [
  // firebase-admin and its server deps (grpc, google-cloud) are api/ only
  /node_modules\/firebase-admin\/.*/,
  /node_modules\/@google-cloud\/.*/,
  /node_modules\/@grpc\/.*/,
];

module.exports = withNativeWind(config, { input: "./global.css" });
