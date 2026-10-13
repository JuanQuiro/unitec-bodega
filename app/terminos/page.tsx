import Link from 'next/link';

export default function TerminosPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold">Términos del servicio</h1>
      <div className="space-y-4 text-gray-700">
        <p>
          Mi Bodega es una herramienta de catálogo digital y gestión de pedidos para bodegas.
          Al registrarte aceptás estos términos.
        </p>
        <h2 className="pt-2 text-xl font-semibold">1. El servicio</h2>
        <p>
          Proveemos catálogo público con link/QR, recepción de pedidos por WhatsApp, panel de
          gestión, reportes contables y exportables. La entrega de los productos y el cobro los
          gestiona cada bodega con sus clientes.
        </p>
        <h2 className="pt-2 text-xl font-semibold">2. Planes y pago</h2>
        <p>
          Las cuentas nuevas incluyen 14 días de prueba. Superado ese plazo, las funciones de
          carga de productos e importaciones requieren un plan activo. Las ventas a tus clientes
          nunca se bloquean.
        </p>
        <h2 className="pt-2 text-xl font-semibold">3. Tus datos</h2>
        <p>
          Sos responsable de la veracidad de precios, stock y datos de contacto que publiques.
          Podés exportar tu catálogo y tus ventas en cualquier momento.
        </p>
        <h2 className="pt-2 text-xl font-semibold">4. Uso aceptable</h2>
        <p>
          No está permitido publicar contenido ilegal, usar la plataforma para spam ni intentar
          acceder a datos de otras tiendas. El incumplimiento puede suspender la cuenta.
        </p>
      </div>
      <Link href="/" className="mt-8 inline-block text-green-700 hover:underline">
        ← Volver al inicio
      </Link>
    </div>
  );
}
