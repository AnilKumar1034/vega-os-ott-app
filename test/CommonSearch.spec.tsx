import 'react-native';
import {fireEvent, render} from '@testing-library/react-native';
import * as React from 'react';
import {CommonSearch} from '../src/components/molecules/CommonSearch';
import {HomeScreen} from '../src/screens/HomeScreen';
import {MoviesScreen} from '../src/screens/MoviesScreen';

// Mock navigation
const mockDispatch = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    dispatch: mockDispatch,
  }),
  useRoute: () => ({
    params: {},
  }),
}));

describe('CommonSearch and Multi-Screen Search Filtering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders CommonSearch component with input field and search icon', () => {
    const mockOnChangeText = jest.fn();
    const screen = render(
      <CommonSearch value="" onChangeText={mockOnChangeText} />,
    );

    expect(screen.getByTestId('common-search-input')).toBeTruthy();
    expect(screen.getByTestId('search-icon')).toBeTruthy();
  });

  it('shows clear button when text is present and calls onChangeText on clear', () => {
    const mockOnChangeText = jest.fn();
    const screen = render(
      <CommonSearch value="Horizon" onChangeText={mockOnChangeText} />,
    );

    const clearBtn = screen.getByTestId('clear-search-button');
    expect(clearBtn).toBeTruthy();

    fireEvent.press(clearBtn);
    expect(mockOnChangeText).toHaveBeenCalledWith('');
  });

  it('filters content on HomeScreen based on search query', () => {
    const screen = render(<HomeScreen />);

    const input = screen.getByTestId('common-search-input');
    fireEvent.changeText(input, 'Horizon');

    expect(screen.getByText('The Last Horizon')).toBeTruthy();
    expect(screen.queryByText('Kalki 2898 AD')).toBeNull();
  });

  it('filters content on MoviesScreen based on search query', () => {
    const screen = render(<MoviesScreen />);

    const input = screen.getByTestId('common-search-input');
    fireEvent.changeText(input, 'Dark Knight');

    expect(screen.getByText('The Dark Knight')).toBeTruthy();
    expect(screen.queryByText('Avatar: The Way of Water')).toBeNull();
  });
});
