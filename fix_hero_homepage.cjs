const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/layout/Hero.tsx', 'utf8');

const emptyState = `
  if (hasSlides === false) {
    return (
      <div className="relative min-h-[100svh] flex flex-col items-center justify-center bg-navy-950 z-30 px-4">
        <h1 className="text-3xl md:text-5xl font-serif text-white mb-6 text-center">No active hero campaigns available.</h1>
        <Link to="/resorts" className="bg-gold-500 hover:bg-gold-400 text-navy-950 px-8 py-3 rounded-full font-semibold transition-all">
          Explore Resorts
        </Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100svh] flex items-center justify-center bg-navy-950 z-30">`;

// 1. Add state variable
content = content.replace(
  '  const [currentImageIndex, setCurrentImageIndex] = useState(0);',
  '  const [currentImageIndex, setCurrentImageIndex] = useState(0);\n  const [hasSlides, setHasSlides] = useState<boolean | null>(null);'
);

// 2. Modify fetch handling
content = content.replace(
  `        if (data && data.length > 0) {
          setHampiImages(data.map((s: any) => s.imageUrl));
          setImageLabels(data.map((s: any) => s.title));
        }
      })
      .catch(err => console.error("Failed to load hero slides", err));`,
  `        if (data && data.length > 0) {
          setHampiImages(data.map((s: any) => s.imageUrl));
          setImageLabels(data.map((s: any) => s.title));
          setHasSlides(true);
        } else {
          setHasSlides(false);
        }
      })
      .catch(err => {
        console.error("Failed to load hero slides", err);
        setHasSlides(false);
      });`
);

// 3. Add early return
content = content.replace(
  `  return (
    <div className="relative min-h-[100svh] flex items-center justify-center bg-navy-950 z-30">`,
  emptyState
);

fs.writeFileSync('frontend/src/components/layout/Hero.tsx', content);
console.log('done replacing Hero.tsx');
