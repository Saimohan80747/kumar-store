import { useState } from 'react';
import {
  Store, CheckCircle2, XCircle, Clock, MapPin, Phone, Mail,
  Search, Download
} from 'lucide-react';
import { useStore } from '../../store';
import { toast } from 'sonner';

export function AdminShopApprovals() {
  const shopRequests = useStore((s) => s.shopRequests);
  const approveShop = useStore((s) => s.approveShop);
  const rejectShop = useStore((s) => s.rejectShop);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const pending = shopRequests.filter((r) => r.status === 'pending');
  const approved = shopRequests.filter((r) => r.status === 'approved');
  const rejected = shopRequests.filter((r) => r.status === 'rejected');

  const filtered = shopRequests
    .filter((r) => filter === 'all' || r.status === filter)
    .filter((r) =>
      r.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.shopLocation.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <Clock className="w-6 h-6 text-amber-500 mx-auto mb-2" />
          <p className="text-[28px] text-amber-700" style={{ fontWeight: 700 }}>{pending.length}</p>
          <p className="text-[13px] text-amber-700" style={{ fontWeight: 500 }}>Pending Approval</p>
        </div>
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
          <CheckCircle2 className="w-6 h-6 text-primary mx-auto mb-2" />
          <p className="text-[28px] text-primary" style={{ fontWeight: 700 }}>{approved.length}</p>
          <p className="text-[13px] text-primary" style={{ fontWeight: 500 }}>Approved</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <XCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
          <p className="text-[28px] text-red-600" style={{ fontWeight: 700 }}>{rejected.length}</p>
          <p className="text-[13px] text-red-600" style={{ fontWeight: 500 }}>Rejected</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-[13px] capitalize transition-colors ${filter === f ? 'bg-primary text-white' : 'bg-white border hover:bg-gray-50'
                }`}
              style={{ fontWeight: filter === f ? 600 : 400 }}
            >
              {f === 'all' ? 'All Requests' : f}
              {f === 'pending' && pending.length > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[11px] ${filter === f ? 'bg-white/20' : 'bg-amber-100 text-amber-700'
                  }`}>{pending.length}</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center bg-white border rounded-lg px-3 py-2 flex-1 sm:w-64">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              placeholder="Search by name, shop, email..."
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
          <Store className="w-14 h-14 text-gray-300 mx-auto mb-3" />
          <p className="text-[16px]" style={{ fontWeight: 600 }}>No {filter === 'all' ? '' : filter} requests found</p>
          <p className="text-[14px] text-muted-foreground mt-1">
            {searchQuery ? 'Try adjusting your search query.' : 'No shop registrations found with this status.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((request) => (
            <div key={request.id} className="bg-white border rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
              <div className="p-5">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${request.status === 'pending' ? 'bg-amber-50' : request.status === 'approved' ? 'bg-primary/10' : 'bg-red-50'
                        }`}>
                        <Store className={`w-6 h-6 ${request.status === 'pending' ? 'text-amber-600' : request.status === 'approved' ? 'text-primary' : 'text-red-500'
                          }`} />
                      </div>
                      <div>
                        <h4 className="text-[16px]" style={{ fontWeight: 600 }}>{request.shopName}</h4>
                        <p className="text-[13px] text-muted-foreground">Owner: {request.name}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                      <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                        {request.shopLocationUrl ? (
                          <a href={request.shopLocationUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {request.shopLocation}
                          </a>
                        ) : (
                          <span>{request.shopLocation}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                        <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>{request.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                        <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>{request.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-[13px] text-muted-foreground">Applied: {request.date}</span>
                      </div>
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full capitalize ${request.status === 'pending'
                        ? 'bg-amber-100 text-amber-700'
                        : request.status === 'approved'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-red-100 text-red-700'
                        }`} style={{ fontWeight: 600 }}>
                        {request.status}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {request.status === 'pending' && (
                      <>
                        <button
                          onClick={async () => { await approveShop(request.id); toast.success(`${request.shopName} has been approved! The shop owner can now login with wholesale access.`); }}
                          className="px-5 py-2.5 bg-primary text-white rounded-lg text-[14px] flex items-center gap-1.5 hover:bg-primary/90 transition-colors"
                          style={{ fontWeight: 600 }}
                        >
                          <CheckCircle2 className="w-4 h-4" /> Approve
                        </button>
                        <button
                          onClick={async () => { await rejectShop(request.id); toast.error(`${request.shopName} has been rejected.`); }}
                          className="px-5 py-2.5 bg-destructive text-white rounded-lg text-[14px] flex items-center gap-1.5 hover:bg-destructive/90 transition-colors"
                          style={{ fontWeight: 600 }}
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </>
                    )}
                    {request.status === 'approved' && (
                      <div className="flex items-center gap-2 text-primary text-[14px] bg-primary/5 px-4 py-2.5 rounded-lg">
                        <CheckCircle2 className="w-5 h-5" />
                        <span style={{ fontWeight: 600 }}>Approved</span>
                      </div>
                    )}
                    {request.status === 'rejected' && (
                      <div className="flex items-center gap-2 text-red-500 text-[14px] bg-red-50 px-4 py-2.5 rounded-lg">
                        <XCircle className="w-5 h-5" />
                        <span style={{ fontWeight: 600 }}>Rejected</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}