import type { Metadata } from 'next';
import { neon } from '@neondatabase/serverless';
import ReviewsClient from './ReviewsClient';

export const metadata: Metadata = {
  title: 'Customer Reviews | Mcdodo UK',
  description: 'Read genuine customer reviews for Mcdodo UK charging cables, chargers, and accessories.',
  alternates: { canonical: 'https://www.mcdodo.co.uk/reviews' },
};

const sql = neon(process.env.DATABASE_URL!);

export default async function ReviewsPage() {
  const rows = await sql`SELECT title, product_url FROM products`;
  const products = rows as Array<{ title: string; product_url: string }>;
  const productLinks = Object.fromEntries(
    products.map((row) => [row.title, row.product_url])
  );

  return <ReviewsClient productLinks={productLinks} />;
}
