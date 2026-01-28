// Path: components/ProductDetail.tsx

'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Minus, Plus, Star, ChevronDown, ChevronUp, X, ChevronLeft, ChevronRight, Truck, ShieldCheck, Headphones, CreditCard, Package, Tag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import ApplePayButton from '@/components/ApplePayButton';

// ... rest of interfaces stay the same ...
interface ProductVariant {
  id: string;
  sku: string;
  option_value_1: string;
  color?: string | null;
  size?: string | null;
  price: number | string;
  sale_price: number | string;
  on_sale: boolean;
  stock: number | string;
  images: string[];
}

interface Accordion {
  id: string;
  title: string;
  content: string;
}

interface RelatedProduct {
  id: string;
  title: string;
  product_url: string;
  price: number;
  sale_price: number;
  on_sale: boolean;
  image: string;
  review_count: number;
  review_rating: number | string;
}

interface Product {
  id: string;
  title: string;
  description: string;
  categories: string;
  product_url: string;
  variants: ProductVariant[];
  accordions?: Accordion[];
  gallery_images?: string[];
  product_images?: string[];
  review_count?: number;
  review_rating?: number | string;
  related_products?: RelatedProduct[];
}

export default function ProductDetail({ product }: { product: Product }) {
  const { addItem } = useCart();

  // Safety check: Product must have at least one variant
  if (!product.variants || product.variants.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-xl border border-gray-200 shadow-sm max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Configuration Needed</h1>
          <p className="text-gray-600 mb-4">This product needs to have at least one variant configured before it can be displayed.</p>
          <p className="text-sm text-gray-500">Please add variants in the admin panel.</p>
        </div>
      </div>
    );
  }

  const initialVariant = product.variants.find(v => Number(v.stock) > 0) || product.variants[0];

  const [selectedVariant, setSelectedVariant] = useState(initialVariant);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(Number(initialVariant.stock) > 0 ? 1 : 0);
  const [expandedAccordions, setExpandedAccordions] = useState<{ [key: string]: boolean }>({});
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [galleryModalIndex, setGalleryModalIndex] = useState(0);
  const [isBuyingNow, setIsBuyingNow] = useState(false);

  const price = Number(selectedVariant.price);
  const salePrice = Number(selectedVariant.sale_price);
  const stock = Number(selectedVariant.stock);
  const onSale = selectedVariant.on_sale;
  const reviewRating = Number(product.review_rating || 0);

  const displayImages = Array.from(new Set([
    ...(selectedVariant.images || []),
    ...(product.product_images || [])
  ]));

  const toggleAccordion = (id: string) => {
    setExpandedAccordions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const uniqueColors = Array.from(new Set(
    product.variants.map(v => v.color).filter(Boolean)
  )) as string[];
  
  const uniqueSizes = Array.from(new Set(
    product.variants.map(v => v.size).filter(Boolean)
  )) as string[];

  const colorMap: { [key: string]: string } = {
    'White': '#FFFFFF',
    'Black': '#000000',
    'Blue': '#3B82F6',
    'Purple': '#A855F7',
    'Green': '#10B981',
    'Red': '#EF4444',
    'Orange': '#F97316',
    'Pink': '#EC4899',
    'Gray': '#6B7280',
    'Grey': '#6B7280',
    'Silver': '#C0C0C0',
    'Gold': '#FFD700'
  };

  const selectVariant = (color: string | null, size: string | null) => {
    const variant = product.variants.find(v => 
      (color === null || v.color === color) && 
      (size === null || v.size === size)
    );
    if (variant) {
      const variantStock = Number(variant.stock);
      setSelectedVariant(variant);
      setSelectedImage(0);
      setQuantity(variantStock > 0 ? 1 : 0);
    }
  };

  const handleAddToCart = () => {
    if (stock === 0) return;
    
    const image = displayImages[0] || '/placeholder.jpg';
    
    addItem({
      id: selectedVariant.id,
      productId: product.id,
      productUrl: product.product_url,
      title: product.title,
      color: selectedVariant.color || undefined,
      size: selectedVariant.size || undefined,
      price: price,
      salePrice: salePrice,
      onSale: onSale,
      image: image,
      stock: stock
    });
  };

  const handleBuyNow = async () => {
    if (stock === 0) return;
    setIsBuyingNow(true);

    try {
      const imagePath = displayImages[0] || '/placeholder.jpg';
      
      const imageUrl = imagePath.startsWith('http') 
        ? imagePath 
        : `${window.location.origin}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
      
      const finalPrice = onSale ? salePrice : price;

      const totalAmount = finalPrice * quantity;
      const shippingCost = totalAmount >= 20 ? 0 : 3.99;

      const stripePayload = {
        items: [{
          id: selectedVariant.id, 
          title: product.title,
          image: imageUrl,
          price: price,
          salePrice: salePrice,
          onSale: onSale,
          color: selectedVariant.color,
          size: selectedVariant.size,
          quantity: quantity
        }],
        shippingCost
      };

      const cartItemBackup = {
        id: selectedVariant.id,
        productId: product.id,
        productUrl: product.product_url,
        title: product.title,
        color: selectedVariant.color || undefined,
        size: selectedVariant.size || undefined,
        price: price,
        salePrice: salePrice,
        onSale: onSale,
        image: displayImages[0] || '/placeholder.jpg',
        stock: stock,
        quantity: quantity
      };

      sessionStorage.setItem('pendingCartItem', JSON.stringify(cartItemBackup));

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stripePayload)
      });

      const data = await res.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Failed to create checkout session');
        setIsBuyingNow(false);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to proceed to checkout');
      setIsBuyingNow(false);
    }
  };

  const renderStars = (rating: number, size: number = 16) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <>
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} size={size} className="fill-cyan-500 text-cyan-500" />
        ))}
        {hasHalfStar && (
          <div className="relative" key="half">
            <Star size={size} className="text-cyan-500" />
            <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
              <Star size={size} className="fill-cyan-500 text-cyan-500" />
            </div>
          </div>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} size={size} className="text-cyan-500" />
        ))}
      </>
    );
  };

  const openGalleryModal = (index: number) => {
    setGalleryModalIndex(index);
    setGalleryModalOpen(true);
  };

  const nextGalleryImage = () => {
    if (product.gallery_images) {
      setGalleryModalIndex((prev) => (prev + 1) % product.gallery_images!.length);
    }
  };

  const prevGalleryImage = () => {
    if (product.gallery_images) {
      setGalleryModalIndex((prev) => 
        prev === 0 ? product.gallery_images!.length - 1 : prev - 1
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-orange-600">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-orange-600">Shop</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{product.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Images */}
          <div className="space-y-4">
            <motion.div 
              className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={selectedVariant.id}
            >
              {displayImages[selectedImage] ? (
                <Image
                  src={displayImages[selectedImage]}
                  alt={product.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-contain p-8"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
              {onSale && (
                <div className="absolute top-4 right-4 bg-orange-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
                  SAVE £{(price - salePrice).toFixed(2)}
                </div>
              )}
            </motion.div>

            {displayImages.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {displayImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition ${
                      selectedImage === idx 
                        ? 'border-orange-500' 
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      fill
                      sizes="(max-width: 768px) 25vw, 12vw"
                      className="object-contain p-2"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Info + Details + Services */}
          <div className="space-y-6">
            {/* Product Info */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">{product.title}</h1>
              
              {/* Reviews */}
              {product.review_count && product.review_count > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">
                    {renderStars(reviewRating)}
                  </div>
                  <span className="text-cyan-600 font-medium">{product.review_count} reviews</span>
                </div>
              )}

              {/* Price */}
              <div className="flex items-center gap-4 mb-6">
                {onSale ? (
                  <>
                    <span className="text-3xl font-bold text-orange-500">
                      £{salePrice.toFixed(2)}
                    </span>
                    <span className="text-xl text-gray-400 line-through">
                      £{price.toFixed(2)}
                    </span>
                  </>
                ) : (
                  <span className="text-3xl font-bold text-gray-900">
                    £{price.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {/* Size Selection */}
            {uniqueSizes.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-3">
                  Size: <span className="text-orange-500">{selectedVariant.size || 'Select'}</span>
                </h3>
                <div className="flex gap-3">
                  {uniqueSizes.map((size) => {
                    const isSelected = selectedVariant.size === size;
                    const variant = product.variants.find(v => 
                      (selectedVariant.color === null || v.color === selectedVariant.color) && 
                      v.size === size
                    );
                    const variantStock = variant ? Number(variant.stock) : 0;
                    const isOutOfStock = variantStock === 0;
                    
                    return (
                      <button
                        key={size}
                        onClick={() => !isOutOfStock && selectVariant(selectedVariant.color || null, size)}
                        disabled={isOutOfStock}
                        className={`px-6 py-3 rounded-lg font-bold transition ${
                          isOutOfStock
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : isSelected
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {uniqueColors.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-3">
                  Color: <span className="text-orange-500">{selectedVariant.color || 'Select'}</span>
                </h3>
                <div className="flex gap-3">
                  {uniqueColors.map((color) => {
                    const isSelected = selectedVariant.color === color;
                    const hexColor = colorMap[color] || '#CBD5E1';
                    const needsBorder = ['White', 'Silver'].includes(color);
                    
                    const variant = product.variants.find(v => 
                      v.color === color && 
                      (selectedVariant.size === null || v.size === selectedVariant.size)
                    );
                    const variantStock = variant ? Number(variant.stock) : 0;
                    const isOutOfStock = variantStock === 0;

                    return (
                      <button
                        key={color}
                        onClick={() => !isOutOfStock && selectVariant(color, selectedVariant.size || null)}
                        disabled={isOutOfStock}
                        className={`w-12 h-12 rounded-full transition ${
                          isOutOfStock
                            ? 'opacity-30 cursor-not-allowed'
                            : isSelected
                            ? 'ring-4 ring-orange-500 ring-offset-2'
                            : 'hover:ring-2 hover:ring-gray-300 hover:ring-offset-2'
                        } ${needsBorder ? 'border-2 border-gray-300' : ''}`}
                        style={{ backgroundColor: isOutOfStock ? '#D1D5DB' : hexColor }}
                        title={`${color}${isOutOfStock ? ' (Out of Stock)' : ''}`}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="mb-6">
              <h3 className="font-bold text-gray-900 mb-3">Quantity</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1 || stock === 0}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Minus size={16} />
                </button>
                <span className="text-lg font-bold text-gray-900 min-w-[2.5ch] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                  disabled={quantity >= stock || stock === 0}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Plus size={16} />
                </button>
              </div>
              {stock > 0 && stock <= 5 && (
                <p className="text-orange-600 font-medium mt-2 text-sm">Only {stock} left in stock!</p>
              )}
              {stock === 0 && (
                <p className="text-red-600 font-medium mt-2 text-sm">Out of Stock</p>
              )}
            </div>

            {/* Add to Cart + Buy Now Buttons */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={stock === 0}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-xl font-bold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-md"
                >
                  <ShoppingCart size={22} />
                  Add to Cart
                </button>
                <button 
                  onClick={handleBuyNow}
                  disabled={stock === 0 || isBuyingNow}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {isBuyingNow ? 'Processing...' : 'Buy Now'}
                </button>
              </div>

              {/* Apple Pay Button - Mobile Only, Full Width */}
              <ApplePayButton
                productId={product.id}
                variantId={selectedVariant.id}
                productTitle={product.title}
                price={price}
                salePrice={salePrice}
                onSale={onSale}
                image={displayImages[0] || '/placeholder.jpg'}
                productUrl={product.product_url}
                selectedColor={selectedVariant.color || undefined}
                selectedSize={selectedVariant.size || undefined}
                disabled={stock === 0}
              />
            </div>

            {/* Description */}
            <div className="pt-6 border-t border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
              <div 
                className="text-gray-900 leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>

            {/* Product Details */}
            {product.accordions && product.accordions.length > 0 && (
              <div className="pt-6 border-t border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Product Details</h2>
                <div className="space-y-3">
                  {product.accordions.map((accordion) => (
                    <div key={accordion.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleAccordion(accordion.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition"
                      >
                        <span className="font-bold text-gray-900">{accordion.title}</span>
                        {expandedAccordions[accordion.id] ? (
                          <ChevronUp size={20} className="text-gray-600" />
                        ) : (
                          <ChevronDown size={20} className="text-gray-600" />
                        )}
                      </button>
                      <AnimatePresence>
                        {expandedAccordions[accordion.id] && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div 
                              className="p-4 text-gray-700 border-t border-gray-200"
                              dangerouslySetInnerHTML={{ __html: accordion.content }}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Services and Benefits */}
            <div className="pt-6 border-t border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Services and Benefits</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Truck size={20} className="text-orange-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-900">Fast, Free Shipping</span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Tag size={20} className="text-orange-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-900">30-Day Money-Back Guarantee</span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <ShieldCheck size={20} className="text-orange-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-900">Hassle-Free Warranty</span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Headphones size={20} className="text-orange-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-900">Lifetime Customer Support</span>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <CreditCard size={20} className="text-orange-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-900">Pay with Ease</span>
                  </div>
                  <div className="flex gap-2 flex-wrap pl-8">
                    <div className="px-2 py-1 bg-white rounded border border-gray-200 text-xs font-bold text-gray-700">VISA</div>
                    <div className="px-2 py-1 bg-white rounded border border-gray-200 text-xs font-bold text-gray-700">Mastercard</div>
                    <div className="px-2 py-1 bg-white rounded border border-gray-200 text-xs font-bold text-gray-700">Amex</div>
                    <div className="px-2 py-1 bg-white rounded border border-gray-200 text-xs font-bold text-gray-700">PayPal</div>
                    <div className="px-2 py-1 bg-white rounded border border-gray-200 text-xs font-bold text-gray-700">Google Pay</div>
                    <div className="px-2 py-1 bg-white rounded border border-gray-200 text-xs font-bold text-gray-700">Apple Pay</div>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Package size={20} className="text-orange-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-900">Trusted Delivery</span>
                  </div>
                  <div className="flex gap-2 flex-wrap pl-8">
                    <div className="px-3 py-1 bg-white rounded border border-gray-200 text-xs font-bold text-gray-700">Royal Mail</div>
                    <div className="px-3 py-1 bg-white rounded border border-gray-200 text-xs font-bold text-gray-700">Evri</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gallery Section */}
        {product.gallery_images && product.gallery_images.length > 0 && (
          <div className="mt-16 flex justify-center">
            <div className="max-w-5xl w-full">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {product.gallery_images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => openGalleryModal(idx)}
                    className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 hover:opacity-90 transition cursor-pointer"
                  >
                    <Image 
                      src={img} 
                      alt={`Gallery ${idx + 1}`} 
                      fill 
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className="object-cover" 
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* You May Also Like */}
        {product.related_products && product.related_products.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">You may also like</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {product.related_products.map((related) => {
                const relatedRating = Number(related.review_rating || 0);
                return (
                  <Link
                    key={related.id}
                    href={`/shop/p/${related.product_url}`}
                    className="group"
                  >
                    <div className="relative aspect-square bg-gray-50 rounded-lg overflow-hidden mb-3">
                      {related.image && (
                        <Image
                          src={related.image}
                          alt={related.title}
                          fill
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
                          className="object-contain p-4 group-hover:scale-105 transition"
                        />
                      )}
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                      {related.title}
                    </h3>
                    {related.review_count > 0 && (
                      <div className="flex items-center gap-1 mb-1">
                        <div className="flex">
                          {renderStars(relatedRating, 12)}
                        </div>
                        <span className="text-xs text-cyan-600">{related.review_count} reviews</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      {related.on_sale ? (
                        <>
                          <span className="text-sm font-bold text-orange-500">
                            £{related.sale_price.toFixed(2)}
                          </span>
                          <span className="text-xs text-gray-400 line-through">
                            £{related.price.toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm font-bold text-gray-900">
                          £{related.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Gallery Modal */}
      <AnimatePresence>
        {galleryModalOpen && product.gallery_images && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4"
            onClick={() => setGalleryModalOpen(false)}
          >
            <button
              onClick={() => setGalleryModalOpen(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition z-10"
            >
              <X size={32} />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); prevGalleryImage(); }}
              className="absolute left-4 text-white hover:text-gray-300 transition z-10"
            >
              <ChevronLeft size={48} />
            </button>

            <div className="relative w-full max-w-3xl aspect-square" onClick={(e) => e.stopPropagation()}>
              <Image
                src={product.gallery_images[galleryModalIndex]}
                alt={`Gallery ${galleryModalIndex + 1}`}
                fill
                sizes="(max-width: 1024px) 100vw, 75vw"
                className="object-contain"
              />
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); nextGalleryImage(); }}
              className="absolute right-4 text-white hover:text-gray-300 transition z-10"
            >
              <ChevronRight size={48} />
            </button>

            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
              {galleryModalIndex + 1} / {product.gallery_images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
