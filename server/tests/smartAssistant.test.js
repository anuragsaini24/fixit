import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getSafetyAdvice, matchFallbackService, rankProviders } from '../services/smartAssistantService.js';
import { getServicePriceEstimate } from '../config/servicePriceEstimates.js';

const acService = { id: 'ac-id', name: 'AC Repair', category: 'Home repair', detail: 'Air conditioning and cooling', keywords: ['ac', 'cooling', 'air conditioner'], priceFrom: 450 };

describe('FixIt Smart Assistant', () => {
  it('uses keyword fallback to identify a naturally described AC problem', () => {
    const match = matchFallbackService('My AC is running but it is not cooling properly and making a strange noise.', [acService]);
    assert.equal(match.service.name, 'AC Repair');
    assert.ok(match.matchedKeywords.includes('cooling'));
  });

  it('matches configured aliases even if a service has no saved keywords', () => {
    const match = matchFallbackService('My AC is not cooling.', [{ ...acService, keywords: [], detail: '' }]);
    assert.equal(match.service.name, 'AC Repair');
  });

  it('returns no fallback match for an unrelated description', () => {
    assert.equal(matchFallbackService('I need help planning a birthday party.', [acService]), null);
  });

  it('uses the configurable service estimate instead of provider prices as a guarantee', () => {
    assert.deepEqual(getServicePriceEstimate(acService), { min: 500, max: 3000, currency: 'INR' });
  });

  it('adds professional-only safety advice for electrical or gas hazards', () => {
    assert.match(getSafetyAdvice('There are sparks coming from an exposed wire.'), /qualified electrician/i);
    assert.equal(getSafetyAdvice('My AC is not cooling.'), '');
  });

  it('ranks providers using rating, availability, experience, distance, price, and reviews', () => {
    const providers = [
      { _id: 'far-id', name: 'Far Pro', profession: 'AC technician', rating: 4.6, experience: 12, availableToday: false, distance: 18, startingPrice: 1200, reviewCount: 80 },
      { _id: 'near-id', name: 'Nearby Pro', profession: 'AC specialist', rating: 4.9, experience: 8, availableToday: true, distance: 2, startingPrice: 800, reviewCount: 50 },
    ];
    const ranked = rankProviders(providers, acService, { min: 500, max: 3000 });
    assert.equal(ranked[0].id, 'near-id');
    assert.match(ranked[0].reason, /highly rated, available today, experienced, nearby/i);
  });
});