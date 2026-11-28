import { describe, expect, it } from 'vitest';
import { merchantDomain } from '@/components/kallan/merchant-logo';

describe('merchantDomain', () => {
  it('recognizes known merchants in statement descriptions', () => {
    expect(merchantDomain('Compra à vista Americanas')).toBe('americanas.com.br');
    expect(merchantDomain('IFOOD *RESTAURANTE')).toBe('ifood.com.br');
    expect(merchantDomain('Netflix.com parcela 2/12')).toBe('netflix.com');
    expect(merchantDomain('UBER *TRIP')).toBe('uber.com');
  });
  it('returns null for unknown names and partial words', () => {
    expect(merchantDomain('Padaria do Zé')).toBeNull();
    expect(merchantDomain('Interlagos estacionamento')).toBeNull();
    expect(merchantDomain('Salário')).toBeNull();
  });
});
