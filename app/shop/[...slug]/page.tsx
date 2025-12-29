// Path: app/shop/[...slug]/page.tsx

import { redirect } from 'next/navigation';

export default function ShopCatchAll() {
  redirect('/shop');
}