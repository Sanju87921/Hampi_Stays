import React from 'react';
import { renderToString } from 'react-dom/server';
import { UserManagement } from './frontend/src/pages/admin/components/UserManagement';

global.import = { meta: { env: { VITE_API_URL: 'https://hampi-stays.sanju87921.workers.dev' } } };

try {
  const html = renderToString(<UserManagement />);
  console.log("Render successful!");
} catch (err) {
  console.error("RENDER CRASHED:");
  console.error(err);
}
