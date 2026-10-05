(() => {
  const STRONG_MATCH_THRESHOLD = 2;
  const services = [
    {
      serviceCategory: 'Laptop Hardware Repair',
      keywords: ['laptop repair', 'laptop', 'computer repair', 'computer', 'not charging', 'not turning on', 'charging port'],
      possibleIssues: ['Charging port', 'Battery', 'Power circuit'],
      minCost: 500,
      maxCost: 2000,
      professionalsCount: 12
    },
    {
      serviceCategory: 'Mobile Phone Repair',
      keywords: ['mobile phone repair', 'mobile repair', 'smartphone', 'cell phone', 'mobile', 'phone', 'not charging', 'cracked screen'],
      possibleIssues: ['Screen or display', 'Charging port', 'Battery'],
      minCost: 300,
      maxCost: 5000,
      professionalsCount: 18
    },
    {
      serviceCategory: 'Plumbing Repair',
      keywords: ['water leak', 'plumber', 'plumbing', 'pipe', 'leak', 'faucet', 'tap', 'drain'],
      possibleIssues: ['Leaking pipe or joint', 'Blocked drain', 'Faulty tap or fixture'],
      minCost: 250,
      maxCost: 2500,
      professionalsCount: 9
    },
    {
      serviceCategory: 'Electrical Repair',
      keywords: ['electrician', 'electrical', 'wiring', 'fan', 'light', 'switch', 'outlet'],
      possibleIssues: ['Fan capacitor or motor', 'Loose wiring', 'Faulty switch or outlet'],
      minCost: 300,
      maxCost: 1800,
      professionalsCount: 14
    },
    {
      serviceCategory: 'AC Repair',
      keywords: ['air conditioner', 'air conditioning', 'ac repair', 'hvac', 'ac'],
      possibleIssues: ['Air filter or airflow', 'Refrigerant', 'Compressor'],
      minCost: 500,
      maxCost: 5000,
      professionalsCount: 8
    },
    {
      serviceCategory: 'Vehicle Mechanic',
      keywords: ['car repair', 'bike repair', 'vehicle repair', 'mechanic', 'engine', 'brakes', 'car', 'bike'],
      possibleIssues: ['Battery or starting system', 'Brakes', 'Engine or transmission'],
      minCost: 400,
      maxCost: 5000,
      professionalsCount: 15
    }
  ];

  function normalizeText(value) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
  }

  function getMatchingKeywords(description, keywords) {
    const normalizedDescription = ` ${normalizeText(description)} `;
    return keywords.filter((keyword) => normalizedDescription.includes(` ${normalizeText(keyword)} `));
  }

  function scoreKeywords(matchingKeywords) {
    return matchingKeywords.reduce((score, keyword) => {
      const wordCount = normalizeText(keyword).split(' ').length;
      return score + (wordCount * 2) + (keyword.length >= 6 ? 1 : 0);
    }, 0);
  }

  function recommendService(description) {
    const normalizedDescription = normalizeText(description);
    if (!normalizedDescription) return null;

    const ranked = services
      .map((service) => {
        const matchedKeywords = getMatchingKeywords(normalizedDescription, service.keywords);
        return { ...service, matchedKeywords, matchScore: scoreKeywords(matchedKeywords) };
      })
      .filter((service) => service.matchScore > 0)
      .sort((first, second) => second.matchScore - first.matchScore);

    if (!ranked.length || ranked[0].matchScore < STRONG_MATCH_THRESHOLD) return null;
    return ranked[0];
  }

  function getServiceByCategory(category) {
    return services.find((service) => service.serviceCategory === category) || null;
  }

  window.FixItRecommendationEngine = Object.freeze({
    getServices: () => services.map((service) => ({ ...service, keywords: [...service.keywords], possibleIssues: [...service.possibleIssues] })),
    getServiceByCategory,
    recommendService
  });
})();
