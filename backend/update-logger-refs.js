import fs from 'fs';
import path from 'path';

function replaceInFile(filePath, oldStr, newStr) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    if (data.includes(oldStr)) {
      const newData = data.split(oldStr).join(newStr);
      fs.writeFileSync(filePath, newData, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  } catch (err) {
    console.error(`Error updating ${filePath}: ${err}`);
  }
}

replaceInFile('server/controllers/admin/admin.controller.js', '../../utils/logger.js', '../../logging/logger.js');
replaceInFile('server/controllers/auth/auth.controller.js', '../../utils/logger.js', '../../logging/logger.js');
replaceInFile('server/controllers/bookings/booking.controller.js', '../../utils/logger.js', '../../logging/logger.js');
replaceInFile('server/controllers/payments/payment.controller.js', '../../utils/logger.js', '../../logging/logger.js');
replaceInFile('server/middleware/errorHandler.middleware.js', '../utils/logger.js', '../logging/logger.js');
replaceInFile('server/worker.js', './utils/logger.js', './logging/logger.js');

console.log('Done');
