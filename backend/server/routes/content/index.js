import * as blogController from '../../content/controllers/blog.controller.js';

export const setupContentRoutes = (app, authMiddleware, adminMiddleware) => {
  app.get('/api/content/blog', blogController.getBlogPosts);
  app.get('/api/content/blog/:slug', blogController.getBlogPostBySlug);
  
  // Admin routes
  app.post('/admin/content/blog', authMiddleware, adminMiddleware, blogController.createBlogPost);
};
