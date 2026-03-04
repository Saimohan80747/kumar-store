import { memo } from 'react';
import { Store, Phone, Mail, MapPin } from 'lucide-react';
import { Link } from 'react-router';

export const Footer = memo(function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-[18px] text-white" style={{ fontWeight: 700 }}>Kumar Store</span>
                <span className="block text-[11px] text-gray-500 -mt-1">Wholesale & Retail</span>
              </div>
            </div>
            <p className="text-[14px] text-gray-400 mb-4">India's trusted wholesale and retail platform for grocery, personal care, and household products.</p>
            <div className="space-y-2 text-[13px]">
              <p className="flex items-center gap-2"><Phone className="w-4 h-4" /> 1800-123-4567</p>
              <p className="flex items-center gap-2"><Mail className="w-4 h-4" /> support@kumarstore.com</p>
              <p className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Mumbai, Maharashtra</p>
            </div>
          </div>
          <div>
            <h4 className="text-white mb-4">Quick Links</h4>
            <ul className="space-y-2 text-[14px]">
              {['About Us', 'Contact', 'Blog', 'Careers', 'Press'].map(l => (
                <li key={l}><Link to="/" className="hover:text-primary transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white mb-4">Customer Service</h4>
            <ul className="space-y-2 text-[14px]">
              {['FAQ', 'Shipping Policy', 'Return Policy', 'Privacy Policy', 'Terms & Conditions'].map(l => (
                <li key={l}><Link to="/" className="hover:text-primary transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white mb-4">For Business</h4>
            <ul className="space-y-2 text-[14px]">
              {['Wholesale Registration', 'Bulk Orders', 'Partner with Us', 'Franchise', 'Advertise'].map(l => (
                <li key={l}><Link to="/" className="hover:text-primary transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-gray-500">
          <p>2026 Kumar Store. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Payments:</span>
            <span className="bg-gray-800 px-3 py-1 rounded text-[12px]">UPI</span>
            <span className="bg-gray-800 px-3 py-1 rounded text-[12px]">Cards</span>
            <span className="bg-gray-800 px-3 py-1 rounded text-[12px]">COD</span>
            <span className="bg-gray-800 px-3 py-1 rounded text-[12px]">Net Banking</span>
          </div>
        </div>
      </div>
    </footer>
  );
});