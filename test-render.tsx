import React from 'react';
import { renderToString } from 'react-dom/server';
import { UserManagement } from './frontend/src/pages/admin/components/UserManagement';

try {
  const html = renderToString(<UserManagement />);
  console.log("Render successful!");
} catch (err) {
  console.error("RENDER CRASHED:");
  console.error(err);
}
