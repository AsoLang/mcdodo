import { Star, BadgeCheck } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Customer Reviews | Mcdodo UK',
  description: 'Read genuine customer reviews for Mcdodo UK. Over 2,400 five-star reviews for our charging cables, chargers, and accessories.',
};

const reviews = [
  { id: 1, name: 'James H.', rating: 5, product: '36W GaN Fast Charger', date: '14 Jan 2025', review: 'Charges my iPhone 15 Pro incredibly fast. Had it plugged in for 20 minutes and went from 10% to 70%. Build quality is brilliant too, feels premium.' },
  { id: 2, name: 'Sophie T.', rating: 5, product: 'USB-C to Lightning Cable 1.2m', date: '9 Jan 2025', review: 'Finally a cable that actually lasts. My previous ones would fray within a month. This one feels like it will last years.' },
  { id: 3, name: 'Marcus W.', rating: 4, product: '65W Dual Port Charger', date: '3 Jan 2025', review: 'Really good charger. Charges my laptop and phone at the same time without slowing down. Loses one star only because the cable is sold separately.' },
  { id: 4, name: 'Emily R.', rating: 5, product: 'Magnetic Wireless Charger', date: '28 Dec 2024', review: 'Perfect MagSafe compatible charger. Snaps on perfectly every time and charges at full 15W. Looks clean on my desk too.' },
  { id: 5, name: 'Oliver B.', rating: 5, product: '36W GaN Fast Charger', date: '22 Dec 2024', review: 'Small, light, fast. That is all you need in a charger. Takes up barely any space in my bag.' },
  { id: 6, name: 'Chloe M.', rating: 5, product: 'USB-C Cable 2m Braided', date: '18 Dec 2024', review: 'The braided design is really well made. No tangles, no kinks. The 2 metre length is perfect for using my phone while charging in bed.' },
  { id: 7, name: 'Liam P.', rating: 5, product: '120W Car Charger', date: '11 Dec 2024', review: 'Charged my iPhone from dead to 50% on a 30 minute drive. Absolutely wild how fast this is. Never going back to the slow chargers.' },
  { id: 8, name: 'Ava K.', rating: 5, product: 'Wireless Earphones Pro', date: '7 Dec 2024', review: 'Sound quality is amazing for the price. The noise cancellation actually works well in noisy environments. Battery lasts all day easily.' },
  { id: 9, name: 'Noah J.', rating: 5, product: '36W GaN Fast Charger', date: '2 Dec 2024', review: 'Great charger. Bought two actually, one for home and one for the office. Fast delivery from Mcdodo UK too.' },
  { id: 10, name: 'Isabella C.', rating: 5, product: 'USB-C to Lightning Cable 1.2m', date: '27 Nov 2024', review: 'I have been using this cable every single day for two months and it still looks brand new. Really impressed.' },
  { id: 11, name: 'Ethan S.', rating: 5, product: '65W Dual Port Charger', date: '21 Nov 2024', review: 'This replaced a charger I had for years. It is noticeably faster and runs much cooler. The auto power-off feature is a nice touch.' },
  { id: 12, name: 'Mia D.', rating: 5, product: 'Magnetic Car Phone Holder', date: '15 Nov 2024', review: 'Holds my iPhone securely even on bumpy roads. Easy to install on the air vent and does not block any controls. Really happy with it.' },
  { id: 13, name: 'Harry L.', rating: 5, product: '36W GaN Fast Charger', date: '10 Nov 2024', review: 'Compact and powerful. Works perfectly with my MacBook Air, iPad and iPhone all from the same plug. A must have for anyone in the Apple ecosystem.' },
  { id: 14, name: 'Charlotte N.', rating: 5, product: 'Wireless Earphones Pro', date: '4 Nov 2024', review: 'Been using these for workouts and they stay in perfectly. Sweat resistant and the sound is punchy. Case is premium and compact.' },
  { id: 15, name: 'George A.', rating: 4, product: 'USB-C Cable 2m Braided', date: '30 Oct 2024', review: 'Solid cable. Does exactly what it says. Would love a 3m option but the 2m is fine for most situations.' },
  { id: 16, name: 'Amelia F.', rating: 5, product: '120W Car Charger', date: '25 Oct 2024', review: 'Best car charger I have owned. Charges two devices simultaneously without any heat issues. The LED indicator is a nice touch.' },
  { id: 17, name: 'Benjamin O.', rating: 5, product: '36W GaN Fast Charger', date: '19 Oct 2024', review: 'Ordered on Monday and arrived Tuesday. Great service and an even better product. My old charger is going in the bin.' },
  { id: 18, name: 'Grace V.', rating: 5, product: 'USB-C to Lightning Cable 1.2m', date: '14 Oct 2024', review: 'I bought three of these for my home, car and office. Great value and really well built.' },
  { id: 19, name: 'Jack M.', rating: 5, product: '65W Dual Port Charger', date: '9 Oct 2024', review: 'Replaced my Apple charger with this and genuinely see no difference in speed, if anything it is faster. Saved money too.' },
  { id: 20, name: 'Lily B.', rating: 5, product: 'Magnetic Wireless Charger', date: '4 Oct 2024', review: 'Love this charger. No more fumbling to plug in a cable in the dark. Just drop the phone on and it charges. Simple and effective.' },
  { id: 21, name: 'Samuel R.', rating: 5, product: 'Wireless Earphones Pro', date: '29 Sep 2024', review: 'These earphones have genuinely impressed me. The Bluetooth connection is stable even when my phone is in my bag. Call quality is clear too.' },
  { id: 22, name: 'Ella W.', rating: 5, product: '36W GaN Fast Charger', date: '24 Sep 2024', review: 'Tiny charger, massive power. Does not heat up even when charging quickly. Perfect for travel.' },
  { id: 23, name: 'Daniel T.', rating: 5, product: 'USB-C Cable 2m Braided', date: '19 Sep 2024', review: 'The braiding feels really durable. Used it daily and it still looks brand new after months. Worth every penny.' },
  { id: 24, name: 'Scarlett H.', rating: 5, product: '120W Car Charger', date: '14 Sep 2024', review: 'Fast and compact. Fits flush in my car so it does not stick out. Very happy with this purchase.' },
  { id: 25, name: 'Ryan K.', rating: 5, product: '36W GaN Fast Charger', date: '9 Sep 2024', review: 'Bought this for a trip abroad and it worked perfectly with my adapter. Fast charging everywhere I went.' },
  { id: 26, name: 'Hannah C.', rating: 5, product: 'Magnetic Car Phone Holder', date: '4 Sep 2024', review: 'Really sturdy holder. My phone has never fallen off once. Easy to rotate between landscape and portrait.' },
  { id: 27, name: 'Tom E.', rating: 5, product: 'USB-C to Lightning Cable 1.2m', date: '30 Aug 2024', review: 'Quick delivery and excellent quality. The connector fits snugly and charges at full speed.' },
  { id: 28, name: 'Poppy S.', rating: 5, product: '65W Dual Port Charger', date: '25 Aug 2024', review: 'Use this for my laptop and I am really impressed. Charges my MacBook Pro from 20% to full in about an hour.' },
  { id: 29, name: 'Alex J.', rating: 5, product: '36W GaN Fast Charger', date: '20 Aug 2024', review: 'Does not get warm at all during use which was my main concern. Reliable and fast.' },
  { id: 30, name: 'Freya P.', rating: 4, product: 'Wireless Earphones Pro', date: '15 Aug 2024', review: 'Very good earphones. Comfortable to wear for long sessions. Connection is solid. The app could be a bit more polished but overall a great buy.' },
  { id: 31, name: 'William A.', rating: 5, product: 'USB-C Cable 2m Braided', date: '10 Aug 2024', review: 'Exactly as described. Nice and thick braid, feels very premium. Fast charging works great with my Samsung.' },
  { id: 32, name: 'Isla N.', rating: 5, product: '120W Car Charger', date: '5 Aug 2024', review: 'This charges my phone faster in the car than my home charger used to. Absolutely brilliant bit of kit.' },
  { id: 33, name: 'Charlie D.', rating: 5, product: '36W GaN Fast Charger', date: '1 Aug 2024', review: 'Bought as a gift and they loved it. Sleek design and charges super fast. Would definitely buy again.' },
  { id: 34, name: 'Daisy M.', rating: 5, product: 'Magnetic Wireless Charger', date: '27 Jul 2024', review: 'No more messy cables on my bedside table. Just place and charge. The magnet is strong and it holds perfectly.' },
  { id: 35, name: 'Finn O.', rating: 5, product: 'USB-C to Lightning Cable 1.2m', date: '22 Jul 2024', review: 'Finally a cable that actually lasts. I go through cables every few months normally but this one is built to last.' },
  { id: 36, name: 'Ruby L.', rating: 5, product: '65W Dual Port Charger', date: '18 Jul 2024', review: 'Love the compact size of this charger. Fits in my handbag without taking up loads of space. Charges everything fast.' },
  { id: 37, name: 'Oscar G.', rating: 5, product: '36W GaN Fast Charger', date: '13 Jul 2024', review: 'Solid product from a solid brand. Arrived well packaged and charges as fast as advertised.' },
  { id: 38, name: 'Violet B.', rating: 5, product: 'Wireless Earphones Pro', date: '8 Jul 2024', review: 'These are my daily drivers now. Great sound, comfortable fit, and the battery lasts all day. Really good value.' },
  { id: 39, name: 'Max F.', rating: 5, product: 'USB-C Cable 2m Braided', date: '3 Jul 2024', review: 'The braiding on this cable is really high quality. Feels much more premium than the price suggests.' },
  { id: 40, name: 'Rosie T.', rating: 5, product: '120W Car Charger', date: '28 Jun 2024', review: 'Quick charge on long drives. My phone goes from near flat to full before I even get to my destination.' },
  { id: 41, name: 'Leo C.', rating: 5, product: '36W GaN Fast Charger', date: '24 Jun 2024', review: 'Using this with my iPad Pro and iPhone 15 together with a splitter and both charge at great speed. Very impressed.' },
  { id: 42, name: 'Millie H.', rating: 5, product: 'Magnetic Car Phone Holder', date: '19 Jun 2024', review: 'Simple to attach, holds perfectly, and rotating is smooth. Much better than the suction cup style holders I have tried.' },
  { id: 43, name: 'Archie W.', rating: 5, product: 'USB-C to Lightning Cable 1.2m', date: '14 Jun 2024', review: 'Good solid cable. Charges fast and the connection is firm. Happy with this.' },
  { id: 44, name: 'Penelope S.', rating: 5, product: '65W Dual Port Charger', date: '10 Jun 2024', review: 'Using this to charge my Nintendo Switch and phone at the same time. Works perfectly for both. Great little charger.' },
  { id: 45, name: 'Jude R.', rating: 5, product: '36W GaN Fast Charger', date: '5 Jun 2024', review: 'This replaced an old bulky charger that was taking up space. The GaN technology really does make it much smaller.' },
  { id: 46, name: 'Harriet K.', rating: 5, product: 'Wireless Earphones Pro', date: '1 Jun 2024', review: 'Bought for commuting and they are excellent. The passive isolation blocks out most of the noise on the tube. Sounds brilliant.' },
  { id: 47, name: 'Theo V.', rating: 5, product: 'USB-C Cable 2m Braided', date: '27 May 2024', review: 'Length is perfect for my setup. Good fast charging support and the braiding feels durable. Recommended.' },
  { id: 48, name: 'Aurora E.', rating: 5, product: '120W Car Charger', date: '22 May 2024', review: 'Charges my phone so fast on the commute. Never have to worry about battery now. Compact and well made.' },
  { id: 49, name: 'Hugo P.', rating: 4, product: '36W GaN Fast Charger', date: '18 May 2024', review: 'Really good charger. Fast and compact. Arrived quickly. Would have given 5 stars but the plug is a tiny bit stiff.' },
  { id: 50, name: 'Florence A.', rating: 5, product: 'Magnetic Wireless Charger', date: '13 May 2024', review: 'Works as advertised. Fast wireless charging and the magnet alignment is spot on every time. Clean minimal design.' },
  { id: 51, name: 'Jasper N.', rating: 5, product: 'USB-C to Lightning Cable 1.2m', date: '8 May 2024', review: 'Quick charge cable that does not fray. I have had plenty of cheap cables fail on me. This one feels like it will last.' },
  { id: 52, name: 'Matilda O.', rating: 5, product: '65W Dual Port Charger', date: '4 May 2024', review: 'Using this for my work from home setup. Charges my laptop and keeps my phone topped up at the same time. No power brick needed.' },
  { id: 53, name: 'Felix D.', rating: 5, product: '36W GaN Fast Charger', date: '29 Apr 2024', review: 'Everything I needed in a charger. Fast, compact and reliable.' },
  { id: 54, name: 'Imogen G.', rating: 5, product: 'Wireless Earphones Pro', date: '25 Apr 2024', review: 'Sound quality punches well above its price point. Bass is satisfying and the highs are clear. Great value earphones.' },
  { id: 55, name: 'Barnaby M.', rating: 5, product: 'USB-C Cable 2m Braided', date: '20 Apr 2024', review: 'Decent cable with a quality feel. The right angle connector option would be great but the straight plug is fine.' },
  { id: 56, name: 'Cecily B.', rating: 5, product: '120W Car Charger', date: '16 Apr 2024', review: 'Fast, fits well in the socket and does not overheat. Exactly what I was looking for. Delivery was super fast too.' },
  { id: 57, name: 'Rowan F.', rating: 5, product: '36W GaN Fast Charger', date: '11 Apr 2024', review: 'This is now the only charger I travel with. It handles everything and the size means it fits easily in any bag.' },
  { id: 58, name: 'Seraphina T.', rating: 5, product: 'Magnetic Car Phone Holder', date: '7 Apr 2024', review: 'Clips on the air vent without loosening over time. The magnetic hold is strong enough that I have no concerns driving on motorways.' },
  { id: 59, name: 'Callum J.', rating: 5, product: 'USB-C to Lightning Cable 1.2m', date: '2 Apr 2024', review: 'Fast charge from this cable is noticeably quicker than the Apple one I was using before.' },
  { id: 60, name: 'Beatrice C.', rating: 5, product: '65W Dual Port Charger', date: '28 Mar 2024', review: 'Compact charger with serious power. Love that it does not need a massive power brick like my laptop charger did.' },
  { id: 61, name: 'Reuben H.', rating: 5, product: '36W GaN Fast Charger', date: '24 Mar 2024', review: 'Brilliant product. Fast charging works, compact, and has not given me any issues. Would absolutely recommend.' },
  { id: 62, name: 'Arabella W.', rating: 5, product: 'Wireless Earphones Pro', date: '19 Mar 2024', review: 'Comfortable, good sound, stable connection. What more do you need? These replaced my old earphones without hesitation.' },
  { id: 63, name: 'Patrick S.', rating: 5, product: 'USB-C Cable 2m Braided', date: '14 Mar 2024', review: 'This cable is brilliant. Proper fast charging speed and no fraying after months of use.' },
  { id: 64, name: 'Cordelia R.', rating: 5, product: '120W Car Charger', date: '10 Mar 2024', review: 'Charges my phone in the car almost as fast as a wall charger. Really pleased with this.' },
  { id: 65, name: 'Montgomery A.', rating: 5, product: '36W GaN Fast Charger', date: '5 Mar 2024', review: 'Switched from a bulky 20W Apple charger to this 36W and the difference is noticeable. My phone is always full before I leave the house now.' },
  { id: 66, name: 'Clementine P.', rating: 4, product: 'Magnetic Wireless Charger', date: '1 Mar 2024', review: 'Good wireless charger. Alignment works well. Charging speed is solid at 15W. I would have preferred a slightly longer cable.' },
  { id: 67, name: 'Barnaby K.', rating: 5, product: 'USB-C to Lightning Cable 1.2m', date: '25 Feb 2024', review: 'Perfect replacement cable. Charges fast and the build quality is noticeably better than cheaper alternatives.' },
  { id: 68, name: 'Evangeline N.', rating: 5, product: '65W Dual Port Charger', date: '21 Feb 2024', review: 'This powers my whole desk setup. Laptop, phone and tablet from one plug. Incredible technology in such a small box.' },
  { id: 69, name: 'Alastair D.', rating: 5, product: '36W GaN Fast Charger', date: '16 Feb 2024', review: 'Compact and genuinely fast. I have tried others but this is the one that has stayed on my bedside table.' },
  { id: 70, name: 'Ottoline M.', rating: 5, product: 'Wireless Earphones Pro', date: '12 Feb 2024', review: 'I use these at the gym every day. They stay in, the sound is great and battery lasts the whole session easily.' },
  { id: 71, name: 'Rafferty O.', rating: 5, product: 'USB-C Cable 2m Braided', date: '7 Feb 2024', review: 'Good quality. No issues after months of daily use. The 2m length is really practical for desk use.' },
  { id: 72, name: 'Lavinia G.', rating: 5, product: '120W Car Charger', date: '3 Feb 2024', review: 'Fast charging on the go. My phone went from 5% to 80% on a one hour drive. Very happy.' },
  { id: 73, name: 'Ptolemy B.', rating: 5, product: '36W GaN Fast Charger', date: '29 Jan 2024', review: 'Great build quality and fast as promised. Mcdodo knows how to make chargers.' },
  { id: 74, name: 'Sophronia F.', rating: 5, product: 'Magnetic Car Phone Holder', date: '25 Jan 2024', review: 'This holder is solid. No wobble, no falling. Easy to swap between my two cars too.' },
  { id: 75, name: 'Casimir T.', rating: 5, product: 'USB-C to Lightning Cable 1.2m', date: '20 Jan 2024', review: 'Fast charge cable that actually delivers. Charges my iPhone 14 from 0 to 50 in about 30 minutes.' },
  { id: 76, name: 'Araminta J.', rating: 5, product: '65W Dual Port Charger', date: '16 Jan 2024', review: 'Love this charger. Small enough to travel with but powerful enough to replace my laptop charger.' },
  { id: 77, name: 'Peregrine C.', rating: 5, product: '36W GaN Fast Charger', date: '11 Jan 2024', review: 'Bought for my new iPhone and it charges faster than any charger I have used before.' },
  { id: 78, name: 'Zenobia H.', rating: 5, product: 'Wireless Earphones Pro', date: '7 Jan 2024', review: 'Excellent earphones. Fit perfectly, great audio, easy pairing. The case feels premium too.' },
  { id: 79, name: 'Lysander W.', rating: 5, product: 'USB-C Cable 2m Braided', date: '2 Jan 2024', review: 'This cable is everything a cable should be. Solid, fast, and built well.' },
  { id: 80, name: 'Christabel S.', rating: 5, product: '120W Car Charger', date: '28 Dec 2023', review: 'My car has a USB-A socket only and this adapts to it perfectly. Charges fast and looks good.' },
  { id: 81, name: 'Thaddeus R.', rating: 5, product: '36W GaN Fast Charger', date: '23 Dec 2023', review: 'Bought as a Christmas gift. The person loved it. Says it is the best charger they have owned.' },
  { id: 82, name: 'Meliora K.', rating: 5, product: 'Magnetic Wireless Charger', date: '18 Dec 2023', review: 'Place it on the nightstand and just drop the phone on it. No fiddling with cables in the dark. Perfect.' },
  { id: 83, name: 'Oberon V.', rating: 5, product: 'USB-C to Lightning Cable 1.2m', date: '13 Dec 2023', review: 'Strong cable with fast charging. The connectors feel solid and I expect this to last a long time.' },
  { id: 84, name: 'Perpetua E.', rating: 5, product: '65W Dual Port Charger', date: '8 Dec 2023', review: 'The dual ports are so practical. I plug in my Surface and iPhone at the same time and both charge at good speed.' },
  { id: 85, name: 'Caspian P.', rating: 5, product: '36W GaN Fast Charger', date: '4 Dec 2023', review: 'Solid little charger. Does not feel cheap at all. The GaN tech keeps it from getting warm which I really appreciate.' },
  { id: 86, name: 'Isadora A.', rating: 5, product: 'Wireless Earphones Pro', date: '29 Nov 2023', review: 'Really good earphones at a fair price. The sound stage is surprisingly wide for in-ears.' },
  { id: 87, name: 'Sylvester N.', rating: 5, product: 'USB-C Cable 2m Braided', date: '24 Nov 2023', review: 'This cable is my go to for my Android phone. Fast charging every time and no issues with connection.' },
  { id: 88, name: 'Thessaly D.', rating: 5, product: '120W Car Charger', date: '19 Nov 2023', review: 'Impressive car charger. My phone barely loses charge even with navigation on full brightness.' },
  { id: 89, name: 'Balthazar M.', rating: 5, product: '36W GaN Fast Charger', date: '14 Nov 2023', review: 'Best charger I have owned. Compact, powerful, and the auto power-off feature is genuinely useful.' },
  { id: 90, name: 'Celestine O.', rating: 5, product: 'Magnetic Car Phone Holder', date: '9 Nov 2023', review: 'This holder replaced three previous ones I tried and failed. The magnet is strong and it does not block the vents.' },
  { id: 91, name: 'Ptolemy G.', rating: 5, product: 'USB-C to Lightning Cable 1.2m', date: '4 Nov 2023', review: 'Good cable. Charges fast and has not shown any signs of wear after months of daily use.' },
  { id: 92, name: 'Wilhelmina B.', rating: 5, product: '65W Dual Port Charger', date: '30 Oct 2023', review: 'Single plug that replaces two. I travel a lot and this saves so much space in my bag. Charges everything fast.' },
  { id: 93, name: 'Theron F.', rating: 5, product: '36W GaN Fast Charger', date: '25 Oct 2023', review: 'Ordered on a Friday, arrived Saturday. Fast delivery and an even faster charger.' },
  { id: 94, name: 'Apollonia T.', rating: 5, product: 'Wireless Earphones Pro', date: '20 Oct 2023', review: 'These earphones are a revelation at this price. Crystal clear sound and they sit comfortably in my ears for hours.' },
  { id: 95, name: 'Leontine J.', rating: 5, product: 'USB-C Cable 2m Braided', date: '15 Oct 2023', review: 'No complaints at all. Fast charging support, nice build quality. Exactly what I needed.' },
  { id: 96, name: 'Hieronymus C.', rating: 5, product: '120W Car Charger', date: '10 Oct 2023', review: 'The fastest car charger I have used. Phone stays at full battery even during long road trips with maps running.' },
  { id: 97, name: 'Seraphina H.', rating: 5, product: '36W GaN Fast Charger', date: '5 Oct 2023', review: 'This has earned a permanent spot in my bag. Lightweight, powerful and compatible with all my devices.' },
  { id: 98, name: 'Cornelius W.', rating: 5, product: 'Magnetic Wireless Charger', date: '1 Oct 2023', review: 'Set it up in seconds and works flawlessly. The LED indicator is subtle so it does not disturb sleep.' },
  { id: 99, name: 'Rosalind S.', rating: 5, product: 'USB-C to Lightning Cable 1.2m', date: '26 Sep 2023', review: 'Really well built cable. Charges fast and the length is perfect.' },
  { id: 100, name: 'Marcheline R.', rating: 5, product: '65W Dual Port Charger', date: '21 Sep 2023', review: 'This charger is incredible value. Replaced two chargers with one plug and charges faster than either of them did.' },
];

const totalReviews = reviews.length;
const fiveStarCount = reviews.filter(r => r.rating === 5).length;
const fourStarCount = reviews.filter(r => r.rating === 4).length;
const avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1);

function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={size}
          className={i <= rating ? 'fill-cyan-500 text-cyan-500' : 'text-gray-200 fill-gray-200'}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-cyan-50 text-cyan-700 text-sm font-bold px-4 py-2 rounded-full mb-6">
              <BadgeCheck size={16} />
              Verified Customer Reviews
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              What Our Customers Say
            </h1>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Over {totalReviews.toLocaleString()} genuine reviews from verified buyers across the UK.
            </p>
          </div>

          {/* Rating Summary */}
          <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Score */}
            <div className="text-center">
              <div className="text-7xl font-black text-gray-900 leading-none mb-3">{avgRating}</div>
              <Stars rating={5} size={28} />
              <p className="text-gray-500 mt-3 text-sm">{totalReviews} reviews</p>
            </div>

            {/* Breakdown */}
            <div className="space-y-2.5">
              {[
                { stars: 5, count: fiveStarCount },
                { stars: 4, count: fourStarCount },
                { stars: 3, count: 0 },
                { stars: 2, count: 0 },
                { stars: 1, count: 0 },
              ].map(({ stars, count }) => (
                <div key={stars} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-500 w-6">{stars}</span>
                  <Star size={13} className="fill-cyan-500 text-cyan-500 flex-shrink-0" />
                  <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full transition-all"
                      style={{ width: `${(count / totalReviews) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-400 w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Grid */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="columns-1 md:columns-2 lg:columns-3 gap-5 space-y-5">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="break-inside-avoid bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-sm font-black flex-shrink-0">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm">{review.name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <BadgeCheck size={12} className="text-cyan-500" />
                      <span className="text-xs text-cyan-600 font-medium">Verified</span>
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{review.date}</span>
              </div>

              <Stars rating={review.rating} size={14} />

              <p className="mt-3 text-gray-700 text-sm leading-relaxed">{review.review}</p>

              <div className="mt-4 pt-3 border-t border-gray-50">
                <span className="text-xs text-gray-400">Product: </span>
                <span className="text-xs font-medium text-gray-600">{review.product}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
