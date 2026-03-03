
import { getAllBlogs } from '@/services/blogs';
import { BlogProp } from '@/types/BlogProp';
import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    try {
        const data = await getAllBlogs();
        const blogs = data.blogs;
        return blogs.map((blog: BlogProp) => ({
            url: `${process.env.NEXT_PUBLIC_BASE_URL}/tin-tuc/${blog.slug}`,
            lastmod: blog.updated_at,
            priority: 0.8
        }));
    } catch (error) {
        console.error('Failed to generate blogs sitemap:', error);
        return [];
    }
}