import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {render, fireEvent, waitFor, act} from '@testing-library/react-native';
import {useShorts, UseShortsReturn} from '../src/features/shorts/hooks/useShorts';
import {
  setMockScenario,
  resetMockScenario,
} from '../src/features/shorts/services/shortsMockApi';
import * as profileHooks from '../src/profiles/hooks/useProfile';
import {UserProfile} from '../src/profiles/types/Profile';

let latestHookState: UseShortsReturn | null = null;

const HookTestHarness = ({
  initialCategory,
  limit,
}: {
  initialCategory?: string;
  limit?: number;
}) => {
  const hookResult = useShorts({initialCategory, limit});
  latestHookState = hookResult;

  return (
    <View testID="shorts-hook-harness">
      <Text testID="loading-state">{hookResult.loading ? 'loading' : 'idle'}</Text>
      <Text testID="loading-more">{hookResult.loadingMore ? 'yes' : 'no'}</Text>
      <Text testID="error-code">{hookResult.error?.code || 'no-error'}</Text>
      <Text testID="error-message">{hookResult.error?.message || 'none'}</Text>
      <Text testID="is-empty">{hookResult.isEmpty ? 'empty' : 'not-empty'}</Text>
      <Text testID="shorts-count">{hookResult.shorts.length.toString()}</Text>
      <Text testID="selected-id">{hookResult.selectedShort?.id || 'none'}</Text>
      <Text testID="selected-index">{hookResult.selectedIndex.toString()}</Text>
      <Text testID="selected-category">{hookResult.selectedCategory}</Text>
      <Text testID="categories-count">{hookResult.categories.length.toString()}</Text>

      <TouchableOpacity
        testID="btn-fetch-more"
        onPress={() => hookResult.fetchMore()}
      />
      <TouchableOpacity
        testID="btn-retry"
        onPress={() => hookResult.retry()}
      />
      <TouchableOpacity
        testID="btn-next"
        onPress={() => hookResult.selectNext()}
      />
      <TouchableOpacity
        testID="btn-prev"
        onPress={() => hookResult.selectPrevious()}
      />
      <TouchableOpacity
        testID="btn-select-cat-comedy"
        onPress={() => hookResult.selectCategory('Comedy')}
      />
      <TouchableOpacity
        testID="btn-select-cat-all"
        onPress={() => hookResult.selectCategory('All')}
      />
      <TouchableOpacity
        testID="btn-search"
        onPress={() => hookResult.search('orchestral')}
      />
    </View>
  );
};

describe('useShorts Hook State Management', () => {
  const adultProfile: UserProfile = {
    id: 'profile-adult',
    name: 'Adult User',
    avatarId: 'avatar-1',
    isKids: false,
    createdAt: 1000,
    updatedAt: 1000,
  };

  const kidsProfile: UserProfile = {
    id: 'profile-kids',
    name: 'Kids Profile',
    avatarId: 'avatar-kids',
    isKids: true,
    kidsMaturityLimit: 'KIDS',
    createdAt: 1000,
    updatedAt: 1000,
  };

  beforeEach(() => {
    resetMockScenario();
    latestHookState = null;
    jest.spyOn(profileHooks, 'useProfile').mockReturnValue({
      activeProfile: adultProfile,
      profiles: [adultProfile, kidsProfile],
      isLoadingProfiles: false,
      error: null,
      switchProfile: jest.fn(),
      createProfile: jest.fn(),
      deleteProfile: jest.fn(),
      updateProfile: jest.fn(),
      refreshProfiles: jest.fn(),
      selectProfileWithPin: jest.fn(),
    } as any);
  });

  afterEach(() => {
    resetMockScenario();
    jest.restoreAllMocks();
  });

  it('1. loads initial feed successfully and sets selectedShort', async () => {
    const screen = render(<HookTestHarness />);
    await act(async () => {});

    await waitFor(() => {
      expect(screen.getByTestId('loading-state').props.children).toBe('idle');
      expect(Number(screen.getByTestId('shorts-count').props.children)).toBeGreaterThan(0);
      expect(screen.getByTestId('selected-id').props.children).not.toBe('none');
      expect(screen.getByTestId('selected-index').props.children).toBe('0');
      expect(screen.getByTestId('is-empty').props.children).toBe('not-empty');
    });
  });

  it('2. sets empty state when feed contains 0 items', async () => {
    setMockScenario('empty');
    const screen = render(<HookTestHarness />);
    await act(async () => {});

    await waitFor(() => {
      expect(screen.getByTestId('loading-state').props.children).toBe('idle');
      expect(screen.getByTestId('is-empty').props.children).toBe('empty');
      expect(screen.getByTestId('shorts-count').props.children).toBe('0');
      expect(screen.getByTestId('selected-id').props.children).toBe('none');
    });
  });

  it('6. filters feed by category when selectCategory is called', async () => {
    const screen = render(<HookTestHarness />);
    await act(async () => {});

    await waitFor(() => {
      expect(screen.getByTestId('loading-state').props.children).toBe('idle');
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('btn-select-cat-comedy'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('selected-category').props.children).toBe('Comedy');
      expect(screen.getByTestId('loading-state').props.children).toBe('idle');
    });

    const currentShorts = latestHookState?.shorts || [];
    expect(currentShorts.length).toBeGreaterThan(0);
    currentShorts.forEach((item) => {
      expect(item.category?.toLowerCase()).toBe('comedy');
    });
  });

  it('9 & 13. paginates via fetchMore and ensures duplicate records are not appended', async () => {
    const screen = render(<HookTestHarness limit={5} />);
    await act(async () => {});

    await waitFor(() => {
      expect(screen.getByTestId('loading-state').props.children).toBe('idle');
      expect(screen.getByTestId('shorts-count').props.children).toBe('5');
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('btn-fetch-more'));
    });

    await waitFor(() => {
      const count = Number(screen.getByTestId('shorts-count').props.children);
      expect(count).toBeGreaterThan(5);
    });

    // Check no duplicate IDs exist
    const items = latestHookState?.shorts || [];
    const idSet = new Set(items.map((i) => i.id));
    expect(idSet.size).toBe(items.length);
  });

  it('11 & 12. handles network error and recovers on retry', async () => {
    setMockScenario('network_error');
    const screen = render(<HookTestHarness />);
    await act(async () => {});

    await waitFor(() => {
      expect(screen.getByTestId('loading-state').props.children).toBe('idle');
      expect(screen.getByTestId('error-code').props.children).toBe('NETWORK_ERROR');
    });

    // Reset failure scenario and trigger retry
    resetMockScenario();
    await act(async () => {
      fireEvent.press(screen.getByTestId('btn-retry'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('loading-state').props.children).toBe('idle');
      expect(screen.getByTestId('error-code').props.children).toBe('no-error');
      expect(Number(screen.getByTestId('shorts-count').props.children)).toBeGreaterThan(0);
    });
  });

  it('navigates through items with selectNext and selectPrevious', async () => {
    const screen = render(<HookTestHarness limit={5} />);
    await act(async () => {});

    await waitFor(() => {
      expect(screen.getByTestId('loading-state').props.children).toBe('idle');
      expect(screen.getByTestId('selected-index').props.children).toBe('0');
    });

    // Next
    await act(async () => {
      fireEvent.press(screen.getByTestId('btn-next'));
    });
    expect(screen.getByTestId('selected-index').props.children).toBe('1');

    // Next again
    await act(async () => {
      fireEvent.press(screen.getByTestId('btn-next'));
    });
    expect(screen.getByTestId('selected-index').props.children).toBe('2');

    // Previous
    await act(async () => {
      fireEvent.press(screen.getByTestId('btn-prev'));
    });
    expect(screen.getByTestId('selected-index').props.children).toBe('1');
  });

  it('15. respects kids profile by filtering out mature content', async () => {
    jest.spyOn(profileHooks, 'useProfile').mockReturnValue({
      activeProfile: kidsProfile,
      profiles: [adultProfile, kidsProfile],
      isLoadingProfiles: false,
      error: null,
      switchProfile: jest.fn(),
      createProfile: jest.fn(),
      deleteProfile: jest.fn(),
      updateProfile: jest.fn(),
      refreshProfiles: jest.fn(),
      selectProfileWithPin: jest.fn(),
    } as any);

    const screen = render(<HookTestHarness limit={20} />);
    await act(async () => {});

    await waitFor(() => {
      expect(screen.getByTestId('loading-state').props.children).toBe('idle');
    });

    const items = latestHookState?.shorts || [];
    expect(items.length).toBeGreaterThan(0);
    // All items should have maturityRating 'ALL' or 'KIDS'
    items.forEach((item) => {
      const rating = item.maturityRating || item.ageRating;
      expect(['ALL', 'KIDS']).toContain(rating);
    });
  });
});
