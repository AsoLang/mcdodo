// Path: app/shop/page.tsx

import ShopPage from '@/components/ShopPage';

async function getProducts() {
  try {
    // In production, use relative path
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    console.log('Fetching from:', `${baseUrl}/api/shop/products`);
    
    const res = await fetch(`${baseUrl}/api/shop/products`, {
      cache: 'no-store'
    });
    
    console.log('Response status:', res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Fetch failed:', res.status, errorText);
      return [];
    }
    
    const data = await res.json();
    console.log('Products fetched:', data.length);
    return data;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export default async function Shop() {
  const products = await getProducts();
  
  console.log('Rendering shop page with', products.length, 'products');
  
  return <ShopPage products={products} />;
}