import { useEffect, useMemo, useState } from 'react';
import { Star, Trash2, Edit3, ThumbsUp, Sparkles, MessageSquare, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useStore } from '../store';
import { deleteMyReview, getProductReviews, upsertMyReview, type ProductReview } from '../services/reviews';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

function Stars({ value, onChange, size = 18 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.button
          key={i}
          type="button"
          whileHover={onChange ? { scale: 1.2 } : {}}
          whileTap={onChange ? { scale: 0.9 } : {}}
          onClick={() => onChange?.(i)}
          onMouseEnter={() => onChange && setHover(i)}
          onMouseLeave={() => onChange && setHover(0)}
          className={onChange ? 'cursor-pointer' : 'cursor-default'}
          aria-label={`${i} star`}
        >
          <Star
            className={`${i <= (hover || value) ? 'text-amber-500 fill-amber-500' : 'text-gray-200'} transition-colors duration-200`}
            style={{ width: size, height: size }}
          />
        </motion.button>
      ))}
    </div>
  );
}

export function ProductReviews({ productId }: { productId: string }) {
  const user = useStore((s) => s.user);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest'>('newest');

  const myReview = useMemo(() => (user ? reviews.find((r) => r.user_id === user.id) : undefined), [reviews, user?.id]);

  const stats = useMemo(() => {
    const count = reviews.length;
    const avg = count ? reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / count : 0;
    const distribution = [0, 0, 0, 0, 0];
    reviews.forEach(r => {
      const idx = Math.max(0, Math.min(4, Math.floor(r.rating) - 1));
      distribution[idx]++;
    });
    return { count, avg: Math.round(avg * 10) / 10, distribution: distribution.reverse() };
  }, [reviews]);

  const sortedReviews = useMemo(() => {
    return [...reviews].sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'highest') return b.rating - a.rating;
      if (sortBy === 'lowest') return a.rating - b.rating;
      return 0;
    });
  }, [reviews, sortBy]);

  const aiSummary = useMemo(() => {
    if (reviews.length < 3) return null;
    const positive = reviews.filter(r => r.rating >= 4).length;
    const percent = Math.round((positive / reviews.length) * 100);
    
    if (percent > 80) return "Customers are loving this! Highly rated for quality and value.";
    if (percent > 50) return "Mostly positive feedback with some mixed opinions on specific features.";
    return "Check reviews carefully; some customers had concerns with this product.";
  }, [reviews]);

  const load = async () => {
    try {
      const data = await getProductReviews(productId);
      setReviews(data);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load reviews');
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
    <div className="mt-12 space-y-8">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 bg-white p-8 rounded-3xl border border-border/60 shadow-sm flex flex-col items-center justify-center text-center">
          <h3 className="text-[18px] mb-4" style={{ fontWeight: 800 }}>Customer Rating</h3>
          <div className="text-[56px] leading-none text-gray-900" style={{ fontWeight: 900 }}>
            {stats.avg || '0.0'}
          </div>
          <div className="mt-4">
            <Stars value={Math.round(stats.avg)} size={24} />
          </div>
          <p className="mt-4 text-[14px] text-muted-foreground">Based on {stats.count} reviews</p>
        </div>

        <div className="md:col-span-2 bg-white p-8 rounded-3xl border border-border/60 shadow-sm">
          <div className="space-y-3">
            {stats.distribution.map((count, i) => {
              const star = 5 - i;
              const percent = stats.count ? (count / stats.count) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-4">
                  <span className="text-[13px] w-4 font-bold text-slate-600">{star}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      className="h-full bg-amber-500 rounded-full"
                    />
                  </div>
                  <span className="text-[12px] w-10 text-muted-foreground text-right">{Math.round(percent)}%</span>
                </div>
              );
            })}
          </div>

          {aiSummary && (
            <div className="mt-8 p-4 bg-purple-50 rounded-2xl border border-purple-100 flex gap-3">
              <Sparkles className="w-5 h-5 text-purple-600 shrink-0" />
              <div>
                <p className="text-[12px] font-bold text-purple-900 flex items-center gap-1.5 uppercase tracking-wider">
                  AI Summary
                </p>
                <p className="text-[13px] text-purple-800 mt-1 leading-relaxed">
                  {aiSummary}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Write Review Section */}
      <div className="bg-white rounded-3xl border border-border/60 overflow-hidden shadow-premium">
        <div className="p-6 border-b border-border/60 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-primary" />
            <h3 className="text-[16px]" style={{ fontWeight: 800 }}>
              {myReview ? 'Edit Your Review' : 'Write a Review'}
            </h3>
          </div>
          {myReview && (
             <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
               Already Reviewed
             </Badge>
          )}
        </div>

        <div className="p-8">
          {user ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!rating) return toast.error('Please select a rating');
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
                } catch (err: any) {
                  toast.error(err.message || 'Failed to save');
                } finally {
                  setSaving(false);
                }
              }}
              className="space-y-6"
            >
              <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-[14px] font-bold text-slate-700 mb-3 uppercase tracking-widest">Your overall rating</p>
                <Stars value={rating} onChange={setRating} size={32} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-700 uppercase tracking-wider">Review Title</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Example: Excellent quality, highly recommend!"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-[14px]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-700 uppercase tracking-wider">Product Review</label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Tell us more about your experience..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-[14px] resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-4 flex-wrap">
                <div className="flex gap-3">
                  <Button
                    disabled={saving}
                    type="submit"
                    className="h-12 px-8 rounded-xl bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20"
                  >
                    {saving ? 'Processing...' : myReview ? 'Update Review' : 'Submit Review'}
                  </Button>
                  {myReview && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={async () => {
                        if (!confirm('Delete your review?')) return;
                        try {
                          await deleteMyReview(productId, user.id);
                          toast.success('Review deleted');
                          setTitle(''); setBody(''); setRating(5);
                          await load();
                        } catch (err: any) {
                          toast.error('Failed to delete');
                        }
                      }}
                      className="h-12 px-6 rounded-xl text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </Button>
                  )}
                </div>
                {myReview && (
                  <span className="text-[12px] text-muted-foreground italic">
                    Updated on {new Date(myReview.updated_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </form>
          ) : (
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium">Please sign in to share your thoughts on this product.</p>
            </div>
          )}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-[20px]" style={{ fontWeight: 800 }}>
            Recent Reviews <span className="text-muted-foreground ml-2">({reviews.length})</span>
          </h3>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          >
            <option value="newest">Newest First</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
          </select>
        </div>

        <AnimatePresence mode="popLayout">
          {sortedReviews.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200"
            >
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No reviews yet. Be the first to share your experience!</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {sortedReviews.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`p-6 rounded-3xl bg-white border shadow-sm transition-all hover:shadow-md ${user?.id === r.user_id ? 'border-primary/30 ring-1 ring-primary/10' : 'border-border/60'}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold uppercase">
                        {r.user_name[0]}
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-slate-900 flex items-center gap-2">
                          {r.user_name}
                          {user?.id === r.user_id && (
                            <Badge className="bg-primary text-white text-[10px] py-0 px-1.5 h-4">YOU</Badge>
                          )}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Stars value={r.rating} size={14} />
                          <span className="text-[12px] text-muted-foreground">
                            {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {r.title && (
                    <h4 className="mt-4 text-[15px] font-bold text-slate-800 leading-tight">{r.title}</h4>
                  )}
                  {r.body && (
                    <p className="mt-2 text-[14px] text-slate-600 leading-relaxed whitespace-pre-wrap">{r.body}</p>
                  )}

                  <div className="mt-6 flex items-center gap-4 pt-4 border-t border-slate-50">
                    <button className="flex items-center gap-1.5 text-[12px] font-bold text-slate-400 hover:text-primary transition-colors">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      Helpful
                    </button>
                    <button className="text-[12px] font-bold text-slate-400 hover:text-slate-600 transition-colors">
                      Report
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}


// Code styling update 7
