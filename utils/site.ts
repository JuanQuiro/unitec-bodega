// Número de WhatsApp de SOPORTE de la plataforma (no del bodeguero).
// Cambialo por tu número real con formato internacional, sin "+" ni espacios.
export const SUPPORT_WHATSAPP = '584120000000';

export const supportLink = (text: string) =>
  `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(text)}`;
