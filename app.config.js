const mobileAppJson = require('./mobile/app.json');

module.exports = () => {
  const expo = {
    ...mobileAppJson.expo,
    entryPoint: 'mobile/index.ts',
    android: {
      ...mobileAppJson.expo.android,
      package: mobileAppJson.expo.android?.package ?? 'com.tripwise.app',
    },
    ios: {
      ...mobileAppJson.expo.ios,
      bundleIdentifier: mobileAppJson.expo.ios?.bundleIdentifier ?? 'com.tripwise.app',
    },
  };

  return { expo };
};
