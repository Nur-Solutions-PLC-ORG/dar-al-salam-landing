import { en, type Dict } from './en';
import { am } from './am';

export type Lang = 'en' | 'am';
export const langs: readonly Lang[] = ['en', 'am'];
export const defaultLang: Lang = 'en';

const dicts: Record<Lang, Dict> = { en, am };

export const getDict = (lang: Lang): Dict => dicts[lang];

/** BCP 47 tag for <html lang>, Intl and og:locale. */
export const htmlLang: Record<Lang, string> = { en: 'en', am: 'am' };
export const ogLocale: Record<Lang, string> = { en: 'en_US', am: 'am_ET' };

/** Path of the home page in a language ('/' or '/am/'). */
export const homePath = (lang: Lang) => (lang === defaultLang ? '/' : `/${lang}/`);

export const otherLang = (lang: Lang): Lang => (lang === 'en' ? 'am' : 'en');

/** Replace {placeholders} in a dictionary string. */
export const fmt = (template: string, vars: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? String(vars[k]) : `{${k}}`));

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Render `*word*` emphasis as <em> (HTML-escaped; use with set:html). */
export const emph = (s: string) => escapeHtml(s).replace(/\*([^*]+)\*/g, '<em>$1</em>');

/** Strip emphasis markers for plain-text contexts (aria-label, meta). */
export const plain = (s: string) => s.replace(/\*([^*]+)\*/g, '$1');
