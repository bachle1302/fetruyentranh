import { getComicsByPage } from '@/services/comics'
import { ComicProp } from '@/types/ComicProp';
import { MetadataRoute } from 'next'

export async function generateSitemaps() {
    try {
        const data = await getComicsByPage(1);
        const totalPage = data.comics.last_page;
        const sitemaps = Array.from({ length: totalPage }, (_, index) => ({ id: index + 1 }));
        return sitemaps;
    } catch (error) {
        console.error('Failed to generate sitemaps:', error);
        return [{ id: 1 }];
    }
}
 
export default async function sitemap({
  id,
}: {
  id: number
}): Promise<MetadataRoute.Sitemap> {
    try {
        const page = id;
        const data = await getComicsByPage(page);
        const comics = data.comics.data;
        return comics.map((comic: ComicProp) => ({
            url: `${process.env.NEXT_PUBLIC_BASE_URL}/${comic.slug}`,
            lastmod: comic.updated_at,
            priority: 0.8
        }));
    } catch (error) {
        console.error(`Failed to collect sitemap data for page ${id}:`, error);
        return [];
    }
}