(() => {
  const states = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
    'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands',
    'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh',
    'Lakshadweep', 'Puducherry'
  ];

  const providers = [
    {
      id: 'pro-aarav-patel', name: 'Aarav Patel', profession: 'Electrician', rating: 4.9, reviewCount: 186,
      experience: 9, distance: 1.2, startingPrice: 450, verified: true, availableToday: true,
      services: ['Electrician', 'Electrical Repair', 'Electrical', 'Wiring', 'Fan installation'],
      location: 'Indiranagar, Bengaluru', about: 'A licensed electrician focused on safe home repairs, fan installations, and neat, reliable wiring work.', avatarTone: 'blue'
    },
    {
      id: 'pro-meera-iyer', name: 'Meera Iyer', profession: 'Electrical Technician', rating: 4.8, reviewCount: 124,
      experience: 7, distance: 2.4, startingPrice: 380, verified: true, availableToday: false,
      services: ['Electrician', 'Electrical Repair', 'Electrical', 'Lighting', 'Switches'],
      location: 'Koramangala, Bengaluru', about: 'Residential electrical technician experienced with lighting, switches, troubleshooting, and safety checks.', avatarTone: 'green'
    },
    {
      id: 'pro-kabir-khan', name: 'Kabir Khan', profession: 'Electrician', rating: 4.7, reviewCount: 93,
      experience: 6, distance: 3.8, startingPrice: 320, verified: true, availableToday: true,
      services: ['Electrician', 'Electrical Repair', 'Electrical', 'Wiring', 'Outlet repair'],
      location: 'Jayanagar, Bengaluru', about: 'Friendly local electrician for everyday wiring, outlet, and lighting repairs, with clear upfront estimates.', avatarTone: 'orange'
    },
    {
      id: 'pro-ravi-kumar', name: 'Ravi Kumar', profession: 'Plumber', rating: 4.9, reviewCount: 211,
      experience: 11, distance: 1.6, startingPrice: 350, verified: true, availableToday: true,
      services: ['Plumber', 'Plumbing Repair', 'Plumbing', 'Water Leak Repair', 'Drain cleaning'],
      location: 'HSR Layout, Bengaluru', about: 'Experienced in leak detection, bathroom fittings, and drain repairs. Known for tidy work and dependable arrival times.', avatarTone: 'teal'
    },
    {
      id: 'pro-ananya-das', name: 'Ananya Das', profession: 'Plumbing Specialist', rating: 4.8, reviewCount: 102,
      experience: 8, distance: 2.9, startingPrice: 400, verified: true, availableToday: false,
      services: ['Plumber', 'Plumbing Repair', 'Plumbing', 'Pipe repair', 'Tap installation'],
      location: 'Whitefield, Bengaluru', about: 'Home plumbing specialist for pipe repairs, taps, water pressure issues, and fixture installation.', avatarTone: 'rose'
    },
    {
      id: 'pro-nikhil-rao', name: 'Nikhil Rao', profession: 'AC Technician', rating: 4.9, reviewCount: 157,
      experience: 10, distance: 2.1, startingPrice: 500, verified: true, availableToday: true,
      services: ['AC Repair', 'AC & heating', 'Heating & cooling', 'Air conditioning', 'AC servicing'],
      location: 'Indiranagar, Bengaluru', about: 'AC technician for seasonal servicing, cooling issues, filter cleaning, and split-unit repairs.', avatarTone: 'blue'
    },
    {
      id: 'pro-farah-khan', name: 'Farah Khan', profession: 'HVAC Specialist', rating: 4.7, reviewCount: 88,
      experience: 6, distance: 4.2, startingPrice: 450, verified: true, availableToday: true,
      services: ['AC Repair', 'AC & heating', 'Heating & cooling', 'AC installation', 'HVAC'],
      location: 'Koramangala, Bengaluru', about: 'HVAC specialist supporting home AC installation, routine maintenance, and airflow troubleshooting.', avatarTone: 'green'
    },
    {
      id: 'pro-ishaan-shah', name: 'Ishaan Shah', profession: 'Laptop Repair Specialist', rating: 4.9, reviewCount: 143,
      experience: 7, distance: 1.9, startingPrice: 600, verified: true, availableToday: false,
      services: ['Laptop Hardware Repair', 'Laptop & computer repair', 'Computer Repair', 'Laptop repair', 'Hardware diagnostics'],
      location: 'Jayanagar, Bengaluru', about: 'Computer repair specialist for charging faults, battery replacement, hardware diagnostics, and laptop upgrades.', avatarTone: 'orange'
    },
    {
      id: 'pro-priya-menon', name: 'Priya Menon', profession: 'Computer Technician', rating: 4.8, reviewCount: 97,
      experience: 5, distance: 3.1, startingPrice: 500, verified: true, availableToday: true,
      services: ['Laptop Hardware Repair', 'Laptop & computer repair', 'Computer Repair', 'Desktop repair', 'Laptop repair'],
      location: 'HSR Layout, Bengaluru', about: 'Patient, detail-oriented technician for laptop and desktop diagnostics, setup, and component replacement.', avatarTone: 'teal'
    },
    {
      id: 'pro-devika-rao', name: 'Devika Rao', profession: 'Mobile Repair Specialist', rating: 4.8, reviewCount: 132,
      experience: 6, distance: 2.7, startingPrice: 300, verified: true, availableToday: true,
      services: ['Mobile Phone Repair', 'Mobile phone repair', 'Mobile repair', 'Phone repair', 'Screen replacement'],
      location: 'Whitefield, Bengaluru', about: 'Mobile device specialist for charging issues, screen replacement, battery service, and diagnostics.', avatarTone: 'rose'
    },
    {
      id: 'pro-karthik-shetty', name: 'Karthik Shetty', profession: 'Handyman', rating: 4.7, reviewCount: 76,
      experience: 8, distance: 1.4, startingPrice: 350, verified: true, availableToday: true,
      services: ['Handyman', 'Home Repair', 'Furniture assembly', 'Door repair', 'Wall mounting'],
      location: 'Indiranagar, Bengaluru', about: 'Reliable home handyman for furniture assembly, wall mounting, door adjustments, and small repair jobs.', avatarTone: 'green'
    },
    {
      id: 'pro-nandini-bose', name: 'Nandini Bose', profession: 'Home Cleaning Professional', rating: 4.9, reviewCount: 204,
      experience: 9, distance: 2.2, startingPrice: 700, verified: true, availableToday: false,
      services: ['House cleaning', 'Home Cleaning', 'Deep cleaning', 'Move-out cleaning'],
      location: 'Koramangala, Bengaluru', about: 'Home cleaning professional offering regular and deep cleans with careful attention to kitchens and bathrooms.', avatarTone: 'blue'
    },
    {
      id: 'pro-suresh-gowda', name: 'Suresh Gowda', profession: 'Car Mechanic', rating: 4.8, reviewCount: 119,
      experience: 12, distance: 4.6, startingPrice: 800, verified: true, availableToday: true,
      services: ['Car repair', 'Vehicle Mechanic', 'Auto repair', 'Car servicing', 'Brake repair'],
      location: 'Jayanagar, Bengaluru', about: 'Local mechanic for routine car servicing, brake checks, battery problems, and practical repair advice.', avatarTone: 'orange'
    },
    {
      id: 'pro-keerthi-nair', name: 'Keerthi Nair', profession: 'Appliance Repair Technician', rating: 4.8, reviewCount: 91,
      experience: 7, distance: 3.5, startingPrice: 450, verified: true, availableToday: true,
      services: ['Appliance repair', 'Appliance Repair', 'Washing machine repair', 'Refrigerator repair', 'Oven repair'],
      location: 'HSR Layout, Bengaluru', about: 'Home appliance technician for washer, refrigerator, and oven troubleshooting and repairs.', avatarTone: 'teal'
    }
  ];
  const cityByState = {
    'Andhra Pradesh': 'Visakhapatnam', 'Arunachal Pradesh': 'Itanagar', Assam: 'Guwahati', Bihar: 'Patna',
    Chhattisgarh: 'Raipur', Goa: 'Panaji', Gujarat: 'Ahmedabad', Haryana: 'Gurugram', 'Himachal Pradesh': 'Shimla',
    Jharkhand: 'Ranchi', Karnataka: 'Bengaluru', Kerala: 'Kochi', 'Madhya Pradesh': 'Indore', Maharashtra: 'Mumbai',
    Manipur: 'Imphal', Meghalaya: 'Shillong', Mizoram: 'Aizawl', Nagaland: 'Kohima', Odisha: 'Bhubaneswar',
    Punjab: 'Ludhiana', Rajasthan: 'Jaipur', Sikkim: 'Gangtok', 'Tamil Nadu': 'Chennai', Telangana: 'Hyderabad',
    Tripura: 'Agartala', 'Uttar Pradesh': 'Lucknow', Uttarakhand: 'Dehradun', 'West Bengal': 'Kolkata',
    'Andaman and Nicobar Islands': 'Port Blair', Chandigarh: 'Chandigarh',
    'Dadra and Nagar Haveli and Daman and Diu': 'Daman', Delhi: 'New Delhi', 'Jammu and Kashmir': 'Srinagar',
    Ladakh: 'Leh', Lakshadweep: 'Kavaratti', Puducherry: 'Puducherry'
  };
  const firstNames = ['Aarav', 'Meera', 'Kabir', 'Ravi', 'Ananya', 'Nikhil', 'Farah', 'Ishaan', 'Priya', 'Devika', 'Karthik', 'Nandini', 'Suresh', 'Keerthi', 'Aditi', 'Arjun', 'Diya', 'Rohan'];
  const surnames = ['Patel', 'Iyer', 'Khan', 'Kumar', 'Das', 'Rao', 'Shah', 'Menon', 'Nair', 'Shetty', 'Bose', 'Gowda', 'Reddy', 'Singh', 'Verma', 'Joshi', 'Pillai', 'Mishra', 'Saxena', 'Choudhary', 'Naidu', 'Desai', 'Bhat', 'Dutta', 'Kapoor', 'Yadav', 'Saha', 'Thakur', 'Kulkarni', 'Ghosh', 'Malik', 'Jain', 'Prasad', 'Kaur', 'Lal', 'Fernandes'];
  const reviewComments = [
    'Arrived on time, explained the work clearly, and left everything tidy.',
    'Good communication and a fair estimate. The issue was sorted out on the first visit.',
    'Professional and careful work. I would happily book this service again.'
  ];
  const reviewDates = ['Sep 2026', 'Aug 2026', 'Jul 2026'];

  const providersWithState = states.flatMap((state, stateIndex) => providers.map((provider, providerIndex) => {
    let regionalProvider = { ...provider };
    if (state !== 'Karnataka') {
      const firstName = firstNames[(stateIndex + providerIndex) % firstNames.length];
      const surname = surnames[(stateIndex * 5 + providerIndex * 3) % surnames.length];
      const ratingVariation = ((stateIndex + providerIndex) % 3 - 1) / 10;
      const priceVariation = 0.9 + ((stateIndex + providerIndex) % 5) * 0.05;
      const stateSlug = state.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      regionalProvider = {
        ...provider,
        id: `${provider.id}-${stateSlug}`,
        name: `${firstName} ${surname}`,
        rating: Math.round(Math.min(5, Math.max(4.5, provider.rating + ratingVariation)) * 10) / 10,
        reviewCount: provider.reviewCount + ((stateIndex * 13 + providerIndex * 7) % 86),
        experience: Math.max(3, provider.experience + ((stateIndex + providerIndex) % 3) - 1),
        distance: Number((1 + ((stateIndex * 7 + providerIndex * 3) % 24) * 0.5).toFixed(1)),
        startingPrice: Math.round(provider.startingPrice * priceVariation / 10) * 10,
        availableToday: (stateIndex + providerIndex) % 3 !== 0,
        location: `${cityByState[state]}, ${state}`
      };
    }

    const phoneSuffix = String(10000 + stateIndex * providers.length + providerIndex).padStart(5, '0');
    return {
      ...regionalProvider,
      state,
      phone: `+91 90000 ${phoneSuffix}`,
      reviews: reviewComments.map((comment, reviewIndex) => ({
        id: `${regionalProvider.id}-review-${reviewIndex + 1}`,
        reviewer: `${firstNames[(stateIndex + providerIndex + reviewIndex + 3) % firstNames.length]} ${surnames[(stateIndex * 7 + providerIndex * 5 + reviewIndex) % surnames.length]}`,
        rating: Math.max(4.5, regionalProvider.rating - (reviewIndex === 1 ? 0.1 : 0)),
        date: reviewDates[reviewIndex],
        comment
      }))
    };
  }));

  window.FixItMarketplace = Object.freeze({
    storageKeys: Object.freeze({ recommendation: 'fixit.recommendedService', selectedService: 'fixit.selectedService', selectedProvider: 'fixit.selectedProviderId', favorites: 'fixit.favoriteProviderIds', messages: 'fixit.messageDrafts' }),
    providers: providersWithState,
    states,
    normalize: (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ')
  });
})();
