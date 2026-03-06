import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | Mcdodo UK',
  description: 'Get in touch with the Mcdodo UK team for order support, product questions, or general enquiries. We reply within 24 hours.',
  alternates: { canonical: 'https://www.mcdodo.co.uk/contact' },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
