import {parentalControlsService} from '../src/services/parentalControlsService';
import * as authService from '../src/services/authService';
import {
  hashParentPin,
  isValidPinFormat,
  sha256,
  verifyPinHash,
} from '../src/utils/cryptoUtils';

describe('Parental Controls & PIN Crypto Service', () => {
  describe('Crypto & PIN Utils', () => {
    it('computes standard SHA-256 hashes matching known test vectors', () => {
      // Empty string SHA-256
      expect(sha256('')).toBe(
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      );
      // '1234' SHA-256
      expect(sha256('1234')).toBe(
        '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
      );
    });

    it('validates 4 numeric digits format strictly', () => {
      expect(isValidPinFormat('1234')).toBe(true);
      expect(isValidPinFormat('0000')).toBe(true);
      expect(isValidPinFormat('9876')).toBe(true);

      // Invalids
      expect(isValidPinFormat('123')).toBe(false);
      expect(isValidPinFormat('12345')).toBe(false);
      expect(isValidPinFormat('abcd')).toBe(false);
      expect(isValidPinFormat('12a4')).toBe(false);
      expect(isValidPinFormat('')).toBe(false);
      expect(isValidPinFormat(null)).toBe(false);
      expect(isValidPinFormat(undefined)).toBe(false);
    });

    it('generates salted PIN hashes specific to UID', () => {
      const hash1 = hashParentPin('1234', 'user-1');
      const hash2 = hashParentPin('1234', 'user-2');
      const hash3 = hashParentPin('5678', 'user-1');

      // Different UIDs produce different hashes for same PIN
      expect(hash1).not.toBe(hash2);
      // Different PINs produce different hashes
      expect(hash1).not.toBe(hash3);
      // Hash is 64 hex characters (SHA-256)
      expect(hash1).toHaveLength(64);
    });

    it('verifies PIN hash correctly against stored hash', () => {
      const storedHash = hashParentPin('4321', 'user-abc');
      expect(verifyPinHash('4321', 'user-abc', storedHash)).toBe(true);
      expect(verifyPinHash('1234', 'user-abc', storedHash)).toBe(false);
      expect(verifyPinHash('4321', 'user-different', storedHash)).toBe(false);
      expect(verifyPinHash('', 'user-abc', storedHash)).toBe(false);
      expect(verifyPinHash('4321', 'user-abc', null)).toBe(false);
    });
  });

  describe('Parental Controls Firestore Service', () => {
    let mockAuthFetch: jest.SpyInstance;

    beforeEach(() => {
      mockAuthFetch = jest.spyOn(authService, 'authenticatedFirestoreFetch');
    });

    afterEach(() => {
      mockAuthFetch.mockRestore();
    });

    it('fetches and decodes parental control settings', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          fields: {
            pinEnabled: {booleanValue: true},
            pinHash: {stringValue: 'some_hash_val'},
            createdAt: {stringValue: '2026-08-27T00:00:00.000Z'},
            updatedAt: {stringValue: '2026-08-27T00:00:00.000Z'},
          },
        }),
      } as any);

      const settings = await parentalControlsService.getSettings('user-123');
      expect(settings).toEqual({
        pinEnabled: true,
        pinHash: 'some_hash_val',
        createdAt: '2026-08-27T00:00:00.000Z',
        updatedAt: '2026-08-27T00:00:00.000Z',
      });
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/user-123/parentalControls/settings'),
      );
    });

    it('returns null if settings document is not found (404)', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({}),
      } as any);

      const settings = await parentalControlsService.getSettings('user-123');
      expect(settings).toBeNull();
    });

    it('sets parent PIN by hashing before sending to Firestore', async () => {
      // 1. getSettings call for existing check
      mockAuthFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          fields: {
            pinEnabled: {booleanValue: false},
          },
        }),
      } as any);

      // 2. PATCH write call
      mockAuthFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as any);

      await parentalControlsService.setParentPin('user-123', '2580');

      expect(mockAuthFetch).toHaveBeenCalledTimes(2);
      const patchCall = mockAuthFetch.mock.calls[1];
      const requestBody = JSON.parse(patchCall[1].body);

      expect(patchCall[1].method).toBe('PATCH');
      expect(requestBody.fields.pinEnabled.booleanValue).toBe(true);
      // Must NOT send raw PIN
      expect(requestBody.fields.pinHash.stringValue).not.toBe('2580');
      // Must send hashed PIN
      expect(requestBody.fields.pinHash.stringValue).toBe(
        hashParentPin('2580', 'user-123'),
      );
    });

    it('rejects invalid PIN formats when setting PIN', async () => {
      await expect(
        parentalControlsService.setParentPin('user-123', '12'),
      ).rejects.toThrow('INVALID_PIN_FORMAT');
    });

    it('verifies entered PIN against stored settings', async () => {
      const hash = hashParentPin('9999', 'user-123');
      mockAuthFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          fields: {
            pinEnabled: {booleanValue: true},
            pinHash: {stringValue: hash},
          },
        }),
      } as any);

      const isMatch = await parentalControlsService.verifyPin(
        'user-123',
        '9999',
      );
      expect(isMatch).toBe(true);
    });

    it('removes parent PIN by disabling in Firestore', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as any);

      await parentalControlsService.removeParentPin('user-123');

      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/user-123/parentalControls/settings'),
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('"pinEnabled":{"booleanValue":false}'),
        }),
      );
    });
  });
});
