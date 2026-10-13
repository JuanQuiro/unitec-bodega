'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push('/panel');
    router.refresh();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      setError('Debés aceptar los términos para registrarte.');
      return;
    }
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, nombre: fullName },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push('/panel');
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-green-700">Mi Bodega</h1>
          <p className="mt-2 text-gray-600">Pedidos por WhatsApp para tu bodega</p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">
            {showRegister ? 'Crear cuenta' : 'Iniciar sesión'}
          </h2>

          <form onSubmit={showRegister ? handleRegister : handleSignIn} className="space-y-4">
            {showRegister && (
              <div>
                <label className="mb-1 block text-sm font-medium">Nombre completo</label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={showRegister}
                  placeholder="Tu nombre"
                  autoComplete="name"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="tu@email.com"
                  autoComplete="email"
                />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Contraseña</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  minLength={6}
                  className="pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {showRegister && (
              <label className="flex items-start gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 h-4 w-4"
                />
                <span>
                  Acepto los{' '}
                  <Link href="/terminos" className="font-medium text-green-600 hover:underline">
                    términos
                  </Link>{' '}
                  y la{' '}
                  <Link href="/privacidad" className="font-medium text-green-600 hover:underline">
                    privacidad
                  </Link>
                </span>
              </label>
            )}

            {error && (
              <p className="text-sm text-red-600">
                {error === 'Failed to fetch'
                  ? 'No se pudo conectar con Supabase. Revisá tu conexión o las credenciales del .env.local.'
                  : error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? 'Procesando...'
                : showRegister
                  ? 'Crear cuenta'
                  : 'Ingresar'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600">
            {showRegister ? (
              <>
                ¿Ya tenés cuenta?{' '}
                <button
                  onClick={() => setShowRegister(false)}
                  className="font-medium text-green-600 hover:underline"
                >
                  Iniciar sesión
                </button>
              </>
            ) : (
              <>
                ¿No tenés cuenta?{' '}
                <button
                  onClick={() => setShowRegister(true)}
                  className="font-medium text-green-600 hover:underline"
                >
                  Registrarse
                </button>
              </>
            )}
          </p>
        </div>

        <p className="mt-4 text-center text-sm text-gray-500">
          <Link href="/" className="hover:underline">
            Volver al inicio
          </Link>
        </p>
      </div>
    </div>
  );
}
