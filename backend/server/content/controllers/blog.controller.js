import { getPrisma } from '../../../config/prisma.js';

export const getBlogPosts = async (c) => {
  const prisma = getPrisma(c.env);
  const { limit = 10, offset = 0, category } = c.req.query();

  const where = { publishedAt: { not: null } };
  if (category) where.categoryId = category;

  const posts = await prisma.blogPost.findMany({
    where,
    take: parseInt(limit, 10),
    skip: parseInt(offset, 10),
    orderBy: { publishedAt: 'desc' },
    select: {
      slug: true,
      title: true,
      excerpt: true,
      featuredImage: true,
      publishedAt: true,
      tags: true,
      author: { select: { name: true, avatar: true } }
    }
  });

  return c.json({ success: true, posts });
};

export const getBlogPostBySlug = async (c) => {
  const prisma = getPrisma(c.env);
  const { slug } = c.req.param();

  const post = await prisma.blogPost.findUnique({
    where: { slug },
    include: { author: { select: { name: true, avatar: true } } }
  });

  if (!post || !post.publishedAt) {
    return c.json({ success: false, error: 'Post not found' }, 404);
  }

  return c.json({ success: true, post });
};

// Admin Endpoints
export const createBlogPost = async (c) => {
  const prisma = getPrisma(c.env);
  const user = c.get('user');
  const data = await c.req.json();

  const post = await prisma.blogPost.create({
    data: {
      ...data,
      authorId: user.id
    }
  });

  return c.json({ success: true, post });
};
