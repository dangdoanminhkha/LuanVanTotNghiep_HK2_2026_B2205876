// Normalize image URL to absolute URL
// Convert '/uploads/...' to `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/uploads/...`
const extractImageValue = (value) => {
  if (!value) return '';

  if (Array.isArray(value)) {
    return extractImageValue(value[0]);
  }

  if (typeof value === 'object') {
    if (typeof value.url === 'string') return value.url;
    if (typeof value.src === 'string') return value.src;
    if (typeof value.image === 'string') return value.image;
    return '';
  }

  if (typeof value !== 'string') return '';

  const trimmed = value.trim();
  if (!trimmed) return '';

  // Handle JSON-like string payloads such as '["/uploads/a.jpg"]'
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      return extractImageValue(JSON.parse(trimmed));
    } catch {
      // Keep fallback to original string below
    }
  }

  return trimmed;
};

export const normalizeImageUrl = (url) => {
  const imageValue = extractImageValue(url);
  if (!imageValue) return '';
  if (imageValue.startsWith('http')) return imageValue;
  if (imageValue.startsWith('data:')) return imageValue; // data URI

  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  if (imageValue.startsWith('/')) return `${BASE_URL}${imageValue}`;
  return `${BASE_URL}/${imageValue}`;
};

export default normalizeImageUrl;
