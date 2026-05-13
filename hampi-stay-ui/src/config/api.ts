const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;
export const API_BASE_URL = baseUrl.replace(/\/$/, '') + '/api';


