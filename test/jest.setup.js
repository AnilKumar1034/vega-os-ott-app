if (typeof jest !== 'undefined') {
  jest.now = () => Date.now();

  try {
    const KeplerNativeModules = require('@amazon-devices/react-native-kepler/Libraries/BatchedBridge/NativeModules');
    KeplerNativeModules.PlatformConstants = {
      interfaceIdiom: 'tv',
      isTesting: true,
      reactNativeVersion: {major: 0, minor: 83, patch: 0},
      forceTouchAvailable: false,
      osVersion: '14.0',
      systemName: 'Kepler',
      getConstants: () => ({
        interfaceIdiom: 'tv',
        isTesting: true,
        reactNativeVersion: {major: 0, minor: 83, patch: 0},
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

  const mockDimensions = {
    window: {fontScale: 1, height: 540, scale: 2, width: 960},
    screen: {fontScale: 1, height: 540, scale: 2, width: 960},
    physical: {fontScale: 1, height: 1080, scale: 2, width: 1920},
  };

  jest.mock('react-native/Libraries/Utilities/Dimensions', () => ({
    __esModule: true,
    default: {
      get: jest.fn(type => mockDimensions[type] || mockDimensions.window),
      set: jest.fn(),
      addEventListener: jest.fn(() => ({remove: jest.fn()})),
      removeEventListener: jest.fn(),
    },
  }));

  jest.mock('react-native/Libraries/Utilities/NativeDeviceInfo', () => ({
    __esModule: true,
    default: {
      addEventListener: jest.fn(),
      addListenerV2: jest.fn(),
      getConstants: () => ({
        Dimensions: mockDimensions,
      }),
      getDimensionsV2: () => ({
        Dimensions: mockDimensions.window,
      }),
    },
  }));

  jest.mock('react-native/src/private/specs_DEPRECATED/modules/NativeDeviceInfo', () => ({
    __esModule: true,
    default: {
      addEventListener: jest.fn(),
      addListenerV2: jest.fn(),
      getConstants: () => ({
        Dimensions: mockDimensions,
      }),
      getDimensionsV2: () => ({
        Dimensions: mockDimensions.window,
      }),
    },
  }));

  const mockLinking = {
    openURL: jest.fn(() => Promise.resolve()),
    canOpenURL: jest.fn(() => Promise.resolve(true)),
    openSettings: jest.fn(() => Promise.resolve()),
    addEventListener: jest.fn(() => ({
      remove: jest.fn(),
    })),
    getInitialURL: jest.fn(() => Promise.resolve(null)),
    sendIntent: jest.fn(() => Promise.resolve()),
    removeEventListener: jest.fn(),
  };

  jest.mock('react-native/Libraries/Linking/Linking', () => ({
    __esModule: true,
    default: mockLinking,
    ...mockLinking,
  }));
  jest.mock('@amazon-devices/react-native-kepler/Libraries/Linking/Linking', () => ({
    __esModule: true,
    default: mockLinking,
    ...mockLinking,
  }));

  const mockAppState = {
    currentState: 'active',
    addEventListener: jest.fn(() => ({
      remove: jest.fn(),
    })),
    removeEventListener: jest.fn(),
  };
  jest.mock('react-native/Libraries/AppState/AppState', () => ({
    __esModule: true,
    default: mockAppState,
    ...mockAppState,
  }));
  jest.mock('@amazon-devices/react-native-kepler/Libraries/AppState/AppState', () => ({
    __esModule: true,
    default: mockAppState,
    ...mockAppState,
  }));

  const mockBackHandler = {
    exitApp: jest.fn(),
    addEventListener: jest.fn(() => ({
      remove: jest.fn(),
    })),
    removeEventListener: jest.fn(),
  };
  jest.mock('react-native/Libraries/Utilities/BackHandler', () => ({
    __esModule: true,
    default: mockBackHandler,
    ...mockBackHandler,
  }));
  jest.mock('@amazon-devices/react-native-kepler/Libraries/Utilities/BackHandler', () => ({
    __esModule: true,
    default: mockBackHandler,
    ...mockBackHandler,
  }));

  const mockAccessibilityInfo = {
    addEventListener: jest.fn(() => ({
      remove: jest.fn(),
    })),
    announceForAccessibility: jest.fn(),
    announceForAccessibilityWithOptions: jest.fn(),
    isBoldTextEnabled: jest.fn(() => Promise.resolve(false)),
    isGrayscaleEnabled: jest.fn(() => Promise.resolve(false)),
    isInvertColorsEnabled: jest.fn(() => Promise.resolve(false)),
    isReduceMotionEnabled: jest.fn(() => Promise.resolve(false)),
    isReduceTransparencyEnabled: jest.fn(() => Promise.resolve(false)),
    isScreenReaderEnabled: jest.fn(() => Promise.resolve(false)),
    setAccessibilityFocus: jest.fn(),
    sendAccessibilityEvent: jest.fn(),
  };
  jest.mock('react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo', () => ({
    __esModule: true,
    default: mockAccessibilityInfo,
    ...mockAccessibilityInfo,
  }));
  jest.mock('@amazon-devices/react-native-kepler/Libraries/Components/AccessibilityInfo/AccessibilityInfo', () => ({
    __esModule: true,
    default: mockAccessibilityInfo,
    ...mockAccessibilityInfo,
  }));

  const mockNativeAnimated = {
    startOperationBatch: jest.fn(),
    finishOperationBatch: jest.fn(),
    createAnimatedNode: jest.fn(),
    updateAnimatedNodeConfig: jest.fn(),
    getValue: jest.fn(),
    startListeningToAnimatedNodeValue: jest.fn(),
    stopListeningToAnimatedNodeValue: jest.fn(),
    connectAnimatedNodes: jest.fn(),
    disconnectAnimatedNodes: jest.fn(),
    startAnimatingNode: jest.fn(),
    stopAnimation: jest.fn(),
    setAnimatedNodeValue: jest.fn(),
    setAnimatedNodeOffset: jest.fn(),
    flattenAnimatedNodeOffset: jest.fn(),
    extractAnimatedNodeOffset: jest.fn(),
    connectAnimatedNodeToView: jest.fn(),
    disconnectAnimatedNodeFromView: jest.fn(),
    restoreDefaultValues: jest.fn(),
    dropAnimatedNode: jest.fn(),
    addAnimatedEventToView: jest.fn(),
    removeAnimatedEventFromView: jest.fn(),
    addListener: jest.fn(),
    removeListeners: jest.fn(),
    queueAndExecuteBatchedOperations: jest.fn(),
  };
  jest.mock('react-native/Libraries/Animated/NativeAnimatedModule', () => ({
    __esModule: true,
    default: mockNativeAnimated,
    ...mockNativeAnimated,
  }));
  jest.mock('react-native/Libraries/Animated/NativeAnimatedTurboModule', () => ({
    __esModule: true,
    default: mockNativeAnimated,
    ...mockNativeAnimated,
  }));
  jest.mock('react-native/src/private/specs_DEPRECATED/modules/NativeAnimatedTurboModule', () => ({
    __esModule: true,
    default: mockNativeAnimated,
    ...mockNativeAnimated,
  }));
  jest.mock('react-native/src/private/specs_DEPRECATED/modules/NativeAnimatedModule', () => ({
    __esModule: true,
    default: mockNativeAnimated,
    ...mockNativeAnimated,
  }));

  jest.mock('@amazon-devices/react-native-kepler/Libraries/Animated/NativeAnimatedModule', () => ({
    __esModule: true,
    default: mockNativeAnimated,
    ...mockNativeAnimated,
  }));
  jest.mock('@amazon-devices/react-native-kepler/Libraries/Animated/NativeAnimatedTurboModule', () => ({
    __esModule: true,
    default: mockNativeAnimated,
    ...mockNativeAnimated,
  }));

  try {
    jest.mock(
      '@amazon-devices/react-native-async-storage__async-storage/lib/commonjs/AsyncStorage.native',
      () => {
        const m = require('@amazon-devices/react-native-async-storage__async-storage/jest/async-storage-mock');
        return {__esModule: true, default: m, ...m};
      },
    );
    jest.mock(
      '@amazon-devices/react-native-async-storage__async-storage',
      () => {
        const m = require('@amazon-devices/react-native-async-storage__async-storage/jest/async-storage-mock');
        return {__esModule: true, default: m, ...m};
      },
    );
    jest.mock(
      '@react-native-async-storage/async-storage',
      () => {
        const m = require('@amazon-devices/react-native-async-storage__async-storage/jest/async-storage-mock');
        return {__esModule: true, default: m, ...m};
      },
    );
  } catch (err) {}

  if (typeof globalThis !== 'undefined') {
    globalThis.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        status: 204,
        json: async () => ({}),
        text: async () => '',
      }),
    );
  }
}
