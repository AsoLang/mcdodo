// Path: app/shop/p/[slug]/page.tsx

import { notFound, redirect } from 'next/navigation';
import { neon } from '@neondatabase/serverless';
import ProductDetail from '@/components/ProductDetail';
import type { Metadata } from 'next';

const sql = neon(process.env.DATABASE_URL!);

interface ProductVariant {
  id: string;
  sku: string;
  option_value_1: string;
  color?: string | null;
  size?: string | null;
  price: number;
  sale_price: number;
  on_sale: boolean;
  stock: number;
  images: string[];
}

interface Accordion {
  id: string;
  title: string;
  content: string;
}

interface RelatedProduct {
  id: string;
  title: string;
  product_url: string;
  price: number;
  sale_price: number;
  on_sale: boolean;
  image: string;
  review_count: number;
  review_rating: number;
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
  visible: boolean;
  variants: ProductVariant[];
  accordions?: Accordion[];
  product_images?: string[];
  gallery_images?: string[];
  review_count?: number;
  review_rating?: number;
  related_products?: RelatedProduct[];
}

interface Props {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string): Promise<Product | null> {
  try {
    const products = await sql`
      SELECT * FROM products 
      WHERE product_url = ${slug} 
    `;

    if (products.length === 0) return null;
    
    const product = products[0];

    const variants = await sql`
      SELECT * FROM product_variants 
      WHERE product_id = ${product.id}
      ORDER BY position ASC
    `;

    // Fetch related products with product_images prioritized
    let relatedProducts: RelatedProduct[] = [];
    if (product.related_products && product.related_products.length > 0) {
      const relatedData = await sql`
        SELECT 
          p.id, 
          p.title, 
          p.product_url,
          p.review_count,
          p.review_rating,
          p.product_images,
          v.price,
          v.sale_price,
          v.on_sale,
          v.images
        FROM products p
        LEFT JOIN LATERAL (
          SELECT * FROM product_variants 
          WHERE product_id = p.id 
          ORDER BY position ASC 
          LIMIT 1
        ) v ON true
        WHERE p.id = ANY(${product.related_products}::text[])
        AND p.visible = true
      `;
      
      relatedProducts = relatedData.map((r: any) => {
        let image = '';
        if (r.product_images && r.product_images.length > 0) {
          image = r.product_images[0];
        } else if (r.images && r.images.length > 0) {
          image = r.images[0];
        }

        return {
          id: r.id,
          title: r.title,
          product_url: r.product_url,
          price: Number(r.price) || 0,
          sale_price: Number(r.sale_price) || 0,
          on_sale: r.on_sale || false,
          image: image,
          review_count: r.review_count || 0,
          review_rating: Number(r.review_rating) || 0
        };
      });
    }

    return { 
      ...product,
      variants: variants as ProductVariant[],
      accordions: product.accordions || [],
      product_images: product.product_images || [],
      gallery_images: product.gallery_images || [],
      review_count: product.review_count || 0,
      review_rating: Number(product.review_rating) || 0,
      related_products: relatedProducts
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

  // Prevent indexing if hidden
  if (!product.visible) {
    return {
      title: `Archived: ${product.title} | Mcdodo UK`,
      description: product.description,
      robots: 'noindex', 
    };
  }

  const title = product.seo_title || `${product.title} | Mcdodo UK`;
  const description = product.seo_description || product.description || 'Premium charging accessories from Mcdodo UK';
  
  const images = product.product_images?.[0] 
    ? [product.product_images[0]] 
    : product.variants[0]?.images?.[0] 
    ? [product.variants[0].images[0]] 
    : [];

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

  // REDIRECT LOGIC:
  // 1. If product is NULL (broken link/invalid slug) -> Redirect to /archive
  // 2. If product exists (even if hidden) -> Show it (So you can view it from the Archive page)
  if (!product) {
    redirect('/archive');
  }

  return <ProductDetail product={product} />;
}