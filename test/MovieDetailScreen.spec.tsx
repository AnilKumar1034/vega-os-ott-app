import 'react-native';
import {fireEvent, render} from '@testing-library/react-native';
import * as React from 'react';
import {MovieDetailScreen} from '../src/screens/MovieDetailScreen';

const mockNavigate = jest.fn();
const mockRouteParams = {
  params: {
    movie: {
      id: 'test-movie',
      title: 'Inception Test',
      description: 'Test Description for Movie Detail',
      image: {uri: 'http://example.com/test.jpg'},
      rating: '⭐ 8.8 / 10',
      badge: 'TOP 10',
      cast: 'Leonardo DiCaprio',
      director: 'Christopher Nolan',
      meta: ['2010', '4K UHD'],
    },
  },
};

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
  useRoute: () => mockRouteParams,
}));

describe('MovieDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders movie details correctly', () => {
    const screen = render(<MovieDetailScreen />);

    expect(screen.getByTestId('movie-detail-screen')).toBeTruthy();
    expect(screen.getByText('Inception Test')).toBeTruthy();
    expect(screen.getByText('Test Description for Movie Detail')).toBeTruthy();
    expect(screen.getByText('Leonardo DiCaprio')).toBeTruthy();
    expect(screen.getByText('Christopher Nolan')).toBeTruthy();
  });

  it('navigates back to home when Back button is pressed', () => {
    const screen = render(<MovieDetailScreen />);

    fireEvent.press(screen.getByTestId('detail-back-button'));
    expect(mockNavigate).toHaveBeenCalledWith('Home');
  });
});
