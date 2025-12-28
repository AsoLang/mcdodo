// Path: app/shipping/page.tsx

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Shipping Information</h1>
          <p className="text-xl text-gray-600">Fast, reliable delivery across the UK</p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12 space-y-8">
          
          {/* Free Shipping Banner */}
          <section className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">Free Shipping on Orders Over £20</h2>
                <p className="text-green-100">Orders under £20 have a flat £3.99 shipping fee</p>
              </div>
            </div>
          </section>

          {/* Delivery Times */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Delivery Times</h2>
            <div className="grid md:grid-cols-2 gap-4">
              
              {/* Standard Delivery */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <h3 className="text-xl font-bold text-gray-900">Standard Delivery</h3>
                </div>
                <p className="text-gray-700 mb-2">
                  <strong className="text-orange-600">3-5 Business Days</strong>
                </p>
                <p className="text-sm text-gray-600">
                  Via Royal Mail or Evri. Tracking provided with all orders.
                </p>
              </div>

              {/* Express Delivery */}
              <div className="bg-orange-50 border-2 border-orange-500 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <h3 className="text-xl font-bold text-orange-900">Express Delivery</h3>
                  <span className="ml-auto bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">Coming Soon</span>
                </div>
                <p className="text-gray-700 mb-2">
                  <strong className="text-orange-600">1-2 Business Days</strong>
                </p>
                <p className="text-sm text-gray-600">
                  Next day delivery available for orders placed before 2pm.
                </p>
              </div>

            </div>
          </section>

          {/* Coverage */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Where We Ship</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <p className="text-blue-900 font-semibold mb-2">
                🇬🇧 We currently ship to all UK addresses
              </p>
              <p className="text-blue-800 text-sm">
                This includes England, Scotland, Wales, and Northern Ireland.
              </p>
            </div>
          </section>

          {/* Processing Times */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Processing</h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span><strong>Orders placed before 2pm Monday-Friday</strong> are dispatched the same day</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span><strong>Orders placed after 2pm or on weekends</strong> are dispatched the next business day</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span><strong>Bank holidays</strong> may affect processing and delivery times</span>
              </li>
            </ul>
          </section>

          {/* Tracking */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Tracking</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Once your order is dispatched, you'll receive a confirmation email with a tracking number. You can use this to track your parcel in real-time.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                <strong>Note:</strong> Tracking information may take 24 hours to become active after dispatch.
              </p>
            </div>
          </section>

          {/* Shipping Costs */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Shipping Costs</h2>
            <div className="overflow-hidden border border-gray-200 rounded-xl">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Order Value</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Shipping Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="bg-white">
                    <td className="px-6 py-4 text-gray-700">Under £20</td>
                    <td className="px-6 py-4 text-gray-900 font-semibold">£3.99</td>
                  </tr>
                  <tr className="bg-green-50">
                    <td className="px-6 py-4 text-gray-700">£20 and over</td>
                    <td className="px-6 py-4 text-green-600 font-bold">FREE</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Damaged Parcels */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Damaged or Missing Parcels</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If your parcel arrives damaged or doesn't arrive at all, please contact us within 48 hours at <a href="mailto:support@mcdodo.co.uk" className="text-orange-600 hover:underline">support@mcdodo.co.uk</a>. We'll investigate and arrange a replacement or refund.
            </p>
            <p className="text-gray-700 leading-relaxed">
              All orders are fully insured during transit.
            </p>
          </section>

          {/* Contact */}
          <section className="bg-orange-50 border border-orange-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-orange-900 mb-2">Shipping Questions?</h2>
            <p className="text-orange-800 mb-3">
              Need help with your delivery? Our team is here to assist.
            </p>
            <a 
              href="mailto:support@mcdodo.co.uk" 
              className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-orange-600 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contact Support
            </a>
          </section>

        </div>
      </div>
    </div>
  );
}