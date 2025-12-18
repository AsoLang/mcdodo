// Path: /components/Hero.tsx

'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export default function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div ref={ref} className="relative h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200 pt-20">
      {/* Simplified gradient overlays for better performance */}
      <div className="absolute inset-0 bg-gradient-to-tr from-yellow-50/30 via-transparent to-red-50/20" />
      
      <motion.div className="absolute inset-0" style={{ y }}>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-200/40 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-200/30 rounded-full blur-3xl" />
      </motion.div>
      
      <motion.div 
        className="relative z-10 text-center px-4 max-w-5xl mx-auto w-full"
        style={{ opacity }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight">
            Charge Faster,<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-orange-600 to-red-500">
              Go Further
            </span>
          </h1>
        </motion.div>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6, delay: 0.15 }} 
          className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-700 mb-8 md:mb-12 max-w-3xl mx-auto px-4"
        >
          Premium charging cables and accessories with patented auto power-off technology
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6, delay: 0.3 }} 
          className="flex gap-4 md:gap-6 justify-center flex-wrap px-4"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="px-8 md:px-10 py-3 md:py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full font-bold text-base md:text-lg shadow-xl"
          >
            Shop Now
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="px-8 md:px-10 py-3 md:py-4 bg-white text-orange-600 rounded-full font-bold text-base md:text-lg border-2 border-orange-300 shadow-lg"
          >
            Learn More
          </motion.button>
        </motion.div>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 1 }} 
        className="absolute bottom-10 left-1/2 -translate-x-1/2 hidden md:block"
      >
        <motion.div 
          animate={{ y: [0, 10, 0] }} 
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} 
          className="w-6 h-10 border-2 border-orange-400 rounded-full flex justify-center p-2"
        >
          <motion.div className="w-1 h-3 bg-orange-500 rounded-full" />
        </motion.div>
      </motion.div>
    </div>
  );
}