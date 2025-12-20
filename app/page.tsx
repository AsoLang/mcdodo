// Path: /app/page.tsx

import { getProducts, getProductVariants } from '@/lib/db';
import ProductCard from '@/components/ProductCard';
import Hero from '@/components/Hero';

export default async function Home() {
  const products = await getProducts();
  
  // Get first variant and images for each product
  const productsWithVariants = await Promise.all(
    products.map(async (product) => {
      const variants = await getProductVariants(product.id);
      const firstVariant = variants[0];
      return {
        ...product,
        variant: firstVariant,
      };
    })
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Hero />
      
      {/* Products Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            Premium Charging Accessories
          </h2>
          <p className="text-xl text-gray-600">
            Fast charging solutions for your lifestyle
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {productsWithVariants.map((product, index) => (
            <ProductCard
              key={product.id}
              product_url={product.product_url}
              title={product.title}
              price={Number(product.variant?.price) || 0}
              salePrice={Number(product.variant?.sale_price) || 0}
              onSale={product.variant?.on_sale || false}
              image={product.variant?.images?.[0] || ''}
              index={index}
            />
          ))}
        </div>
      </section>
    </main>
  );
}