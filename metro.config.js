// Default Expo Metro config. Extend here if custom resolver/transformer rules
// are ever needed; keep it extending expo/metro-config so Expo's defaults apply.
const { getDefaultConfig } = require('expo/metro-config');

module.exports = getDefaultConfig(__dirname);
