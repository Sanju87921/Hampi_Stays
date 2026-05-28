export const generateGeoMetadata = (categorySlug) => {
  const metaMap = {
    'near-virupaksha-temple': {
      title: 'Best Resorts Near Virupaksha Temple, Hampi | HampiStays',
      description: 'Discover luxury and budget resorts within walking distance of the iconic Virupaksha Temple. Book your perfect stay with stunning river views.',
      h1: 'Resorts near Virupaksha Temple',
      faqs: [
        { question: 'How close are these resorts to Virupaksha Temple?', answer: 'All listed resorts are within a 2km radius, offering easy access via foot, coracle, or bicycle.' }
      ]
    },
    'riverside-resorts-hampi': {
      title: 'Top Riverside Resorts in Hampi | HampiStays',
      description: 'Wake up to the sound of the Tungabhadra river. Explore our curated list of riverside cottages and luxury heritage stays in Hampi.',
      h1: 'Riverside Retreats in Hampi',
      faqs: [
        { question: 'Do riverside resorts offer coracle rides?', answer: 'Yes, most of our premium riverside stays provide private coracle access.' }
      ]
    },
    'luxury-resorts-hampi': {
      title: 'Luxury Resorts & Heritage Stays in Hampi | HampiStays',
      description: 'Experience Royal Vijayanagara luxury. Book premium 5-star heritage resorts and boutique stays with private pools in Hampi.',
      h1: 'Luxury Stays in Hampi',
      faqs: [
        { question: 'Do these luxury resorts have private pools?', answer: 'Yes, our top-tier heritage resorts feature exclusive plunge pools and spa services.' }
      ]
    },
    'pet-friendly-resorts-hampi': {
      title: 'Pet Friendly Resorts in Hampi | HampiStays',
      description: 'Travel with your furry friends. Discover the best pet-friendly stays and resorts in Hampi with open spaces and specific pet amenities.',
      h1: 'Pet-Friendly Hampi Stays',
      faqs: [
        { question: 'Are there extra charges for pets?', answer: 'Most of our pet-friendly partners allow pets for free or for a minimal cleaning deposit.' }
      ]
    }
  };

  return metaMap[categorySlug] || {
    title: \`Best Stays for \${categorySlug.replace(/-/g, ' ')} | HampiStays\`,
    description: 'Find your perfect accommodation in Hampi.',
    h1: categorySlug.replace(/-/g, ' ').toUpperCase(),
    faqs: []
  };
};
