// Path: /components/ProductCard.tsx

'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  salePrice: number;
  onSale: boolean;
  image: string;
  index: number;
}

export default function ProductCard({ id, title, price, salePrice, onSale, image, index }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7.5deg", "-7.5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7.5deg", "7.5deg"]);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <Link href={`/product/${id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="group relative cursor-pointer"
      >
        <motion.div className="relative overflow-hidden rounded-2xl bg-white shadow-lg" whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
          {onSale && (
            <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} className="absolute top-4 right-4 z-10 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              SALE
            </motion.div>
          )}
          
          <motion.div className="relative aspect-square overflow-hidden bg-gray-50" animate={{ z: isHovered ? 50 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} style={{ transformStyle: "preserve-3d" }}>
            <motion.div animate={{ scale: isHovered ? 1.15 : 1 }} transition={{ duration: 0.4 }}>
              <Image src={image || '/placeholder.jpg'} alt={title} fill className="object-cover" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
            </motion.div>
          </motion.div>
          
          <div className="p-6 bg-white">
            <motion.h3 className="font-semibold text-lg mb-2 line-clamp-2 text-gray-900" animate={{ y: isHovered ? -5 : 0 }}>
              {title}
            </motion.h3>
            
            <motion.div className="flex items-center gap-3" animate={{ y: isHovered ? -5 : 0 }}>
              {onSale ? (
                <>
                  <span className="text-2xl font-bold text-red-500">£{salePrice.toFixed(2)}</span>
                  <span className="text-lg text-gray-400 line-through">£{price.toFixed(2)}</span>
                </>
              ) : (
                <span className="text-2xl font-bold text-gray-900">£{price.toFixed(2)}</span>
              )}
            </motion.div>
            
            <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }} className="mt-4 w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors">
              View Details
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </Link>
  );
}