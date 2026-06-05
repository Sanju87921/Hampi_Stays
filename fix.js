const fs = require('fs');
let code = fs.readFileSync('c:/Users/sanju/Desktop/Hampi-Stays/frontend/src/pages/admin/AdminDashboard.tsx', 'utf8');

const regex = /import \{ jsPDF \} from "jspdf";\r?\nimport html2canvas from "html2canvas";\r?\n/;
code = code.replace(regex, '');

fs.writeFileSync('c:/Users/sanju/Desktop/Hampi-Stays/frontend/src/pages/admin/AdminDashboard.tsx', code);
