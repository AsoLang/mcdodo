import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us | Mcdodo (UK)',
  description: 'Learn about Mcdodo (UK) - premium fast charging cables, chargers and accessories with patented auto power-off technology.',
  alternates: { canonical: 'https://www.mcdodo.co.uk/about' },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
