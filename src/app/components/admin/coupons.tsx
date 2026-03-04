import { useState } from 'react';
import { Plus, Edit, Trash2, Copy, Tag } from 'lucide-react';
import { toast } from 'sonner';

const initialCoupons = [
  { code: 'WELCOME10', discount: '10%', type: 'Percentage', minOrder: 500, maxDiscount: 200, uses: 234, maxUses: 1000, status: 'active', validTill: '2026-06-30', forRole: 'All' },
  { code: 'SAVE50', discount: 'Rs.50', type: 'Flat', minOrder: 1000, maxDiscount: 50, uses: 89, maxUses: 500, status: 'active', validTill: '2026-04-30', forRole: 'Customer' },
  { code: 'BULK20', discount: '20%', type: 'Percentage', minOrder: 5000, maxDiscount: 2000, uses: 45, maxUses: 200, status: 'active', validTill: '2026-05-15', forRole: 'Shop Owner' },
  { code: 'FIRST100', discount: 'Rs.100', type: 'Flat', minOrder: 300, maxDiscount: 100, uses: 567, maxUses: 500, status: 'expired', validTill: '2026-02-28', forRole: 'All' },
  { code: 'MEGA15', discount: '15%', type: 'Percentage', minOrder: 2000, maxDiscount: 500, uses: 12, maxUses: 300, status: 'active', validTill: '2026-07-31', forRole: 'All' },
];

export function AdminCoupons() {
  const [coupons] = useState(initialCoupons);

  const activeCoupons = coupons.filter((c) => c.status === 'active');
  const expiredCoupons = coupons.filter((c) => c.status === 'expired');

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border rounded-xl p-4">
          <p className="text-[13px] text-muted-foreground">Total Coupons</p>
          <p className="text-[28px]" style={{ fontWeight: 700 }}>{coupons.length}</p>
        </div>
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <p className="text-[13px] text-primary">Active</p>
          <p className="text-[28px] text-primary" style={{ fontWeight: 700 }}>{activeCoupons.length}</p>
        </div>
        <div className="bg-gray-50 border rounded-xl p-4">
          <p className="text-[13px] text-muted-foreground">Expired</p>
          <p className="text-[28px] text-gray-500" style={{ fontWeight: 700 }}>{expiredCoupons.length}</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[14px] text-muted-foreground">{coupons.length} coupons total</p>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-[14px]" style={{ fontWeight: 600 }} onClick={() => toast.success('Create coupon form')}>
          <Plus className="w-4 h-4" /> Create Coupon
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead className="bg-gray-50 text-[13px] text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Code</th>
                <th className="text-left px-4 py-3">Discount</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Min Order</th>
                <th className="text-left px-4 py-3">For</th>
                <th className="text-left px-4 py-3">Usage</th>
                <th className="text-left px-4 py-3">Valid Till</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.code} className="border-t hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-primary" />
                      <span style={{ fontWeight: 600 }}>{c.code}</span>
                      <button onClick={() => { navigator.clipboard.writeText(c.code); toast.success('Code copied!'); }} className="p-1 hover:bg-gray-100 rounded">
                        <Copy className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ fontWeight: 600 }}>{c.discount}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.type}</td>
                  <td className="px-4 py-3">Rs.{c.minOrder}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                      c.forRole === 'Shop Owner' ? 'bg-primary/10 text-primary' : c.forRole === 'Customer' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100'
                    }`} style={{ fontWeight: 500 }}>{c.forRole}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <span className="text-[13px]">{c.uses}/{c.maxUses}</span>
                      <div className="w-16 bg-gray-100 rounded-full h-1.5 mt-1">
                        <div className="bg-primary rounded-full h-1.5" style={{ width: `${Math.min((c.uses / c.maxUses) * 100, 100)}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-[13px]">{c.validTill}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] ${c.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'}`} style={{ fontWeight: 500 }}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button className="p-1.5 hover:bg-gray-100 rounded" onClick={() => toast.success('Edit coupon')}><Edit className="w-3.5 h-3.5 text-gray-500" /></button>
                      <button className="p-1.5 hover:bg-gray-100 rounded" onClick={() => toast.error('Coupon deleted')}><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
