// Path: app/product/[slug]/page.tsx

import { notFound } from 'next/navigation';
import { neon } from '@neondatabase/serverless';
import ProductDetail from '@/components/ProductDetail';
import type { Metadata } from 'next';

const sql = neon(process.env.DATABASE_URL!);

interface ProductVariant {
  id: string;
  sku: string;
  option_value_1: string;
  price: number;
  sale_price: number;
  on_sale: boolean;
  stock: number;
  images: string[];
}

interface Product {
  id: string;
  title: string;
  description: string;
  categories: string;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  product_url: string;
  variants: ProductVariant[];
}

interface Props {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string): Promise<Product | null> {
  try {
    const products = await sql`
      SELECT * FROM products 
      WHERE product_url = ${slug} 
      AND visible = true
    `;

    if (products.length === 0) return null;
    
    const product = products[0];

    const variants = await sql`
      SELECT * FROM product_variants 
      WHERE product_id = ${product.id}
    `;

    return { 
      ...product,
      variants: variants as ProductVariant[]
    } as Product;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: 'Product Not Found | Mcdodo UK',
      description: 'The product you are looking for could not be found.',
    };
  }

  const title = product.seo_title || `${product.title} | Mcdodo UK`;
  const description = product.seo_description || product.description || 'Premium charging accessories from Mcdodo UK';
  const images = product.variants[0]?.images?.[0] ? [product.variants[0].images[0]] : [];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  return <ProductDetail product={product} />;
}