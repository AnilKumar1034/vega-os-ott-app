import {StyleSheet} from 'react-native';
import {act, fireEvent, render} from '@testing-library/react-native';
import * as React from 'react';
import {
  HeroCarousel,
  HeroSlide,
} from '../src/components/molecules/HeroCarousel';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

const mockSlides: HeroSlide[] = [
  {
    id: 'slide-1',
    eyebrow: 'ORIGINAL',
    title: 'Slide 1 Title',
    description: 'Description 1',
    meta: ['2026', '4K'],
    image: {uri: 'http://example.com/image1.jpg'},
    badge: 'NEW',
  },
  {
    id: 'slide-2',
    eyebrow: 'FEATURED',
    title: 'Slide 2 Title',
    description: 'Description 2',
    meta: ['2025', 'HD'],
    image: {uri: 'http://example.com/image2.jpg'},
    badge: 'POPULAR',
  },
];

describe('HeroCarousel component', () => {
  const mockOnContentFocus = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the first slide title and content', () => {
    const screen = render(
      <HeroCarousel
        slides={mockSlides}
        onContentFocus={mockOnContentFocus}
        testID="hero-carousel"
      />,
    );

    expect(screen.getByTestId('hero-carousel')).toBeTruthy();
    expect(screen.getByText('Slide 1 Title')).toBeTruthy();
    expect(screen.getByText('Description 1')).toBeTruthy();
  });

  it('calls onContentFocus when action buttons are focused', () => {
    const screen = render(
      <HeroCarousel slides={mockSlides} onContentFocus={mockOnContentFocus} />,
    );

    fireEvent(screen.getByTestId('hero-play-button'), 'focus');
    expect(mockOnContentFocus).toHaveBeenCalledTimes(1);

    fireEvent(screen.getByTestId('hero-mylist-button'), 'focus');
    expect(mockOnContentFocus).toHaveBeenCalledTimes(2);
  });

  it('switches slide when pagination dots or navigation arrows are focused', () => {
    const screen = render(
      <HeroCarousel slides={mockSlides} onContentFocus={mockOnContentFocus} />,
    );

    expect(screen.getByText('Slide 1 Title')).toBeTruthy();

    // Focus next slide arrow button
    fireEvent(screen.getByTestId('hero-next-slide'), 'focus');
    expect(screen.getByText('Slide 2 Title')).toBeTruthy();

    // Focus previous slide arrow button
    fireEvent(screen.getByTestId('hero-prev-slide'), 'focus');
    expect(screen.getByText('Slide 1 Title')).toBeTruthy();

    // Focus slide dot 1 directly
    fireEvent(screen.getByTestId('hero-slide-dot-1'), 'focus');
    expect(screen.getByText('Slide 2 Title')).toBeTruthy();
  });

  it('does not scale or enlarge the play button on focus', () => {
    const screen = render(
      <HeroCarousel slides={mockSlides} onContentFocus={mockOnContentFocus} />,
    );

    const playButton = screen.getByTestId('hero-play-button');
    act(() => {
      fireEvent(playButton, 'focus');
    });

    const flatStyle = StyleSheet.flatten(playButton.props.style);
    expect(flatStyle.transform).toBeUndefined();
  });

  it('handles TV remote playpause event to start video playback', () => {
    const {useTVEventHandler} = require('@amazon-devices/react-native-kepler');
    render(
      <HeroCarousel slides={mockSlides} onContentFocus={mockOnContentFocus} />,
    );

    const tvEventHandler = useTVEventHandler.mock.calls
      .map((c: any) => c[0])
      .find((fn: any) => fn?.toString?.().includes('focusedActionRef'));

    expect(tvEventHandler).toBeDefined();

    tvEventHandler({eventType: 'playpause', eventKeyAction: 0});
    expect(mockNavigate).toHaveBeenCalledWith('VideoPlayer', {
      movie: mockSlides[0],
      videoUrl: undefined,
    });
  });

  it('handles TV remote select and left events when play button is focused', () => {
    const {useTVEventHandler} = require('@amazon-devices/react-native-kepler');
    const mockOnMenuEscapeLeft = jest.fn();
    const screen = render(
      <HeroCarousel
        slides={mockSlides}
        onContentFocus={mockOnContentFocus}
        onMenuEscapeLeft={mockOnMenuEscapeLeft}
      />,
    );

    const playButton = screen.getByTestId('hero-play-button');
    act(() => {
      fireEvent(playButton, 'focus');
    });

    const tvEventHandler = useTVEventHandler.mock.calls
      .map((c: any) => c[0])
      .find((fn: any) => fn?.toString?.().includes('focusedActionRef'));

    expect(tvEventHandler).toBeDefined();

    // Select triggers play
    tvEventHandler({eventType: 'select', eventKeyAction: 0});
    expect(mockNavigate).toHaveBeenCalledWith('VideoPlayer', {
      movie: mockSlides[0],
      videoUrl: undefined,
    });

    // Left triggers onMenuEscapeLeft
    tvEventHandler({eventType: 'left', eventKeyAction: 0});
    expect(mockOnMenuEscapeLeft).toHaveBeenCalledTimes(1);
  });
});
