import { useState, useMemo } from 'react';
import { Users, Store, Search, Mail, Phone, MapPin, Eye, Ban, CheckCircle2, IndianRupee, ChevronDown, ChevronUp } from 'lucide-react';
import { useStore } from '../../store';
import { toast } from 'sonner';

export function AdminCustomers() {
  const registeredUsers = useStore((s) => s.registeredUsers);
  const orders = useStore((s) => s.orders);
  const toggleBlockUser = useStore((s) => s.toggleBlockUser);
  const [activeTab, setActiveTab] = useState<'customers' | 'shops'>('customers');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const customerUsers = useMemo(() => registeredUsers.filter((u) => u.role === 'customer'), [registeredUsers]);
  const shopUsers = useMemo(() => registeredUsers.filter((u) => u.role === 'shopowner'), [registeredUsers]);

  // Calculate profits dynamically from delivered orders
  const userStatsMap = useMemo(() => {
    const map = new Map<string, { savings: number; profit: number }>();
    orders
      .filter((o) => o.status === 'delivered')
      .forEach((o) => {
        const key = o.userId;
        if (!key) return;
        const existing = map.get(key) || { savings: 0, profit: 0 };

        // Calculate from order items if stored values don't exist
        if (o.userRole === 'customer') {
          // Use stored customerSavings or calculate from items
          if (o.customerSavings !== undefined) {
            existing.savings += o.customerSavings;
          } else {
            // Calculate: sum of (MRP - customerPrice) * quantity for each item
            const calculatedSavings = o.items.reduce((sum, item) => {
              const mrp = Number(item.product.mrp) || 0;
              const customerPrice = Number(item.product.customerPrice) || 0;
              return sum + ((mrp - customerPrice) * item.quantity);
            }, 0);
            existing.savings += calculatedSavings;
          }
        } else if (o.userRole === 'shopowner') {
          // Use stored shopProfit or calculate from items
          if (o.shopProfit !== undefined) {
            existing.profit += o.shopProfit;
          } else {
            // Calculate: sum of (MRP - shopPrice) * quantity for each item
            const calculatedProfit = o.items.reduce((sum, item) => {
              const mrp = Number(item.product.mrp) || 0;
              const shopPrice = Number(item.product.shopPrice) || 0;
              return sum + ((mrp - shopPrice) * item.quantity);
            }, 0);
            existing.profit += calculatedProfit;
          }
        }
        map.set(key, existing);
      });
    return map;
  }, [orders]);

  // Calculate totals
  const totalCustomerProfit = customerUsers.reduce(
    (s, u) => s + (userStatsMap.get(u.id)?.savings || 0),
    0
  );
  const totalShopProfit = shopUsers.reduce(
    (s, u) => s + (userStatsMap.get(u.id)?.profit || 0),
    0
  );

  const filteredCustomers = useMemo(() => customerUsers.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  ), [customerUsers, searchQuery]);

  const filteredShops = useMemo(() => shopUsers.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.shopName || '').toLowerCase().includes(searchQuery.toLowerCase())
  ), [shopUsers, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border rounded-xl p-3 sm:p-4">
          <p className="text-[11px] sm:text-[13px] text-muted-foreground">Total Users</p>
          <p className="text-[22px] sm:text-[28px]" style={{ fontWeight: 700 }}>{registeredUsers.filter((u) => u.role !== 'admin').length}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4">
          <p className="text-[11px] sm:text-[13px] text-blue-700">Customers</p>
          <p className="text-[22px] sm:text-[28px] text-blue-700" style={{ fontWeight: 700 }}>{customerUsers.length}</p>
        </div>
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 sm:p-4">
          <p className="text-[11px] sm:text-[13px] text-primary">Shop Owners</p>
          <p className="text-[22px] sm:text-[28px] text-primary" style={{ fontWeight: 700 }}>{shopUsers.length}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4">
          <p className="text-[11px] sm:text-[13px] text-amber-700">Total Profit</p>
          <p className="text-[22px] sm:text-[28px] text-amber-700" style={{ fontWeight: 700 }}>Rs.{(totalCustomerProfit + totalShopProfit).toLocaleString()}</p>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-2 rounded-lg text-[13px] transition-colors flex items-center gap-1.5 ${activeTab === 'customers' ? 'bg-blue-600 text-white' : 'bg-white border hover:bg-gray-50'
              }`}
            style={{ fontWeight: activeTab === 'customers' ? 600 : 400 }}
          >
            <Users className="w-3.5 h-3.5" /> Customer Users ({customerUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('shops')}
            className={`px-4 py-2 rounded-lg text-[13px] transition-colors flex items-center gap-1.5 ${activeTab === 'shops' ? 'bg-primary text-white' : 'bg-white border hover:bg-gray-50'
              }`}
            style={{ fontWeight: activeTab === 'shops' ? 600 : 400 }}
          >
            <Store className="w-3.5 h-3.5" /> Shop Users ({shopUsers.length})
          </button>
        </div>
        <div className="flex items-center bg-white border rounded-lg px-3 py-2 w-full sm:w-64">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-2 bg-transparent outline-none text-[13px]"
          />
        </div>
      </div>

      {/* ─── CUSTOMER USERS TABLE ─── */}
      {activeTab === 'customers' && (
        <>
          {/* Profit summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-[13px] text-blue-700" style={{ fontWeight: 600 }}>Customer Users Table</p>
              <p className="text-[11px] text-blue-600">From <span style={{ fontWeight: 600 }}>kumar_customer_users</span></p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-blue-600">Total Customer Profit</p>
              <p className="text-[18px] sm:text-[22px] text-blue-700" style={{ fontWeight: 700 }}>Rs.{totalCustomerProfit.toLocaleString()}</p>
            </div>
          </div>

          {filteredCustomers.length === 0 ? (
            <div className="text-center py-16 bg-white border rounded-xl">
              <Users className="w-14 h-14 text-gray-300 mx-auto mb-3" />
              <p className="text-[16px]" style={{ fontWeight: 600 }}>No customers found</p>
              <p className="text-[14px] text-muted-foreground mt-1">Try adjusting your search.</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="bg-white border rounded-xl overflow-hidden hidden lg:block">
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead className="bg-blue-50 text-[12px] text-blue-700">
                      <tr>
                        <th className="text-left px-4 py-3">Customer</th>
                        <th className="text-left px-4 py-3">Contact</th>
                        <th className="text-left px-4 py-3">Address</th>
                        <th className="text-right px-4 py-3">Profit (Savings)</th>
                        <th className="text-center px-4 py-3">Status</th>
                        <th className="text-center px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.map((u) => (
                        <tr key={u.id} className="border-t hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-blue-50">
                                <Users className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <p style={{ fontWeight: 500 }}>{u.name}</p>
                                <p className="text-[11px] text-muted-foreground">{u.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground"><Mail className="w-3 h-3" /> {u.email}</div>
                              <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground"><Phone className="w-3 h-3" /> {u.phone}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[12px] text-muted-foreground">{u.address || 'No address'}</td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-[13px] text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full" style={{ fontWeight: 700 }}>
                              <IndianRupee className="w-3 h-3 inline" />{(userStatsMap.get(u.id)?.savings || 0).toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {u.blocked ? (
                              <span className="flex items-center gap-1 text-red-600 text-[12px] justify-center">
                                <Ban className="w-3.5 h-3.5" /> Blocked
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-primary text-[12px] justify-center">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Active
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1 justify-center">
                              <button className="p-1.5 hover:bg-gray-100 rounded" onClick={() => toast.success(`Viewing ${u.name}`)}><Eye className="w-3.5 h-3.5 text-gray-500" /></button>
                              <button
                                className="p-1.5 hover:bg-gray-100 rounded"
                                onClick={() => {
                                  toggleBlockUser(u.id, !u.blocked);
                                  toast.success(u.blocked ? `${u.name} unblocked` : `${u.name} blocked`);
                                }}
                              >
                                {u.blocked ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                ) : (
                                  <Ban className="w-3.5 h-3.5 text-red-500" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-3 border-t text-[13px] text-muted-foreground">
                  Showing {filteredCustomers.length} of {customerUsers.length} customers
                </div>
              </div>

              {/* Mobile cards */}
              <div className="lg:hidden space-y-2">
                {filteredCustomers.map((u) => (
                  <div key={u.id} className="bg-white border rounded-xl overflow-hidden">
                    <button className="w-full p-3 flex items-center gap-3" onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-blue-50">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-[13px] truncate" style={{ fontWeight: 500 }}>{u.name}</p>
                        <p className="text-[11px] text-muted-foreground">{u.email}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[14px] text-blue-700" style={{ fontWeight: 700 }}>Rs.{(userStatsMap.get(u.id)?.savings || 0).toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">savings</p>
                      </div>
                      {expandedUser === u.id ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                    </button>
                    {expandedUser === u.id && (
                      <div className="border-t px-3 pb-3 pt-2 space-y-2 text-[12px]">
                        <div className="flex items-center gap-1.5 text-muted-foreground"><Phone className="w-3 h-3" /> {u.phone}</div>
                        <div className="flex items-center gap-1.5 text-muted-foreground"><MapPin className="w-3 h-3" /> {u.address || 'No address'}</div>
                        <div className="flex gap-2 pt-1">
                          <button className="flex-1 py-2 border rounded-lg text-[12px] flex items-center justify-center gap-1 hover:bg-gray-50" onClick={() => toast.success(`Viewing ${u.name}`)}><Eye className="w-3 h-3" /> View</button>
                          <button
                            className={`flex-1 py-2 border rounded-lg text-[12px] flex items-center justify-center gap-1 ${u.blocked ? 'border-green-200 text-green-600 hover:bg-green-50' : 'border-red-200 text-red-500 hover:bg-red-50'}`}
                            onClick={() => {
                              toggleBlockUser(u.id, !u.blocked);
                              toast.success(u.blocked ? `${u.name} unblocked` : `${u.name} blocked`);
                            }}
                          >
                            {u.blocked ? <><CheckCircle2 className="w-3 h-3" /> Unblock</> : <><Ban className="w-3 h-3" /> Block</>}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <p className="text-[12px] text-muted-foreground text-center py-1">Showing {filteredCustomers.length} of {customerUsers.length} customers</p>
              </div>
            </>
          )}
        </>
      )}

      {/* ─── SHOP USERS TABLE ─── */}
      {activeTab === 'shops' && (
        <>
          {/* Profit summary */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-[13px] text-primary" style={{ fontWeight: 600 }}>Shop Users Table</p>
              <p className="text-[11px] text-primary/70">From <span style={{ fontWeight: 600 }}>kumar_shop_users</span></p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-primary/70">Total Shop Profit</p>
              <p className="text-[18px] sm:text-[22px] text-primary" style={{ fontWeight: 700 }}>Rs.{totalShopProfit.toLocaleString()}</p>
            </div>
          </div>

          {filteredShops.length === 0 ? (
            <div className="text-center py-16 bg-white border rounded-xl">
              <Store className="w-14 h-14 text-gray-300 mx-auto mb-3" />
              <p className="text-[16px]" style={{ fontWeight: 600 }}>No shop owners found</p>
              <p className="text-[14px] text-muted-foreground mt-1">Try adjusting your search.</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="bg-white border rounded-xl overflow-hidden hidden lg:block">
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead className="bg-primary/5 text-[12px] text-primary">
                      <tr>
                        <th className="text-left px-4 py-3">Shop Owner</th>
                        <th className="text-left px-4 py-3">Shop Details</th>
                        <th className="text-left px-4 py-3">Contact</th>
                        <th className="text-left px-4 py-3">GST</th>
                        <th className="text-right px-4 py-3">Credit Limit</th>
                        <th className="text-right px-4 py-3">Profit</th>
                        <th className="text-center px-4 py-3">Status</th>
                        <th className="text-center px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredShops.map((u) => (
                        <tr key={u.id} className="border-t hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-primary/10">
                                <Store className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <p style={{ fontWeight: 500 }}>{u.name}</p>
                                <p className="text-[11px] text-muted-foreground">{u.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-[13px]" style={{ fontWeight: 500 }}>{u.shopName || '—'}</p>
                            <p className="flex items-center gap-1 text-[11px] text-muted-foreground w-full">
                              <MapPin className="w-3 h-3 shrink-0" />
                              {u.shopLocationUrl ? (
                                <a href={u.shopLocationUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                                  {u.shopLocation || '—'}
                                </a>
                              ) : (
                                <span className="truncate">{u.shopLocation || '—'}</span>
                              )}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground"><Mail className="w-3 h-3" /> {u.email}</div>
                              <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground"><Phone className="w-3 h-3" /> {u.phone}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[12px] text-muted-foreground">{u.gstNumber || '—'}</td>
                          <td className="px-4 py-3 text-right text-[13px]" style={{ fontWeight: 500 }}>Rs.{(u.creditLimit || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-[13px] text-primary bg-primary/10 px-2.5 py-1 rounded-full" style={{ fontWeight: 700 }}>
                              <IndianRupee className="w-3 h-3 inline" />{(userStatsMap.get(u.id)?.profit || 0).toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {u.blocked ? (
                              <span className="flex items-center gap-1 text-red-600 text-[12px] justify-center">
                                <Ban className="w-3.5 h-3.5" /> Blocked
                              </span>
                            ) : (
                              <span className={`flex items-center gap-1 text-[12px] justify-center ${u.approved ? 'text-primary' : 'text-amber-600'}`}>
                                <CheckCircle2 className="w-3.5 h-3.5" /> {u.approved ? 'Approved' : 'Pending'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1 justify-center">
                              <button className="p-1.5 hover:bg-gray-100 rounded" onClick={() => toast.success(`Viewing ${u.name}`)}><Eye className="w-3.5 h-3.5 text-gray-500" /></button>
                              <button
                                className="p-1.5 hover:bg-gray-100 rounded"
                                onClick={() => {
                                  toggleBlockUser(u.id, !u.blocked);
                                  toast.success(u.blocked ? `${u.name} unblocked` : `${u.name} blocked`);
                                }}
                              >
                                {u.blocked ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                ) : (
                                  <Ban className="w-3.5 h-3.5 text-red-500" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-3 border-t text-[13px] text-muted-foreground">
                  Showing {filteredShops.length} of {shopUsers.length} shop owners
                </div>
              </div>

              {/* Mobile cards */}
              <div className="lg:hidden space-y-2">
                {filteredShops.map((u) => (
                  <div key={u.id} className="bg-white border rounded-xl overflow-hidden">
                    <button className="w-full p-3 flex items-center gap-3" onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-primary/10">
                        <Store className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-[13px] truncate" style={{ fontWeight: 500 }}>{u.shopName || u.name}</p>
                        <p className="text-[11px] text-muted-foreground">{u.name}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[14px] text-primary" style={{ fontWeight: 700 }}>Rs.{(userStatsMap.get(u.id)?.profit || 0).toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">profit</p>
                      </div>
                      {expandedUser === u.id ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                    </button>
                    {expandedUser === u.id && (
                      <div className="border-t px-3 pb-3 pt-2 space-y-2 text-[12px]">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-gray-50 rounded-lg p-2">
                            <p className="text-[10px] text-muted-foreground">Credit Limit</p>
                            <p style={{ fontWeight: 600 }}>Rs.{(u.creditLimit || 0).toLocaleString()}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2">
                            <p className="text-[10px] text-muted-foreground">GST</p>
                            <p style={{ fontWeight: 500 }}>{u.gstNumber || '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground"><Mail className="w-3 h-3" /> {u.email}</div>
                        <div className="flex items-center gap-1.5 text-muted-foreground"><Phone className="w-3 h-3" /> {u.phone}</div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <MapPin className="w-3 h-3 shrink-0" />
                          {u.shopLocationUrl ? (
                            <a href={u.shopLocationUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                              {u.shopLocation || '—'}
                            </a>
                          ) : (
                            <span>{u.shopLocation || '—'}</span>
                          )}
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button className="flex-1 py-2 border rounded-lg text-[12px] flex items-center justify-center gap-1 hover:bg-gray-50" onClick={() => toast.success(`Viewing ${u.name}`)}><Eye className="w-3 h-3" /> View</button>
                          <button
                            className={`flex-1 py-2 border rounded-lg text-[12px] flex items-center justify-center gap-1 ${u.blocked ? 'border-green-200 text-green-600 hover:bg-green-50' : 'border-red-200 text-red-500 hover:bg-red-50'}`}
                            onClick={() => {
                              toggleBlockUser(u.id, !u.blocked);
                              toast.success(u.blocked ? `${u.name} unblocked` : `${u.name} blocked`);
                            }}
                          >
                            {u.blocked ? <><CheckCircle2 className="w-3 h-3" /> Unblock</> : <><Ban className="w-3 h-3" /> Block</>}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <p className="text-[12px] text-muted-foreground text-center py-1">Showing {filteredShops.length} of {shopUsers.length} shop owners</p>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
