const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/layout/Navbar.tsx', 'utf8');

// Fix the Administrator badge - replace just the isScrolled conditional classes
code = code.replace(
  /isScrolled \? "bg-navy-950 text-white border-navy-950 shadow-md" : "bg-white text-white border-white\/20 backdrop-blur-md"/,
  'isScrolled ? "bg-navy-950 text-white border-navy-950/20 shadow-md" : "bg-white/15 text-white border-white/30 backdrop-blur-md shadow-sm"'
);

// Also improve padding/tracking for a more premium pill look
code = code.replace(
  '"hidden md:flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all duration-300"',
  '"hidden md:flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border transition-all duration-300"'
);

fs.writeFileSync('frontend/src/components/layout/Navbar.tsx', code);
console.log('Done - Administrator badge fixed');
