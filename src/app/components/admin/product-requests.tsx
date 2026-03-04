import { useState, useEffect } from 'react';
import {
  Bell, CheckCircle2, XCircle, Clock, Package, Search, Download,
  User, Mail, Store, Filter
} from 'lucide-react';
import { useStore } from '../../store';
import { toast } from 'sonner';

export function AdminProductRequests() {
  const productRequests = useStore((s) => s.productRequests);
  const loadProductRequests = useStore((s) => s.loadProductRequests);
  const updateProductRequest = useStore((s) => s.updateProductRequest);
  const [filter, setFilter] = useState<'all' | 'pending' | 'fulfilled' | 'dismissed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadProductRequests();
  }, []);

  const pending = productRequests.filter((r) => r.status === 'pending');
  const fulfilled = productRequests.filter((r) => r.status === 'fulfilled');
  const dismissed = productRequests.filter((r) => r.status === 'dismissed');

  const filtered = productRequests
    .filter((r) => filter === 'all' || r.status === filter)
    .filter((r) =>
      r.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Group by product
  const groupedByProduct: Record<string, typeof filtered> = {};
  filtered.forEach((r) => {
    if (!groupedByProduct[r.productId]) groupedByProduct[r.productId] = [];
    groupedByProduct[r.productId].push(r);
  });

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <Bell className="w-6 h-6 text-amber-500 mx-auto mb-2" />
          <p className="text-[28px] text-amber-700" style={{ fontWeight: 700 }}>{pending.length}</p>
          <p className="text-[13px] text-amber-700" style={{ fontWeight: 500 }}>Pending Requests</p>
        </div>
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
          <CheckCircle2 className="w-6 h-6 text-primary mx-auto mb-2" />
          <p className="text-[28px] text-primary" style={{ fontWeight: 700 }}>{fulfilled.length}</p>
          <p className="text-[13px] text-primary" style={{ fontWeight: 500 }}>Fulfilled</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <XCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
          <p className="text-[28px] text-red-600" style={{ fontWeight: 700 }}>{dismissed.length}</p>
          <p className="text-[13px] text-red-600" style={{ fontWeight: 500 }}>Dismissed</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          {(['all', 'pending', 'fulfilled', 'dismissed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-[13px] capitalize transition-colors ${
                filter === f ? 'bg-primary text-white' : 'bg-white border hover:bg-gray-50'
              }`}
              style={{ fontWeight: filter === f ? 600 : 400 }}
            >
              {f === 'all' ? 'All Requests' : f}
              {f === 'pending' && pending.length > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[11px] ${
                  filter === f ? 'bg-white/20' : 'bg-amber-100 text-amber-700'
                }`}>{pending.length}</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center bg-white border rounded-lg px-3 py-2 flex-1 sm:w-64">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              placeholder="Search by product, user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-2 bg-transparent outline-none text-[13px]"
            />
          </div>
          <button
            onClick={() => toast.success('Report exported!')}
            className="p-2 border rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Requests List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border rounded-xl">
          <Bell className="w-14 h-14 text-gray-300 mx-auto mb-3" />
          <p className="text-[16px]" style={{ fontWeight: 600 }}>No {filter === 'all' ? '' : filter} product requests</p>
          <p className="text-[14px] text-muted-foreground mt-1">
            {searchQuery ? 'Try adjusting your search query.' : 'No customers have requested unavailable products yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByProduct).map(([productId, requests]) => (
            <div key={productId} className="bg-white border rounded-xl overflow-hidden">
              {/* Product Header */}
              <div className="p-4 bg-gray-50 border-b flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="text-[15px]" style={{ fontWeight: 600 }}>{requests[0].productName}</h4>
                    <p className="text-[12px] text-muted-foreground">
                      {requests.length} request{requests.length > 1 ? 's' : ''} · Product ID: {productId}
                    </p>
                  </div>
                </div>
                <span className="text-[12px] px-3 py-1 bg-amber-100 text-amber-700 rounded-full" style={{ fontWeight: 600 }}>
                  {requests.filter((r) => r.status === 'pending').length} pending
                </span>
              </div>

              {/* Individual requests */}
              <div className="divide-y">
                {requests.map((request) => (
                  <div key={request.id} className="p-4 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                        request.userRole === 'shopowner' ? 'bg-purple-50' : 'bg-blue-50'
                      }`}>
                        {request.userRole === 'shopowner' ? (
                          <Store className={`w-4 h-4 text-purple-600`} />
                        ) : (
                          <User className={`w-4 h-4 text-blue-600`} />
                        )}
                      </div>
                      <div>
                        <p className="text-[14px]" style={{ fontWeight: 500 }}>
                          {request.userName}
                          <span className={`ml-2 text-[11px] px-2 py-0.5 rounded-full ${
                            request.userRole === 'shopowner' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
                          }`}>
                            {request.userRole === 'shopowner' ? 'Shop Owner' : 'Customer'}
                          </span>
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[12px] text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {request.userEmail}
                          </span>
                          <span className="text-[12px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {request.requestDate}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {request.status === 'pending' ? (
                        <>
                          <button
                            onClick={async () => {
                              await updateProductRequest(request.id, 'fulfilled');
                              toast.success(`Fulfilled! ${request.userName} has been notified.`);
                            }}
                            className="px-4 py-2 bg-primary text-white rounded-lg text-[13px] flex items-center gap-1.5 hover:bg-primary/90 transition-colors"
                            style={{ fontWeight: 600 }}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Fulfill
                          </button>
                          <button
                            onClick={async () => {
                              await updateProductRequest(request.id, 'dismissed');
                              toast.error('Request dismissed');
                            }}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg text-[13px] flex items-center gap-1.5 hover:bg-red-600 transition-colors"
                            style={{ fontWeight: 600 }}
                          >
                            <XCircle className="w-3.5 h-3.5" /> Dismiss
                          </button>
                        </>
                      ) : (
                        <span className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] ${
                          request.status === 'fulfilled' ? 'bg-primary/5 text-primary' : 'bg-red-50 text-red-500'
                        }`} style={{ fontWeight: 600 }}>
                          {request.status === 'fulfilled' ? (
                            <><CheckCircle2 className="w-4 h-4" /> Fulfilled</>
                          ) : (
                            <><XCircle className="w-4 h-4" /> Dismissed</>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
