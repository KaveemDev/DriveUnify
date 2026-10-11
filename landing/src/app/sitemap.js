export default function sitemap() {
  const baseUrl = 'https://driveunify.com';
  const routes = [
    '',
    '/features',
    '/integrations',
    '/about',
    '/contact',
    '/docs',
    '/help',
    '/blog',
    '/legal',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: '2026-10-11T00:00:00.000Z',
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }));
}
