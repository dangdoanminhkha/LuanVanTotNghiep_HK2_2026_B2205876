// Utility functions for product slugs and URL handling

export const createProductSlug = (product) => {
  if (!product) return '';
  
  // Create slug from product name + key details
  const baseName = product.name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
  
  return `${baseName}-${product.id}`;
};

export const extractIdFromSlug = (slug) => {
  // Extract ID from slug format: "product-name-123" -> "123"
  const parts = slug.split('-');
  const lastPart = parts[parts.length - 1];
  
  // Check if last part is numeric (ID)
  return /^\d+$/.test(lastPart) ? parseInt(lastPart) : null;
};

export const parseImages = (images) => {
  if (Array.isArray(images)) return images;
  if (typeof images === 'string' && images.trim()) {
    // Try JSON parsing first
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // Not JSON, treat as single URL or comma-separated list
      const urls = images.split(',').map(u => u.trim()).filter(Boolean);
      return urls.length > 0 ? urls : [];
    }
  }
  return [];
};

export const firstImageFrom = (images) => {
  const arr = parseImages(images);
  return arr && arr.length > 0 ? arr[0] : '';
};

export const getProductDisplayImage = (product) => {
  if (!product) return '';

  // Prefer variant image if available
  const firstVariant = product.variants && product.variants.length > 0 ? product.variants[0] : null;
  if (firstVariant) {
    const vImg = firstImageFrom(firstVariant.images || firstVariant.image);
    if (vImg) return vImg;
  }

  // Fallback to product images or product.image
  const pImg = firstImageFrom(product.images || product.image);
  if (pImg) return pImg;

  return product.image || '';
};