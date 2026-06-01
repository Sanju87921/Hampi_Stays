const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/admin/AdminDashboard.tsx', 'utf8');

const definition = `
const normalizeArray = (d: any) => {
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.data)) return d.data;
  if (d && Array.isArray(d.logs)) return d.logs;
  return [];
};

export function AdminDashboard() {`;

content = content.replace('export function AdminDashboard() {', definition);
fs.writeFileSync('frontend/src/pages/admin/AdminDashboard.tsx', content);
console.log('done fixing AdminDashboard');
