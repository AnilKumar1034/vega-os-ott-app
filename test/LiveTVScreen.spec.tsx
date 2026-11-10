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

  it('generates free live EPG data starting from current episode with future episodes', () => {
    const {getFreeLiveEPGData} = require('../src/features/live-tv/data/freeLiveChannels');
    const {getCurrentEPGSlotTimeMs} = require('../src/features/live-tv/utils/epgTimeUtils');
    const epgData = getFreeLiveEPGData();
    const currentSlot = getCurrentEPGSlotTimeMs();

    expect(epgData.startTimeMs).toBe(currentSlot);
    expect(epgData.channels.length).toBeGreaterThan(0);

    const firstChannel = epgData.channels[0];
    expect(firstChannel.programs.length).toBeGreaterThan(1);

    // First program is the current live episode
    expect(firstChannel.programs[0].startTime).toBe(currentSlot);

    // Subsequent programs are future episodes
    for (let i = 1; i < firstChannel.programs.length; i++) {
      expect(firstChannel.programs[i].startTime).toBeGreaterThanOrEqual(
        firstChannel.programs[i - 1].endTime,
      );
    }
  });

  it('opens category modal, isolates side menu, navigates options and selects Free Channels', async () => {
    const {act, fireEvent} = require('@testing-library/react-native');
    const {getByTestId} = render(<LiveTVScreen />);
    const {useTVEventHandler} = require('@amazon-devices/react-native-kepler');
    const {analyticsService} = require('../src/analytics');
    const trackCategorySpy = jest.spyOn(analyticsService, 'trackContentCategorySelected');

    // Open filter modal
    const filterBtn = getByTestId('common-header-filter-button');
    act(() => {
      fireEvent(filterBtn, 'press');
    });

    expect(getByTestId('category-option-all')).toBeTruthy();
    expect(getByTestId('category-option-free')).toBeTruthy();

    // Get the latest TV event handler for LiveTVScreen
    const liveTvHandlers = useTVEventHandler.mock.calls
      .map((call: any) => call[0])
      .filter((fn: any) => fn.toString().includes('isCategoryMenuVisible'));
    const latestHandler = liveTvHandlers[liveTvHandlers.length - 1];

    expect(latestHandler).toBeDefined();

    // Navigate down to 'free'
    act(() => {
      latestHandler({eventType: 'down', eventKeyAction: 0});
    });

    // Press select on 'free'
    act(() => {
      latestHandler({eventType: 'select', eventKeyAction: 0});
    });

    expect(trackCategorySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        category_name: 'Free Channels',
        source_screen: 'LiveTV',
        source_component: 'category_menu',
      }),
    );
  });

  it('dismisses category modal when remote back key is pressed', () => {
    const {act, fireEvent} = require('@testing-library/react-native');
    const {getByTestId, queryByTestId} = render(<LiveTVScreen />);
    const {useTVEventHandler} = require('@amazon-devices/react-native-kepler');

    // Open filter modal
    const filterBtn = getByTestId('common-header-filter-button');
    act(() => {
      fireEvent(filterBtn, 'press');
    });

    expect(getByTestId('category-option-all')).toBeTruthy();

    const liveTvHandlers = useTVEventHandler.mock.calls
      .map((call: any) => call[0])
      .filter((fn: any) => fn.toString().includes('isCategoryMenuVisible'));
    const latestHandler = liveTvHandlers[liveTvHandlers.length - 1];

    expect(latestHandler).toBeDefined();

    // Send back key event
    act(() => {
      latestHandler({eventType: 'back', eventKeyAction: 0});
    });

    // Modal should close
    expect(queryByTestId('category-option-all')).toBeNull();
  });
});
