import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';

export interface ResponsiveSet {
  avif: string;
  webp: string;
  /** Fallback <img> (WebP, middle width). */
  src: string;
  width: number;
  height: number;
  sizes: string;
}

/**
 * Build AVIF + WebP srcsets for a hand-written <picture>, with URLs identical to what a
 * <link rel="preload" imagesrcset> needs (used for the LCP hero image).
 */
export async function responsiveSet(
  src: ImageMetadata,
  widths: number[],
  sizes: string,
  quality: { avif?: number; webp?: number } = {},
): Promise<ResponsiveSet> {
  const usable = widths.filter((w) => w <= src.width);
  const ws = usable.length ? usable : [src.width];
  const fallbackWidth = ws[Math.floor(ws.length / 2)] ?? src.width;

  const [avif, webp, fallback] = await Promise.all([
    getImage({ src, widths: ws, format: 'avif', quality: quality.avif ?? 50 }),
    getImage({ src, widths: ws, format: 'webp', quality: quality.webp ?? 72 }),
    getImage({ src, width: fallbackWidth, format: 'webp', quality: quality.webp ?? 72 }),
  ]);

  return {
    avif: avif.srcSet.attribute,
    webp: webp.srcSet.attribute,
    src: fallback.src,
    width: src.width,
    height: src.height,
    sizes,
  };
}
