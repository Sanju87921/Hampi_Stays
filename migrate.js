const fs = require('fs');

const oldWorker = fs.readFileSync('worker_old.js', 'utf16le');

const startIndex = oldWorker.indexOf("app.get('/admin/stats'");
// Find the end of the admin coupons analytics route
const endIndexStr = "app.get('/admin/coupons/analytics'";
let endIndex = oldWorker.indexOf(endIndexStr);
// Find the end of the block for coupons/analytics
endIndex = oldWorker.indexOf("app.patch('/bookings/:id/cancel'", endIndex);

let adminRoutesCode = oldWorker.substring(startIndex, endIndex);

adminRoutesCode = adminRoutesCode.replace(/getPrisma\(c\.env\)/g, "c.get('getPrisma')(c.env)");

let adminIndex = fs.readFileSync('backend/server/routes/admin/index.js', 'utf8');

// Strip out the previous broken append if it's there
adminIndex = adminIndex.replace(/\napp\.get\('\/admin\/stats'[\s\S]*$/, '\n};\n');

// Insert the code before the final closing brace.
adminIndex = adminIndex.replace(/};\s*$/, '\n' + adminRoutesCode + '\n};\n');

fs.writeFileSync('backend/server/routes/admin/index.js', adminIndex, 'utf8');
console.log('Successfully merged old admin routes into admin/index.js (UTF-8)');
