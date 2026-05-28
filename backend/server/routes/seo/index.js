import { SitemapGenerator } from '../../seo/sitemap/sitemap.generator.js';
import { generateGeoMetadata } from '../../seo/metadata/geoMetadata.generator.js';

export const getSitemapXml = async (c) => {
  const generator = new SitemapGenerator(c.env);
  const xml = await generator.generateSitemapXml();
  
  c.header('Content-Type', 'application/xml');
  c.header('Cache-Control', 'public, max-age=86400'); // Cache for 24h
  return c.body(xml);
};

export const getGeoMetadata = async (c) => {
  const { categorySlug } = c.req.param();
  const metadata = generateGeoMetadata(categorySlug);
  
  c.header('Cache-Control', 'public, max-age=3600');
  return c.json({ success: true, data: metadata });
};

export const setupSeoRoutes = (app) => {
  app.get('/sitemap.xml', getSitemapXml);
  app.get('/api/seo/geo/:categorySlug', getGeoMetadata);
};
