// Path: app/shop/page.tsx

import ShopPage from '@/components/ShopPage';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getProducts() {
  try {
    // Use absolute URL for production
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const res = await fetch(`${baseUrl}/api/shop/products`, {
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    
    if (!res.ok) {
      console.error('Failed to fetch products:', res.status);
      return [];
    }
    
    return res.json();
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export default async function Shop() {
  const products = await getProducts();
  
  return <ShopPage products={products} />;
}