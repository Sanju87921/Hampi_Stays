export function calculateRankingScores(resort) {
  let featuredScore = 0;
  let sponsoredScore = 0;

  // If manually featured by admin, give a high boost
  if (resort.isFeatured) {
    featuredScore += 1000; 
  }

  // If sponsored (paid placement), give priority
  if (resort.isSponsored) {
    sponsoredScore += 500;
  }

  // Quality multipliers
  const qualityMultiplier = (resort.rating || 0) * 10;
  
  // Popularity multiplier
  const popularityMultiplier = Math.min((resort.bookingsCount || 0) * 2, 200);

  // Engagement multiplier
  const engagementMultiplier = Math.min((resort.reviewsCount || 0) * 5, 100);

  // Apply organic boosts to featured score if not explicitly featured to create a natural gradient
  if (!resort.isFeatured && !resort.isSponsored) {
    featuredScore = qualityMultiplier + popularityMultiplier + engagementMultiplier;
  }

  return {
    featuredScore,
    sponsoredScore
  };
}
