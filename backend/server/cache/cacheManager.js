export class CacheManager {
  constructor(env) {
    this.env = env;
    this.useKV = !!env?.KV_CACHE;
  }

  async get(key) {
    try {
      if (this.useKV) {
        const data = await this.env.KV_CACHE.get(key, 'json');
        return data;
      }
      return null; // Fallback to memory or external DB
    } catch (err) {
      console.warn(`[CACHE_MANAGER] Get failed for key ${key}: ${err.message}`);
      return null;
    }
  }

  async set(key, value, ttlSeconds = 300) {
    try {
      if (this.useKV) {
        await this.env.KV_CACHE.put(key, JSON.stringify(value), { expirationTtl: ttlSeconds });
        return true;
      }
      return false;
    } catch (err) {
      console.warn(`[CACHE_MANAGER] Set failed for key ${key}: ${err.message}`);
      return false;
    }
  }

  async delete(key) {
    try {
      if (this.useKV) {
        await this.env.KV_CACHE.delete(key);
        return true;
      }
      return false;
    } catch (err) {
      console.warn(`[CACHE_MANAGER] Delete failed for key ${key}: ${err.message}`);
      return false;
    }
  }
}
