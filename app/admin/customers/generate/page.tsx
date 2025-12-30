// Path: app/admin/customers/generate/page.tsx

'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, TestTube, Eye, Bold, Italic, Link as LinkIcon, Image as ImageIcon, Maximize2, Minimize2, Code, Edit, Search, X, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GenerateEmailPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Email form state
  const [campaignName, setCampaignName] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [filterSegment, setFilterSegment] = useState('all');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  
  // Selected customers state
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  
  // AI Generator state
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingEmail, setGeneratingEmail] = useState(false);
  
  // Preview state
  const [previewOpen, setPreviewOpen] = useState(false);
  
  // Editor state
  const [editorTab, setEditorTab] = useState<'editor' | 'template'>('editor');
  const [isExpanded, setIsExpanded] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  const emailTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
          
          <!-- Logo Header -->
          <tr>
            <td style="padding:30px;text-align:center;background:#ffffff;">
              <img src="https://www.mcdodo.co.uk/mcdodo-logo.png" alt="Mcdodo" style="height:40px;width:auto;" />
            </td>
          </tr>
          
          <!-- Hero Banner -->
          <tr>
            <td style="background:linear-gradient(135deg,#ff6b35 0%,#f7931e 100%);padding:50px 30px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:32px;font-weight:800;letter-spacing:-0.5px;">New Look, New Savings!</h1>
              <p style="margin:15px 0 0;color:#ffffff;font-size:18px;opacity:0.95;">Exclusive offer just for you</p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding:50px 40px;background:#ffffff;">
              <p style="margin:0 0 20px;color:#333333;font-size:16px;line-height:1.8;">
                We're excited to introduce our brand new website look! To celebrate, we're offering you 
                <strong style="color:#ff6b35;">10% off your entire order</strong>. 
              </p>
              <p style="margin:0;color:#333333;font-size:16px;line-height:1.8;">
                Simply use the code <strong style="background:#fff3e0;padding:4px 8px;border-radius:4px;color:#ff6b35;font-size:18px;">NEW10</strong> 
                at checkout to redeem your discount.
              </p>
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td style="padding:0 40px 50px;text-align:center;">
              <a href="https://www.mcdodo.co.uk/shop" style="display:inline-block;background:linear-gradient(135deg,#ff6b35,#f7931e);color:#ffffff;text-decoration:none;padding:18px 50px;border-radius:30px;font-weight:700;font-size:16px;box-shadow:0 4px 12px rgba(255,107,53,0.3);">
                Shop Now and Save 10%!
              </a>
            </td>
          </tr>
          
          <!-- Terms -->
          <tr>
            <td style="background:#f8f9fa;padding:30px 40px;border-top:1px solid #e9ecef;">
              <p style="margin:0;color:#6c757d;font-size:13px;line-height:1.6;">
                <strong>T&Cs apply:</strong> Use code <strong>NEW10</strong> at checkout. 
                Discount applies to all orders placed within the next 7 days. 
                Valid on all products, excluding sale and clearance items.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background:#ffffff;padding:30px 40px;text-align:center;border-top:1px solid #e9ecef;">
              <p style="margin:0 0 10px;color:#6c757d;font-size:14px;font-weight:600;">
                Mcdodo UK - Premium Tech Accessories
              </p>
              <p style="margin:0;color:#adb5bd;font-size:12px;">
                Fast charging solutions for your lifestyle
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/admin/customers');
      if (res.status === 401) { router.push('/admin'); return; }
      const data = await res.json();
      setCustomers(data);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateEmail = async () => {
    if (!aiPrompt) return;
    
    setGeneratingEmail(true);
    try {
      const res = await fetch('/api/admin/ai-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt })
      });

      const data = await res.json();
      
      if (res.ok) {
        setEmailSubject(data.subject);
        setEmailBody(data.html);
        if (!campaignName) {
          setCampaignName(aiPrompt.slice(0, 50));
        }
        setEditorTab('editor'); // Switch to editor tab
      } else {
        alert('Failed to generate email: ' + data.error);
      }
    } catch (error) {
      console.error('AI generation error:', error);
      alert('Error generating email');
    } finally {
      setGeneratingEmail(false);
    }
  };

  const insertHTML = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = emailBody.substring(start, end);
    
    let insertion = '';
    if (tag === 'b') {
      insertion = `<strong>${selectedText || 'bold text'}</strong>`;
    } else if (tag === 'i') {
      insertion = `<em>${selectedText || 'italic text'}</em>`;
    } else if (tag === 'link') {
      const url = prompt('Enter URL:', 'https://');
      if (url) {
        insertion = `<a href="${url}" style="color:#ff6b35;text-decoration:underline;">${selectedText || 'link text'}</a>`;
      }
    }

    if (insertion) {
      const newText = emailBody.substring(0, start) + insertion + emailBody.substring(end);
      setEmailBody(newText);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      alert('Image must be under 1MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const imgTag = `\n<img src="${base64}" alt="Image" style="max-width:100%;height:auto;border-radius:8px;margin:20px 0;" />\n`;
      
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const newText = emailBody.substring(0, start) + imgTag + emailBody.substring(start);
        setEmailBody(newText);
      }
    };
    reader.readAsDataURL(file);
  };

  const useTemplate = () => {
    if (confirm('Replace current email content with template?')) {
      setEmailBody(emailTemplate);
      setEditorTab('editor');
    }
  };

  const toggleCustomer = (email: string) => {
    setSelectedCustomers(prev => 
      prev.includes(email) 
        ? prev.filter(e => e !== email)
        : [...prev, email]
    );
  };

  const filteredCustomerSearch = customers.filter(c => 
    c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.email?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const getRecipientCount = () => {
    if (filterSegment === 'all') return customers.length;
    if (filterSegment === 'has_orders') return customers.filter(c => c.total_orders > 0).length;
    if (filterSegment === 'no_orders') return customers.filter(c => c.total_orders === 0).length;
    if (filterSegment === 'selected') return selectedCustomers.length;
    return 0;
  };

  const handleSendEmail = async (isTest: boolean = false) => {
    if (!campaignName || !emailSubject || !emailBody) {
      alert('Please fill in campaign name, subject and message');
      return;
    }

    if (isTest && !testEmail) {
      alert('Please enter a test email address');
      return;
    }

    const confirmMsg = isTest 
      ? `Send test email to ${testEmail}?`
      : `Send email to ${getRecipientCount()} customers? This cannot be undone.`;

    if (!confirm(confirmMsg)) return;

    setSendingEmail(true);
    try {
      const res = await fetch('/api/admin/customers/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          campaignName,
          subject: emailSubject, 
          bodyHtml: emailBody, // Only emailBody is sent, not template
          bodyText: emailBody.replace(/<[^>]*>/g, ''),
          testMode: isTest,
          testEmail: isTest ? testEmail : undefined,
          filterSegment,
          selectedCustomers: filterSegment === 'selected' ? selectedCustomers : undefined
        })
      });

      const data = await res.json();

      if (res.ok) {
        if (isTest) {
          alert(`Test email sent to ${testEmail}!`);
        } else {
          alert(`Campaign sent!\n✅ Delivered: ${data.sentCount}\n❌ Failed: ${data.failedCount}`);
          router.push('/admin/customers');
        }
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Email error:', error);
      alert('Error sending emails');
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/admin/customers"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 font-medium"
          >
            <ArrowLeft size={20} /> Back to Customers
          </Link>
          <h1 className="text-4xl font-black text-gray-900">Create Email Campaign</h1>
          <p className="text-gray-600 mt-2">Design and send professional emails to your customers</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Email Composer */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* AI Email Generator */}
            <div className="bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl shadow-lg p-6 text-white">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">✨</span>
                <h3 className="text-lg font-bold">AI Email Generator</h3>
              </div>
              <p className="text-purple-100 text-sm mb-4">
                Describe your campaign and let AI create professional email content instantly
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleGenerateEmail()}
                  placeholder="e.g., 20% off all charging cables - weekend flash sale"
                  className="flex-1 px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 outline-none"
                />
                <button
                  onClick={handleGenerateEmail}
                  disabled={generatingEmail || !aiPrompt}
                  className="px-6 py-3 bg-white text-purple-600 rounded-xl font-bold hover:bg-purple-50 transition disabled:opacity-50 whitespace-nowrap"
                >
                  {generatingEmail ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </div>

            {/* Email Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Email Content</h3>
              
              <div className="space-y-4">
                {/* Campaign Name */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Campaign Name</label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="e.g., Spring Sale 2025"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none text-gray-900"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Email Subject</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="e.g., Exclusive 20% Off - This Weekend Only!"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none text-gray-900"
                  />
                </div>

                {/* Editor Tabs */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditorTab('editor')}
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition flex items-center gap-2 ${
                          editorTab === 'editor'
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <Edit size={16} /> Your Email (Used for Sending)
                      </button>
                      <button
                        onClick={() => setEditorTab('template')}
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition flex items-center gap-2 ${
                          editorTab === 'template'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <Code size={16} /> Template Reference
                      </button>
                    </div>
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="p-2 text-gray-500 hover:text-gray-700 transition"
                      title={isExpanded ? "Collapse" : "Expand"}
                    >
                      {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>
                  </div>

                  {editorTab === 'editor' ? (
                    <>
                      {/* Rich Text Toolbar */}
                      <div className="flex gap-2 mb-2">
                        <button
                          onClick={() => insertHTML('b')}
                          className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                          title="Bold"
                        >
                          <Bold size={18} className="text-gray-700" />
                        </button>
                        <button
                          onClick={() => insertHTML('i')}
                          className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                          title="Italic"
                        >
                          <Italic size={18} className="text-gray-700" />
                        </button>
                        <button
                          onClick={() => insertHTML('link')}
                          className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                          title="Insert Link"
                        >
                          <LinkIcon size={18} className="text-gray-700" />
                        </button>
                        <label className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition cursor-pointer" title="Insert Image">
                          <ImageIcon size={18} className="text-gray-700" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                        <div className="flex-1"></div>
                        <button
                          onClick={() => setPreviewOpen(true)}
                          disabled={!emailBody}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition disabled:opacity-50 flex items-center gap-2"
                        >
                          <Eye size={18} /> Preview
                        </button>
                      </div>
                      <textarea
                        ref={textareaRef}
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        placeholder="Email HTML will appear here after AI generation, or write your own..."
                        rows={isExpanded ? 30 : 16}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none resize-none font-mono text-sm text-gray-900"
                      />
                      <p className="text-xs text-gray-500 mt-2">⚠️ This content will be used for sending emails</p>
                    </>
                  ) : (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm text-blue-700">Professional template with Mcdodo branding (reference only)</p>
                        <button
                          onClick={useTemplate}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition text-sm"
                        >
                          Use This Template
                        </button>
                      </div>
                      <textarea
                        value={emailTemplate}
                        readOnly
                        rows={isExpanded ? 30 : 16}
                        className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl outline-none resize-none font-mono text-sm text-gray-900"
                      />
                      <p className="text-xs text-blue-600 mt-2">ℹ️ This is a reference template - click "Use This Template" to copy it to your editor</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Settings & Actions */}
          <div className="space-y-6">
            
            {/* Audience */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Audience</h3>
              <select
                value={filterSegment}
                onChange={(e) => {
                  setFilterSegment(e.target.value);
                  if (e.target.value !== 'selected') {
                    setSelectedCustomers([]);
                    setCustomerSearch('');
                  }
                }}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-gray-900 font-medium"
              >
                <option value="all">All Customers ({customers.length})</option>
                <option value="has_orders">With Orders ({customers.filter(c => c.total_orders > 0).length})</option>
                <option value="no_orders">No Orders Yet ({customers.filter(c => c.total_orders === 0).length})</option>
                <option value="selected">Selected Users ({selectedCustomers.length})</option>
              </select>

              {/* Selected Users Search Interface */}
              {filterSegment === 'selected' && (
                <div className="mt-4 border border-gray-200 rounded-xl p-4 bg-gray-50">
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text"
                      placeholder="Search customers by name or email..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    />
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {filteredCustomerSearch.length > 0 ? (
                      filteredCustomerSearch.map((customer) => (
                        <label 
                          key={customer.email}
                          className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition group"
                        >
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={selectedCustomers.includes(customer.email)}
                              onChange={() => toggleCustomer(customer.email)}
                              className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900 truncate">{customer.name || 'Unknown'}</div>
                            <div className="text-xs text-gray-500 truncate">{customer.email}</div>
                          </div>
                          <div className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded font-medium">
                            {customer.total_orders} orders
                          </div>
                        </label>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        {customerSearch ? 'No customers found' : 'Start typing to search...'}
                      </div>
                    )}
                  </div>

                  {selectedCustomers.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                        <span className="font-medium">Selected: {selectedCustomers.length}</span>
                        <button
                          onClick={() => setSelectedCustomers([])}
                          className="text-red-600 hover:text-red-700 font-bold flex items-center gap-1"
                        >
                          <X size={14} /> Clear All
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {selectedCustomers.slice(0, 5).map(email => {
                          const customer = customers.find(c => c.email === email);
                          return (
                            <span 
                              key={email}
                              className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-medium"
                            >
                              {customer?.name || email.split('@')[0]}
                              <button
                                onClick={() => toggleCustomer(email)}
                                className="hover:text-orange-900"
                              >
                                <X size={12} />
                              </button>
                            </span>
                          );
                        })}
                        {selectedCustomers.length > 5 && (
                          <span className="text-xs text-gray-500 px-2 py-1">
                            +{selectedCustomers.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
                <div className="text-sm text-orange-900 font-medium">
                  Will send to: <span className="text-2xl font-black text-orange-600">{getRecipientCount()}</span> customers
                </div>
              </div>
            </div>

            {/* Test Email */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-blue-900 mb-2">Test Email</h3>
              <p className="text-sm text-blue-700 mb-4">Always test before sending to customers</p>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="your-email@example.com"
                className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none mb-3 text-gray-900"
              />
              <button
                onClick={() => handleSendEmail(true)}
                disabled={sendingEmail || !testEmail}
                className="w-full px-4 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <TestTube size={18} /> Send Test Email
              </button>
            </div>

            {/* Send Campaign */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <button
                onClick={() => handleSendEmail(false)}
                disabled={sendingEmail || !campaignName || !emailSubject || !emailBody}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-xl font-black text-lg hover:from-orange-600 hover:to-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {sendingEmail ? '📧 Sending...' : `📧 Send to ${getRecipientCount()} Customers`}
              </button>
              <p className="text-xs text-gray-500 text-center mt-3">
                Emails sent via Resend at ~10/second
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PREVIEW MODAL */}
      {previewOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-[750px] h-[85vh] rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b bg-gradient-to-r from-gray-50 to-gray-100 flex justify-between items-center">
              <div>
                <h3 className="font-black text-gray-900 text-lg">Email Preview</h3>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-semibold">Subject:</span> {emailSubject || 'No subject'}
                </p>
              </div>
              <button 
                onClick={() => setPreviewOpen(false)}
                className="w-10 h-10 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full transition text-gray-700 font-bold text-xl"
              >
                ×
              </button>
            </div>
            <iframe
              className="w-full h-[calc(100%-5rem)]"
              srcDoc={emailBody}
              sandbox="allow-same-origin"
              title="Email Preview"
            />
          </div>
        </div>
      )}
    </div>
  );
}