/**
 * English dictionary (source of truth for keys). `am.ts` must match this shape.
 * Keep facts in sync with docs/BRIEF.md; never add prices.
 */
export const en = {
  meta: {
    title: 'Dar Al Salam Real Estate | Garment Tower apartments in Addis Ababa',
    description:
      '2 and 3 bedroom apartments in Garment Tower, Addis Ababa: 14 residential floors, 126 homes, 158–171 m². Flexible payment plans. Book a visit.',
    ogAlt: 'Aerial render of Garment Tower by Dar Al Salam Real Estate',
  },
  a11y: {
    skipToContent: 'Skip to content',
    mainNav: 'Main',
    home: 'Dar Al Salam Real Estate, home',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    newTab: '(opens in a new tab)',
  },
  lang: {
    /** Label of the link that switches to the OTHER language. */
    switchTo: 'አማርኛ',
    switchToLabel: 'Read this page in Amharic',
  },
  nav: {
    tower: 'The tower',
    apartments: 'Apartments',
    location: 'Location',
    enquire: 'Enquire',
  },
  cta: {
    bookVisit: 'Book a visit',
    explore: 'Explore apartments',
    requestPricing: 'Request pricing',
    requestPlans: 'Request floor plans & pricing',
  },
  hero: {
    eyebrow: 'Garment Tower · Addis Ababa',
    title: 'A house of peace in the heart of Garment',
    lead: 'Calm, light-filled 2 and 3 bedroom homes, with flexible payment plans.',
    imageAlt: 'Aerial render of Garment Tower, a white high-rise with dark balconies, surrounded by palm trees',
  },
  facts: {
    title: 'Key facts',
    floors: 'Residential floors',
    apartments: 'Apartments',
    types: '2 & 3 bedroom homes',
    typesValue: '2 & 3',
    typesUnit: 'bedrooms',
    area: 'Gross area per home',
  },
  story: {
    eyebrow: 'Dar Al Salam',
    title: 'House of Peace',
    body: 'Dar Al Salam means “House of Peace”. Garment Tower brings that calm to one of Addis Ababa’s best-connected neighbourhoods: two residential blocks, nine homes per floor, and balconies on every apartment.',
  },
  model: {
    eyebrow: 'Explore the tower',
    title: 'Choose a floor, then a home',
    floor: 'Floor',
    floorN: 'Floor {n}',
    selectFloor: 'Select a floor',
    selectUnit: 'Select an apartment',
    back: 'Back',
    fallbackNote: 'Showing the 2D view.',
  },
  units: {
    eyebrow: 'Apartments',
    title: 'Nine thoughtful layouts',
    filterAll: 'All',
    filter2: '2 bedroom',
    filter3: '3 bedroom',
    bedroomsN: '{n} bedroom',
    gross: 'Gross area',
    net: 'Net area',
    rooms: 'Rooms',
    viewPlan: 'View plan',
    planAlt: 'Furnished floor plan of apartment type {code}',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    close: 'Close',
    price: 'Contact for price',
  },
  rooms: {
    livingDining: 'Living & dining',
    masterBedroom: 'Master bedroom',
    bedroom: 'Bedroom',
    bedrooms2: '2 bedrooms',
    kitchen: 'Kitchen',
    bathrooms2: '2 bathrooms',
    store: 'Store',
    storeOrBedroom: 'Store / bedroom',
  },
  location: {
    eyebrow: 'Location',
    title: 'In the heart of Garment',
    body: 'Close to the Haile Garment roundabout, with taxi links across the city.',
    openMaps: 'Open in Google Maps',
    landmarks: {
      haileGarmentRoundabout: 'Haile Garment roundabout',
      garmentTaxiStation: 'Garment taxi station',
      laftoSquare: 'Lafto square',
      africaCdc: 'Africa CDC headquarters',
    },
  },
  why: {
    eyebrow: 'Why Dar Al Salam',
    title: 'Pay at your own pace',
    body: 'Reserve your apartment with an initial payment, then pay any amount over time until it is fully paid.',
    flexible: 'Flexible payment plans',
  },
  enquiry: {
    eyebrow: 'Enquire',
    title: 'Book a visit or request pricing',
    name: 'Full name',
    phone: 'Phone number',
    unit: 'Preferred apartment',
    unitAny: 'Not sure yet',
    message: 'Message',
    messagePlaceholder: 'When would you like to visit?',
    sendWhatsapp: 'Send on WhatsApp',
    sendTelegram: 'Message on Telegram',
    sendEmail: 'Send by email',
    comingSoon: 'Contact details are coming soon.',
    required: 'Required',
    /** Prefilled message template. */
    template: 'Hello Dar Al Salam, I am {name} ({phone}). I am interested in {unit} at Garment Tower. {message}',
    subject: 'Garment Tower enquiry',
  },
  footer: {
    rights: 'All rights reserved.',
    contact: 'Contact',
    follow: 'Follow us',
    disclaimer: 'Renders and plans are illustrative and may change.',
  },
};

export type Dict = typeof en;
