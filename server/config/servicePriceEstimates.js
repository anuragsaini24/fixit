const configuredEstimates = [
  { names: ['ac repair', 'air conditioner repair', 'air conditioning'], keywords: ['ac', 'hvac', 'cooling'], min: 500, max: 3000, issues: ['Airflow or filter issue', 'Refrigerant issue', 'Compressor problem'] },
  { names: ['plumbing', 'plumbing repair', 'plumber'], keywords: ['plumbing', 'plumber', 'pipe', 'leak', 'faucet', 'tap', 'drain'], min: 250, max: 2500, issues: ['Leaking pipe or joint', 'Blocked drain', 'Faulty tap or fixture'] },
  { names: ['electrical', 'electrical repair', 'electrician'], keywords: ['electrical', 'electrician', 'wiring', 'fan', 'light', 'switch', 'outlet'], min: 300, max: 1800, issues: ['Faulty switch or fixture', 'Loose connection', 'Component failure'] },
  { names: ['laptop repair', 'computer repair'], keywords: ['laptop', 'computer', 'not charging', 'not turning on'], min: 500, max: 3000, issues: ['Battery or charging issue', 'Power circuit issue', 'Display or component fault'] },
  { names: ['mobile phone repair', 'mobile repair', 'phone repair'], keywords: ['mobile', 'smartphone', 'phone', 'cracked screen'], min: 300, max: 5000, issues: ['Screen or display issue', 'Charging port issue', 'Battery issue'] },
  { names: ['car repair', 'vehicle repair', 'mechanic'], keywords: ['car', 'vehicle', 'mechanic', 'engine', 'brakes'], min: 800, max: 8000, issues: ['Starting or battery issue', 'Brake component issue', 'Engine component issue'] },
  { names: ['house cleaning', 'home cleaning'], keywords: ['cleaning', 'deep clean', 'maid'], min: 700, max: 4000, issues: ['Routine cleaning', 'Deep-cleaning needs'] },
  { names: ['appliance repair'], keywords: ['appliance', 'washer', 'refrigerator', 'fridge'], min: 500, max: 5000, issues: ['Power or connection issue', 'Mechanical component issue', 'Control component issue'] },
  { names: ['pest control'], keywords: ['pest', 'termite', 'ants'], min: 600, max: 5000, issues: ['Possible pest entry point', 'Possible active infestation'] },
  { names: ['moving help', 'moving service'], keywords: ['moving', 'relocation', 'packing'], min: 1200, max: 10000, issues: ['Packing and handling needs', 'Transport requirements'] },
];

function normalizeText(value) {
  return String(value || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
}

export const SERVICE_PRICE_ESTIMATES = Object.freeze(configuredEstimates);

export function getServicePriceEstimate(service) {
  const haystack = ` ${normalizeText([service.name, service.category, service.detail, ...(service.keywords || [])].join(' '))} `;
  const configured = configuredEstimates.find((entry) => [...entry.names, ...entry.keywords].some((term) => haystack.includes(` ${normalizeText(term)} `)));
  if (configured) return { min: configured.min, max: configured.max, currency: 'INR' };

  const min = Math.max(0, Math.round(Number(service.priceFrom) || 500));
  return { min, max: Math.max(min, min * 4), currency: 'INR' };
}

export function getServiceMatchingTerms(service) {
  const haystack = ` ${normalizeText([service.name, service.category, service.detail, ...(service.keywords || [])].join(' '))} `;
  const configured = configuredEstimates.find((entry) => [...entry.names, ...entry.keywords].some((term) => haystack.includes(` ${normalizeText(term)} `)));
  return [...new Set([...(service.keywords || []), service.name, service.detail, ...(configured?.names || []), ...(configured?.keywords || [])].filter(Boolean))];
}

export function getPossibleIssues(service) {
  const haystack = ` ${normalizeText([service.name, service.category, service.detail, ...(service.keywords || [])].join(' '))} `;
  const configured = configuredEstimates.find((entry) => [...entry.names, ...entry.keywords].some((term) => haystack.includes(` ${normalizeText(term)} `)));
  return configured?.issues || ['A component or connection issue', 'A wear, blockage, or airflow issue', 'Another issue requiring professional inspection'];
}