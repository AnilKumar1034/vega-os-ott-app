import {
  isSelectEvent,
  isKeyDown,
  isBackEvent,
  isPlayPauseEvent,
  isStopEvent,
  sanitizeEmailInput,
} from '../src/utils/inputUtils';

describe('inputUtils', () => {
  describe('isSelectEvent', () => {
    it('returns true for select and enter', () => {
      expect(isSelectEvent('select')).toBe(true);
      expect(isSelectEvent('SELECT')).toBe(true);
      expect(isSelectEvent('enter')).toBe(true);
      expect(isSelectEvent('Enter')).toBe(true);
    });

    it('returns true for kpenter and key_kpenter from virtual remote skin', () => {
      expect(isSelectEvent('kpenter')).toBe(true);
      expect(isSelectEvent('KPENTER')).toBe(true);
      expect(isSelectEvent('key_kpenter')).toBe(true);
      expect(isSelectEvent('KEY_KPENTER')).toBe(true);
    });

    it('returns true for ok and dpad_center', () => {
      expect(isSelectEvent('ok')).toBe(true);
      expect(isSelectEvent('OK')).toBe(true);
      expect(isSelectEvent('dpad_center')).toBe(true);
    });

    it('returns false for other keys and undefined/empty', () => {
      expect(isSelectEvent('back')).toBe(false);
      expect(isSelectEvent('left')).toBe(false);
      expect(isSelectEvent('right')).toBe(false);
      expect(isSelectEvent('up')).toBe(false);
      expect(isSelectEvent('down')).toBe(false);
      expect(isSelectEvent('')).toBe(false);
      expect(isSelectEvent(undefined)).toBe(false);
    });
  });

  describe('isKeyDown', () => {
    it('returns true for undefined (default down) and 0 (down)', () => {
      expect(isKeyDown(undefined)).toBe(true);
      expect(isKeyDown(0)).toBe(true);
    });

    it('returns false for 1 (up) or other non-zero actions', () => {
      expect(isKeyDown(1)).toBe(false);
      expect(isKeyDown(2)).toBe(false);
    });
  });

  describe('isBackEvent', () => {
    it('returns true for back and escape', () => {
      expect(isBackEvent('back')).toBe(true);
      expect(isBackEvent('BACK')).toBe(true);
      expect(isBackEvent('escape')).toBe(true);
      expect(isBackEvent('Escape')).toBe(true);
    });

    it('returns false for other keys', () => {
      expect(isBackEvent('select')).toBe(false);
      expect(isBackEvent(undefined)).toBe(false);
    });
  });

  describe('isPlayPauseEvent', () => {
    it('returns true for playpause, play, and pause', () => {
      expect(isPlayPauseEvent('playpause')).toBe(true);
      expect(isPlayPauseEvent('PLAYPAUSE')).toBe(true);
      expect(isPlayPauseEvent('play')).toBe(true);
      expect(isPlayPauseEvent('pause')).toBe(true);
    });

    it('returns false for other keys', () => {
      expect(isPlayPauseEvent('select')).toBe(false);
      expect(isPlayPauseEvent(undefined)).toBe(false);
    });
  });

  describe('isStopEvent', () => {
    it('returns true for stop', () => {
      expect(isStopEvent('stop')).toBe(true);
      expect(isStopEvent('STOP')).toBe(true);
    });

    it('returns false for other keys', () => {
      expect(isStopEvent('select')).toBe(false);
      expect(isStopEvent(undefined)).toBe(false);
    });
  });

  describe('sanitizeEmailInput', () => {
    it('handles spoken words for @ and .', () => {
      expect(sanitizeEmailInput('test at example dot com')).toBe('test@example.com');
      expect(sanitizeEmailInput('testAtExampleDotCom')).toBe('test@Example.Com');
    });
  });
});
