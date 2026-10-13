import Link from 'next/link';

export default function PrivacidadPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold">Política de privacidad</h1>
      <div className="space-y-4 text-gray-700">
        <p>Respetamos tus datos. Esto es lo que guardamos y por qué.</p>
        <h2 className="pt-2 text-xl font-semibold">Qué guardamos</h2>
        <p>
          Tu email (para ingresar), los datos de tu tienda, tu catálogo, tus pedidos, pagos,
          gastos y cierres. Los datos de tus clientes (nombre, teléfono, dirección) solo se
          usan para gestionar sus pedidos.
        </p>
        <h2 className="pt-2 text-xl font-semibold">Qué NO hacemos</h2>
        <p>
          No vendemos datos, no mostramos publicidad con ellos y no los compartimos con
          terceros salvo requerimiento legal.
        </p>
        <h2 className="pt-2 text-xl font-semibold">Tus derechos</h2>
        <p>
          Podés pedir una copia de tus datos (exportables del panel) o la eliminación de tu
          cuenta escribiéndonos por el canal de soporte.
        </p>
      </div>
      <Link href="/" className="mt-8 inline-block text-green-700 hover:underline">
        ← Volver al inicio
      </Link>
    </div>
  );
}
