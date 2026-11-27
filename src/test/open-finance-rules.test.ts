import { describe, expect, it } from 'vitest';
import { isRealInstitution, isOwnedRealItem, mapItemStatus, institutionExists } from '@/modules/open-finance/calculations';
describe('Open Finance uses only real provider confirmation', () => {
  it('excludes sandbox institutions from real coverage', () => {
    expect(isRealInstitution({ isSandbox: true, isOpenFinance: true, country: 'BR', type: 'PERSONAL_BANK' })).toBe(false);
    expect(isRealInstitution({ isSandbox: false, isOpenFinance: true, country: 'BR', type: 'PERSONAL_BANK' })).toBe(true);
  });
  it('never records another owner’s connection', () => {
    expect(isOwnedRealItem({ id: 'item', status: 'UPDATED', clientUserId: 'other', connector: { id: 1, name: 'Bank', isSandbox: false } }, 'owner')).toBe(false);
  });
  it('never records sandbox data even for its owner', () => {
    expect(isOwnedRealItem({ id: 'item', status: 'UPDATED', clientUserId: 'owner', connector: { id: 1, name: 'Bank', isSandbox: true } }, 'owner')).toBe(false);
  });
  it('requires provider success before marking completed', () => {
    expect(mapItemStatus({ status: 'UPDATING', executionStatus: 'ACCOUNTS_IN_PROGRESS' })).toBe('syncing');
    expect(mapItemStatus({ status: 'UPDATED', executionStatus: 'SUCCESS' })).toBe('completed');
    expect(mapItemStatus({ status: 'UPDATED', executionStatus: 'ERROR' })).toBe('failed');
  });
  it('does not mistake partial data for complete success', () => expect(mapItemStatus({ status: 'UPDATED', executionStatus: 'PARTIAL_SUCCESS' })).toBe('verifying'));
  it('honors provider-reported terminated authorization', () => expect(mapItemStatus({ status: 'OUTDATED', executionStatus: 'USER_AUTHORIZATION_REVOKED' })).toBe('consent_expired'));
  it('rejects tokens for institutions not enabled as real', () => {
    expect(institutionExists([], '7')).toBe(false);
    expect(institutionExists([{ id: '7', name: 'test', products: [], sandbox: true }], '7')).toBe(false);
    expect(institutionExists([{ id: '8', name: 'real', products: [], sandbox: false }], '8')).toBe(true);
  });
});
