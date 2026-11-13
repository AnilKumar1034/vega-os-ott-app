import React from 'react';
import {act, fireEvent, render} from '@testing-library/react-native';
import {ContentRow} from '../src/components/molecules/ContentRow';
import {HeroCarousel} from '../src/components/molecules/HeroCarousel';
import {CommonSearch} from '../src/components/molecules/CommonSearch';
import {CommonHeader} from '../src/components/molecules/CommonHeader';
import {EPG, type EPGActions} from '../src/features/live-tv/components/EPG';
import {LiveTVScreen} from '../src/features/live-tv/screens/LiveTVScreen';
import {HomeContentRow} from '../src/data/home';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    dispatch: jest.fn(),
  }),
}));

const mockRow: HomeContentRow = {
  id: 'test-row',
  title: 'Test Row',
  layout: 'horizontal',
  items: [
    {id: 'item-0', title: 'Card 0', image: {uri: 'http://example.com/0.jpg'}},
    {id: 'item-1', title: 'Card 1', image: {uri: 'http://example.com/1.jpg'}},
    {id: 'item-2', title: 'Card 2', image: {uri: 'http://example.com/2.jpg'}},
    {id: 'item-3', title: 'Card 3', image: {uri: 'http://example.com/3.jpg'}},
    {id: 'item-4', title: 'Card 4', image: {uri: 'http://example.com/4.jpg'}},
  ],
};

const mockSlides = [
  {
    id: 'slide-1',
    title: 'Hero Title',
    description: 'Hero Desc',
    image: {uri: 'http://example.com/hero.jpg'},
  },
];

describe('Focus Management & Last-Focused Restoration', () => {
  it('1. ContentRow: gives preferred focus to focusedCardIndex, not index 0', () => {
    const onContentFocus = jest.fn();

    // Row rendered with focusedCardIndex = 3 and shouldPreferFocus = true
    const {getByTestId} = render(
      <ContentRow
        row={mockRow}
        onContentFocus={onContentFocus}
        shouldPreferFocus={true}
        focusedCardIndex={3}
      />,
    );

    const card0 = getByTestId('content-card-item-0');
    const card3 = getByTestId('content-card-item-3');

    // Card 0 must NOT have preferred focus
    expect(card0.props.hasTVPreferredFocus).toBe(false);

    // Card 3 MUST have preferred focus (restoring last focused card)
    expect(card3.props.hasTVPreferredFocus).toBe(true);
  });

  it('2. ContentRow: reports the focused card index when focused', () => {
    const onContentFocus = jest.fn();

    const {getByTestId} = render(
      <ContentRow
        row={mockRow}
        onContentFocus={onContentFocus}
        shouldPreferFocus={false}
      />,
    );

    const card2 = getByTestId('content-card-item-2');
    fireEvent(card2, 'focus');

    // Must report card index 2 to parent
    expect(onContentFocus).toHaveBeenCalledWith(2);
  });

  it('3. ContentRow: does not set preferred focus on any card when shouldPreferFocus is false', () => {
    const onContentFocus = jest.fn();

    const {getByTestId} = render(
      <ContentRow
        row={mockRow}
        onContentFocus={onContentFocus}
        shouldPreferFocus={false}
        focusedCardIndex={2}
      />,
    );

    expect(getByTestId('content-card-item-0').props.hasTVPreferredFocus).toBe(
      false,
    );
    expect(getByTestId('content-card-item-2').props.hasTVPreferredFocus).toBe(
      false,
    );
  });

  it('4. HeroCarousel: restores preferred focus to last focused button (list or play)', () => {
    const onContentFocus = jest.fn();

    const {getByTestId, rerender} = render(
      <HeroCarousel
        slides={mockSlides}
        onContentFocus={onContentFocus}
        shouldPreferFocus={true}
      />,
    );

    const playBtn = getByTestId('hero-play-button');
    const listBtn = getByTestId('hero-mylist-button');

    // Initially play button has preferred focus
    expect(playBtn.props.hasTVPreferredFocus).toBe(true);
    expect(listBtn.props.hasTVPreferredFocus).toBe(false);

    // User focuses list button
    fireEvent(listBtn, 'focus');

    // Re-render carousel with shouldPreferFocus = true (e.g. returning to Hero from below)
    rerender(
      <HeroCarousel
        slides={mockSlides}
        onContentFocus={onContentFocus}
        shouldPreferFocus={true}
      />,
    );

    // List button should now have preferred focus (restoring last focused action)
    expect(getByTestId('hero-mylist-button').props.hasTVPreferredFocus).toBe(
      true,
    );
    expect(getByTestId('hero-play-button').props.hasTVPreferredFocus).toBe(
      false,
    );
  });

  it('5. CommonSearch: triggers onFocusEscapeDown when remote down key is pressed', () => {
    const onFocusEscapeDown = jest.fn();
    const onChangeText = jest.fn();

    const {getByTestId} = render(
      <CommonSearch
        value=""
        onChangeText={onChangeText}
        onFocusEscapeDown={onFocusEscapeDown}
      />,
    );

    const input = getByTestId('common-search-input');
    act(() => {
      fireEvent(input, 'focus');
    });

    const {useTVEventHandler} = require('@amazon-devices/react-native-kepler');
    const handler = useTVEventHandler.mock.calls
      .map((call: any) => call[0])
      .find((fn: any) => fn.toString().includes('onFocusEscapeDown'));

    expect(handler).toBeDefined();

    handler({eventType: 'down', eventKeyAction: 0});
    expect(onFocusEscapeDown).toHaveBeenCalledTimes(1);
  });

  it('6. CommonHeader: filter button exposes requestTVFocus and remote handlers', () => {
    const onFilterPress = jest.fn();
    const onFocusEscapeDown = jest.fn();
    const onFocusEscapeLeft = jest.fn();
    const filterRef = React.createRef<any>();

    const {getByTestId} = render(
      <CommonHeader
        title="Live TV"
        filterLabel="Filters"
        onFilterPress={onFilterPress}
        onFocusEscapeDown={onFocusEscapeDown}
        onFocusEscapeLeft={onFocusEscapeLeft}
        filterFocusGuideRef={filterRef}
      />,
    );

    const button = getByTestId('common-header-filter-button');
    expect(button).toBeTruthy();
    expect(filterRef.current).toBeDefined();
    expect(typeof filterRef.current.requestTVFocus).toBe('function');

    // Call programmatic requestTVFocus on filterRef
    act(() => {
      filterRef.current.requestTVFocus();
    });

    const {useTVEventHandler} = require('@amazon-devices/react-native-kepler');
    const headerHandler = useTVEventHandler.mock.calls
      .map((call: any) => call[0])
      .find((fn: any) => fn.toString().includes('isFilterFocusedRef'));

    expect(headerHandler).toBeDefined();

    // Down key escapes down
    headerHandler({eventType: 'down', eventKeyAction: 0});
    expect(onFocusEscapeDown).toHaveBeenCalledTimes(1);

    // Left key escapes left
    headerHandler({eventType: 'left', eventKeyAction: 0});
    expect(onFocusEscapeLeft).toHaveBeenCalledTimes(1);

    // Select key triggers onFilterPress
    headerHandler({eventType: 'select', eventKeyAction: 0});
    expect(onFilterPress).toHaveBeenCalledTimes(1);

    // Back key escapes down to EPG
    headerHandler({eventType: 'back', eventKeyAction: 0});
    expect(onFocusEscapeDown).toHaveBeenCalledTimes(2);
  });

  it('7. EPG: triggers onFocusEscapeUp on row 0 when up key is pressed', () => {
    const onFocusEscapeUp = jest.fn();
    const epgRef = React.createRef<EPGActions>();

    const {getByText} = render(
      <EPG
        ref={epgRef}
        onFocusEscapeUp={onFocusEscapeUp}
        onTileFocus={jest.fn()}
        onTilePress={jest.fn()}
        timeRange={{
          startTimeMs: 1720000000000,
          initialPosition: 1720000000000,
        }}
      />,
    );

    act(() => {
      epgRef.current?.resetData([
        {
          id: 'ch-1',
          displayName: 'Channel 1',
          logoUrl: '',
          programs: [
            {
              programId: 'p-1',
              title: 'Top Show',
              startTime: 1720000000000,
              endTime: 1720003600000,
            },
          ],
        },
      ]);
      epgRef.current?.focusOnEPG(true);
    });

    const tile = getByText('Top Show');
    act(() => {
      fireEvent(tile, 'focus');
    });

    const {useTVEventHandler} = require('@amazon-devices/react-native-kepler');
    const epgHandler = useTVEventHandler.mock.calls
      .map((call: any) => call[0])
      .find((fn: any) => fn.toString().includes('onFocusEscapeUp'));

    expect(epgHandler).toBeDefined();

    // Test with uppercase 'Up' event to verify case-insensitivity
    epgHandler({eventType: 'Up', eventKeyAction: 0});
    expect(onFocusEscapeUp).toHaveBeenCalledTimes(1);
  });

  it('8. LiveTVScreen: pressing filters button opens category menu modal', () => {
    const {getByTestId, getByText, queryByText} = render(<LiveTVScreen />);

    const filterButton = getByTestId('common-header-filter-button');
    expect(filterButton).toBeTruthy();

    // Category modal is not visible initially
    expect(queryByText('Free Channels')).toBeNull();

    // Press filter button
    act(() => {
      fireEvent.press(filterButton);
    });

    // Category modal options are now displayed
    expect(getByText('Free Channels')).toBeTruthy();
  });
});
