// Path: components/ShopPage.tsx

'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Search, ShoppingCart, SlidersHorizontal, X, ShoppingBasket, Truck, Shield, DollarSign, Headphones, ChevronDown } from 'lucide-react';

interface ProductVariant {
  id: string;
  price: number;
  sale_price: number;
  on_sale: boolean;
  stock: number;
  images: string[];
}

interface Product {
  id: string;
  title: string;
  categories: string;
  product_url: string;
  visible: boolean;
  created_at: string;
  featured?: boolean;
  variant: ProductVariant;
}

type SortOption = 'newest' | 'price-low' | 'price-high' | 'name';

// Competitor-Matched Gradients
const GRADIENT_BACKGROUNDS = [
  'bg-gradient-to-br from-blue-300 via-blue-400 to-blue-500',           // Light Blue
  'bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800',           // Dark Charcoal
  'bg-gradient-to-br from-amber-200 via-amber-300 to-amber-400',        // Tan/Beige
  'bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500',        // Light Silver
];

const FEATURES = [
  { icon: Truck, title: 'Fast, Free Shipping', description: 'Quick delivery on all orders' },
  { icon: Shield, title: 'Hassle-Free Warranty', description: 'Quality guarantee' },
  { icon: DollarSign, title: '30-Day Money-Back Guarantee', description: 'Risk-free purchase' },
  { icon: Headphones, title: 'Lifetime Customer Support', description: 'Always here to help' },
];

const FAQ_ITEMS = [
  {
    question: 'What is a USB Cable?',
    answer: 'A USB cable is a universal connector used to transfer data and power between devices. It comes in various types including USB-A, USB-C, Lightning, and Micro-USB, each designed for different devices and charging speeds.'
  },
  {
    question: 'What Are the 4 Types of USB Cables?',
    answer: 'The four main types are: USB-A (rectangular, traditional), USB-B (square, printer cables), USB-C (oval, reversible, modern), and Micro-USB (small, older Android phones). Each type serves different purposes and device compatibility.'
  },
  {
    question: 'How to Determine Your USB Cable Type',
    answer: 'Check the connector shape and size. USB-C is oval and reversible, USB-A is rectangular, Lightning has 8 pins (Apple devices), and Micro-USB is small and trapezoid-shaped. Your device\'s charging port will indicate which cable you need.'
  },
  {
    question: 'Do All USB Cables Charge the Same Way?',
    answer: 'No, charging speeds vary based on cable type, wattage support, and device compatibility. USB-C cables with Power Delivery can charge faster (up to 100W+), while older USB-A cables typically max out at 12W. Always use quality cables rated for your device\'s charging requirements.'
  },
  {
    question: 'Choosing the Right USB Cable for Your iPhone',
    answer: 'iPhones use Lightning cables (iPhone 14 and earlier) or USB-C cables (iPhone 15 and newer). For fast charging, use a USB-C to Lightning cable with a 20W+ adapter for older models, or a USB-C to USB-C cable for iPhone 15 series.'
  },
];

export default function ShopPage({ products }: { products: Product[] }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  const [showOnSale, setShowOnSale] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => {
      if (p.categories) {
        p.categories.split(',').forEach(cat => cats.add(cat.trim().replace(/^\//, '')));
      }
    });
    return Array.from(cats).sort();
  }, [products]);

  // Get featured/best sellers
  const bestSellers = useMemo(() => {
    return products.filter(p => p.featured).slice(0, 4);
  }, [products]);

  // Handle carousel scroll
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const handleScroll = () => {
      const scrollLeft = carousel.scrollLeft;
      const cardWidth = carousel.offsetWidth * 0.9;
      const currentIndex = Math.round(scrollLeft / cardWidth);
      setActiveSlide(currentIndex);
    };

    carousel.addEventListener('scroll', handleScroll);
    return () => carousel.removeEventListener('scroll', handleScroll);
  }, []);

  // Filter and sort
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || 
                              p.categories.toLowerCase().includes(selectedCategory.toLowerCase());
      
      const price = p.variant?.on_sale ? Number(p.variant.sale_price) : Number(p.variant?.price || 0);
      const matchesPrice = price >= priceRange[0] && price <= priceRange[1];
      
      const matchesSale = !showOnSale || p.variant?.on_sale;
      
      return matchesSearch && matchesCategory && matchesPrice && matchesSale;
    });

    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => {
          const priceA = a.variant?.on_sale ? a.variant.sale_price : a.variant?.price || 0;
          const priceB = b.variant?.on_sale ? b.variant.sale_price : b.variant?.price || 0;
          return Number(priceA) - Number(priceB);
        });
        break;
      case 'price-high':
        filtered.sort((a, b) => {
          const priceA = a.variant?.on_sale ? a.variant.sale_price : a.variant?.price || 0;
          const priceB = b.variant?.on_sale ? b.variant.sale_price : b.variant?.price || 0;
          return Number(priceB) - Number(priceA);
        });
        break;
      case 'name':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return filtered;
  }, [products, search, selectedCategory, sortBy, priceRange, showOnSale]);

  const FilterSidebar = () => (
    <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">Filters</h3>
        <button 
          onClick={() => {
            setSelectedCategory('all');
            setPriceRange([0, 100]);
            setShowOnSale(false);
          }}
          className="text-sm text-orange-600 hover:text-orange-700 font-medium"
        >
          Clear
        </button>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 mb-3">Categories</h4>
        <div className="space-y-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
              selectedCategory === 'all' 
                ? 'bg-orange-50 text-orange-600 font-medium' 
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            All Products
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                selectedCategory === cat 
                  ? 'bg-orange-50 text-orange-600 font-medium' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {cat.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 mb-3">Price Range</h4>
        <div className="space-y-2">
          {[
            [0, 15, '£0 - £15'],
            [15, 25, '£15 - £25'],
            [25, 50, '£25 - £50'],
            [50, 100, '£50+']
          ].map(([min, max, label]) => (
            <button
              key={label}
              onClick={() => setPriceRange([min as number, max as number])}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                priceRange[0] === min && priceRange[1] === max 
                  ? 'bg-orange-50 text-orange-600 font-medium' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Offers */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Offers</h4>
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={showOnSale}
            onChange={(e) => setShowOnSale(e.target.checked)}
            className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500 border-gray-300"
          />
          <span className="text-sm text-gray-700 group-hover:text-gray-900">On Sale</span>
        </label>
      </div>
    </div>
  );

  const BestSellerCard = ({ product, index }: { product: Product; index: number }) => {
    const price = Number(product.variant?.price || 0);
    const salePrice = Number(product.variant?.sale_price || 0);
    const onSale = product.variant?.on_sale || false;
    const gradientClass = GRADIENT_BACKGROUNDS[index % GRADIENT_BACKGROUNDS.length];

    return (
      <Link href={`/shop/p/${product.product_url}`}>
        <div className={`group ${gradientClass} rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-visible relative pb-6 pt-12 h-full`}>
          {/* Hot Badge */}
          {onSale && (
            <div className="absolute top-4 left-4 bg-white text-orange-600 px-3 py-1 rounded text-xs font-bold z-10 shadow-md">
              Hot
            </div>
          )}

          {/* Protruding Product Image */}
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-32 h-32">
            <div className="relative w-full h-full">
              {product.variant?.images?.[0] ? (
                <Image
                  src={product.variant.images[0]}
                  alt={product.title}
                  fill
                  className="object-contain drop-shadow-2xl transform group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/50">
                  No Image
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="px-5 mt-8">
            <h3 className="font-semibold text-white mb-8 line-clamp-2 min-h-[3rem] text-sm">
              {product.title}
            </h3>
            
            <div className="flex items-end justify-between">
              <div className="flex items-baseline gap-2">
                {onSale ? (
                  <>
                    <span className="text-xl font-bold text-white">
                      £{salePrice.toFixed(2)}
                    </span>
                    <span className="text-sm text-white/70 line-through">
                      £{price.toFixed(2)}
                    </span>
                  </>
                ) : (
                  <span className="text-xl font-bold text-white">
                    £{price.toFixed(2)}
                  </span>
                )}
              </div>

              <button className="bg-cyan-400 hover:bg-cyan-500 text-gray-900 px-4 py-2 rounded-lg font-semibold text-sm transition-all shadow-md">
                Shop Now
              </button>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Hero */}
      <div className="bg-gradient-to-br from-orange-100 via-orange-200 to-orange-300 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Premium Charging Accessories
            </h1>
            <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
              High-quality cables, chargers, and accessories for all your devices
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search for cables, chargers, accessories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400 shadow-lg"
              />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Best Sellers */}
        {bestSellers.length > 0 && (
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Best Sellers</h2>
            
            {/* Desktop Grid */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {bestSellers.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative pt-16"
                >
                  <BestSellerCard product={product} index={index} />
                </motion.div>
              ))}
            </div>

            {/* Mobile Carousel */}
            <div className="md:hidden">
              <div 
                ref={carouselRef}
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 pl-4"
                style={{ scrollBehavior: 'smooth' }}
              >
                {bestSellers.map((product, index) => (
                  <div
                    key={product.id}
                    className="flex-shrink-0 snap-start pt-16"
                    style={{ width: 'calc(90vw - 2rem)' }}
                  >
                    <BestSellerCard product={product} index={index} />
                  </div>
                ))}
              </div>

              {/* Dot Indicators */}
              <div className="flex justify-center gap-2 mt-6">
                {bestSellers.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      const carousel = carouselRef.current;
                      if (carousel) {
                        const cardWidth = carousel.offsetWidth * 0.9;
                        carousel.scrollTo({
                          left: cardWidth * index,
                          behavior: 'smooth'
                        });
                      }
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      activeSlide === index 
                        ? 'bg-gray-800 w-8' 
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Main Content with Sidebar */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar - Desktop */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <FilterSidebar />
          </div>

          {/* Mobile Filter Button */}
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden flex items-center gap-2 bg-white px-4 py-3 rounded-lg shadow-sm mb-4 text-gray-900 font-medium"
          >
            <SlidersHorizontal size={20} />
            Filters
          </button>

          {/* Mobile Filters Modal */}
          {mobileFiltersOpen && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileFiltersOpen(false)}>
              <div className="absolute right-0 top-0 bottom-0 w-80 bg-white p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Filters</h3>
                  <button onClick={() => setMobileFiltersOpen(false)}>
                    <X size={24} className="text-gray-600" />
                  </button>
                </div>
                <FilterSidebar />
              </div>
            </div>
          )}

          {/* Products Area */}
          <div className="flex-1">
            {/* Sort and Count */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-700 font-medium">{filteredProducts.length} products</p>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900 font-medium"
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name: A-Z</option>
              </select>
            </div>

            {/* Products Grid - 2 columns on mobile */}
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
              {filteredProducts.map((product, index) => {
                const price = Number(product.variant?.price || 0);
                const salePrice = Number(product.variant?.sale_price || 0);
                const onSale = product.variant?.on_sale || false;
                
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group relative">
                      <Link href={`/shop/p/${product.product_url}`}>
                        <div className="relative aspect-square bg-gray-50">
                          {product.variant?.images?.[0] ? (
                            <Image
                              src={product.variant.images[0]}
                              alt={product.title}
                              fill
                              className="object-contain p-4 sm:p-6 group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              No Image
                            </div>
                          )}
                          {onSale && (
                            <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                              SALE
                            </div>
                          )}
                        </div>

                        <div className="p-3 sm:p-4">
                          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem] text-sm">
                            {product.title}
                          </h3>
                          
                          <div className="flex items-baseline gap-2 mb-3">
                            {onSale ? (
                              <>
                                <span className="text-base sm:text-lg font-bold text-orange-600">
                                  £{salePrice.toFixed(2)}
                                </span>
                                <span className="text-xs sm:text-sm text-gray-400 line-through">
                                  £{price.toFixed(2)}
                                </span>
                              </>
                            ) : (
                              <span className="text-base sm:text-lg font-bold text-gray-900">
                                £{price.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>

                      {/* Add to Basket Button */}
                      <div className="px-3 sm:px-4 pb-3 sm:pb-4 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            console.log('Add to cart:', product.id);
                          }}
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2"
                        >
                          <ShoppingBasket size={14} />
                          <span className="hidden sm:inline">Add to Basket</span>
                          <span className="sm:hidden">Add</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-16">
                <p className="text-gray-500 text-lg mb-4">No products found</p>
                <button
                  onClick={() => {
                    setSearch('');
                    setSelectedCategory('all');
                    setPriceRange([0, 100]);
                    setShowOnSale(false);
                  }}
                  className="text-orange-600 hover:text-orange-700 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Features Section */}
        <section className="my-16 py-12 bg-white rounded-2xl shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-8">
            {FEATURES.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center text-center"
              >
                <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <feature.icon className="w-7 h-7 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Content Section */}
        <section className="my-16 bg-white rounded-2xl shadow-sm p-8 sm:p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Find the USB Cables You Need at Mcdodo
          </h2>
          <p className="text-gray-700 leading-relaxed">
            USB cables have become an essential part of our daily lives, and they come in a range of types and versions. By considering the factors mentioned above, you can make an informed decision and ensure that you get the best USB cable for your needs. Invest in a high-quality USB cable today and enjoy seamless data transfer and charging!
          </p>
        </section>

        {/* FAQ Section */}
        <section className="my-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">FAQ About Power Strips</h2>
          <div className="space-y-4">
            {FAQ_ITEMS.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition"
                >
                  <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`flex-shrink-0 w-5 h-5 text-gray-600 transition-transform ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 text-gray-700 leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}