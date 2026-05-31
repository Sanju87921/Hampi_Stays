const fs = require('fs');
const path = require('path');

const files = [
  'frontend/src/pages/traveler/BookingsPage.tsx',
  'frontend/src/pages/owner/GuideDashboard.tsx',
  'frontend/src/pages/admin/BlogModule.tsx',
  'frontend/src/pages/admin/HeroModule.tsx',
  'frontend/src/pages/admin/PromotionsModule.tsx',
  'frontend/src/pages/admin/curation/SponsoredAdsModule.tsx',
  'frontend/src/pages/admin/curation/SeasonalCampaignsModule.tsx',
  'frontend/src/pages/admin/curation/CuratedExperiencesModule.tsx',
  'frontend/src/pages/admin/components/UserManagement.tsx'
];

for (const file of files) {
  const filePath = path.join('c:/Users/sanju/Desktop/Hampi-Stays', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes('useModal')) continue;

    let depth = file.split('/').length - 3;
    let importPath = '../'.repeat(depth) + 'components/shared/ModalProvider';
    if (depth < 0) importPath = './components/shared/ModalProvider';
    content = 'import { useModal } from \"' + importPath + '\";\n' + content;

    const componentRegex = /export (?:default )?(?:function|const) (\w+)[^{]*{/;
    content = content.replace(componentRegex, (match) => {
      return match + '\n  const { confirm, showModal } = useModal();\n';
    });

    content = content.replace(/if \(!window\.confirm\(([^]+)\)\) return;/g, 'if (!(await confirm({ title: "Confirm Action", message: $1 }))) return;');
    content = content.replace(/if \(!window\.confirm\('([^']+)'\)\) return;/g, 'if (!(await confirm({ title: "Confirm Action", message: \'\' }))) return;');
    content = content.replace(/if \(!window\.confirm\("([^"]+)"\)\) return;/g, 'if (!(await confirm({ title: "Confirm Action", message: "" }))) return;');
    content = content.replace(/if \(!confirm\(([^]+)\)\) return;/g, 'if (!(await confirm({ title: "Confirm Action", message: $1 }))) return;');
    content = content.replace(/if \(!confirm\('([^']+)'\)\) return;/g, 'if (!(await confirm({ title: "Confirm Action", message: \'\' }))) return;');
    content = content.replace(/if \(!confirm\("([^"]+)"\)\) return;/g, 'if (!(await confirm({ title: "Confirm Action", message: "" }))) return;');
    content = content.replace(/!window\.confirm\(([^]+)\)/g, '!(await confirm({ title: "Confirm Action", message: $1 }))');

    fs.writeFileSync(filePath, content);
    console.log('Processed', file);
  }
}
