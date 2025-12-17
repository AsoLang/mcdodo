import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export interface Product {
  id: string;
  title: string;
  description: string;
  product_url: string;
  categories: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  option_value_1: string;
  price: number;
  sale_price: number;
  on_sale: boolean;
  stock: number;
  images: string[];
}

export async function getProducts() {
  const products = await sql`
    SELECT * FROM products 
    WHERE visible = true 
    ORDER BY created_at DESC
  `;
  return products as Product[];
}

export async function getProductVariants(productId: string) {
  const variants = await sql`
    SELECT * FROM product_variants 
    WHERE product_id = ${productId}
  `;
  return variants as ProductVariant[];
}

export async function getProductWithVariants(productId: string) {
  const [product] = await sql`
    SELECT * FROM products WHERE id = ${productId}
  `;
  
  const variants = await getProductVariants(productId);
  
  return { product: product as Product, variants };
}