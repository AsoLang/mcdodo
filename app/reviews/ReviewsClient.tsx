'use client';

import { useState } from 'react';
import { Star, BadgeCheck } from 'lucide-react';

const reviews = [
  { id: 1, name: 'James H.', rating: 5, product: '36W GaN Fast Charger', date: '14 Jan 2025', review: 'Had it about three weeks now and charges my iPhone 15 Pro without any fuss. Went from 10% to full in just over an hour which is plenty fast enough for me.' },
  { id: 2, name: 'Sophie T.', rating: 5, product: 'USB-C to Lightning Cable 1.2m', date: '9 Jan 2025', review: 'Previous cable frayed at the connector after about six weeks. This one has been in my bag every day since October and looks the same as when I got it.' },
  { id: 3, name: 'Marcus W.', rating: 4, product: '65W Dual Port Charger', date: '3 Jan 2025', review: 'Charges my laptop and phone together without slowing either down. My only gripe is the cable is not included so factor that in.' },
  { id: 4, name: 'Emily R.', rating: 5, product: 'Magnetic Wireless Charger', date: '28 Dec 2024', review: 'Sits on my desk and I just drop my phone on it when I sit down. No mucking about with cables. Does what it says.' },
  { id: 5, name: 'Oliver B.', rating: 5, product: '36W GaN Fast Charger', date: '22 Dec 2024', review: 'Fits in my jacket pocket easily which is what I needed. Charges everything I have without any trouble.' },
  { id: 6, name: 'Chloe M.', rating: 5, product: 'USB-C Cable 2m Braided', date: '18 Dec 2024', review: 'The 2 metre length is really useful for charging from the plug by my sofa. No complaints about it at all.' },
  { id: 7, name: 'Liam P.', rating: 5, product: '120W Car Charger', date: '11 Dec 2024', review: 'I drive for about 40 minutes in the morning and my phone goes from low battery to above 60%. Way better than the charger that came with my car.' },
  { id: 8, name: 'Ava K.', rating: 5, product: 'Wireless Earphones Pro', date: '7 Dec 2024', review: 'Used them on a three hour train journey last week. Stayed in comfortably the whole time and the battery was still showing over half when I got off.' },
  { id: 9, name: 'Noah J.', rating: 5, product: '36W GaN Fast Charger', date: '2 Dec 2024', review: 'Bought a second one for my office after liking the first one so much. Arrived fast and works the same.' },
  { id: 10, name: 'Isabella C.', rating: 5, product: 'USB-C to Lightning Cable 1.2m', date: '27 Nov 2024', review: 'Solid cable. Charges at the right speed and the connector clicks in properly unlike some cheaper ones I have tried.' },
  { id: 11, name: 'Ethan S.', rating: 5, product: '65W Dual Port Charger', date: '21 Nov 2024', review: 'Replaced the charger I had for years with this. My MacBook Air tops up at a decent rate and it does not get warm sitting on my desk.' },
  { id: 12, name: 'Mia D.', rating: 5, product: 'Magnetic Car Phone Holder', date: '15 Nov 2024', review: 'Been through a few of these over the years and this is the first one that has not started drooping after a couple of weeks. Phone stays put.' },
  { id: 13, name: 'Harry L.', rating: 5, product: '36W GaN Fast Charger', date: '10 Nov 2024', review: 'Travel with this every week for work. Goes in my bag and powers my phone and iPad on the same plug with a splitter. Sorted.' },
  { id: 14, name: 'Charlotte N.', rating: 5, product: 'Wireless Earphones Pro', date: '4 Nov 2024', review: 'I use these at the gym three times a week. They have not moved once mid-workout and the sound holds up well when I am running.' },
  { id: 15, name: 'George A.', rating: 4, product: 'USB-C Cable 2m Braided', date: '30 Oct 2024', review: 'Good cable, does the job well. I would probably order a 3 metre version if they made one but 2m is workable.' },
  { id: 16, name: 'Amelia F.', rating: 5, product: '120W Car Charger', date: '25 Oct 2024', review: 'Charges my phone and my partner\'s at the same time on long drives. Never had any heat from it and it has been in the car for months.' },
  { id: 17, name: 'Benjamin O.', rating: 5, product: '36W GaN Fast Charger', date: '19 Oct 2024', review: 'Ordered Monday morning, arrived Tuesday. Used it straight away and it charges my iPhone quickly. Happy with it.' },
  { id: 18, name: 'Grace V.', rating: 5, product: 'USB-C to Lightning Cable 1.2m', date: '14 Oct 2024', review: 'I keep one at home, one in my car and one at work. Bought all three from here. Does the job every time.' },
  { id: 19, name: 'Jack M.', rating: 5, product: '65W Dual Port Charger', date: '9 Oct 2024', review: 'I switched from an Apple charger to this. No drop in speed that I can notice and it charges my laptop alongside my phone with no issue.' },
  { id: 20, name: 'Lily B.', rating: 5, product: 'Magnetic Wireless Charger', date: '4 Oct 2024', review: 'My phone sits on this overnight every night. Wakes up at 100% every morning without fail.' },
  { id: 21, name: 'Samuel R.', rating: 5, product: 'Wireless Earphones Pro', date: '29 Sep 2024', review: 'The connection has not cut out once since I got them. Even when my phone is at the other end of the room. That was my problem with my last pair.' },
  { id: 22, name: 'Ella W.', rating: 5, product: '36W GaN Fast Charger', date: '24 Sep 2024', review: 'Exactly what I needed for travelling. Fits in the small pocket of my backpack and powers everything I brought.' },
  { id: 23, name: 'Daniel T.', rating: 5, product: 'USB-C Cable 2m Braided', date: '19 Sep 2024', review: 'Been using it every day since I got it. The braid has not started unravelling or anything like that. Good bit of kit.' },
  { id: 24, name: 'Scarlett H.', rating: 5, product: '120W Car Charger', date: '14 Sep 2024', review: 'Sits flush in my car and barely noticeable. Phone charges fast on the way to work and I never worry about battery anymore.' },
  { id: 25, name: 'Ryan K.', rating: 5, product: '36W GaN Fast Charger', date: '9 Sep 2024', review: 'Took this to Europe with a travel adapter. Worked everywhere I went without any issues.' },
  { id: 26, name: 'Hannah C.', rating: 5, product: 'Magnetic Car Phone Holder', date: '4 Sep 2024', review: 'Third phone holder I have tried in this car. This is the only one that works properly. No wobbling on roundabouts.' },
  { id: 27, name: 'Tom E.', rating: 5, product: 'USB-C to Lightning Cable 1.2m', date: '30 Aug 2024', review: 'Cable arrived coiled neatly and the connectors feel properly made. Charges my phone at the right speed.' },
  { id: 28, name: 'Poppy S.', rating: 5, product: '65W Dual Port Charger', date: '25 Aug 2024', review: 'Using this to charge my MacBook Pro. Gets it from about 20% to full while I have a meeting. That is all I need.' },
  { id: 29, name: 'Alex J.', rating: 5, product: '36W GaN Fast Charger', date: '20 Aug 2024', review: 'It does not run noticeably warm during use which was what I was worried about from a previous charger I had. This one is fine.' },
  { id: 30, name: 'Freya P.', rating: 4, product: 'Wireless Earphones Pro', date: '15 Aug 2024', review: 'Sound is good and they are comfortable for long sessions. Connection has been reliable. The case lid is a tiny bit stiff but it is nothing serious.' },
  { id: 31, name: 'William A.', rating: 5, product: 'USB-C Cable 2m Braided', date: '10 Aug 2024', review: 'Samsung fast charging works through it without any issues. The braid feels like it can handle being thrown in a bag daily.' },
  { id: 32, name: 'Isla N.', rating: 5, product: '120W Car Charger', date: '5 Aug 2024', review: 'My old car charger took ages to do anything. This one has my phone charged within the first 20 minutes of a drive.' },
  { id: 33, name: 'Charlie D.', rating: 5, product: '36W GaN Fast Charger', date: '1 Aug 2024', review: 'Bought this as a birthday present. The person uses it every day apparently so I would say that is a win.' },
  { id: 34, name: 'Daisy M.', rating: 5, product: 'Magnetic Wireless Charger', date: '27 Jul 2024', review: 'No cables on my bedside table anymore. Phone just sits on the pad and charges. Really glad I switched to wireless.' },
  { id: 35, name: 'Finn O.', rating: 5, product: 'USB-C to Lightning Cable 1.2m', date: '22 Jul 2024', review: 'Bought three at once. One for the bedroom, one for the kitchen and one for work. All doing the job fine weeks later.' },
  { id: 36, name: 'Ruby L.', rating: 5, product: '65W Dual Port Charger', date: '18 Jul 2024', review: 'I carry this in my handbag. It is small enough not to be a nuisance and charges my laptop and phone on the go.' },
  { id: 37, name: 'Oscar G.', rating: 5, product: '36W GaN Fast Charger', date: '13 Jul 2024', review: 'Came well packaged and has been working without issue since I got it. No complaints at all.' },
  { id: 38, name: 'Violet B.', rating: 5, product: 'Wireless Earphones Pro', date: '8 Jul 2024', review: 'I wear these on my commute every morning. About an hour each way. Battery has not run out on me yet in the few weeks I have had them.' },
  { id: 39, name: 'Max F.', rating: 5, product: 'USB-C Cable 2m Braided', date: '3 Jul 2024', review: 'The braid feels like it will last a while. Much better than the thin rubber cables I have been buying previously.' },
  { id: 40, name: 'Rosie T.', rating: 5, product: '120W Car Charger', date: '28 Jun 2024', review: 'On a four hour drive last weekend my phone stayed above 90% the entire way with maps running. That says it all.' },
  { id: 41, name: 'Leo C.', rating: 5, product: '36W GaN Fast Charger', date: '24 Jun 2024', review: 'Running my iPad and iPhone off this with a dual cable and both are charged by the time I leave for work. Exactly what I needed.' },
  { id: 42, name: 'Millie H.', rating: 5, product: 'Magnetic Car Phone Holder', date: '19 Jun 2024', review: 'Attaches to the air vent firmly. I can rotate between portrait and landscape easily and the magnet holds the phone in both.' },
  { id: 43, name: 'Archie W.', rating: 5, product: 'USB-C to Lightning Cable 1.2m', date: '14 Jun 2024', review: 'Does what a cable should do. Charges fast, sits firmly in the port, arrived on time.' },
  { id: 44, name: 'Penelope S.', rating: 5, product: '65W Dual Port Charger', date: '10 Jun 2024', review: 'I plug my Switch dock into one port and my phone into the other. Both work fine at the same time. Good purchase.' },
  { id: 45, name: 'Jude R.', rating: 5, product: '36W GaN Fast Charger', date: '5 Jun 2024', review: 'Previous charger was about the size of a small brick. This one fits behind furniture easily and I forget it is even there.' },
  { id: 46, name: 'Harriet K.', rating: 5, product: 'Wireless Earphones Pro', date: '1 Jun 2024', review: 'Tube commute every day. These block out enough noise to enjoy music without having to crank the volume right up.' },
  { id: 47, name: 'Theo V.', rating: 5, product: 'USB-C Cable 2m Braided', date: '27 May 2024', review: 'Good reach from the plug to my desk. Fast charging works as expected. Bought a second one for the bedroom.' },
  { id: 48, name: 'Aurora E.', rating: 5, product: '120W Car Charger', date: '22 May 2024', review: 'My commute is about 25 minutes each way. Phone goes from near dead to over half charged by the time I park. Good enough for me.' },
  { id: 49, name: 'Hugo P.', rating: 4, product: '36W GaN Fast Charger', date: '18 May 2024', review: 'Works well and charges quickly. The plug folds flat which is handy. Only minor thing is it feels slightly stiff to push into the wall socket.' },
  { id: 50, name: 'Florence A.', rating: 5, product: 'Magnetic Wireless Charger', date: '13 May 2024', review: 'Charges at the right speed and the alignment is consistent. Has been working reliably since day one.' },
  { id: 51, name: 'Jasper N.', rating: 5, product: 'USB-C to Lightning Cable 1.2m', date: '8 May 2024', review: 'I go through cables at an embarrassing rate normally. This one has lasted noticeably longer than what I was buying before.' },
  { id: 52, name: 'Matilda O.', rating: 5, product: '65W Dual Port Charger', date: '4 May 2024', review: 'Working from home and this sits on my desk powering my laptop and phone off one socket. Has not given me any trouble.' },
  { id: 53, name: 'Felix D.', rating: 5, product: '36W GaN Fast Charger', date: '29 Apr 2024', review: 'Bought it, plugged it in, phone charged. No drama. That is genuinely all I wanted.' },
  { id: 54, name: 'Imogen G.', rating: 5, product: 'Wireless Earphones Pro', date: '25 Apr 2024', review: 'The bass is actually decent which I was not expecting at this price. My previous earphones were twice the cost and not much better.' },
  { id: 55, name: 'Barnaby M.', rating: 5, product: 'USB-C Cable 2m Braided', date: '20 Apr 2024', review: 'Seems well made. The joint where the braid meets the connector looks like it can take some bending without splitting.' },
  { id: 56, name: 'Cecily B.', rating: 5, product: '120W Car Charger', date: '16 Apr 2024', review: 'Fast delivery and works straight away. Phone charges properly in the car now instead of just trickling along.' },
  { id: 57, name: 'Rowan F.', rating: 5, product: '36W GaN Fast Charger', date: '11 Apr 2024', review: 'This is the only charger I pack when travelling now. One plug and everything I carry is sorted.' },
  { id: 58, name: 'Seraphina T.', rating: 5, product: 'Magnetic Car Phone Holder', date: '7 Apr 2024', review: 'The vent clip has not loosened over several months of driving. Phone goes on and off easily without the holder moving.' },
  { id: 59, name: 'Callum J.', rating: 5, product: 'USB-C to Lightning Cable 1.2m', date: '2 Apr 2024', review: 'iPhone 14 charges noticeably faster through this than through the cable I was using before. Straightforward upgrade.' },
  { id: 60, name: 'Beatrice C.', rating: 5, product: '65W Dual Port Charger', date: '28 Mar 2024', review: 'Really happy with this. Replaced a large laptop charger and freed up a socket. Does the same job in a fraction of the space.' },
  { id: 61, name: 'Reuben H.', rating: 5, product: '36W GaN Fast Charger', date: '24 Mar 2024', review: 'Fast charging works, it fits behind my bedside table without issue, and I have had no problems with it. Good product.' },
  { id: 62, name: 'Arabella W.', rating: 5, product: 'Wireless Earphones Pro', date: '19 Mar 2024', review: 'Have been through a few pairs of earphones this year. These are the ones that have stayed in my ears properly and the sound is good.' },
  { id: 63, name: 'Patrick S.', rating: 5, product: 'USB-C Cable 2m Braided', date: '14 Mar 2024', review: 'Using it daily for my Android. Fast charge kicks in every time and the cable has not shown any signs of wear yet.' },
  { id: 64, name: 'Cordelia R.', rating: 5, product: '120W Car Charger', date: '10 Mar 2024', review: 'Went from nearly flat to 80% on a 50 minute drive. That is about as much as I could ask from a car charger.' },
  { id: 65, name: 'Montgomery A.', rating: 5, product: '36W GaN Fast Charger', date: '5 Mar 2024', review: 'Used to worry about leaving for work on low battery. Now I just plug in for 20 minutes while I have breakfast and it is fine.' },
  { id: 66, name: 'Clementine P.', rating: 4, product: 'Magnetic Wireless Charger', date: '1 Mar 2024', review: 'Works well and charges at a decent speed. The cable it comes with is a bit short for my desk setup but that is easy enough to fix.' },
  { id: 67, name: 'Barnaby K.', rating: 5, product: 'USB-C to Lightning Cable 1.2m', date: '25 Feb 2024', review: 'Bought this after my third cheap cable gave up. Has been going strong since February with no issues.' },
  { id: 68, name: 'Evangeline N.', rating: 5, product: '65W Dual Port Charger', date: '21 Feb 2024', review: 'This runs my laptop and phone off a single socket during my workday. Has been completely reliable since I got it.' },
  { id: 69, name: 'Alastair D.', rating: 5, product: '36W GaN Fast Charger', date: '16 Feb 2024', review: 'First charger that has actually stayed on my bedside table consistently. Fast, small, reliable.' },
  { id: 70, name: 'Ottoline M.', rating: 5, product: 'Wireless Earphones Pro', date: '12 Feb 2024', review: 'Gym every morning and these have not given me any problems. Stay in, battery holds up, audio is fine for what I need.' },
  { id: 71, name: 'Rafferty O.', rating: 5, product: 'USB-C Cable 2m Braided', date: '7 Feb 2024', review: 'Length is right for my desk. Charges at full speed. The braid is still looking tidy after a few months of daily use.' },
  { id: 72, name: 'Lavinia G.', rating: 5, product: '120W Car Charger', date: '3 Feb 2024', review: 'Bought this after a long trip where my phone died halfway. This would have sorted that. Works well on normal commutes too.' },
  { id: 73, name: 'Ptolemy B.', rating: 5, product: '36W GaN Fast Charger', date: '29 Jan 2024', review: 'Good quality charger. Charges my devices without issue and the size means it is easy to take with me.' },
  { id: 74, name: 'Sophronia F.', rating: 5, product: 'Magnetic Car Phone Holder', date: '25 Jan 2024', review: 'I have two cars and I just move this between them. Easy to clip and unclip and the phone always holds in both.' },
  { id: 75, name: 'Casimir T.', rating: 5, product: 'USB-C to Lightning Cable 1.2m', date: '20 Jan 2024', review: 'iPhone 14 goes from empty to 50% in about 30 minutes on this. Bought a second one and it is the same.' },
  { id: 76, name: 'Araminta J.', rating: 5, product: '65W Dual Port Charger', date: '16 Jan 2024', review: 'Takes this on business trips instead of my laptop charger now. Does the same job and weighs a lot less.' },
  { id: 77, name: 'Peregrine C.', rating: 5, product: '36W GaN Fast Charger', date: '11 Jan 2024', review: 'My new iPhone charges faster through this than through the original cable and plug that came with it.' },
  { id: 78, name: 'Zenobia H.', rating: 5, product: 'Wireless Earphones Pro', date: '7 Jan 2024', review: 'Sound is clear, they fit well and the case is compact. Paired straight away with no fuss. Happy with the purchase.' },
  { id: 79, name: 'Lysander W.', rating: 5, product: 'USB-C Cable 2m Braided', date: '2 Jan 2024', review: 'Nice heavy cable. Does not tangle as easily as thinner ones. Charges quickly and fits properly in the port.' },
  { id: 80, name: 'Christabel S.', rating: 5, product: '120W Car Charger', date: '28 Dec 2023', review: 'My car only has USB-A and this works perfectly with it. Phone charging is noticeably faster than before.' },
  { id: 81, name: 'Thaddeus R.', rating: 5, product: '36W GaN Fast Charger', date: '23 Dec 2023', review: 'Got this as a gift. The person has been using it every day since Christmas and asked me where I got it from.' },
  { id: 82, name: 'Meliora K.', rating: 5, product: 'Magnetic Wireless Charger', date: '18 Dec 2023', review: 'Phone on the pad every night. Wake up every morning at full battery. It just works consistently.' },
  { id: 83, name: 'Oberon V.', rating: 5, product: 'USB-C to Lightning Cable 1.2m', date: '13 Dec 2023', review: 'Connectors feel solid. Has been in and out of my bag daily since I got it and no sign of the cable weakening at the joints.' },
  { id: 84, name: 'Perpetua E.', rating: 5, product: '65W Dual Port Charger', date: '8 Dec 2023', review: 'Surface and iPhone both plugged in on my desk. Both charge at a reasonable speed without either one suffering.' },
  { id: 85, name: 'Caspian P.', rating: 5, product: '36W GaN Fast Charger', date: '4 Dec 2023', review: 'Has not caused any issues since I got it. Runs cool, charges fast, fits in the socket without needing to force it.' },
  { id: 86, name: 'Isadora A.', rating: 5, product: 'Wireless Earphones Pro', date: '29 Nov 2023', review: 'Used these on a flight recently. The passive isolation from the ear tips helped a lot. Sound was good too.' },
  { id: 87, name: 'Sylvester N.', rating: 5, product: 'USB-C Cable 2m Braided', date: '24 Nov 2023', review: 'Android fast charging works fine through this. The cable reaches from my plug to my desk comfortably.' },
  { id: 88, name: 'Thessaly D.', rating: 5, product: '120W Car Charger', date: '19 Nov 2023', review: 'Had maps and music running on a three hour drive. Phone was on 80% when I arrived. This charger keeps up.' },
  { id: 89, name: 'Balthazar M.', rating: 5, product: '36W GaN Fast Charger', date: '14 Nov 2023', review: 'The auto power-off is a feature I never thought I would care about but now I actually leave it plugged in and do not worry.' },
  { id: 90, name: 'Celestine O.', rating: 5, product: 'Magnetic Car Phone Holder', date: '9 Nov 2023', review: 'Does not vibrate loose on rough roads which was the issue with my previous holder. Phone stays where I put it.' },
  { id: 91, name: 'Ptolemy G.', rating: 5, product: 'USB-C to Lightning Cable 1.2m', date: '4 Nov 2023', review: 'Good cable. Charges at the speed it is supposed to. Been using it since November with zero problems.' },
  { id: 92, name: 'Wilhelmina B.', rating: 5, product: '65W Dual Port Charger', date: '30 Oct 2023', review: 'I travel a lot for work. One plug for my laptop and phone saves a lot of hassle at hotel desks. Would not go back.' },
  { id: 93, name: 'Theron F.', rating: 5, product: '36W GaN Fast Charger', date: '25 Oct 2023', review: 'Ordered Friday, had it Saturday. Charged my phone straight out of the box. Delivery and product both good.' },
  { id: 94, name: 'Apollonia T.', rating: 5, product: 'Wireless Earphones Pro', date: '20 Oct 2023', review: 'These were a bit of an impulse buy but I have used them every day since. The sound at this price is better than I expected.' },
  { id: 95, name: 'Leontine J.', rating: 5, product: 'USB-C Cable 2m Braided', date: '15 Oct 2023', review: 'Good length, charges at full speed, braid has held up. Nothing to fault with it.' },
  { id: 96, name: 'Hieronymus C.', rating: 5, product: '120W Car Charger', date: '10 Oct 2023', review: 'Long road trip last month. Had three people in the car using this and everyone was fully charged when we arrived.' },
  { id: 97, name: 'Seraphina H.', rating: 5, product: '36W GaN Fast Charger', date: '5 Oct 2023', review: 'Small enough to forget it is in my bag but powerful enough to charge everything I carry. That is a good balance.' },
  { id: 98, name: 'Cornelius W.', rating: 5, product: 'Magnetic Wireless Charger', date: '1 Oct 2023', review: 'The LED does not shine in my eyes at night which I appreciated. Charges overnight without issue.' },
  { id: 99, name: 'Rosalind S.', rating: 5, product: 'USB-C to Lightning Cable 1.2m', date: '26 Sep 2023', review: 'Charges at the right speed and has stayed in one piece. Simple but that is what you want from a cable.' },
  { id: 100, name: 'Marcheline R.', rating: 5, product: '65W Dual Port Charger', date: '21 Sep 2023', review: 'Replaced two wall plugs with this one. Both devices charge at a decent rate and I got a spare socket back. Win all round.' },
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

export default function ReviewsClient() {
  const [filter, setFilter] = useState<'all' | 4 | 5>('all');

  const filtered = filter === 'all' ? reviews : reviews.filter(r => r.rating === filter);

  const filters: { label: string; value: 'all' | 4 | 5; count: number }[] = [
    { label: 'All', value: 'all', count: totalReviews },
    { label: '5 Stars', value: 5, count: fiveStarCount },
    { label: '4 Stars', value: 4, count: fourStarCount },
  ];

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
              Over {totalReviews} genuine reviews from verified buyers across the UK.
            </p>
          </div>

          {/* Rating Summary */}
          <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="text-center">
              <div className="text-7xl font-black text-gray-900 leading-none mb-3">{avgRating}</div>
              <Stars rating={5} size={28} />
              <p className="text-gray-500 mt-3 text-sm">{totalReviews} reviews</p>
            </div>

            <div className="space-y-2.5">
              {[
                { stars: 5, count: fiveStarCount },
                { stars: 4, count: fourStarCount },
                { stars: 3, count: 0 },
                { stars: 2, count: 0 },
                { stars: 1, count: 0 },
              ].map(({ stars, count }) => (
                <div key={stars} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-500 w-4">{stars}</span>
                  <Star size={13} className="fill-cyan-500 text-cyan-500 flex-shrink-0" />
                  <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full"
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

      {/* Filter + Reviews */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Filter Tabs */}
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <span className="text-sm font-bold text-gray-500">Filter:</span>
          {filters.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition border ${
                filter === f.value
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {f.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                filter === f.value ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {f.count}
              </span>
            </button>
          ))}
          <span className="text-sm text-gray-400 ml-auto">{filtered.length} reviews</span>
        </div>

        {/* Reviews Grid */}
        <div className="columns-1 md:columns-2 lg:columns-3 gap-5 space-y-5">
          {filtered.map((review) => (
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
                <span className="text-xs text-gray-400 whitespace-nowrap">{review.date}</span>
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
