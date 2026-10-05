import React from 'react';
import {act, fireEvent, render} from '@testing-library/react-native';
import {ContentCard} from '../src/components/molecules/ContentCard';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

describe('ContentCard component', () => {
  const defaultProps = {
    id: 'test-card-1',
    title: 'Test Movie',
    image: {uri: 'http://example.com/image.jpg'},
    videoUrl: 'http://example.com/stream.m3u8',
    testID: 'content-card-test',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with title and image', () => {
    const screen = render(<ContentCard {...defaultProps} />);
    expect(screen.getByText('Test Movie')).toBeTruthy();
    expect(screen.getByTestId('content-card-test')).toBeTruthy();
  });

  it('sets focusable to true for TV remote navigation', () => {
    const screen = render(<ContentCard {...defaultProps} />);
    const touchable = screen.getByTestId('content-card-test');
    expect(touchable.props.focusable).toBe(true);
  });

  it('handles TV remote select event to open movie details when focused', () => {
    const {useTVEventHandler} = require('@amazon-devices/react-native-kepler');
    const screen = render(<ContentCard {...defaultProps} />);

    const card = screen.getByTestId('content-card-test');
    act(() => {
      fireEvent(card, 'focus');
    });

    const tvEventHandler = useTVEventHandler.mock.calls
      .map((c: any) => c[0])
      .find((fn: any) => fn?.toString?.().includes('handlePress()'));

    expect(tvEventHandler).toBeDefined();

    tvEventHandler({eventType: 'select', eventKeyAction: 0});
    expect(mockNavigate).toHaveBeenCalledWith('MovieDetail', {
      movie: expect.objectContaining({
        id: 'test-card-1',
        title: 'Test Movie',
      }),
    });
  });

  it('handles TV remote play event to start playback immediately when focused', () => {
    const {useTVEventHandler} = require('@amazon-devices/react-native-kepler');
    const screen = render(<ContentCard {...defaultProps} />);

    const card = screen.getByTestId('content-card-test');
    act(() => {
      fireEvent(card, 'focus');
    });

    const tvEventHandler = useTVEventHandler.mock.calls
      .map((c: any) => c[0])
      .find((fn: any) => fn?.toString?.().includes('handlePress()'));

    expect(tvEventHandler).toBeDefined();

    tvEventHandler({eventType: 'play', eventKeyAction: 0});
    expect(mockNavigate).toHaveBeenCalledWith('VideoPlayer', {
      movie: expect.objectContaining({
        id: 'test-card-1',
        title: 'Test Movie',
      }),
      videoUrl: 'http://example.com/stream.m3u8',
    });
  });

  it('handles TV remote left event when onMenuEscapeLeft is provided and focused', () => {
    const {useTVEventHandler} = require('@amazon-devices/react-native-kepler');
    const mockOnMenuEscapeLeft = jest.fn();
    const screen = render(
      <ContentCard
        {...defaultProps}
        onMenuEscapeLeft={mockOnMenuEscapeLeft}
      />,
    );

    const card = screen.getByTestId('content-card-test');
    act(() => {
      fireEvent(card, 'focus');
    });

    const tvEventHandler = useTVEventHandler.mock.calls
      .map((c: any) => c[0])
      .find((fn: any) => fn?.toString?.().includes('handlePress()'));

    expect(tvEventHandler).toBeDefined();

    act(() => {
      tvEventHandler({eventType: 'left', eventKeyAction: 0});
    });
    expect(mockOnMenuEscapeLeft).toHaveBeenCalledTimes(1);
  });
});
