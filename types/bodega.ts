export interface Store {
  id: string;
  owner_id: string;
  slug: string;
  nombre: string;
  whatsapp: string;
  logo_url: string | null;
  direccion: string | null;
  activa: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  nombre: string;
  precio: number;
  stock: number;
  foto_url: string | null;
  unidad: 'unidad' | 'kg' | 'detal' | 'bulto';
  categoria: 'viveres' | 'lacteos' | 'embutidos' | 'limpieza' | 'bebidas' | 'snacks';
  activo: boolean;
  created_at: string;
}

export interface Zone {
  id: string;
  store_id: string;
  nombre: string;
  costo: number;
  minimo: number;
  created_at: string;
}

export type OrderStatus =
  | 'pendiente'
  | 'confirmado'
  | 'preparando'
  | 'en_camino'
  | 'entregado'
  | 'cancelado';

export interface OrderItem {
  product_id: string;
  nombre: string;
  cantidad: number;
  precio: number;
  subtotal: number;
}

export interface Order {
  id: string;
  store_id: string;
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_direccion: string;
  zone_id: string | null;
  items: OrderItem[];
  total: number;
  estado: OrderStatus;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export const ORDER_STATUSES: OrderStatus[] = [
  'pendiente',
  'confirmado',
  'preparando',
  'en_camino',
  'entregado',
  'cancelado',
];

export const PRODUCT_UNITS = ['unidad', 'kg', 'detal', 'bulto'] as const;

export const PRODUCT_CATEGORIES = [
  'viveres',
  'lacteos',
  'embutidos',
  'limpieza',
  'bebidas',
  'snacks',
] as const;

// Generic Database type for Supabase client (replace with supabase gen types when linked)
export interface Database {
  public: {
    Tables: {
      stores: { Row: Store; Insert: Omit<Store, 'id' | 'created_at'>; Update: Partial<Omit<Store, 'id'>> };
      products: { Row: Product; Insert: Omit<Product, 'id' | 'created_at'>; Update: Partial<Omit<Product, 'id'>> };
      zones: { Row: Zone; Insert: Omit<Zone, 'id' | 'created_at'>; Update: Partial<Omit<Zone, 'id'>> };
      orders: { Row: Order; Insert: Omit<Order, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Order, 'id'>> };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
