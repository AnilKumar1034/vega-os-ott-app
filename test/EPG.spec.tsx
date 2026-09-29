import * as React from 'react';
import {render, fireEvent, act} from '@testing-library/react-native';
import {EPG, type EPGActions, type Channel} from '../src/features/live-tv/components/EPG';

const mockChannels: Channel[] = [
  {
    id: 'test-chan-1',
    displayName: 'Test Channel 1',
    logoUrl: 'https://example.com/logo1.png',
    programs: [
      {
        programId: 'prog-1',
        title: 'Morning News',
        startTime: 1720000000000,
        endTime: 1720001800000,
        shortDescription: 'News update',
        extras: {sourceProgram: {id: 'prog-1', title: 'Morning News'}},
      },
      {
        programId: 'prog-2',
        title: 'Movie Showcase',
        startTime: 1720001800000,
        endTime: 1720005400000,
        shortDescription: 'Blockbuster movie',
        extras: {sourceProgram: {id: 'prog-2', title: 'Movie Showcase'}},
      },
    ],
  },
  {
    id: 'test-chan-2',
    displayName: 'Test Channel 2',
    logoUrl: '',
    programs: [
      {
        programId: 'prog-3',
        title: 'Sports Hour',
        startTime: 1720000000000,
        endTime: 1720003600000,
        shortDescription: 'Live football',
        extras: {sourceProgram: {id: 'prog-3', title: 'Sports Hour'}},
      },
    ],
  },
];

describe('EPG Component', () => {
  it('renders correctly and responds to ref actions', () => {
    const onTileFocus = jest.fn();
    const onTilePress = jest.fn();
    const onMenu = jest.fn();
    const onFocusEscapeUp = jest.fn();
    const ref = React.createRef<EPGActions>();

    const {getByText} = render(
      <EPG
        ref={ref}
        onTileFocus={onTileFocus}
        onTilePress={onTilePress}
        onMenu={onMenu}
        onFocusEscapeUp={onFocusEscapeUp}
        timeRange={{
          startTimeMs: 1720000000000,
          initialPosition: 1720000000000,
        }}
      />,
    );

    expect(ref.current).toBeDefined();

    // Populate data
    act(() => {
      ref.current?.resetData(mockChannels, {
        startTimeMs: 1720000000000,
        endTimeMs: 1720005400000,
      });
    });

    expect(getByText('Morning News')).toBeTruthy();
    expect(getByText('Movie Showcase')).toBeTruthy();
    expect(getByText('Sports Hour')).toBeTruthy();
    expect(getByText('Test Channel 2')).toBeTruthy();

    // Test onTilePress
    fireEvent.press(getByText('Morning News'));
    expect(onTilePress).toHaveBeenCalled();
    expect(onTilePress.mock.calls[0][0].payload.program.title).toBe(
      'Morning News',
    );

    // Test onTileFocus
    fireEvent(getByText('Movie Showcase'), 'focus');
    expect(onTileFocus).toHaveBeenCalled();

    // Test updateData
    act(() => {
      ref.current?.updateData([
        {
          id: 'test-chan-3',
          displayName: 'Test Channel 3',
          logoUrl: '',
          programs: [
            {
              programId: 'prog-4',
              title: 'Kids Cartoons',
              startTime: 1720000000000,
              endTime: 1720003600000,
            },
          ],
        },
      ]);
    });

    expect(getByText('Kids Cartoons')).toBeTruthy();

    // Test updateGridStartTime
    act(() => {
      ref.current?.updateGridStartTime(1720000000000, 1720001800000);
    });

    // Test resetViewport and focusOnEPG
    act(() => {
      ref.current?.resetViewport();
      ref.current?.focusOnEPG(true);
      ref.current?.focusOnEPG(false);
    });
  });
});
