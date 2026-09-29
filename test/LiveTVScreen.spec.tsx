import * as React from 'react';
import {render} from '@testing-library/react-native';
import {LiveTVScreen} from '../src/features/live-tv/screens/LiveTVScreen';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    dispatch: jest.fn(),
  }),
}));

describe('LiveTVScreen', () => {
  it('renders without crashing', () => {
    const {getByTestId} = render(<LiveTVScreen />);
    expect(getByTestId('live-tv-screen')).toBeTruthy();
  });

  it('tests registerGeneratedViewConfig execution', () => {
    const registerGeneratedViewConfig = require('@amazon-devices/react-native-kepler/Libraries/Utilities/registerGeneratedViewConfig');
    const ReactNativeViewConfigRegistry = require('@amazon-devices/react-native-kepler/Libraries/Renderer/shims/ReactNativeViewConfigRegistry');
    registerGeneratedViewConfig('KeplerEPGTest', { uiViewClassName: 'KeplerEPGTest', validAttributes: {} });
    expect(() => ReactNativeViewConfigRegistry.get('KeplerEPGTest')).not.toThrow();
  });
});
