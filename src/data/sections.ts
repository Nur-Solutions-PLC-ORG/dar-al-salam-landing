/** Section ids, order and eyebrow numbers (DESIGN §4). Nav labels live in i18n `nav`. */
export const sections = {
  top: { id: 'top' },
  facts: { id: 'facts' },
  story: { id: 'story', n: '01', nav: 'tower', theme: 'light' },
  explore: { id: 'explore', n: '02', nav: 'explore', theme: 'dark' },
  homes: { id: 'homes', n: '03', nav: 'homes', theme: 'light' },
  location: { id: 'location', n: '04', nav: 'location', theme: 'light' },
  payment: { id: 'payment', n: '05', nav: 'payment', theme: 'dark' },
  enquire: { id: 'enquire', n: '06', theme: 'light' },
} as const;

export const navItems = [sections.story, sections.explore, sections.homes, sections.location, sections.payment] as const;
