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
  
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.8]);

  return (
    <div ref={ref} className="relative h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200">
      {/* Subtle gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-tr from-yellow-50/30 via-transparent to-red-50/20" />
      
      <motion.div className="absolute inset-0" style={{ y }}>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-200/40 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-yellow-100/50 rounded-full blur-2xl" />
      </motion.div>
      
      <motion.div className="relative z-10 text-center px-4 max-w-5xl mx-auto" style={{ opacity, scale }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <h1 className="text-7xl md:text-8xl font-bold text-gray-900 mb-6">
            Charge Faster,<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-orange-600 to-red-500">
              Go Further
            </span>
          </h1>
        </motion.div>
        
        <motion.p 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8, delay: 0.2 }} 
          className="text-2xl text-gray-700 mb-12 max-w-3xl mx-auto"
        >
          Premium charging cables and accessories with patented auto power-off technology
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8, delay: 0.4 }} 
          className="flex gap-6 justify-center flex-wrap"
        >
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}
            whileTap={{ scale: 0.95 }}
            className="px-10 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full font-bold text-lg shadow-xl"
          >
            Shop Now
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: "rgba(249, 115, 22, 0.1)" }}
            whileTap={{ scale: 0.95 }}
            className="px-10 py-4 bg-white text-orange-600 rounded-full font-bold text-lg border-2 border-orange-300 transition-colors shadow-lg"
          >
            Learn More
          </motion.button>
        </motion.div>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 1.5 }} 
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
      >
        <motion.div 
          animate={{ y: [0, 10, 0] }} 
          transition={{ duration: 1.5, repeat: Infinity }} 
          className="w-6 h-10 border-2 border-orange-400 rounded-full flex justify-center p-2"
        >
          <motion.div className="w-1 h-3 bg-orange-500 rounded-full" />
        </motion.div>
      </motion.div>
    </div>
  );
}