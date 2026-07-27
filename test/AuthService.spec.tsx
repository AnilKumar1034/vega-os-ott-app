/* global globalThis */

import {
  getUserProfile,
  loginUser,
  logoutUser,
  registerUser,
} from '../src/services/authService';
import {sanitizeEmailInput} from '../src/utils/inputUtils';

const mockFetch = jest.fn();

beforeEach(() => {
  (globalThis as any).fetch = mockFetch;
  mockFetch.mockReset();
});

describe('authService & inputUtils', () => {
  it('sanitizes TV IME spoken words At, period, dot into email symbols @ and .', () => {
    expect(sanitizeEmailInput('john At gmail period com')).toBe(
      'john@gmail.com',
    );
    expect(sanitizeEmailInput('johnAtgmailperiodcom')).toBe('john@gmail.com');
    expect(sanitizeEmailInput('user at example dot com')).toBe(
      'user@example.com',
    );
    expect(sanitizeEmailInput('test@domain.com')).toBe('test@domain.com');
  });

  it('registers user and stores username, email, subscription, city, country in Firestore', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          localId: 'test-uid-123',
          email: 'test@example.com',
          idToken: 'id-token',
          refreshToken: 'refresh-token',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    const res = await registerUser({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      subscription: 'Premium',
      city: 'Seattle',
      country: 'USA',
    });

    expect(res.user.uid).toBe('test-uid-123');
    expect(res.profile.username).toBe('testuser');
    expect(res.profile.subscription).toBe('Premium');
    expect(res.profile.city).toBe('Seattle');
    expect(res.profile.country).toBe('USA');
  });

  it('logins user and fetches profile from Firestore', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          localId: 'test-uid-123',
          email: 'test@example.com',
          idToken: 'id-token',
          refreshToken: 'refresh-token',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          fields: {
            uid: {stringValue: 'test-uid-123'},
            username: {stringValue: 'testuser'},
            email: {stringValue: 'test@example.com'},
            subscription: {stringValue: 'Premium'},
            city: {stringValue: 'Seattle'},
            country: {stringValue: 'USA'},
          },
        }),
      });

    const res = await loginUser({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(res.user.uid).toBe('test-uid-123');
    expect(res.profile?.username).toBe('testuser');
  });

  it('fetches user profile', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        fields: {
          uid: {stringValue: 'test-uid-123'},
          username: {stringValue: 'testuser'},
          email: {stringValue: 'test@example.com'},
          subscription: {stringValue: 'Premium'},
          city: {stringValue: 'Seattle'},
          country: {stringValue: 'USA'},
        },
      }),
    });

    const profile = await getUserProfile('test-uid-123');
    expect(profile?.city).toBe('Seattle');
    expect(profile?.country).toBe('USA');
  });

  it('logouts user', async () => {
    await expect(logoutUser()).resolves.toBeUndefined();
  });
});
