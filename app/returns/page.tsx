// Path: app/returns/page.tsx

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Returns & Refunds</h1>
          <p className="text-xl text-gray-600">Your satisfaction is our priority</p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12 space-y-8">
          
          {/* 30-Day Returns */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">30-Day Return Policy</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Changed your mind? No problem. You have <strong>30 days</strong> from the date of delivery to return your purchase for a full refund. Items must be unused, in original packaging, and in resaleable condition.
            </p>
          </section>

          {/* How to Return */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Return an Item</h2>
            <ol className="space-y-4">
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">1</span>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Contact Us</h3>
                  <p className="text-gray-700">Email <a href="mailto:support@mcdodo.co.uk" className="text-orange-600 hover:underline">support@mcdodo.co.uk</a> with your order number and reason for return.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">2</span>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Get Return Authorization</h3>
                  <p className="text-gray-700">We'll send you a return authorization and instructions within 24 hours.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">3</span>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Ship the Item</h3>
                  <p className="text-gray-700">Pack the item securely in original packaging and ship to the address provided. We recommend using tracked shipping.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">4</span>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Receive Your Refund</h3>
                  <p className="text-gray-700">Once we receive and inspect your return, we'll process your refund within 5-7 business days to your original payment method.</p>
                </div>
              </li>
            </ol>
          </section>

          {/* Return Shipping */}
          <section className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-blue-900 mb-2">Return Shipping Costs</h2>
            <p className="text-blue-800">
              <strong>Faulty items:</strong> We'll cover return shipping costs.<br/>
              <strong>Change of mind:</strong> Customer is responsible for return shipping costs.
            </p>
          </section>

          {/* Non-Returnable Items */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Non-Returnable Items</h2>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span>Items damaged due to misuse or improper handling</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span>Sale or clearance items (unless faulty)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span>Items without original packaging or tags</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span>Items returned after the 30-day window</span>
              </li>
            </ul>
          </section>

          {/* Faulty Items */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Faulty or Damaged Items</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you receive a faulty or damaged item, please contact us immediately at <a href="mailto:support@mcdodo.co.uk" className="text-orange-600 hover:underline">support@mcdodo.co.uk</a> with photos of the issue. We'll arrange a replacement or full refund, including return shipping costs.
            </p>
            <p className="text-gray-700 leading-relaxed">
              All Mcdodo products come with a <strong>12-month warranty</strong> against manufacturing defects.
            </p>
          </section>

          {/* Contact */}
          <section className="bg-orange-50 border border-orange-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-orange-900 mb-2">Questions?</h2>
            <p className="text-orange-800 mb-3">
              Our customer service team is here to help with any return queries.
            </p>
            <a 
              href="mailto:support@mcdodo.co.uk" 
              className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-orange-600 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email Support
            </a>
          </section>

        </div>
      </div>
    </div>
  );
}