// Path: app/shop/page.tsx

import ShopPage from '@/components/ShopPage';

async function getProducts() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/shop/products`, {
      cache: 'no-store'
    });
    
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return [];
  }
}

export default async function Shop() {
  const products = await getProducts();
  
  return <ShopPage products={products} />;
}