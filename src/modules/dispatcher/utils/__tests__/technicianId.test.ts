import { describe, it, expect } from 'vitest';
import { normalizeTechId } from '../technicianId';

describe('normalizeTechId', () => {
  it('returns the raw digit string unchanged', () => {
    expect(normalizeTechId('42')).toBe('42');
  });
  it('extracts a numeric id from prefixed strings', () => {
    expect(normalizeTechId('tech-42')).toBe('42');
    expect(normalizeTechId('admin-22')).toBe('22');
  });
  it('prefers the LAST digit-run in compound ids', () => {
    expect(normalizeTechId('loc-3-tech-42')).toBe('42');
  });
  it('handles null / undefined / empty', () => {
    expect(normalizeTechId(null)).toBe('');
    expect(normalizeTechId(undefined)).toBe('');
    expect(normalizeTechId('')).toBe('');
  });
  it('falls back to the raw string when no digits', () => {
    expect(normalizeTechId('tech')).toBe('tech');
  });
  it('accepts a number', () => {
    expect(normalizeTechId(42)).toBe('42');
  });
});