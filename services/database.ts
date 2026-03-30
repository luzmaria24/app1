import { supabase, ScannedItem } from '@/lib/supabase';

export const addScannedItem = async (
  priceOriginal: number,
  currency: 'USD' | 'VES',
  priceBolivares: number,
  exchangeRate: number,
  imageUri?: string
) => {
  const { data, error } = await supabase
    .from('scanned_items')
    .insert({
      price_original: priceOriginal,
      currency: currency,
      price_bolivares: priceBolivares,
      exchange_rate: exchangeRate,
      image_uri: imageUri,
    })
    .select()
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

export const getScannedItems = async (): Promise<ScannedItem[]> => {
  const { data, error } = await supabase
    .from('scanned_items')
    .select('*')
    .order('scanned_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
};

export const deleteScannedItem = async (id: string) => {
  const { error } = await supabase
    .from('scanned_items')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }
};

export const clearAllScannedItems = async () => {
  const { error } = await supabase.from('scanned_items').delete().neq('id', '');

  if (error) {
    throw error;
  }
};
