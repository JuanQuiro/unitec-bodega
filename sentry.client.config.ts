// Monitoreo de errores (Sentry gratis). Crear proyecto en sentry.io y
// pegar el DSN en NEXT_PUBLIC_SENTRY_DSN. Sin DSN el SDK queda inactivo.
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || undefined,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
});
