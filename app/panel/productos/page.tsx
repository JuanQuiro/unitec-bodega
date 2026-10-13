import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { Product, Store } from '@/types/bodega';
import { redirect } from 'next/navigation';
import ProductsClient from './ProductsClient';

async function getStore(ownerId: string): Promise<Store | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('owner_id', ownerId)
    .single();

  if (error || !data) return null;
  return data as Store;
}

async function getProducts(storeId: string): Promise<Product[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data as Product[];
}

export default async function ProductsPage() {
  const supabase = createClient();
  const user = await getUser(supabase);

  if (!user) {
    redirect('/login');
  }

  const store = await getStore(user.id);

  if (!store) {
    redirect('/panel');
  }

  const products = await getProducts(store.id);

  return <ProductsClient products={products} storeId={store.id} />;
}
