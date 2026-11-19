/**
 * WhatsApp deep-link builders — client-safe, zero cost, no API.
 * These only CONSTRUCT wa.me links; the visitor's own WhatsApp app sends
 * the message. Nothing here touches the Cloud API or any secret.
 */

export const WHATSAPP_NUMBER = "19178183426";
export const WHATSAPP_DISPLAY = "+1 (917) 818-3426";

/** wa.me deep link carrying a pre-filled message. */
export function serviceRequestLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/**
 * Build a pre-filled WhatsApp request message for a service.
 * Pure function — used by the on-site request composer.
 */
export function buildServiceRequestMessage(opts: {
  serviceTitle: string;
  lang?: "en" | "ar";
  name?: string;
  requirement?: string;
}): string {
  const { serviceTitle, lang = "en", name = "", requirement = "" } = opts;
  if (lang === "ar") {
    const lines = ["طلب خدمة من سوبرا-ساينس", `الخدمة: ${serviceTitle}`];
    if (name.trim()) lines.push(`الاسم: ${name.trim()}`);
    if (requirement.trim()) lines.push(`المتطلبات: ${requirement.trim()}`);
    lines.push("أرجو التواصل معي بخصوص عرض سعر.");
    return lines.join("\n");
  }
  const lines = ["Service request — Supra-Science", `Service: ${serviceTitle}`];
  if (name.trim()) lines.push(`Name: ${name.trim()}`);
  if (requirement.trim()) lines.push(`Requirements: ${requirement.trim()}`);
  lines.push("Please contact me with a quotation.");
  return lines.join("\n");
}
