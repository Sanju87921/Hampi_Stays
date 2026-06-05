const fs = require('fs');
const path = 'c:/Users/sanju/Desktop/Hampi-Stays/frontend/src/pages/admin/AdminDashboard.tsx';
let lines = fs.readFileSync(path, 'utf8').split('\n');

let startIndex = lines.findIndex(l => l.includes('const renderOverview = () => ('));
lines.splice(startIndex, 2, 
  ' const renderOverview = () => (',
  '  <div className="space-y-8">',
  '    <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-sand-200 shadow-sm">',
  '      <div className="flex items-center gap-4">',
  '        <div className="w-12 h-12 bg-navy-950 rounded-xl flex items-center justify-center shadow-gold">',
  '          <Sparkles className="w-6 h-6 text-gold-500" />',
  '        </div>',
  '        <div>',
  '          <h2 className="text-2xl font-serif font-bold text-navy-950">Command Center</h2>',
  '          <p className="text-sm text-navy-950/60">HampiStays Performance Snapshot</p>',
  '        </div>',
  '      </div>',
  '      <Button onClick={exportToPDF} isLoading={isExportingPDF} className="bg-navy-950 text-white hover:bg-gold-600 shadow-gold transition-colors">',
  '        <Download className="w-4 h-4 mr-2" />',
  '        Export PDF Report',
  '      </Button>',
  '    </div>',
  '',
  '  <div id="overview-report-content" className="p-8 bg-[#FDFBF7] rounded-[2.5rem] space-y-8">',
  '    ',
  '    {/* PDF Header - Visible nicely in the export */}',
  '    <div className="flex justify-between items-start border-b-2 border-sand-200 pb-8 mb-8">',
  '      <div>',
  '        <CinematicLogo className="w-48 mb-4" />',
  '        <h1 className="text-3xl font-serif font-bold text-navy-950">Performance Overview</h1>',
  '        <p className="text-sm font-bold text-navy-950/60 uppercase tracking-widest mt-2">Generated: {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>',
  '      </div>',
  '      <div className="text-right">',
  '        <p className="text-sm font-bold text-navy-950 uppercase">OFFICIAL REPORT</p>',
  '        <p className="text-xs text-navy-950/60 mt-1">Ref: HST-ADMIN-{new Date().getFullYear()}</p>',
  '      </div>',
  '    </div>',
  '   {/* Stats Grid */}'
);

let endIndex = lines.findIndex((l, i) => i > startIndex && l.includes('const renderResortCard ='));

// Find the precise line to replace `  );`
let closingIndex = endIndex - 1;
while(closingIndex > startIndex && !lines[closingIndex].includes(');')) {
  closingIndex--;
}

if (closingIndex > startIndex) {
  lines.splice(closingIndex, 1, '   </div>', '  </div>', ' );');
}

let content = lines.join('\n');
if (!content.includes('import { CinematicLogo }')) {
  content = content.replace(
    /import { Button } from "\.\.\/\.\.\/components\/ui\/Button";/,
    'import { CinematicLogo } from "../../components/ui/CinematicLogo";\nimport { Button } from "../../components/ui/Button";'
  );
}

fs.writeFileSync(path, content);
