const CLOUDFLARE_PUBLIC_URL = import.meta.env.VITE_CLOUDFLARE_PUBLIC_URL || '';

export const getProductImageUrl = (fileName) => {
  if (!fileName) return '/placeholder.png';
  if (fileName.startsWith('http') || fileName.startsWith('/api/') || fileName.startsWith('data:')) {
    return fileName;
  }
  const base = CLOUDFLARE_PUBLIC_URL.replace(/\/+$/, '');
  return `${base}/${fileName}`;
};

export const getProductImages = (images) => {
  if (!images || !Array.isArray(images) || images.length === 0) return [];
  return images.map(getProductImageUrl);
};
