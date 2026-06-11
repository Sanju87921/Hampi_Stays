// Simulated Redis/In-Memory Cache for Availability
const availabilityCache = new Map();

// Generate a cache key for room and date range
const getCacheKey = (roomId, startDate, endDate) => {
  return `avail:${roomId}:${startDate.toISOString().split('T')[0]}:${endDate.toISOString().split('T')[0]}`;
};

export const getCachedAvailability = async (roomId, startDate, endDate) => {
  const key = getCacheKey(roomId, startDate, endDate);
  
  // Simulated Redis GET
  if (availabilityCache.has(key)) {
    const entry = availabilityCache.get(key);
    if (entry.expiresAt > Date.now()) {
      console.log(`[Cache Hit] Redis availability cache for ${key}`);
      return entry.maxDailyUsage;
    } else {
      availabilityCache.delete(key);
    }
  }
  return null;
};

export const setCachedAvailability = async (roomId, startDate, endDate, maxDailyUsage) => {
  const key = getCacheKey(roomId, startDate, endDate);
  
  // Simulated Redis SETEX (expire in 5 minutes)
  availabilityCache.set(key, {
    maxDailyUsage,
    expiresAt: Date.now() + 5 * 60 * 1000 
  });
  console.log(`[Cache Set] Redis availability cache populated for ${key}`);
};

export const invalidateAvailabilityCache = async (roomId) => {
  // Simulated Redis DEL keys by pattern
  console.log(`[Cache Invalidate] Clearing Redis availability cache for room ${roomId}`);
  for (const key of availabilityCache.keys()) {
    if (key.startsWith(`avail:${roomId}:`)) {
      availabilityCache.delete(key);
    }
  }
};
