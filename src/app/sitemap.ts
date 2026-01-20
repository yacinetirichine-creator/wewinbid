import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://wewinbid.com';

  const routes = [
    '',
    '/pricing',
    '/contact',
    '/api/auth/signin', // Page de login par défaut ou custom
    '/legal',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : 0.8,
  }));

  return routes as MetadataRoute.Sitemap;
}
