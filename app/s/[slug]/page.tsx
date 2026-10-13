import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { Store, Product, Zone } from '@/types/bodega';
import CatalogClient from '@/components/catalog/CatalogClient';

interface PageProps {
  params: { slug: string };
}

async function getStore(slug: string): Promise<Store | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('slug', slug)
    .eq('activa', true)
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
    .eq('activo', true)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data as Product[];
}

async function getZones(storeId: string): Promise<Zone[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('zones')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: true });

  if (error) return [];
  return data as Zone[];
}

export default async function CatalogPage({ params }: PageProps) {
  const store = await getStore(params.slug);

  if (!store) {
    notFound();
  }

  const [products, zones] = await Promise.all([
    getProducts(store.id),
    getZones(store.id),
  ]);

  return (
    <CatalogClient
      store={store}
      products={products}
      zones={zones}
    />
  );
}
