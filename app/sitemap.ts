import { MetadataRoute } from 'next'
import { createClient } from '@/utils/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://open.ncskit.org'
  
  // Static Routes
  const staticRoutes = [
    '/',
    '/analyze',
    '/scales',
    '/knowledge',
    '/docs/theory',
    '/docs/case-study',
    '/docs/user-guide',
    '/terms',
  ].map((route) => ({
    url: route === '/' ? `${baseUrl}/` : `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '/' ? 1.0 : (route === '/analyze' || route === '/scales' ? 0.9 : 0.8),
  }))

  // Dynamic Routes for Knowledge Articles
  // We list the 11 Authority Slugs here as a fallback baseline
  let knowledgeSlugs = [
    'cronbach-alpha',
    'efa-factor-analysis',
    'regression-vif-multicollinearity',
    'descriptive-statistics-interpretation',
    'independent-t-test-guide',
    'one-way-anova-post-hoc',
    'pearson-correlation-analysis',
    'chi-square-test-independence',
    'mediation-analysis-sobel-test',
    'data-cleaning-outliers-detection',
    'sem-cfa-structural-modeling'
  ]

  try {
    const supabase = await createClient();
    if (supabase) {
      const { data } = await supabase.from('knowledge_articles').select('slug').eq('is_published', true);
      if (data && data.length > 0) {
        // Merge unique slugs
        const dbSlugs = data.map((row: any) => row.slug).filter(Boolean);
        knowledgeSlugs = Array.from(new Set([...knowledgeSlugs, ...dbSlugs]));
      }
    }
  } catch (error) {
    console.warn('[Sitemap] Failed to fetch dynamic article slugs, using fallback.', error);
  }

  const knowledgeRoutes = knowledgeSlugs.map((slug) => ({
    url: `${baseUrl}/knowledge/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...staticRoutes, ...knowledgeRoutes]
}
