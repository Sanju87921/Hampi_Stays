const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/admin/PromotionsModule.tsx', 'utf8');

const normalizeStr = '  const normalizeArray = (d) => Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : Array.isArray(d?.promotions) ? d.promotions : [];';

content = content.replace(/setPromotions\(promosRes \|\| \[\]\);/g, 'setPromotions(normalizeArray(promosRes));');
content = content.replace('export function PromotionsModule() {', 'export function PromotionsModule() {\n' + normalizeStr);
content = content.replace('export default function PromotionsModule() {', 'export default function PromotionsModule() {\n' + normalizeStr);

fs.writeFileSync('frontend/src/pages/admin/PromotionsModule.tsx', content);

