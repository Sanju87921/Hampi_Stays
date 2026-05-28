import { getPrisma } from '../../config/prisma.js';
import { logSecureError } from '../../logging/logger.js';

export class SitemapGenerator {
  constructor(env) {
    this.prisma = getPrisma(env);
    this.baseUrl = env.APP_URL || 'https://hampistays.com';
  }

  async generateSitemapXml() {
    try {
      const resorts = await this.prisma.resort.findMany({
        where: { status: 'APPROVED', deletedAt: null },
        select: { slug: true, updatedAt: true }
      });

      // Geo / Category pages
      const categories = [
        'luxury-resorts-hampi',
        'budget-stays-hampi',
        'riverside-resorts-hampi',
        'pet-friendly-resorts-hampi',
        'near-virupaksha-temple'
      ];

      let xml = \`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\`;

      // Base URL
      xml += \`
  <url>
    <loc>\${this.baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>\`;

      // Static & Geo Pages
      for (const cat of categories) {
        xml += \`
  <url>
    <loc>\${this.baseUrl}/category/\${cat}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>\`;
      }

      // Dynamic Resort Pages
      for (const resort of resorts) {
        xml += \`
  <url>
    <loc>\${this.baseUrl}/resorts/\${resort.slug}</loc>
    <lastmod>\${resort.updatedAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>\`;
      }

      xml += \`\n</urlset>\`;
      return xml;

    } catch (err) {
      logSecureError('SITEMAP_GENERATION_FAILED', 'Failed to generate sitemap.xml', { error: err.message });
      throw err;
    }
  }
}
