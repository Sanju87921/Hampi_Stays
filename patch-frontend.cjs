const fs = require('fs');
let c = fs.readFileSync('c:/Users/sanju/Desktop/Hampi-Stays/frontend/src/pages/admin/AdminDashboard.tsx', 'utf8');
c = c.replace(
  '{activeTab === "commissions" && <Suspense fallback={<TabLoader />}><CommissionsModule /></Suspense>}',
  '{activeTab === "commissions" && <div className="space-y-12"><Suspense fallback={<TabLoader />}><CommissionsModule /></Suspense>{renderCommissions()}</div>}'
);
fs.writeFileSync('c:/Users/sanju/Desktop/Hampi-Stays/frontend/src/pages/admin/AdminDashboard.tsx', c);
