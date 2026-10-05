import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildProviderFilter } from '../services/providerService.js';

describe('provider search business logic', () => {
  it('preserves the existing marketplace filters and escapes search text', () => {
    const filter = buildProviderFilter({
      search: 'AC.*',
      serviceId: '507f1f77bcf86cd799439011',
      state: 'New York',
      minRating: 4.5,
      maxPrice: 1200,
      availableToday: true,
    });

    assert.equal(filter.isActive, true);
    assert.deepEqual(filter.accountStatus, { $ne: 'Rejected' });
    assert.equal(filter.serviceIds, '507f1f77bcf86cd799439011');
    assert.equal(filter.state.test('New York'), true);
    assert.equal(filter.state.test('new york'), true);
    assert.deepEqual(filter.rating, { $gte: 4.5 });
    assert.deepEqual(filter.startingPrice, { $lte: 1200 });
    assert.equal(filter.availableToday, true);
    assert.equal(filter.$or[0].name.test('AC.*'), true);
    assert.equal(filter.$or[0].name.test('ACxx'), false);
  });

  it('does not filter out unavailable providers unless requested', () => {
    const filter = buildProviderFilter({ serviceId: '507f1f77bcf86cd799439011' });
    assert.equal('availableToday' in filter, false);
  });
});