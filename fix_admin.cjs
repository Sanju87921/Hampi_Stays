const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/admin/AdminDashboard.tsx', 'utf8');

const normalizeStr = '  const normalizeArray = (d) => Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : Array.isArray(d?.logs) ? d.logs : Array.isArray(d?.users) ? d.users : Array.isArray(d?.bookings) ? d.bookings : [];';

content = content.replace(/setOtpLogs\(logs\);/g, 'setOtpLogs(normalizeArray(logs));');
content = content.replace(/setAllBookings\(bk\);/g, 'setAllBookings(normalizeArray(bk));');
content = content.replace(/setAllBookings\(bookings\);/g, 'setAllBookings(normalizeArray(bookings));');

content = content.replace(/setAuditLogs\(Array\.isArray\(aLogs\?\.data\) \? aLogs\.data : \(Array\.isArray\(aLogs\) \? aLogs : \[\]\)\);/g, 'setAuditLogs(normalizeArray(aLogs));');
content = content.replace(/setAuditLogs\(Array\.isArray\(audit\?\.data\) \? audit\.data : \(Array\.isArray\(audit\) \? audit : \[\]\)\);/g, 'setAuditLogs(normalizeArray(audit));');

content = content.replace(/setAllUsers\(Array\.isArray\(us\) \? us : \[\]\);/g, 'setAllUsers(normalizeArray(us));');
content = content.replace(/setAllUsers\(Array\.isArray\(users\) \? users : \[\]\);/g, 'setAllUsers(normalizeArray(users));');

content = content.replace('export default function AdminDashboard() {', 'export default function AdminDashboard() {\n' + normalizeStr);

fs.writeFileSync('frontend/src/pages/admin/AdminDashboard.tsx', content);

