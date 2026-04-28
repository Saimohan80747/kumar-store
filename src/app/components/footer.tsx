import { memo, useState } from 'react';
import { Store, Phone, Mail, MapPin, Send, Heart } from 'lucide-react';
import { Link } from 'react-router';
import { toast } from 'sonner';

export const Footer = memo(function Footer() {
  const [email, setEmail] = useState('');
  return (
    <footer role="contentinfo" role="contentinfo" role="contentinfo" className="bg-gradient-to-b from-gray-900 to-gray-950 text-gray-300">
      <div className="h-1 bg-gradient-to-r from-primary via-emerald-500 to-teal-500 animate-gradient-fast" style={{ backgroundSize: '200% 100%' }} />

      {/* Newsletter */}
      <div className="max-w-7xl mx-auto px-4 pt-14 pb-8">
        <div className="bg-gradient-to-r from-gray-800/60 to-gray-800/30 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 border border-gray-700/50">
          <div className="text-center sm:text-left w-full sm:w-auto mb-4 sm:mb-0">
            <h3 className="text-white text-lg font-bold">Stay Updated</h3>
            <p className="text-gray-400 text-sm mt-1">Get the latest deals, new arrivals & exclusive wholesale offers.</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (email.trim()) { toast.success('Subscribed! Welcome aboard.'); setEmail(''); } }} className="flex flex-col sm:flex-row w-full sm:w-auto gap-3 sm:gap-0">
            <input
              type="email"
              value={email}
              aria-label="Email address for newsletter"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full sm:flex-1 sm:w-64 px-4 py-3 sm:py-2.5 bg-gray-900/60 border border-gray-700 rounded-xl sm:rounded-r-none sm:rounded-l-xl text-sm text-white placeholder:text-gray-500 outline-none focus:border-primary/50 transition-colors"
            />
            <button type="submit" className="w-full sm:w-auto px-6 py-3 sm:py-2.5 bg-gradient-to-r from-primary to-emerald-600 text-white rounded-xl sm:rounded-l-none sm:rounded-r-xl hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2 text-sm font-semibold btn-press" aria-label="Subscribe to newsletter">
              <Send className="w-4 h-4" /> Subscribe
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 glow-primary">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-[18px] text-white" style={{ fontWeight: 700 }}>Kumar Store</span>
                <span className="block text-[11px] text-gray-500 -mt-1">Wholesale & Retail</span>
              </div>
            </div>
            <p className="text-[14px] text-gray-400 mb-5 leading-relaxed">India's trusted wholesale and retail platform for grocery, personal care, and household products.</p>
            <div className="space-y-2.5 text-[13px]">
              <p className="flex items-center gap-2.5 hover:text-white transition-colors cursor-pointer"><Phone className="w-4 h-4 text-primary" /> 1800-123-4567</p>
              <p className="flex items-center gap-2.5 hover:text-white transition-colors cursor-pointer"><Mail className="w-4 h-4 text-primary" /> support@kumarstore.com</p>
              <p className="flex items-center gap-2.5 hover:text-white transition-colors cursor-pointer"><MapPin className="w-4 h-4 text-primary" /> Mumbai, Maharashtra</p>
            </div>
          </div>
          <div>
            <h4 className="text-white mb-4 text-[15px]" style={{ fontWeight: 600 }}>Quick Links</h4>
            <ul className="space-y-2.5 text-[14px]">
              {['About Us', 'Contact', 'Blog', 'Careers', 'Press'].map(l => (
                <li key={l}><Link to="/" className="hover:text-primary hover:translate-x-0.5 transition-all inline-block">{l}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white mb-4 text-[15px]" style={{ fontWeight: 600 }}>Customer Service</h4>
            <ul className="space-y-2.5 text-[14px]">
              {['FAQ', 'Shipping Policy', 'Return Policy', 'Privacy Policy', 'Terms & Conditions'].map(l => (
                <li key={l}><Link to="/" className="hover:text-primary hover:translate-x-0.5 transition-all inline-block">{l}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white mb-4 text-[15px]" style={{ fontWeight: 600 }}>For Business</h4>
            <ul className="space-y-2.5 text-[14px]">
              {['Wholesale Registration', 'Bulk Orders', 'Partner with Us', 'Franchise', 'Advertise'].map(l => (
                <li key={l}><Link to="/" className="hover:text-primary hover:translate-x-0.5 transition-all inline-block">{l}</Link></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800/80 mt-10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-gray-500">
          <div className="flex items-center gap-2">
            <p>© {new Date().getFullYear()} Kumar Store. All rights reserved.</p>
            <span className="hidden sm:inline text-gray-600">•</span>
            <span className="hidden sm:inline text-gray-500 flex items-center gap-1">Made with <Heart className="w-3 h-3 text-red-400 fill-red-400" /> in India</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-600">Payments:</span>
            <span className="bg-gray-800/80 px-3 py-1.5 rounded-lg text-[12px] text-gray-400 hover:bg-gray-700/80 hover:text-gray-300 transition-colors cursor-default">UPI</span>
            <span className="bg-gray-800/80 px-3 py-1.5 rounded-lg text-[12px] text-gray-400 hover:bg-gray-700/80 hover:text-gray-300 transition-colors cursor-default">Cards</span>
            <span className="bg-gray-800/80 px-3 py-1.5 rounded-lg text-[12px] text-gray-400 hover:bg-gray-700/80 hover:text-gray-300 transition-colors cursor-default">COD</span>
            <span className="bg-gray-800/80 px-3 py-1.5 rounded-lg text-[12px] text-gray-400 hover:bg-gray-700/80 hover:text-gray-300 transition-colors cursor-default">Net Banking</span>
          </div>
        </div>
      </div>
    </footer>
  );
});
