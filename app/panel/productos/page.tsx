import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { getMyStore } from '@/utils/supabase/store';
import { Product } from '@/types/bodega';
import { redirect } from 'next/navigation';
import ProductsClient from './ProductsClient';

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

  const mine = await getMyStore(user.id);

  if (!mine) {
    redirect('/panel/onboarding');
  }
  const { store } = mine;

  const products = await getProducts(store.id);

  return <ProductsClient products={products} storeId={store.id} />;
}
