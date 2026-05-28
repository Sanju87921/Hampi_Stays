export class SchemaGenerator {
  static generateHotelSchema(resort, baseUrl) {
    const minPrice = resort.rooms && resort.rooms.length > 0
      ? Math.min(...resort.rooms.map(r => r.pricePerNight))
      : 3000;

    return {
      "@context": "https://schema.org",
      "@type": "Hotel",
      "name": resort.name,
      "description": resort.description,
      "url": `${baseUrl}/resorts/${resort.slug}`,
      "image": resort.images?.[0] || `${baseUrl}/default-resort.jpg`,
      "starRating": {
        "@type": "Rating",
        "ratingValue": resort.rating > 0 ? (Math.round(resort.rating / 20 * 10) / 10).toString() : "4.0", // assuming 0-100 to 1-5 mapping or native 5 star mapping
      },
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Hampi",
        "addressRegion": "Karnataka",
        "addressCountry": "IN",
        "streetAddress": resort.locationArea
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": resort.locationLat,
        "longitude": resort.locationLng
      },
      "priceRange": `₹${minPrice}+`,
      "amenityFeature": resort.amenities?.map(a => ({
        "@type": "LocationFeatureSpecification",
        "name": typeof a === 'object' ? a.name : a,
        "value": true
      })) || []
    };
  }

  static generateBreadcrumbSchema(crumbs) {
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": crumbs.map((crumb, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": crumb.name,
        "item": crumb.url
      }))
    };
  }

  static generateFaqSchema(faqs) {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };
  }
}
