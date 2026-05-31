const fs = require('fs');
const path = require('path');

const files = [
  'frontend/src/pages/traveler/BookingsPage.tsx',
  'frontend/src/pages/owner/GuideDashboard.tsx',
  'frontend/src/pages/admin/AdminDashboard.tsx',
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

    // Insert import
    let depth = file.split('/').length - 3;
    let importPath = '../'.repeat(depth) + 'components/shared/ModalProvider';
    if (depth < 0) importPath = './components/shared/ModalProvider';
    content = 'import { useModal } from \"' + importPath + '\";\n' + content;

    // Find component definition to insert useModal hook
    const componentRegex = /export (?:default )?(?:function|const) (\w+)[^{]*{/;
    content = content.replace(componentRegex, (match) => {
      return match + '\n  const { confirm, showModal } = useModal();\n';
    });

    // Replace confirms
    content = content.replace(/(!?)(?:window\.)?confirm\((.*?)\)/g, '(await confirm({ title: \"Confirm Action\", message:  })) === ');
    // For when it's (!await confirm...) we should probably do:
    content = content.replace(/\(await confirm\(\{ title: "Confirm Action", message: (.*?)\} \)\) === !true/g, '!(await confirm({ title: "Confirm Action", message:  }))');
    content = content.replace(/\(await confirm\(\{ title: "Confirm Action", message: (.*?)\} \)\) === true/g, '(await confirm({ title: "Confirm Action", message:  }))');

    fs.writeFileSync(filePath, content);
    console.log('Processed', file);
  }
}
