import { describe, it, expect } from 'vitest';
import { isDemoValue, resolvePdfCompany, buildFooterLines } from './resolveCompany';

const tenant = {
  name: 'Acme Industries SARL',
  address: '12 Rue de la Paix',
  city: 'Tunis',
  postalCode: '1002',
  country: 'Tunisie',
  phone: '+216 71 000 000',
  email: 'contact@acme.tn',
  website: 'acme.tn',
  taxId: 'TVA-123',
  registrationNumber: 'RC-456',
  bankName: 'BIAT',
  bankAccount: 'TN59 1000 6035',
  footerMessage: 'Merci de votre confiance',
};

describe('isDemoValue', () => {
  it('catches placeholder variants, not real data', () => {
    for (const demo of [
      'Peak Solutions',
      'peak solutions inc.',
      'Your Company',
      '1234 Service Street',
      'Tech City, TC 12345',
      'info@yourcompany.com',
      'www.peaksolutions.com',
      '(555) 123-4567',
      'N/A',
    ]) {
      expect(isDemoValue(demo), demo).toBe(true);
    }
    for (const real of [
      'Acme Industries SARL',
      '12 Rue de la Paix',
      'contact@acme.tn',
      '+216 71 000 000',
      'Solutions Peak Industrielles',
    ]) {
      expect(isDemoValue(real), real).toBe(false);
    }
  });
});

describe('resolvePdfCompany', () => {
  it('uses tenant data when no override is active', () => {
    const c = resolvePdfCompany(undefined, tenant as never, '');
    expect(c.name).toBe('Acme Industries SARL');
    expect(c.email).toBe('contact@acme.tn');
  });

  it('lets an active override win but falls back per blank field', () => {
    const c = resolvePdfCompany(
      { useOverride: true, name: 'Acme Export', address: '', email: '' } as never,
      tenant as never,
      '',
    );
    expect(c.name).toBe('Acme Export');
    expect(c.address).toBe('12 Rue de la Paix');
  });

  it('never lets demo placeholders reach the document', () => {
    const c = resolvePdfCompany(
      { useOverride: true, name: 'Peak Solutions', email: 'info@yourcompany.com' } as never,
      tenant as never,
      '',
    );
    expect(c.name).toBe('Acme Industries SARL');
    expect(c.email).toBe('contact@acme.tn');
  });
});

describe('buildFooterLines', () => {
  it('renders the company identity and drops empty segments', () => {
    const resolved = resolvePdfCompany(undefined, tenant as never, '');
    expect(resolved.footerMessage).toBe('Merci de votre confiance');
    const lines = buildFooterLines(resolved);
    const joined = lines.join(' | ');
    expect(joined).toContain('Tunis');
    expect(joined).toContain('TVA-123');
    expect(lines.every(l => l.trim().length > 0)).toBe(true);
  });
});
