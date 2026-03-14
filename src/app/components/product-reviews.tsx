import { useEffect, useMemo, useState } from 'react';
import { Star, Trash2, Edit3 } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../store';
import { deleteMyReview, getProductReviews, upsertMyReview, type ProductReview } from '../services/reviews';

function Stars({ value, onChange, size = 18 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i)}
          className={onChange ? 'cursor-pointer' : 'cursor-default'}
          aria-label={`${i} star`}
        >
          <Star
            className={`${i <= value ? 'text-amber-500 fill-amber-500' : 'text-gray-300'} `}
            style={{ width: size, height: size }}
          />
        </button>
      ))}
    </div>
  );
}

export function ProductReviews({ productId }: { productId: string }) {
  const user = useStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  const myReview = useMemo(() => (user ? reviews.find((r) => r.user_id === user.id) : undefined), [reviews, user?.id]);

  const stats = useMemo(() => {
    const count = reviews.length;
    const avg = count ? reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / count : 0;
    return { count, avg: Math.round(avg * 10) / 10 };
  }, [reviews]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getProductReviews(productId);
      setReviews(data);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating || 5);
      setTitle(myReview.title || '');
      setBody(myReview.body || '');
    }
  }, [myReview?.id]);

  return (
    <div className="mt-8 bg-white rounded-3xl border border-border/80 overflow-hidden shadow-sm">
      <div className="p-5 sm:p-6 border-b border-border/60">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-[16px]" style={{ fontWeight: 800 }}>Reviews</h3>
            <div className="mt-2 flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="px-2.5 py-1 rounded-lg bg-amber-500 text-white text-[12px]" style={{ fontWeight: 800 }}>
                  {stats.avg || 0}
                </div>
                <Stars value={Math.round(stats.avg)} />
              </div>
              <span className="text-[13px] text-muted-foreground">{stats.count} review{stats.count === 1 ? '' : 's'}</span>
            </div>
          </div>
          {loading && <span className="text-[12px] text-muted-foreground">Loading…</span>}
        </div>
      </div>

      {/* Write / edit */}
      <div className="p-5 sm:p-6 bg-gradient-to-br from-gray-50 to-white border-b border-border/60">
        {user ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!rating || rating < 1 || rating > 5) {
                toast.error('Please select a rating');
                return;
              }
              setSaving(true);
              try {
                await upsertMyReview({
                  productId,
                  userId: user.id,
                  userName: user.name,
                  rating,
                  title: title.trim(),
                  body: body.trim(),
                });
                toast.success(myReview ? 'Review updated' : 'Review posted');
                await load();
              } catch (e2: any) {
                toast.error(e2?.message || 'Could not save review');
              } finally {
                setSaving(false);
              }
            }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-4"
          >
            <div className="lg:col-span-1">
              <p className="text-[13px] text-muted-foreground mb-1.5">Your rating</p>
              <Stars value={rating} onChange={setRating} size={20} />
              <p className="text-[11px] text-muted-foreground mt-2">
                {myReview ? 'You can edit your review anytime.' : 'One review per product.'}
              </p>
              {myReview && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!user) return;
                    if (!confirm('Delete your review?')) return;
                    try {
                      await deleteMyReview(productId, user.id);
                      toast.success('Review deleted');
                      setTitle('');
                      setBody('');
                      setRating(5);
                      await load();
                    } catch (e3: any) {
                      toast.error(e3?.message || 'Could not delete review');
                    }
                  }}
                  className="mt-3 inline-flex items-center gap-2 text-[12px] text-destructive hover:underline"
                >
                  <Trash2 className="w-4 h-4" /> Delete my review
                </button>
              )}
            </div>

            <div className="lg:col-span-2 space-y-3">
              <div>
                <label className="text-[13px] text-muted-foreground block mb-1">Title (optional)</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-xl bg-white text-[14px] outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Quick summary"
                />
              </div>
              <div>
                <label className="text-[13px] text-muted-foreground block mb-1">Review (optional)</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 border rounded-xl bg-white text-[14px] outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Share your experience…"
                />
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  disabled={saving}
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-[14px]"
                  style={{ fontWeight: 800 }}
                >
                  {saving ? 'Saving…' : myReview ? 'Update review' : 'Post review'}
                </button>
                {myReview && (
                  <span className="text-[12px] text-muted-foreground inline-flex items-center gap-1">
                    <Edit3 className="w-3.5 h-3.5" /> Last updated {new Date(myReview.updated_at).toLocaleDateString('en-IN')}
                  </span>
                )}
              </div>
            </div>
          </form>
        ) : (
          <div className="text-[14px] text-muted-foreground">
            Please sign in to write a review.
          </div>
        )}
      </div>

      {/* List */}
      <div className="p-5 sm:p-6">
        {reviews.length === 0 ? (
          <div className="py-10 text-center text-[13px] text-muted-foreground">
            No reviews yet. Be the first to review this product.
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="p-4 rounded-2xl border border-border/70 bg-white">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-[14px]" style={{ fontWeight: 700 }}>{r.user_name}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Stars value={r.rating} />
                      <span className="text-[12px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                  {user?.id === r.user_id && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/15" style={{ fontWeight: 700 }}>
                      Your review
                    </span>
                  )}
                </div>
                {r.title && (
                  <p className="mt-3 text-[14px]" style={{ fontWeight: 700 }}>{r.title}</p>
                )}
                {r.body && (
                  <p className="mt-2 text-[13px] text-muted-foreground leading-relaxed whitespace-pre-wrap">{r.body}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

