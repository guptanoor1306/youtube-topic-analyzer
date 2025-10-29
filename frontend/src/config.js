// API Configuration
// Remove trailing slash if present
const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
export const API_BASE_URL = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl

console.log('🔧 API Configuration:', API_BASE_URL)

