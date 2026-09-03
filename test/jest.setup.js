if (typeof jest !== 'undefined') {
  jest.now = () => Date.now();

  try {
    const KeplerNativeModules = require('@amazon-devices/react-native-kepler/Libraries/BatchedBridge/NativeModules');
    KeplerNativeModules.PlatformConstants = {
      interfaceIdiom: 'tv',
      isTesting: true,
      reactNativeVersion: {major: 0, minor: 72, patch: 0},
      forceTouchAvailable: false,
      osVersion: '14.0',
      systemName: 'Kepler',
      getConstants: () => ({
        interfaceIdiom: 'tv',
        isTesting: true,
        reactNativeVersion: {major: 0, minor: 72, patch: 0},
        forceTouchAvailable: false,
        osVersion: '14.0',
        systemName: 'Kepler',
      }),
    };
    try {
      const KeplerPlatform = require('@amazon-devices/react-native-kepler/Libraries/Utilities/Platform.ios');
      if (KeplerPlatform) {
        KeplerPlatform.__constants = KeplerNativeModules.PlatformConstants.getConstants();
      }
    } catch (err) {}
    try {
      const GenericPlatform = require('@amazon-devices/react-native-kepler/Libraries/Utilities/Platform');
      if (GenericPlatform) {
        GenericPlatform.__constants = KeplerNativeModules.PlatformConstants.getConstants();
      }
    } catch (err) {}
  } catch (e) {}
}

if (typeof global !== 'undefined') {
  global.requestAnimationFrame = function (callback) {
    return setTimeout(() => callback(Date.now()), 0);
  };
}


