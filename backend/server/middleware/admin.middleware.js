export const adminMiddleware = async (c, next) => {
  const user = c.get('user');
  if (user?.role !== 'ADMIN') {
    return c.json({ error: 'Forbidden: Admin access required' }, 403);
  }
  await next();
};
