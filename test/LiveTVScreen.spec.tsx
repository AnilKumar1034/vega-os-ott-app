import * as React from 'react';
import {render} from '@testing-library/react-native';
import {LiveTVScreen} from '../src/features/live-tv/screens/LiveTVScreen';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    dispatch: jest.fn(),
  }),
}));

describe('LiveTVScreen', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders without crashing', () => {
    const {getByTestId} = render(<LiveTVScreen />);
    expect(getByTestId('live-tv-screen')).toBeTruthy();
  });

  it('handles TV remote back event and navigates to Home', () => {
    const {useTVEventHandler} = require('@amazon-devices/react-native-kepler');

    render(<LiveTVScreen />);

    useTVEventHandler.mock.calls.forEach(([fn]: any) => {
      fn({eventType: 'back', eventKeyAction: 0});
    });

    expect(mockNavigate).toHaveBeenCalledWith('Home');
  });

  it('tests registerGeneratedViewConfig execution', () => {
    const registerGeneratedViewConfig = require('@amazon-devices/react-native-kepler/Libraries/Utilities/registerGeneratedViewConfig');
    const ReactNativeViewConfigRegistry = require('@amazon-devices/react-native-kepler/Libraries/Renderer/shims/ReactNativeViewConfigRegistry');
    registerGeneratedViewConfig('KeplerEPGTest', { uiViewClassName: 'KeplerEPGTest', validAttributes: {} });
    expect(() => ReactNativeViewConfigRegistry.get('KeplerEPGTest')).not.toThrow();
  });
});
