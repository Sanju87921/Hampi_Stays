const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/admin/HeroModule.tsx', 'utf8');

content = content.replace(
  /const deleteSlide = async[\s\S]*?fetchSlides\(\);\s*}\s*};/,
  `const deleteSlide = async (id: string) => {
    if (!(await confirm({ title: "Delete Hero Slide", message: 'Are you sure you want to delete this slide?', confirmText: 'Delete', cancelText: 'Cancel' }))) return;
    
    setSlides(slides.filter(x => x.id !== id));
    try {
      await api.delete(\`/hero-slides/\${id}\`);
      if (slides.length === 1) {
        toast.success('All hero slides removed');
      } else {
        toast.success('Slide deleted successfully');
      }
    } catch (err) {
      toast.error('Failed to delete slide');
      fetchSlides();
    }
  };`
);

fs.writeFileSync('frontend/src/pages/admin/HeroModule.tsx', content);
console.log('done replacing deleteSlide');
