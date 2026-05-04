const mobileAppJson = require('./mobile/app.json');

module.exports = () => ({
  expo: {
    ...mobileAppJson.expo,
    android: {
      ...mobileAppJson.expo.android,
      package: mobileAppJson.expo.android?.package ?? 'com.tripwise.app',
    },
    ios: {
      ...mobileAppJson.expo.ios,
      bundleIdentifier: mobileAppJson.expo.ios?.bundleIdentifier ?? 'com.tripwise.app',
    },
  },
});
