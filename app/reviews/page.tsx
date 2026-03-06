import type { Metadata } from 'next';
import ReviewsClient from './ReviewsClient';

export const metadata: Metadata = {
  title: 'Customer Reviews | Mcdodo UK',
  description: 'Read genuine customer reviews for Mcdodo UK charging cables, chargers, and accessories.',
  alternates: { canonical: 'https://www.mcdodo.co.uk/reviews' },
};

export default function ReviewsPage() {
  return <ReviewsClient />;
}
