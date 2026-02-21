import type { Metadata } from 'next';
import ReviewsClient from './ReviewsClient';

export const metadata: Metadata = {
  title: 'Customer Reviews | Mcdodo UK',
  description: 'Read genuine customer reviews for Mcdodo UK charging cables, chargers, and accessories.',
};

export default function ReviewsPage() {
  return <ReviewsClient />;
}
