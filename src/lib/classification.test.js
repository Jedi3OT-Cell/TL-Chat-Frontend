import { describe, it, expect } from 'vitest';
import { moduleColor, threatColor, normalizeSession, waitLabel } from './classification';

describe('moduleColor', () => {
  it('matches known modules case-insensitively', () => {
    expect(moduleColor('Ringfencing')).toBe('#a855f7');
    expect(moduleColor('APPLICATION CONTROL')).toBe('#0ea5e9');
    expect(moduleColor('network access')).toBe('#22c55e');
  });
  it('falls back to slate for unknown/empty', () => {
    expect(moduleColor('')).toBe('#475569');
    expect(moduleColor(undefined)).toBe('#475569');
    expect(moduleColor('quantum')).toBe('#475569');
  });
});

describe('threatColor', () => {
  it('maps known levels and falls back', () => {
    expect(threatColor('HIGH').color).toBe('#ef4444');
    expect(threatColor('NONSENSE').color).toBe('#475569');
  });
});

describe('normalizeSession', () => {
  it('prefers nested intake fields, falls back to flat', () => {
    expect(normalizeSession({ intake: { organizationName: 'A' }, organizationName: 'B' }).organizationName).toBe('A');
    expect(normalizeSession({ organizationName: 'B' }).organizationName).toBe('B');
  });
});

describe('waitLabel', () => {
  const now = new Date('2026-09-07T16:10:00.000Z').getTime();
  it('formats minutes and handles just-now', () => {
    expect(waitLabel('2026-09-07T16:05:00.000Z', now)).toBe('5m AGO');
    expect(waitLabel('2026-09-07T16:10:00.000Z', now)).toBe('JUST NOW');
  });
  it('guards invalid/missing dates', () => {
    expect(waitLabel(undefined, now)).toBe('JUST NOW');
    expect(waitLabel('not-a-date', now)).toBe('JUST NOW');
  });
});
