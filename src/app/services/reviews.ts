import { supabase } from './supabase';

export type ProductReview = {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
  updated_at: string;
};

export async function getProductReviews(productId: string) {
  const { data, error } = await supabase
    .from('kumar_product_reviews')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as ProductReview[];
}

export async function upsertMyReview(input: {
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title?: string;
  body?: string;
}) {
  const row = {
    product_id: input.productId,
    user_id: input.userId,
    user_name: input.userName,
    rating: input.rating,
    title: input.title || null,
    body: input.body || null,
  };

  const { data, error } = await supabase
    .from('kumar_product_reviews')
    .upsert(row, { onConflict: 'product_id,user_id' })
    .select('*')
    .single();

  if (error) throw error;
  return data as ProductReview;
}

export async function deleteMyReview(productId: string, userId: string) {
  const { error } = await supabase
    .from('kumar_product_reviews')
    .delete()
    .eq('product_id', productId)
    .eq('user_id', userId);

  if (error) throw error;
  return true;
}

