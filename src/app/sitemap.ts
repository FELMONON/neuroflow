import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site-url';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ['', '/login', '/signup', '/privacy', '/terms'];
  return pages.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: path === '' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : 0.5,
  }));
}
