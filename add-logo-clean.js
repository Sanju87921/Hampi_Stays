const fs = require('fs');
const path = 'c:/Users/sanju/Desktop/Hampi-Stays/frontend/src/pages/admin/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = ` const renderOverview = () => (
 <div className="space-y-8">`;

const replacement = ` const renderOverview = () => (
 <div className="space-y-8" id="overview-report-content">
    <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-sand-200 shadow-sm" data-html2canvas-ignore>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-navy-950 rounded-xl flex items-center justify-center shadow-gold">
          <Sparkles className="w-6 h-6 text-gold-500" />
        </div>
        <div>
          <h2 className="text-2xl font-serif font-bold text-navy-950">Command Center</h2>
          <p className="text-sm text-navy-950/60">HampiStays Performance Snapshot</p>
        </div>
      </div>
      <Button onClick={exportToPDF} isLoading={isExportingPDF} className="bg-navy-950 text-white hover:bg-gold-600 shadow-gold transition-colors">
        <Download className="w-4 h-4 mr-2" />
        Export PDF Report
      </Button>
    </div>

    {/* PDF Header - Visible nicely in the export */}
    <div className="flex justify-between items-start border-b-2 border-sand-200 pb-8 mb-8 bg-[#FDFBF7] p-8 rounded-[2rem] shadow-sm">
      <div>
        <CinematicLogo className="w-48 mb-4" />
        <h1 className="text-3xl font-serif font-bold text-navy-950">Performance Overview</h1>
        <p className="text-sm font-bold text-navy-950/60 uppercase tracking-widest mt-2">Generated: {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-navy-950 uppercase">OFFICIAL REPORT</p>
        <p className="text-xs text-navy-950/60 mt-1">Ref: HST-ADMIN-{new Date().getFullYear()}</p>
      </div>
    </div>`;

content = content.replace(target, replacement);

if (!content.includes('import { CinematicLogo }')) {
  content = content.replace(
    /import \{ Button \} from "\.\.\/\.\.\/components\/ui\/Button";/,
    'import { CinematicLogo } from "../../components/ui/CinematicLogo";\nimport { Button } from "../../components/ui/Button";'
  );
}

fs.writeFileSync(path, content);
