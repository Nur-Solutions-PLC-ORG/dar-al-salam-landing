/**
 * Company, project and contact configuration: the ONE place for facts the client
 * still has to confirm. Every empty string marked TODO(client) is rendered
 * gracefully (the UI hides that row/channel instead of showing a blank).
 *
 * Don't invent values here. See docs/BRIEF.md "Project facts".
 */

export interface SocialLink {
  /** e.g. 'facebook' | 'instagram' | 'tiktok' | 'telegram' | 'youtube' | 'linkedin' */
  network: string;
  url: string;
}

export interface SiteConfig {
  /** Absolute production origin, e.g. 'https://daralsalam.et'. Used for canonical + OG URLs. */
  url: string;
  company: {
    name: string;
    shortName: string;
  };
  project: {
    name: string;
    area: string;
    city: string;
    country: string;
    /** Total floors in the tower (BRIEF update 2026-11-14). */
    floors: number;
    /** The client is adding a 16th floor: say "16th floor planned"; no plans or breakdown for it yet. */
    topFloorPlanned: boolean;
    totalApartments: number;
    /** e.g. '2027-12' or 'Q4 2027'. */
    completion: string;
  };
  contact: {
    /** Display + tel: number in international format, e.g. '+251 9xx xxx xxx'. */
    phone: string;
    /** International digits only for wa.me, e.g. '2519xxxxxxxx'. */
    whatsapp: string;
    /** Telegram usernames without '@', in display order (links https://t.me/<user>). No names or roles given. */
    telegram: readonly string[];
    email: string;
    /** Office address lines. */
    address: string[];
    /** e.g. 'Mon–Sat, 8:30–17:30'. */
    hours: string;
  };
  location: {
    /** The client's Google Maps pin (share link). Preferred for "Open in Google Maps" / "Get directions". */
    mapsUrl: string;
    /** Fallback Google Maps search query when no pin is set. */
    mapsQuery: string;
    /** The client's pin, resolved from mapsUrl (BRIEF update 2026-11-14). Used for the satellite map and directions. */
    coords: { lat: number; lng: number };
    landmarks: readonly LandmarkKey[];
  };
  /** Satellite map (BRIEF update 2026-11-14). */
  map: {
    /**
     * Esri ArcGIS API key. Keyless World Imagery tiles are for non-commercial use only, so a commercial launch needs
     * a key. Empty = the keyless tile URL. The Esri attribution shows either way.
     */
    esriApiKey: string;
  };
  /** Confirmed building features, in display order; labels in src/i18n/*.ts under `features.items`. */
  features: readonly FeatureKey[];
  social: SocialLink[];
}

/** BRIEF update 2026-11-14 (confirmed). Wording is fixed: "underground water", never borehole/tank. */
export type FeatureKey = 'garbageChute' | 'standbyLift' | 'undergroundWater' | 'parking';

export type LandmarkKey = 'haileGarmentRoundabout' | 'garmentTaxiStation' | 'laftoSquare' | 'africaCdc';

export const site: SiteConfig = {
  url: '', // TODO(client): production domain
  company: {
    name: 'Dar Al Salam Real Estate',
    shortName: 'Dar Al Salam',
  },
  project: {
    name: 'Garment Tower',
    area: 'Garment',
    city: 'Addis Ababa',
    country: 'Ethiopia',
    floors: 16,
    topFloorPlanned: true,
    totalApartments: 126, // unchanged by the 16th floor (BRIEF update 2026-11-14)
    completion: '', // TODO(client): completion date
  },
  contact: {
    phone: '', // TODO(client)
    whatsapp: '', // TODO(client)
    telegram: ['abdulaziz_a12', 'monur14'], // client (BRIEF update 2026-11-14)
    email: '', // TODO(client)
    address: [], // TODO(client): sales office address
    hours: '', // TODO(client)
  },
  location: {
    mapsUrl: 'https://maps.app.goo.gl/4Ed5VBCaYGvbbY6X9', // client's pin (BRIEF update 2026-11-14)
    mapsQuery: 'Haile Garment, Addis Ababa',
    coords: { lat: 8.9356809, lng: 38.7299505 }, // client's pin (BRIEF update 2026-11-14)
    landmarks: ['haileGarmentRoundabout', 'garmentTaxiStation', 'laftoSquare', 'africaCdc'],
  },
  map: {
    esriApiKey: '', // TODO(client): Esri ArcGIS API key for commercial use of World Imagery
  },
  features: ['garbageChute', 'standbyLift', 'undergroundWater', 'parking'],
  social: [], // TODO(client): social links
};

/* ---------- Derived helpers (all return '' when not configured) ---------- */

const digits = (s: string) => s.replace(/[^\d+]/g, '');

export const telHref = (phone = site.contact.phone) => (phone ? `tel:${digits(phone)}` : '');

export const whatsappHref = (text = '', number = site.contact.whatsapp) => {
  if (!number) return '';
  const n = number.replace(/\D/g, '');
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
};

/** Telegram has no reliable prefilled-text deep link to a user; text is copied by the form UI instead. */
export const telegramHref = (username = site.contact.telegram[0] ?? '') =>
  username ? `https://t.me/${username.replace(/^@/, '')}` : '';

/** One entry per configured Telegram account: '@user' for display, the t.me link. */
export const telegramAccounts = () =>
  site.contact.telegram.map((u) => {
    const user = u.replace(/^@/, '');
    return { user, handle: `@${user}`, href: telegramHref(user) };
  });

export const mailtoHref = (subject = '', body = '', email = site.contact.email) => {
  if (!email) return '';
  const params = new URLSearchParams();
  if (subject) params.set('subject', subject);
  if (body) params.set('body', body);
  const qs = params.toString().replace(/\+/g, '%20');
  return `mailto:${email}${qs ? `?${qs}` : ''}`;
};

/** The client's pin when set; otherwise a Maps search for `query`. */
export const mapsHref = (query = site.location.mapsQuery) =>
  site.location.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

/** Esri World Imagery tile template (Leaflet {z}/{y}/{x}); `?token=` only when a key is set. */
export const esriTileUrl = (key = site.map.esriApiKey) =>
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' +
  (key ? `?token=${encodeURIComponent(key)}` : '');

/** Google Maps directions to the client's pin (BRIEF update 2026-11-14). */
export const directionsHref = ({ lat, lng } = site.location.coords) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

export type EnquiryChannel = 'whatsapp' | 'telegram' | 'email';

/** Channels the enquiry form can hand off to, in priority order. Empty = show "contact details coming soon". */
export const enquiryChannels = (): EnquiryChannel[] => {
  const out: EnquiryChannel[] = [];
  if (site.contact.whatsapp) out.push('whatsapp');
  if (site.contact.telegram.length) out.push('telegram');
  if (site.contact.email) out.push('email');
  return out;
};

export const hasAnyContact = () =>
  Boolean(
    site.contact.phone ||
      site.contact.whatsapp ||
      site.contact.telegram.length ||
      site.contact.email ||
      site.contact.address.length,
  );
