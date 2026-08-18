// Mock data + types for the VOYO travel planner.
// Tier-aware intelligence: Affordable, Better (Comfort), Luxury across India.

export const POPULAR_DESTINATIONS = [
  'Goa',
  'Mumbai',
  'Bangalore',
  'Jaipur',
  'Manali',
  'Ladakh',
  'Udaipur',
  'Kerala',
  'Varanasi',
  'Rishikesh',
  'Chikmagalur',
]

export const DURATIONS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
export const DURATION_LABELS = {
  2: '2 Days (Quick Escape)',
  3: '3 Days (Long Weekend)',
  4: '4 Days (Short Vacation)',
  5: '5 Days (Extended)',
  6: '6 Days (Expedition)',
  7: '7 Days (Week-long)',
  8: '8 Days (Grand Explorer)',
  9: '9 Days (Immersive Tour)',
  10: '10 Days (Complete Journey)',
  11: '11 Days (Extended Voyage)',
  12: '12 Days (Deep Exploration)',
  13: '13 Days (Two-Week Retreat)',
  14: '14 Days (Grand 2-Week Expedition)',
}

export const BUDGET_PRESETS = [
  { label: 'Budget Saver', amount: 7500 },
  { label: 'Explorer', amount: 13500 },
  { label: 'Comfort', amount: 24000 },
]

export const ORIGIN = 'Bangalore'
export const BASELINE_PER_DAY = 1500

export const THINKING_STEPS = [
  'Analyzing destination & budget tier...',
  'Checking live weather forecast...',
  'Curating tier-specific dining & stays (Affordable / Comfort / Luxury)...',
  'Expanding regional circuit & scenic passes (50–200 km)...',
  'Compiling structured timeline & transparent budget...',
]

// 1. TIER CLASSIFICATION HELPER
export function getBudgetTier(budget, days) {
  const daily = Number(budget || 0) / Number(days || 1)
  if (daily >= 8000) {
    return {
      key: 'luxury',
      label: 'Ultra-Luxury Elite Tier',
      tag: '👑 Luxury',
      heading: 'TOP 3 LUXURY & FINE-DINING EXPERIENCES',
      stayLabel: '5-Star Ultra-Luxury Palace Resorts & Private Pool Villas',
      transitLabel: 'Voyago Premium Luxury 4x4 / Chauffeur-Driven Mercedes/Innova Crysta',
    }
  } else if (daily >= 3500) {
    return {
      key: 'better',
      label: 'Premium Comfort Tier',
      tag: '✨ Comfort / Better',
      heading: 'TOP 3 PREMIUM & HIGH-VALUE DINING DESTINATIONS',
      stayLabel: '4-Star Boutique Mountain Resorts, Coffee Estate Villas & Heritage Haveli Stays',
      transitLabel: 'Voyago Dedicated Premium AC SUV / Ertiga Transit',
    }
  } else {
    return {
      key: 'affordable',
      label: 'Affordable Explorer Tier',
      tag: '💰 Affordable',
      heading: 'TOP 3 AFFORDABLE & AUTHENTIC LOCAL RESTAURANTS',
      stayLabel: 'Verified Budget Boutique Homestays & Heritage Guesthouses',
      transitLabel: 'Voyago Dedicated AC Sedan / Outstation Transit',
    }
  }
}

// 2. CITY DATABASE WITH 3-TIER RESTAURANTS & EXPERIENCES
export const CITY_DATA = {
  ladakh: {
    city: 'Ladakh',
    weather: { c: 16, low: 4, label: 'Crisp mountain air & clear skies', rain: '2%' },
    highlights: ['Pangong Tso Lake (140 km)', 'Nubra Valley & Hunder Dunes (125 km)', 'Khardung La Pass (5,359m)', 'Hanle Dark Sky Reserve (250 km)', 'Tso Moriri (220 km)'],
    tierRestaurants: {
      affordable: [
        {
          id: 1,
          name: 'The Tibetan Kitchen',
          cuisine: 'Authentic Ladakhi, Tibetan & Himalayan Bowls',
          location: 'Fort Road, Leh, Ladakh',
          rating: '4.8/5 (4.5k reviews)',
          priceRange: '₹200 – ₹450 per person',
          itemsWithPrice: 'Steamed Mutton Momos (₹180) • Gyathuk Noodle Soup (₹210) • Butter Tea (₹50) • Tingmo with Shamu (₹220)',
          quote: '"World-renowned heritage dining in Leh serving steaming hot, soul-warming Himalayan broth and momos."',
        },
        {
          id: 2,
          name: 'Gesmo Restaurant (Since 1989)',
          cuisine: 'German Bakery, Yak Cheese & Mountaineer Breakfast',
          location: 'Main Bazaar, Leh, Ladakh',
          rating: '4.6/5 (3.8k reviews)',
          priceRange: '₹150 – ₹350 per person',
          itemsWithPrice: 'Yak Cheese Sandwich (₹140) • Cinnamon Rolls (₹80) • Organic Apricot Jam Pancake (₹160)',
          quote: '"Beloved iconic bakery in Leh serving hearty mountaineer breakfasts and freshly ground coffee."',
        },
        {
          id: 3,
          name: 'Lamayuru Restaurant',
          cuisine: 'Traditional Tibetan & North Indian Thalis',
          location: 'Fort Road, Leh, Ladakh',
          rating: '4.5/5 (2.9k reviews)',
          priceRange: '₹180 – ₹350 per person',
          itemsWithPrice: 'Veg Thukpa (₹160) • Tibetan Fried Rice (₹180) • Ginger Lemon Honey Tea (₹60)',
          quote: '"High-value authentic eatery packed with trekkers enjoying hot comfort meals after mountain passes."',
        },
      ],
      better: [
        {
          id: 1,
          name: 'Bon Appetit',
          cuisine: 'Ladakhi Fusion & Woodfired Mountain Terrace',
          location: 'Karzoo, Leh, Ladakh',
          rating: '4.7/5 (3.1k reviews)',
          priceRange: '₹600 – ₹1,200 per person',
          itemsWithPrice: 'Apricot Tart (₹180) • Woodfired Thin-Crust Pizza (₹480) • Fresh Seabuckthorn Mojito (₹220)',
          quote: '"Stunning minimalist open-air terrace with panoramic sunset views over the Stok Kangri mountain range."',
        },
        {
          id: 2,
          name: 'Syah Contemporary Mountain Dining',
          cuisine: 'Foraged Himalayan Fine Dining & Local Terroir',
          location: 'Choglamsar, Leh, Ladakh',
          rating: '4.8/5 (1.4k reviews)',
          priceRange: '₹800 – ₹1,600 per person',
          itemsWithPrice: 'Foraged Morel Mushroom Risotto (₹650) • Smoked Trout Platter (₹720) • Wild Rose Infusion (₹240)',
          quote: '"Exceptional artisanal kitchen celebrating wild ingredients foraged from the high-altitude valleys."',
        },
        {
          id: 3,
          name: 'Chopsticks Noodle Bar',
          cuisine: 'Pan-Asian, Wok Bowls & Craft Cocktails',
          location: 'Fort Road, Leh, Ladakh',
          rating: '4.6/5 (2.6k reviews)',
          priceRange: '₹500 – ₹1,000 per person',
          itemsWithPrice: 'Crispy Lamb in Honey Chili (₹450) • Khow Suey (₹420) • Jasmine Green Tea (₹140)',
          quote: '"Vibrant contemporary restaurant with warm cozy interiors and authentic Asian gourmet preparations."',
        },
      ],
      luxury: [
        {
          id: 1,
          name: 'Zasgyath at The Grand Dragon Ladakh',
          cuisine: 'Royal Ladakhi & International Gourmet Dining',
          location: 'Old Road Sheynam, Leh, Ladakh',
          rating: '4.9/5 (2.8k reviews)',
          priceRange: '₹2,500 – ₹5,000 per person',
          itemsWithPrice: 'Royal Wazwan & Ladakhi Feast (₹2,800) • Saffron Morel Broth (₹950) • Kashmiri Saffron Phirni (₹550)',
          quote: '"The epitome of 5-star Himalayan luxury dining with live classical instrumental music and royal chandeliers."',
        },
        {
          id: 2,
          name: 'The Ultimate Travelling Camp (TUTC) Private Dining',
          cuisine: '7-Course Bespoke Nomadic Glamping Gastronomy',
          location: 'Chamba Camp, Thiksey / Diskit, Ladakh',
          rating: '5.0/5 (890 reviews)',
          priceRange: '₹4,500 – ₹8,500 per person',
          itemsWithPrice: 'Curated 7-Course Chef Degustation (₹5,200) • Himalayan Herb-Crusted Rack of Lamb (₹2,400)',
          quote: '"World-exclusive luxury glamping dining under silk canopies with private butlers and sommelier pairings."',
        },
        {
          id: 3,
          name: 'Stok Palace Heritage Fine Dining',
          cuisine: 'Royal Court Dining inside the 200-Year-Old Palace',
          location: 'Stok Village, Ladakh',
          rating: '4.9/5 (1.1k reviews)',
          priceRange: '₹3,000 – ₹6,000 per person',
          itemsWithPrice: 'Imperial Ladakhi Banquet (₹3,400) • Handcrafted Apricot & Saffron Souffle (₹750)',
          quote: '"Dine like Ladakhi royalty inside the original ancestral home of the royal Namgyal dynasty."',
        },
      ],
    },
    events: [
      {
        tag: 'Astronomy & Night Sky',
        category: 'Free Entry',
        price: 'Free Stargazing Sanctuary',
        title: 'Hanle International Dark Sky Reserve Stargazing Camp',
        when: 'Daily Night Sky (8:30 PM – Midnight)',
        venue: 'Hanle Observatory High Plateau (250 km from Leh)',
        description: 'Breathtaking zero-light-pollution views of the Milky Way, meteor showers, and planetary rings at 4,500m altitude.',
      },
      {
        tag: 'Cultural Monastery Festival',
        category: 'Free Entry',
        price: 'Free Monastery Access',
        title: 'Hemis & Thiksey Morning Chanting & Mask Dance',
        when: 'Mornings (6:30 AM – 9:00 AM)',
        venue: 'Thiksey & Hemis Monasteries (40 km from Leh)',
        description: 'Soulful Tibetan Buddhist monastic trumpet horns, synchronized prayers, and vibrant spiritual heritage.',
      },
    ],
    daysPlan: [
      {
        day: 1,
        title: 'Day 1: Arrival in Leh (3,500m) & Mandatory Acclimatization Walk',
        items: [
          '08:30 AM: Voyago Private 4x4 Mountain Cab pickup from Leh Kushok Bakula Rimpochee Airport.',
          '10:30 AM: Check-in to traditional boutique Ladakhi hotel. Warm welcome herbal Kahwa tea.',
          '01:00 PM: Light comforting Tibetan lunch (Tingmo & Veg Thukpa).',
          '04:30 PM: Very gentle acclimatization evening walk around Leh Main Bazaar.',
          '07:30 PM: Early nutritious dinner and restful high-altitude sleep.',
        ],
      },
      {
        day: 2,
        title: 'Day 2: Leh Local Heritage — Shanti Stupa, Leh Palace & Sunset View',
        items: [
          '09:00 AM: Visit the iconic white-domed Shanti Stupa for 360° panoramic views of Leh Valley and Stok Kangri.',
          '11:30 AM: Explore historic 17th-century Leh Royal Palace and antique Tibetan art museum.',
          '01:30 PM: Heritage lunch featuring artisanal Yak cheese and organic bakes.',
          '04:00 PM: Walk through the historic stone alleyways of Old Town Leh and local handicraft stalls.',
          '07:30 PM: Rooftop sunset dinner overlooking illuminated mountain ridges.',
        ],
      },
      {
        day: 3,
        title: 'Day 3: Sham Valley Circuit (70 km) — Magnetic Hill, Pathar Sahib & Indus-Zanskar Sangam',
        items: [
          '08:30 AM: Scenic highway drive along the Indus River toward Sham Valley (70 km).',
          '10:00 AM: Experience the gravity-defying optical phenomenon at Magnetic Hill.',
          '11:30 AM: Visit Gurudwara Pathar Sahib for hot langar tea and historical boulders.',
          '01:00 PM: Reach Sangam Point — the dramatic confluence of the blue Indus and muddy Zanskar rivers.',
          '04:30 PM: Visit the Hall of Fame Indian Army Memorial museum.',
          '08:00 PM: Evening dinner in Leh town.',
        ],
      },
      {
        day: 4,
        title: 'Day 4: Royal Monasteries Circuit (45 km) — Thiksey, Shey Palace & Hemis Monastery',
        items: [
          '06:30 AM: Early morning drive to Thiksey Monastery (Mini Potala Palace) for monk morning chants.',
          '09:30 AM: Marvel at the magnificent 49-foot tall Maitreya Future Buddha statue.',
          '11:30 AM: Visit Shey Palace — the ancient summer capital of Ladakh with giant copper Buddha.',
          '01:30 PM: Traditional lunch at a scenic monastic garden cafe in Hemis.',
          '03:30 PM: Explore Hemis Monastery (Ladakh’s largest and wealthiest monastery tucked in a hidden gorge).',
          '07:30 PM: Return to Leh for evening relaxation.',
        ],
      },
      {
        day: 5,
        title: 'Day 5: Crossing Khardung La Pass (5,359m - 40 km) to Nubra Valley & Diskit',
        items: [
          '08:00 AM: Thrilling mountain ascent over Khardung La Pass — one of the world’s highest motorable passes.',
          '10:30 AM: Quick photo stop at the snow-clad Khardung La summit flag point (5,359m).',
          '01:30 PM: Descend into the dramatic green oasis of Nubra Valley (Valley of Flowers).',
          '03:30 PM: Visit the 106-foot tall colorful Maitreya Buddha statue at Diskit Monastery.',
          '06:30 PM: Check-in to luxury Swiss glamping tents in Hunder.',
          '08:00 PM: Traditional Ladakhi camp dinner under pristine starry skies.',
        ],
      },
      {
        day: 6,
        title: 'Day 6: Hunder White Sand Dunes, Double-Humped Bactrian Camels & Stargazing',
        items: [
          '07:30 AM: Sunrise walk through Hunder’s unique cold-desert white sand dunes surrounded by snow peaks.',
          '09:00 AM: Ride the rare double-humped Bactrian Silk Route camels across the desert sands.',
          '01:00 PM: Riverside picnic lunch in Hunder village.',
          '04:00 PM: Explore hidden willow forests and cold mountain stream pools.',
          '08:00 PM: Bonfire dinner and high-altitude Milky Way astrophotography.',
        ],
      },
      {
        day: 7,
        title: 'Day 7: Excursion to Turtuk (85 km from Nubra) — Baltic Border Village & Apricot Orchards',
        items: [
          '08:00 AM: Drive along the scenic Shyok River to Turtuk — the last northern outpost of India (annexed in 1971).',
          '10:30 AM: Walking tour through wooden Baltic stone houses, natural rock refrigerators, and organic apricot farms.',
          '01:00 PM: Authentic Balti lunch feast (Kisir buckwheat pancakes, fresh apricot stew & herbal tea).',
          '03:30 PM: Visit the 16th-century Turtuk Yabgo Royal Palace and meet the royal descendants.',
          '07:00 PM: Return drive to Hunder camp for overnight stay.',
        ],
      },
      {
        day: 8,
        title: 'Day 8: Scenic Off-Road Drive from Nubra to Pangong Tso Lake via Shyok Route (160 km)',
        items: [
          '07:30 AM: Epic 6-hour off-road expedition along the dramatic canyon gorges of the Shyok River route.',
          '01:30 PM: First breathtaking glimpse of the shimmering electric-blue Pangong Tso Lake (4,350m).',
          '03:00 PM: Check-in to lakefront boutique cottages at Spangmik.',
          '05:00 PM: Sunset walk along the tranquil blue lake shores watching colors shift from turquoise to indigo.',
          '08:00 PM: Heated cottage dinner with views of the illuminated Himalayan ridges.',
        ],
      },
      {
        day: 9,
        title: 'Day 9: Pangong Tso Sunrise & Expedition to Hanle Dark Sky Reserve (150 km)',
        items: [
          '06:00 AM: Mesmerizing sunrise over Pangong Tso with mirror reflections of Tibetan peaks.',
          '08:30 AM: Drive across remote Changthang high-altitude wilderness toward Hanle (150 km).',
          '01:00 PM: Spot wild Kiangs (Tibetan Wild Ass), Himalayan Marmots, and Black-Necked Cranes en route.',
          '04:00 PM: Check-in to local homestay in the serene village of Hanle.',
          '08:30 PM: World-class stargazing at India’s first designated International Dark Sky Reserve.',
        ],
      },
      {
        day: 10,
        title: 'Day 10: Hanle Astronomical Observatory (World’s Highest) & High Plateau Exploration',
        items: [
          '09:00 AM: Visit the Indian Astronomical Observatory at Mount Saraswati (4,500m) — one of the highest optical telescopes on Earth.',
          '12:30 PM: Traditional high-altitude hot butter tea and local barley tsampa lunch.',
          '03:00 PM: Excursion to historic 17th-century Hanle Monastery perched atop a solitary hill.',
          '07:30 PM: Homestay acoustic cultural evening with local Changpa nomadic community.',
        ],
      },
      {
        day: 11,
        title: 'Day 11: Drive to Tso Moriri High-Altitude Blue Lake & Korzok Monastery (140 km)',
        items: [
          '08:00 AM: Drive through dramatic multi-colored mineral valleys toward Tso Moriri Lake (4,522m).',
          '01:00 PM: Arrive at the secluded crystal-blue waters of Tso Moriri — a protected Ramsar wetland sanctuary.',
          '03:30 PM: Visit ancient 300-year-old Korzok Monastery overlooking the lake.',
          '06:00 PM: Sunset birdwatching walk (bar-headed geese & Brahminy ducks).',
          '08:00 PM: Traditional dinner at Korzok lake resort.',
        ],
      },
      {
        day: 12,
        title: 'Day 12: Tso Moriri to Tso Kar Salt Lake & Tanglang La Pass (5,328m) Return to Leh (220 km)',
        items: [
          '07:30 AM: Scenic morning drive past the white brine crusts and geothermal hot sulfur springs of Tso Kar Lake.',
          '12:30 PM: Cross the majestic Tanglang La Pass (5,328m - 2nd highest pass) on the Leh-Manali highway.',
          '02:30 PM: Traditional lunch at Upshi river junction.',
          '05:30 PM: Return to Leh town. Check-in to hotel for a warm rejuvenating hot bath.',
          '08:00 PM: Celebration feast in Leh Main Bazaar.',
        ],
      },
      {
        day: 13,
        title: 'Day 13: White Water Rafting on Zanskar River & Alchi 1,000-Year Heritage Village (65 km)',
        items: [
          '09:00 AM: Exhilarating Grade-III white water rafting down the dramatic stone gorges of the Zanskar River (Chilling to Sangam).',
          '01:30 PM: Organic garden lunch at Alchi village.',
          '03:00 PM: Tour 11th-century Alchi Monastery — the oldest surviving monastic complex in Ladakh with Kashmiri-Buddhist wooden carvings.',
          '06:30 PM: Return to Leh for farewell sunset tea overlooking the valley.',
        ],
      },
      {
        day: 14,
        title: 'Day 14: Final Tibetan Souvenir Shopping & Leh Airport Departure',
        items: [
          '08:30 AM: Morning stroll through Tibetan refugee markets for pure certified Pashmina shawls, turquoise jewellery, and dried apricots.',
          '11:30 AM: Farewell lunch with fresh local seabuckthorn juice.',
          '01:30 PM: Hotel checkout and luggage packing.',
          '03:00 PM: Voyago Private 4x4 Cab return drop-off at Leh Kushok Bakula Airport for your flight.',
        ],
      },
    ],
  },
  chikmagalur: {
    city: 'Chikmagalur',
    weather: { c: 27, low: 18, label: 'Misty hills & cool air', rain: '15%' },
    highlights: ['Mullayanagiri Peak', 'Coffee estate stay', 'Hebbe Falls trek', 'Kemmanagundi (55 km)', 'Kudremukh (90 km)', 'Belur/Halebidu (40 km)'],
    tierRestaurants: {
      affordable: [
        {
          id: 1,
          name: 'Town Canteen',
          cuisine: 'Authentic Malnad Benne Dosa & Filter Coffee',
          location: 'MG Road, Chikmagalur',
          rating: '4.8/5 (2.4k reviews)',
          priceRange: '₹150 – ₹300 per person',
          itemsWithPrice: 'Butter Benne Dosa (₹90) • Strong Filter Kaapi (₹35) • Hot Gulab Jamun (₹45)',
          quote: '"Legendary heritage taste since 1963, crisp golden crust with rich spicy coconut chutney."',
        },
        {
          id: 2,
          name: 'Siri Garden Cafe',
          cuisine: 'Plantation Eatery & Artisan Coffee',
          location: 'KM Road, Chikmagalur',
          rating: '4.6/5 (3.1k reviews)',
          priceRange: '₹200 – ₹400 per person',
          itemsWithPrice: 'Cardamom Cookies (₹80) • Herbal Pepper Soup (₹110) • Fresh Cold Brew (₹130)',
          quote: '"Tree-shaded garden cafe with iconic green sculpture, local organic bakes and high value."',
        },
        {
          id: 3,
          name: 'Soundarya Restaurant',
          cuisine: 'South Indian Veg Meals & Quick Bites',
          location: 'Market Road, Chikmagalur',
          rating: '4.5/5 (1.9k reviews)',
          priceRange: '₹120 – ₹250 per person',
          itemsWithPrice: 'Traditional Banana Leaf Thali (₹150) • Curd Vada (₹60) • Filter Kaapi (₹30)',
          quote: '"Authentic, fast, and high-value traditional meals loved by local travellers."',
        },
      ],
      better: [
        {
          id: 1,
          name: 'The Estate Cafe & Bistro',
          cuisine: 'Malnad Thali & Specialty Arabica Roasts',
          location: 'Plantation Road, Chikmagalur',
          rating: '4.7/5 (1.8k reviews)',
          priceRange: '₹500 – ₹950 per person',
          itemsWithPrice: 'Malnad Special Thali (₹380) • Akki Rotti with Veg Huli (₹160) • Arabica Pour-Over (₹140)',
          quote: '"Vibrant open-air plantation ambiance surrounded by misty hills and coffee blossoms."',
        },
        {
          id: 2,
          name: 'Malnad Kitchen & Grill',
          cuisine: 'Authentic Local Delicacies & Pandi / Mushroom Grills',
          location: 'IG Road, Chikmagalur',
          rating: '4.6/5 (2.2k reviews)',
          priceRange: '₹450 – ₹850 per person',
          itemsWithPrice: 'Bamboo Shoot Curry (₹280) • Neer Dosa with Chutney (₹140) • Kadubu Platter (₹220)',
          quote: '"Warm wooden interiors serving rich traditional Malnad recipes with freshly ground spices."',
        },
        {
          id: 3,
          name: 'Planters Court Fine Dining',
          cuisine: 'Multi-Cuisine, Kebabs & Continental Roasts',
          location: 'KM Road, Chikmagalur',
          rating: '4.6/5 (1.6k reviews)',
          priceRange: '₹400 – ₹800 per person',
          itemsWithPrice: 'Tandoori Platter (₹390) • Coffee Glazed Roast (₹340) • Walnut Brownie (₹180)',
          quote: '"Spacious heritage dining hall popular for family dinners and evening cocktails."',
        },
      ],
      luxury: [
        {
          id: 1,
          name: 'The Serai Chikmagalur Luxury Fine Dining',
          cuisine: 'Chef-Curated Global Gastronomy & Coffee Infusions',
          location: 'Mugthihalli Post, Chikmagalur',
          rating: '4.9/5 (2.4k reviews)',
          priceRange: '₹2,500 – ₹5,000 per person',
          itemsWithPrice: '7-Course Coffee Plantation Degustation (₹3,200) • Espresso Rubbed Tenderloin (₹1,400)',
          quote: '"5-star luxury dining immersed in private coffee groves with private cabana candlelight setups."',
        },
        {
          id: 2,
          name: 'Shavige Courtyard at Java Rain Resort',
          cuisine: 'High-Altitude Fine Dining overlooking Mullayanagiri',
          location: 'Giridharshini Layout, Chikmagalur',
          rating: '4.8/5 (1.9k reviews)',
          priceRange: '₹2,000 – ₹4,500 per person',
          itemsWithPrice: 'Signature Malnad Royal Thali (₹1,800) • Woodfired Sourdough Pizza (₹850)',
          quote: '"Spectacular cliff-edge restaurant with panoramic views of the illuminated town below."',
        },
        {
          id: 3,
          name: 'Trivik Mountain Top Bistro',
          cuisine: 'European, Pan-Asian & Artisanal Estate Grills',
          location: 'Channagondanahalli, Mullayanagiri Hills',
          rating: '4.9/5 (1.2k reviews)',
          priceRange: '₹2,200 – ₹4,800 per person',
          itemsWithPrice: 'Smoked Mountain Trout (₹1,250) • Single-Estate Bean Tasting Menu (₹1,600)',
          quote: '"Perched high in the clouds near Karnataka’s highest peak, offering unmatched sunset dining."',
        },
      ],
    },
    events: [
      {
        tag: 'Food & Cultural Gathering',
        category: 'Free Entry',
        price: 'Free (Food stalls on purchase)',
        title: 'Chikmagalur Weekend Artisan & Street Food Fair',
        when: 'Friday through Sunday (5:30 PM – 10:00 PM)',
        venue: 'Central Civic Plaza, Chikmagalur',
        description: 'Top local street food vendors, handmade artisan crafts, live acoustic musicians, and cultural workshops.',
      },
      {
        tag: 'Coffee Tasting Masterclass',
        category: '₹250 / person',
        price: '₹250 (Includes 3 single-origin tastings)',
        title: 'Arabica Coffee Blossom Cupping & Roasting Workshop',
        when: 'Daily (4:00 PM – 5:30 PM)',
        venue: 'Coffee Yatra Experience Center, Chikmagalur',
        description: 'Interactive session with certified master roasters explaining coffee grading, aroma notes, and French press brewing.',
      },
    ],
    daysPlan: [
      {
        day: 1,
        title: 'Day 1: Arrival, Check-In & Hirekolale Lake Sunset Immersion',
        items: [
          '07:00 AM: Voyago Private Outstation AC Cab pickup from Bangalore residence / airport.',
          '11:30 AM: Scenic highway drive through Hassan with en-route breakfast stop (₹300/person).',
          '01:30 PM: Check-in to Serene Coffee Estate Homestay / Resort. Welcome Arabica filter coffee.',
          '02:30 PM: Traditional Malnad lunch at The Estate Cafe (Akki Rotti & Veg Huli).',
          '05:00 PM: Golden-hour evening walk by tranquil Hirekolale Lake surrounded by mountain silhouettes.',
          '07:30 PM: Attend Chikmagalur Weekend Artisan & Street Food Fair for local street delicacies & evening vibes.',
        ],
      },
      {
        day: 2,
        title: "Day 2: Conquering Karnataka's Highest Peak (Mullayanagiri) & Jhari Waterfalls",
        items: [
          '06:00 AM: Early morning drive to Mullayanagiri Peak base (1,930m altitude) for misty cloud sunrise views.',
          '08:30 AM: Descend via Seethalayyanagiri temple viewpoint and cool mountain breeze stops.',
          '11:00 AM: Off-road 4x4 Jeep transfer to Jhari (Buttermilk) Waterfalls (Jeep fee: ₹400/group).',
          '01:30 PM: Iconic heritage lunch at Town Canteen (Crispy Butter Benne Dosa & Strong Filter Coffee — ₹200/person).',
          '04:30 PM: Leisure stroll through local spice and artisanal coffee market on MG Road.',
          '07:30 PM: Evening plantation bonfire at resort with live barbecue and Malnad delicacies.',
        ],
      },
      {
        day: 3,
        title: 'Day 3: Mystic Baba Budangiri Ridge, Z-Point Hike & Coffee Yatra Museum',
        items: [
          '08:30 AM: Scenic winding hill drive to Baba Budangiri shrine and the natural springs of Manikyadhara Falls.',
          '11:30 AM: Cliffside panoramic hike along Z-Point trail with panoramic Western Ghats valley views.',
          '01:30 PM: Organic garden lunch at Siri Coffee with fresh cardamom cookies and herbal brews.',
          '03:30 PM: Educational tour at Coffee Yatra Museum exploring the origin of coffee in India (Entry: ₹50).',
          '08:00 PM: Candlelight dinner amidst coffee blossoms.',
        ],
      },
      {
        day: 4,
        title: 'Day 4: Kemmanagundi Royal Hill Station & Hebbe Falls Jeep Expedition (55 km)',
        items: [
          '08:00 AM: Drive to picturesque Kemmanagundi (the royal summer retreat of Mysore kings).',
          '10:30 AM: Exhilarating 4x4 Jeep drive through dense cloud forests to twin Hebbe Waterfalls.',
          '01:30 PM: Forest picnic lunch by natural mineral springs.',
          '04:30 PM: Visit Z-Point viewpoint and rose garden at Kemmanagundi.',
          '07:30 PM: Return to resort for evening dinner.',
        ],
      },
      {
        day: 5,
        title: 'Day 5: UNESCO Heritage Hoysala Temples of Belur & Halebidu (40 km)',
        items: [
          '09:00 AM: Excursion to Chennakeshava Temple at Belur (12th-century soapstone masterpiece).',
          '12:30 PM: Grand traditional South Indian banana leaf lunch in Belur.',
          '02:30 PM: Visit Hoysaleshwara Temple at Halebidu with intricate friezes depicting Indian epics.',
          '05:30 PM: Sunset walk along Halebidu Lake.',
        ],
      },
      {
        day: 6,
        title: 'Day 6: Kudremukh National Park & Tea Estate Valley Excursion (90 km)',
        items: [
          '07:30 AM: Scenic mountain drive into Kudremukh National Park (Horse-face mountain peak).',
          '11:00 AM: Trek through rolling green shola grasslands and clear river headwaters.',
          '01:30 PM: Traditional lunch at a scenic tea estate bungalow.',
          '04:30 PM: Visit Hanumangundi Waterfalls cascading down a 100-foot rock face.',
        ],
      },
      {
        day: 7,
        title: 'Day 7: Sacred Hornadu Annapoorneshwari Temple & Sringeri Sharada Peetham (85 km)',
        items: [
          '08:30 AM: Drive through lush Western Ghats canopy to Hornadu Temple situated amidst green valleys.',
          '01:00 PM: Sacred temple meal and drive to historic Sringeri Mutt on the banks of the Tunga River.',
          '04:30 PM: Feed the sacred giant fish at the riverside ghats and visit Vidyashankara Temple.',
          '07:30 PM: Return drive to Chikmagalur.',
        ],
      },
      {
        day: 8,
        title: 'Day 8: Agumbe Rainforest & King Cobra Sanctuary (110 km)',
        items: [
          '08:00 AM: Drive to Agumbe — the Cherrapunji of South India known for pristine rainforests.',
          '11:00 AM: Visit Agumbe Rainforest Research Station (ARRS) and Barkana Falls viewpoint.',
          '01:30 PM: Traditional Malnad home-cooked meal.',
          '05:30 PM: Breathtaking sunset over the Arabian Sea horizon from Agumbe Sunset Point.',
        ],
      },
      {
        day: 9,
        title: 'Day 9: Majestic Jog Falls Excursion (160 km - India’s 2nd Highest Plunge Waterfall)',
        items: [
          '07:30 AM: Full-day road trip to thunderous Jog Falls on the Sharavathi River.',
          '11:30 AM: Witness the four distinct cascades (Raja, Roarer, Rocket, and Rani) dropping 830 feet.',
          '01:30 PM: Lunch at KSTDC Mayura Gerusoppa restaurant.',
          '04:30 PM: Visit the hydroelectric viewpoint and drive back through green spice belts.',
        ],
      },
      {
        day: 10,
        title: 'Day 10: Sakleshpur Star Fort & Bisle Ghat Cloud Forest Viewpoint (60 km)',
        items: [
          '08:30 AM: Drive to Sakleshpur and explore 18th-century star-shaped Manjarabad Fort built by Tipu Sultan.',
          '12:30 PM: Lunch in Sakleshpur town.',
          '02:30 PM: Spectacular views of 3 mountain ranges at Bisle Ghat Viewpoint (Bisle Reserve Forest).',
          '06:30 PM: Evening coffee at a scenic Sakleshpur plantation cafe.',
        ],
      },
      {
        day: 11,
        title: 'Day 11: Bhadra Wildlife Sanctuary Jeep Safari & River Backwaters (70 km)',
        items: [
          '06:00 AM: Early morning wildlife safari in Bhadra Tiger Reserve (Spotting elephants, leopards & deer).',
          '12:30 PM: Lunch at River Tern Jungle Lodge.',
          '03:30 PM: Motorboat ride across the tranquil Bhadra reservoir backwaters for birdwatching.',
          '07:30 PM: Return to Chikmagalur for dinner.',
        ],
      },
      {
        day: 12,
        title: 'Day 12: High-Altitude Tea Plantations & Kallathigiri Waterfalls (45 km)',
        items: [
          '09:00 AM: Drive to Kallathigiri Waterfalls flowing across the ancient Veerabhadra temple.',
          '01:00 PM: Lunch and tour of high-altitude orthodox tea processing factory.',
          '04:30 PM: Tea tasting session with fresh mountain estate brews.',
        ],
      },
      {
        day: 13,
        title: 'Day 13: Plantation Ayurvedic Spa, Coffee Cupping & Grand Sunset Bonfire',
        items: [
          '09:00 AM: Relaxing Ayurvedic herbal oil massage and wellness therapy at the resort.',
          '01:00 PM: Farm-to-table organic lunch feast.',
          '04:00 PM: Masterclass on single-origin coffee roasting and brewing methods.',
          '08:00 PM: Grand farewell bonfire dinner under the starry mountain skies with live acoustic music.',
        ],
      },
      {
        day: 14,
        title: 'Day 14: Morning Spice & Coffee Shopping, Farewell & Return Drop to Bangalore',
        items: [
          '08:30 AM: Morning stroll through local spice markets for unroasted Arabica coffee beans, pure cardamom, and organic pepper.',
          '11:30 AM: Hotel checkout and packing.',
          '01:00 PM: Farewell lunch at Chikmagalur Garden Bistro & Cafe.',
          '02:30 PM: Voyago Private Outstation AC Cab return transit to Bangalore.',
          '07:00 PM: Safe, punctual drop-off at your residence / airport in Bangalore.',
        ],
      },
    ],
  },
  mumbai: {
    city: 'Mumbai',
    weather: { c: 30, low: 24, label: 'Warm & coastal sea breeze', rain: '10%' },
    highlights: ['Marine Drive Sunset', 'Gateway of India & Colaba', 'Lonavala Hill Station (85 km)', 'Alibaug Coastal Fort (100 km)', 'Elephanta Caves'],
    tierRestaurants: {
      affordable: [
        {
          id: 1,
          name: 'Britannia & Co.',
          cuisine: 'Authentic Parsi & Irani Heritage Cafe',
          location: 'Ballard Estate, Fort, Mumbai',
          rating: '4.8/5 (3.2k reviews)',
          priceRange: '₹250 – ₹450 per person',
          itemsWithPrice: 'Berry Pulao (₹380) • Sali Boti (₹320) • Caramel Custard (₹140) • Irani Chai (₹40)',
          quote: '"Iconic 1923 vintage cafe in South Bombay serving melt-in-mouth berry pulao and custard."',
        },
        {
          id: 2,
          name: 'Bademiya & Bagdadi',
          cuisine: 'Legendary Mughlai Kebabs & Rolls',
          location: 'Behind Taj Mahal Palace, Colaba, Mumbai',
          rating: '4.7/5 (4.1k reviews)',
          priceRange: '₹200 – ₹400 per person',
          itemsWithPrice: 'Mutton Seekh Kebab (₹240) • Chicken Baida Roti (₹180) • Rumali Roti (₹30)',
          quote: '"Midnight street haven for sizzling charcoal kebabs by the Arabian Sea."',
        },
        {
          id: 3,
          name: 'Highway Gomantak',
          cuisine: 'Coastal Konkan & Malvani Seafood Thalis',
          location: 'Bandra East, Mumbai',
          rating: '4.6/5 (2.8k reviews)',
          priceRange: '₹300 – ₹550 per person',
          itemsWithPrice: 'Surmai Fry Thali (₹360) • Prawns Curry (₹290) • Sol Kadhi (₹50)',
          quote: '"Authentic fiery coastal thalis with crispy pan-fried fish and soul-soothing coconut solkadhi."',
        },
      ],
      better: [
        {
          id: 1,
          name: 'The Bombay Canteen',
          cuisine: 'Contemporary Indian Regional Gastronomy',
          location: 'Kamala Mills, Lower Parel, Mumbai',
          rating: '4.8/5 (3.6k reviews)',
          priceRange: '₹1,000 – ₹2,000 per person',
          itemsWithPrice: 'Keema Pav (₹480) • Canto Pork Ribs (₹780) • Guava Tan-Tana-Tan Cocktail (₹550)',
          quote: '"Celebrated modern Indian kitchen reimagining regional delicacies with chic industrial design."',
        },
        {
          id: 2,
          name: 'Trishna Coastal Seafood',
          cuisine: 'Legendary Butter Pepper Garlic Crab & Koliwada',
          location: 'Kala Ghoda, Fort, Mumbai',
          rating: '4.7/5 (2.9k reviews)',
          priceRange: '₹1,200 – ₹2,400 per person',
          itemsWithPrice: 'Butter Pepper Garlic King Crab (₹1,800) • Jumbo Prawns Koliwada (₹850)',
          quote: '"World-famous coastal seafood temple frequented by global celebrities and seafood lovers."',
        },
        {
          id: 3,
          name: 'Bastian Bandra',
          cuisine: 'Gourmet Asian Seafood & Celebrity Bistro',
          location: 'Linking Road, Bandra West, Mumbai',
          rating: '4.7/5 (3.1k reviews)',
          priceRange: '₹1,200 – ₹2,600 per person',
          itemsWithPrice: 'Lobster Roll (₹1,200) • Truffle Mac & Cheese (₹750) • Signature Cheesecake (₹450)',
          quote: '"Lively upscale seafood hotspot known for premium lobster dishes and chic celebrity vibe."',
        },
      ],
      luxury: [
        {
          id: 1,
          name: 'Wasabi by Morimoto at The Taj Mahal Palace',
          cuisine: 'World-Class Japanese Fine Dining & Teppanyaki',
          location: 'Apollo Bunder, Colaba, Mumbai',
          rating: '5.0/5 (1.8k reviews)',
          priceRange: '₹4,500 – ₹9,000 per person',
          itemsWithPrice: 'Chef Morimoto Omakase Tasting (₹6,500) • Black Cod Miso (₹3,200) • White Lotus Sushi (₹1,800)',
          quote: '"India’s most prestigious Japanese fine-dining landmark with ingredients flown directly from Tokyo."',
        },
        {
          id: 2,
          name: 'Ziya by Vineet Bhatia at The Oberoi',
          cuisine: 'Michelin-Starred Modern Indian Degustation',
          location: 'Nariman Point, Marine Drive, Mumbai',
          rating: '4.9/5 (1.5k reviews)',
          priceRange: '₹4,000 – ₹8,000 per person',
          itemsWithPrice: 'Gourmand 6-Course Tasting Menu (₹4,800) • Malabar Lobster in Coconut Foam (₹2,600)',
          quote: '"Gold-accented luxury dining overlooking the Queen’s Necklace with visionary Michelin cuisine."',
        },
        {
          id: 3,
          name: 'Souk Rooftop Mediterranean at The Taj Palace',
          cuisine: 'Eastern Mediterranean & Arabian Gulf Rooftop Dining',
          location: 'Colaba, Mumbai',
          rating: '4.8/5 (2.1k reviews)',
          priceRange: '₹3,500 – ₹7,000 per person',
          itemsWithPrice: 'Batinjan Makli (₹1,200) • Shish Taouk (₹1,600) • Rose Petal Baklava with Ice Cream (₹650)',
          quote: '"Spectacular rooftop panorama of Mumbai harbor and Gateway of India with authentic mezze."',
        },
      ],
    },
    events: [
      {
        tag: 'Art & Heritage Walk',
        category: 'Free Entry',
        price: 'Free Community Event',
        title: 'Kala Ghoda Historic Architecture & Street Art Trail',
        when: 'Friday through Sunday (4:00 PM – 8:30 PM)',
        venue: 'Kala Ghoda Art District, Fort, Mumbai',
        description: 'Guided heritage walk through colonial Gothic buildings, modern art galleries, and artisan craft boutiques.',
      },
      {
        tag: 'Sunset & Sea Promenade',
        category: 'Free Entry',
        price: 'Free Open Gathering',
        title: 'Marine Drive Sunset Acoustic & Cycling Circle',
        when: 'Daily Sunset (5:30 PM – 9:00 PM)',
        venue: "Queen's Necklace Promenade, Marine Drive, Mumbai",
        description: 'Breathtaking sea views, cool evening ocean breeze, local buskers, and lively Mumbai street energy.',
      },
    ],
    daysPlan: [
      {
        day: 1,
        title: 'Day 1: South Bombay Heritage, Gateway of India & Marine Drive Sunset',
        items: [
          '09:00 AM: Voyago Private AC Cab pickup from Mumbai Airport / Railway Station.',
          '11:30 AM: Scenic heritage drive past Victoria Terminus (CST) and Horniman Circle.',
          '01:00 PM: Check-in to South Bombay hotel. Traditional Parsi lunch at Britannia & Co. (Berry Pulao).',
          '04:30 PM: Walk around Gateway of India and historic Colaba Causeway shopping arcades.',
          '06:30 PM: Golden hour sunset stroll along Marine Drive Promenade (Queen’s Necklace).',
          '08:30 PM: Midnight coastal kebab dinner at Bademiya behind the Taj Mahal Palace.',
        ],
      },
      {
        day: 2,
        title: 'Day 2: Bandra Culture, Mount Mary Church & Carter Road Street Food',
        items: [
          '09:30 AM: Drive across the iconic Bandra-Worli Sea Link over the Arabian Sea.',
          '11:30 AM: Explore historic Bandra heritage lanes, Ranwar village murals, and Mount Mary Basilica.',
          '01:30 PM: Coastal Konkan seafood lunch at Highway Gomantak (Surmai & Prawns Thali).',
          '04:30 PM: Seaside walk along Bandra Bandstand & Carter Road promenade with fresh fruit juices.',
          '07:30 PM: Sunset coffee & live indie music at a Bandra bohemian cafe.',
        ],
      },
      {
        day: 3,
        title: 'Day 3: UNESCO Elephanta Caves & Kala Ghoda Art District',
        items: [
          '08:30 AM: Morning harbor ferry ride from Gateway of India to Elephanta Caves (UNESCO World Heritage rock-cut temples).',
          '01:30 PM: Return to mainland for heritage high tea at Leopold Cafe / Cafe Mondegar.',
          '03:30 PM: Art gallery hopping and heritage architectural walk in Kala Ghoda District.',
          '07:00 PM: Evening NCPA Cultural Jazz & theatre performance at Nariman Point.',
        ],
      },
      {
        day: 4,
        title: 'Day 4: Sanjay Gandhi National Park, Kanheri Caves & Juhu Beach',
        items: [
          '07:30 AM: Morning excursion to Sanjay Gandhi National Park and ancient Buddhist Kanheri rock caves.',
          '01:00 PM: Hearty North Indian lunch in suburban Mumbai.',
          '04:30 PM: Evening stroll on lively Juhu Beach with famous Mumbai Pav Bhaji and Kulfi.',
          '08:00 PM: Sunset night drive through Worli Sea Face promenade.',
        ],
      },
      {
        day: 5,
        title: 'Day 5: Lonavala & Khandala Western Ghats Excursion (85 km)',
        items: [
          '08:00 AM: Scenic expressway drive to Lonavala hill station through the Western Ghats.',
          '11:00 AM: Visit Tiger’s Leap and Bhushi Dam waterfalls.',
          '01:30 PM: Traditional Maharashtrian lunch with fresh hot chikki tasting.',
          '04:30 PM: Explore ancient Karla & Bhaja rock-cut Buddhist caves (2nd century BC).',
          '08:00 PM: Return drive to Mumbai.',
        ],
      },
      {
        day: 6,
        title: 'Day 6: Alibaug Coastal Fort & Beach Retreat (Ferry / 100 km)',
        items: [
          '08:30 AM: Speedboat / ferry transfer from Gateway of India to Mandwa / Alibaug.',
          '11:00 AM: Visit Kolaba Sea Fort surrounded by ocean waves during low tide.',
          '01:30 PM: Authentic coastal Malvani crab & fish lunch on the beach.',
          '04:30 PM: Relax at serene Kihim / Varsoli beach with watersports.',
          '08:00 PM: Beachfront dinner in Alibaug.',
        ],
      },
      {
        day: 7,
        title: 'Day 7: Murud Janjira Impregnable Island Sea Fort (140 km)',
        items: [
          '08:00 AM: Coastal drive to Murud and sailboat transfer to Janjira Fort (never conquered in history).',
          '11:30 AM: Explore 500-year-old fort ramparts, secret sea gates, and cannons.',
          '02:00 PM: Fresh seafood lunch at Murud beach.',
          '06:00 PM: Return drive to Mumbai.',
        ],
      },
      {
        day: 8,
        title: 'Day 8: Matheran Eco-Sensitive Hill Station & Toy Train (90 km)',
        items: [
          '08:00 AM: Drive to Neral and ride the heritage narrow-gauge Matheran Toy Train.',
          '11:00 AM: Horseback and walking tour to Panorama Point and Charlotte Lake (Asia’s only automobile-free hill station).',
          '01:30 PM: Parsi lunch at Matheran heritage bungalow.',
          '06:00 PM: Return to Mumbai.',
        ],
      },
      {
        day: 9,
        title: 'Day 9: Nashik Wine Country & Sula Vineyards Tour (165 km)',
        items: [
          '07:30 AM: Drive over Kasara Ghat to Nashik (the Wine Capital of India).',
          '11:30 AM: Guided vineyard tour, grape crushing, and premium wine tasting masterclass at Sula Vineyards.',
          '01:30 PM: Italian vineyard lunch overlooking rolling grape fields and Gangapur Dam.',
          '05:00 PM: Sunset tasting at York Winery.',
        ],
      },
      {
        day: 10,
        title: 'Day 10: Trimbakeshwar Jyotirlinga & Igatpuri Mountain Valleys (120 km)',
        items: [
          '08:30 AM: Visit sacred Trimbakeshwar Shiva Temple nestled at the base of Brahmagiri mountain.',
          '12:30 PM: Traditional lunch feast in Nashik.',
          '03:00 PM: Scenic stop at Igatpuri valley viewpoints and Vipassana Pagoda.',
          '07:30 PM: Return drive to Mumbai.',
        ],
      },
      {
        day: 11,
        title: 'Day 11: Mumbai Film City Tour, Dharavi Craft Quarter & Street Food',
        items: [
          '09:00 AM: Bollywood studio tour at Film City Goregaon.',
          '01:00 PM: Lunch in Goregaon.',
          '03:00 PM: Guided leather, pottery, and textile craft tour in Dharavi artisan hub.',
          '06:30 PM: Famous street food crawl at Chowpatty (Bhel Puri, Sev Puri, Pani Puri).',
        ],
      },
      {
        day: 12,
        title: 'Day 12: High-End Fashion Shopping, Worli Sea Face & Luxury Dining',
        items: [
          '10:00 AM: Luxury boutique shopping at Palladium Lower Parel & Colaba boutiques.',
          '01:30 PM: Modern Indian fine dining lunch.',
          '05:00 PM: Sunset drinks at a rooftop lounge overlooking the Arabian Sea skyline.',
        ],
      },
      {
        day: 13,
        title: 'Day 13: Mumbai Coastal Relaxation, Marine Sunset Walk & Farewell Dinner',
        items: [
          '10:00 AM: Relaxed morning brunch in Bandra.',
          '03:00 PM: Art gallery hopping at Jehangir Art Gallery & National Gallery of Modern Art (NGMA).',
          '06:30 PM: Golden hour farewell stroll along Marine Drive.',
          '08:30 PM: Grand coastal farewell dinner at a heritage seaside restaurant.',
        ],
      },
      {
        day: 14,
        title: 'Day 14: Crawford Market & Mangaldas Cloth Bazaar Souvenirs & Airport Drop',
        items: [
          '09:00 AM: Souvenir shopping at historic Crawford Market for Alphonso mango sweets, spices, and textiles.',
          '12:30 PM: Farewell lunch with authentic Mumbai snacks and filter coffee.',
          '03:00 PM: Hotel checkout and packing.',
          '05:00 PM: Voyago Private AC Cab return drop-off to Mumbai International Airport / Railway Station.',
        ],
      },
    ],
  },
}

// 3. UNIVERSAL PROCEDURAL REGIONAL CIRCUIT GENERATOR WITH 3-TIER ADAPTATION
export function getCityDetails(destination, budget = 50000, days = 5) {
  const key = (destination || 'Ladakh').trim().toLowerCase()
  const tier = getBudgetTier(budget, days)
  const destTitle = destination.charAt(0).toUpperCase() + destination.slice(1)

  if (CITY_DATA[key]) {
    const raw = CITY_DATA[key]
    const restaurantsForTier = raw.tierRestaurants
      ? raw.tierRestaurants[tier.key] || raw.tierRestaurants.affordable
      : raw.restaurants
    return {
      ...raw,
      tier,
      restaurants: restaurantsForTier,
    }
  }

  // Universal fallback for custom cities with 3 tiers
  const tierRestaurantsFallback = {
    affordable: [
      {
        id: 1,
        name: `${destTitle} Heritage Dining Hub`,
        cuisine: `Authentic Local ${destTitle} Specialities`,
        location: `Central Heritage Road, ${destTitle}`,
        rating: '4.8/5 (2.9k reviews)',
        priceRange: '₹200 – ₹450 per person',
        itemsWithPrice: `Traditional ${destTitle} Special Platter (₹280) • Regional Dish (₹190) • Local Sweet (₹70)`,
        quote: `"Top-rated legendary kitchen in ${destTitle} renowned for authentic regional spices and warm hospitality."`,
      },
      {
        id: 2,
        name: `The Garden Bistro & Cafe`,
        cuisine: `Multi-Cuisine & Artisanal Coffee`,
        location: `Promenade Avenue, ${destTitle}`,
        rating: '4.7/5 (2.1k reviews)',
        priceRange: '₹300 – ₹600 per person',
        itemsWithPrice: `Woodfired Flatbread (₹260) • Specialty Roast Coffee (₹120) • Fresh Pasta (₹240)`,
        quote: `"Charming garden courtyard dining with relaxed ambience and top-rated local brews."`,
      },
      {
        id: 3,
        name: `Royal ${destTitle} Street Kitchen`,
        cuisine: `Traditional Regional Street Food & Grills`,
        location: `Bazaar Street, ${destTitle}`,
        rating: '4.6/5 (3.4k reviews)',
        priceRange: '₹150 – ₹350 per person',
        itemsWithPrice: `Crispy Regional Snacks (₹90) • Special Grilled Platter (₹220) • Spiced Chai (₹30)`,
        quote: `"A vibrant foodie hotspot delivering authentic, piping-hot dishes loved by locals."`,
      },
    ],
    better: [
      {
        id: 1,
        name: `The Grand ${destTitle} Bistro & Grill`,
        cuisine: `Modern Regional Gastronomy & Craft Cocktails`,
        location: `Civil Lines Heritage Quarter, ${destTitle}`,
        rating: '4.8/5 (2.3k reviews)',
        priceRange: '₹800 – ₹1,500 per person',
        itemsWithPrice: `Signature Regional Tasting Platter (₹680) • Slow-Cooked Claypot Curry (₹550) • Artisan Dessert (₹280)`,
        quote: `"Upscale contemporary dining space celebrating heritage flavors with modern culinary presentation."`,
      },
      {
        id: 2,
        name: `Terrace Garden Lounge at ${destTitle}`,
        cuisine: `Continental, Pan-Asian & Tandoor Specialities`,
        location: `Hilltop Road, ${destTitle}`,
        rating: '4.7/5 (1.8k reviews)',
        priceRange: '₹750 – ₹1,400 per person',
        itemsWithPrice: `Woodfired Artisanal Pizza (₹580) • Herb-Infused Grills (₹620) • Signature Mocktails (₹220)`,
        quote: `"Picturesque open-air terrace with panoramic valley views and live evening acoustic performances."`,
      },
      {
        id: 3,
        name: `Spice Route Heritage Kitchen`,
        cuisine: `North & South Indian Regional Delicacies`,
        location: `Palace Road, ${destTitle}`,
        rating: '4.7/5 (2.1k reviews)',
        priceRange: '₹600 – ₹1,200 per person',
        itemsWithPrice: `Special Dum Biryani (₹480) • Paneer / Mutton Ghee Roast (₹520) • Gulab Jamun Trifle (₹190)`,
        quote: `"Rich aromatic gravies prepared using hand-ground spices and royal cooking traditions."`,
      },
    ],
    luxury: [
      {
        id: 1,
        name: `The Royal Pavilion at 5-Star Heritage Palace, ${destTitle}`,
        cuisine: `Imperial Royal Dining & Chef Degustation Menu`,
        location: `Palace Grounds, ${destTitle}`,
        rating: '5.0/5 (1.9k reviews)',
        priceRange: '₹3,500 – ₹7,000 per person',
        itemsWithPrice: `7-Course Royal Degustation Feast (₹4,200) • Truffle Saffron Pulao (₹1,600) • Gold-Leaf Shahi Tukda (₹750)`,
        quote: `"A majestic 5-star fine-dining sanctuary offering bespoke royal banquets with private butler service."`,
      },
      {
        id: 2,
        name: `Skyline Luxury Penthouse Bistro`,
        cuisine: 'Modern European & Asian Contemporary Fine Dining',
        location: `Highland Ridge Tower, ${destTitle}`,
        rating: '4.9/5 (1.4k reviews)',
        priceRange: '₹3,000 – ₹6,000 per person',
        itemsWithPrice: `Imported Black Truffle Pasta (₹1,850) • Chilean Sea Bass (₹2,400) • Fine Wine Pairings (₹1,500)`,
        quote: `"Exclusive high-altitude fine-dining establishment featuring international chefs and private cabanas."`,
      },
      {
        id: 3,
        name: `The Whispering Pines Private Vineyard Dining`,
        cuisine: 'Farm-to-Table Organic Gastronomy & Wine Cellar Pairings',
        location: `Estate Valley, ${destTitle}`,
        rating: '4.9/5 (980 reviews)',
        priceRange: '₹2,800 – ₹5,500 per person',
        itemsWithPrice: `Organic Estate Tasting Menu (₹3,200) • Sourdough & Artisanal Cheese Board (₹1,200)`,
        quote: `"Secluded candlelit estate dining surrounded by rolling private orchards and mountain breezes."`,
      },
    ],
  }

  const customDaysPlan = [
    {
      day: 1,
      title: `Day 1: Arrival in ${destTitle}, Hotel Check-In & Sunset Immersion`,
      items: [
        `09:00 AM: Voyago Private AC Cab pickup from ${destTitle} Airport / Railway Station.`,
        `01:30 PM: Check-in to accommodation and welcome lunch at a top-rated heritage restaurant.`,
        `04:30 PM: Leisure stroll through historic city corridors and vibrant local marketplace.`,
        `06:30 PM: Sunset viewpoint visit followed by authentic local street food exploration.`,
      ],
    },
    {
      day: 2,
      title: `Day 2: ${destTitle} Iconic Landmarks, Palace / Monument & Cultural Heritage`,
      items: [
        `09:00 AM: Scheduled Voyago local sightseeing tour to famous historic monuments and viewpoints in ${destTitle}.`,
        `01:00 PM: Regional specialties lunch featuring authentic traditional flavors.`,
        `04:00 PM: Artisan craft workshops, museums, and architectural photography.`,
        `07:30 PM: Evening cultural folk performance and regional dinner.`,
      ],
    },
    {
      day: 3,
      title: `Day 3: Scenic Lake / River Valley & Mountain Ridge Trail (45 km)`,
      items: [
        `08:30 AM: Scenic morning drive to popular lake and highland valley outside ${destTitle}.`,
        `11:30 AM: Boat ride or nature trail hike with breathtaking panoramic viewpoints.`,
        `01:30 PM: Farm-to-table lunch at a scenic hillside cafe.`,
        `05:00 PM: Golden-hour photography and return to town for dinner.`,
      ],
    },
    {
      day: 4,
      title: `Day 4: Historic Hill Forts & Ancient Temple Sanctuary (65 km)`,
      items: [
        `08:30 AM: Excursion to historic cliffside forts and ancient architectural temple ruins.`,
        `12:30 PM: Lunch at a heritage courtyard eatery.`,
        `03:30 PM: Guided tour of historical battlements and secret tunnels.`,
        `07:00 PM: Sunset tea overlooking the surrounding green valleys.`,
      ],
    },
    {
      day: 5,
      title: `Day 5: Forest Reserve & Wildlife Sanctuary Safari (85 km)`,
      items: [
        `06:30 AM: Early morning wildlife safari in the nearest protected forest reserve.`,
        `12:00 PM: Forest lodge lunch feast.`,
        `03:30 PM: Birdwatching and canopy walk along natural river streams.`,
        `07:30 PM: Campfire dinner with regional delicacies.`,
      ],
    },
    {
      day: 6,
      title: `Day 6: Waterfalls & Cloud Forest Off-Road Jeep Trail (110 km)`,
      items: [
        `08:00 AM: 4x4 Jeep excursion to thunderous natural cascades deep inside mountain forests.`,
        `12:30 PM: Dip in natural mineral stream pools followed by riverside picnic.`,
        `04:30 PM: Visit local spice and fruit plantations.`,
      ],
    },
    {
      day: 7,
      title: `Day 7: Neighboring Heritage Town & Royal Haveli Excursion (130 km)`,
      items: [
        `08:30 AM: Full-day road trip to neighboring historic cultural town.`,
        `12:30 PM: Traditional royal banquet lunch.`,
        `03:30 PM: Walk through ancient stone bazaars and textile weavers.`,
        `07:30 PM: Return drive to ${destTitle}.`,
      ],
    },
    {
      day: 8,
      title: `Day 8: High-Altitude Pass & Panoramic Glacier / Valley Viewpoint (150 km)`,
      items: [
        `07:30 AM: Scenic high-altitude mountain drive offering 360° views across mountain ridges.`,
        `01:00 PM: Traditional mountain lunch at a high-altitude outpost.`,
        `04:00 PM: Explore natural rock formations and high mountain meadows.`,
      ],
    },
    {
      day: 9,
      title: `Day 9: Traditional Village Cultural Immersion & Handicrafts (75 km)`,
      items: [
        `09:00 AM: Visit traditional rural villages showcasing pottery, handlooms, and organic farming.`,
        `01:00 PM: Authentic home-cooked village feast on brass / banana leaf platters.`,
        `04:00 PM: Interactive handicraft masterclass with local master artisans.`,
      ],
    },
    {
      day: 10,
      title: `Day 10: River Rafting / Adventure Watersports & Cave Exploration (95 km)`,
      items: [
        `08:30 AM: Exhilarating adventure rafting or kayaking in river canyons.`,
        `01:00 PM: Riverside barbecue lunch.`,
        `03:30 PM: Exploration of ancient natural limestone caves and subterranean caverns.`,
      ],
    },
    {
      day: 11,
      title: `Day 11: Spiritual Heritage & Sacred River Sunset Aarti (60 km)`,
      items: [
        `09:00 AM: Visit serene spiritual ashrams and ancient sacred ghats.`,
        `01:00 PM: Pure vegetarian satvik lunch feast.`,
        `05:30 PM: Attend grand evening riverside Maha Aarti with musical chants and floating lamps.`,
      ],
    },
    {
      day: 12,
      title: `Day 12: Tea & Spice Plantation Trails or Organic Vineyard Tour (80 km)`,
      items: [
        `09:00 AM: Guided walk through rolling hillside plantations / vineyards.`,
        `01:00 PM: Specialty tasting session and gourmet estate lunch.`,
        `04:30 PM: Sunset tea overlooking misty estate ridges.`,
      ],
    },
    {
      day: 13,
      title: `Day 13: Wellness Ayurvedic Spa & Grand Farewell Sunset Gathering`,
      items: [
        `10:00 AM: Rejuvenating holistic Ayurvedic wellness therapy and spa session.`,
        `01:30 PM: Gourmet regional lunch at a luxury garden bistro.`,
        `05:30 PM: Golden hour farewell stroll at the most famous viewpoint in ${destTitle}.`,
        `08:30 PM: Grand celebration farewell dinner with live acoustic music.`,
      ],
    },
    {
      day: 14,
      title: `Day 14: Morning Souvenir Market Shopping & Voyago Return Departure`,
      items: [
        `09:00 AM: Morning stroll through traditional handicraft bazaars for souvenirs, spices, and local textiles.`,
        `12:30 PM: Farewell feast at a top-rated local dining spot in ${destTitle}.`,
        `03:00 PM: Hotel checkout and luggage packing.`,
        `05:00 PM: Voyago Private AC Cab return drop-off to Airport / Railway Station.`,
      ],
    },
  ]

  return {
    city: destTitle,
    tier,
    weather: { c: 28, low: 18, label: 'Pleasant & clear skies', rain: '8%' },
    highlights: [`${destTitle} Heritage Landmarks`, `Scenic Mountain / River Excursions (50–150 km)`, `Local Food & Culture`, `Valley Viewpoints`],
    restaurants: tierRestaurantsFallback[tier.key] || tierRestaurantsFallback.affordable,
    events: [
      {
        tag: 'Art & Cultural Gathering',
        category: 'Free Entry',
        price: 'Free Community Event',
        title: `${destTitle} Weekend Artisan & Street Food Fair`,
        when: 'Friday through Sunday (5:30 PM – 9:30 PM)',
        venue: `Central Civic Promenade, ${destTitle}`,
        description: `Top local food stalls, handmade regional crafts, live acoustic musicians, and cultural workshops in ${destTitle}.`,
      },
      {
        tag: 'City Sunset Walk',
        category: 'Free Entry',
        price: 'Free Open Gathering',
        title: `Sunset Heritage Walk & Open-Air Music Jam`,
        when: 'Saturday & Sunday (5:00 PM – 8:30 PM)',
        venue: `Historic Promenade & Waterfront, ${destTitle}`,
        description: `Guided stroll through architectural landmarks culminating in an open community acoustic circle and sunset viewing.`,
      },
    ],
    daysPlan: customDaysPlan,
  }
}

function hashSeed(input) {
  let h = 0
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0
  return h
}

// Generate consistent plan with tier awareness & pre-fill parameters
export function generatePlan(destination, days, budget) {
  const cityInfo = getCityDetails(destination, budget, days)
  const seed = hashSeed(`${destination.toLowerCase()}-${days}-${budget}`)

  const spendFactor = 0.82 + ((seed >> 3) % 12) / 100
  const estimatedSpend = Math.round((budget * spendFactor) / 100) * 100

  // Generate Date Range starting from today
  const today = new Date()
  const formatDate = (d) => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const startDateStr = formatDate(today)
  const endDateObj = new Date(today)
  endDateObj.setDate(today.getDate() + Number(days))
  const endDateStr = formatDate(endDateObj)

  // Tier-based Hotel & Vehicle Selection
  let hotelName = ''
  let vehicleType = 'economy'
  if (cityInfo.tier.key === 'luxury') {
    hotelName = `The Grand ${cityInfo.city} Luxury Palace Resort & Spa`
    vehicleType = 'luxury'
  } else if (cityInfo.tier.key === 'better') {
    hotelName = `${cityInfo.city} Boutique Heritage Mountain Resort`
    vehicleType = 'suv'
  } else {
    hotelName = `${cityInfo.city} Verified Homestay & Suites`
    vehicleType = 'economy'
  }

  // Pre-generate structured activities for the Vacation planner
  const activities = []
  const daysList = cityInfo.daysPlan || []
  for (let i = 0; i < days; i++) {
    const actDate = new Date(today)
    actDate.setDate(today.getDate() + i)
    const actDateStr = formatDate(actDate)
    const dayPlan = daysList[Math.min(i, daysList.length - 1)]

    if (dayPlan && dayPlan.items) {
      // Pick 2 key highlights for each day
      dayPlan.items.slice(0, 2).forEach((itemStr, idx) => {
        const parts = itemStr.split(': ')
        const timePart = parts[0]?.trim() || (idx === 0 ? '09:00 AM' : '02:00 PM')
        const descPart = parts.slice(1).join(': ') || itemStr
        
        // Convert to HH:MM 24hr format
        const hour = timePart.includes('PM') && !timePart.startsWith('12') ? '14:00' : '09:30'

        activities.push({
          date: actDateStr,
          time: hour,
          location: `${cityInfo.city} Regional Circuit`,
          description: descPart.length > 90 ? descPart.slice(0, 87) + '...' : descPart,
        })
      })
    }
  }

  return {
    destination: cityInfo.city,
    days,
    budget,
    tier: cityInfo.tier,
    weatherC: cityInfo.weather.c,
    weatherLabel: cityInfo.weather.label,
    restaurants: cityInfo.restaurants.length,
    places: 6 + Math.min(days, 8),
    events: cityInfo.events.length,
    estimatedSpend,
    highlights: cityInfo.highlights,
    details: {
      destination: `${cityInfo.city}, India`,
      startDate: startDateStr,
      endDate: endDateStr,
      passengers: 2,
      vehicleType,
      rideIncluded: true,
      hotelName,
      hotelAddress: `Main Heritage Road, ${cityInfo.city}, India`,
      flightDetails: {
        departureCity: 'Bangalore',
        arrivalCity: cityInfo.city,
        departureTime: `${startDateStr}T08:30`,
        arrivalTime: `${startDateStr}T11:45`,
        flightNumber: 'VY-842',
      },
      activities,
    },
  }
}

export function formatINR(amount) {
  return '₹' + Number(amount || 0).toLocaleString('en-IN')
}
