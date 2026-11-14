/**
 * The 3D apartment strings (DESIGN §9.6, §11 rev 8) as /i18n/unit3d.{lang}.json, fetched with the dollhouse chunk, so
 * the page HTML (budget 40 KB gzip, /am nearly full) carries only the toggle labels. Source: src/i18n/{lang}.ts.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { getDict, langs, type Lang } from '../../i18n';

export const getStaticPaths = (() => langs.map((lang) => ({ params: { lang } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params }) => {
  const t = getDict(params.lang as Lang);
  return new Response(JSON.stringify({ ...t.unit3d, rooms: t.rooms3d, walk: t.walk }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
