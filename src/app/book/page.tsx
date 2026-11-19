import type { Metadata } from "next";
import { SiteNav, SiteFooter } from "@/components/site-chrome";
import { BookingForm } from "@/components/booking-form";

export const metadata: Metadata = {
  title: "Book a free consultation",
  description:
    "Book a free 30-minute consultation with Supra-Science — Sunday to Thursday, 10:00–18:00 Aden time (UTC+3), on Google Meet.",
  alternates: {
    canonical: "/book",
    languages: { en: "/en/book", ar: "/ar/book", "x-default": "/ar/book" },
  },
};

export default function BookPage() {
  return (
    <main className="shell">
      <SiteNav lang="en" />
      <section className="hero">
        <div>
          <div className="eyebrow">Free consultation</div>
          <h1>
            Book a <span className="gold">consultation</span>
          </h1>
          <p className="lead">
            A free 30-minute video call to understand your project in depth —
            no obligation. Pick a time that suits you; the meeting runs on
            Google Meet and a calendar invitation is sent to your email.
          </p>
          <p className="muted" style={{ fontSize: 14 }}>
            Available Sunday–Thursday, 10:00–18:00 Aden time (UTC+3). Prefer
            to write first?{" "}
            <a href="/contact" style={{ color: "#6366F1" }}>
              Send us a message
            </a>{" "}
            or{" "}
            <a href="https://wa.me/19178183426" style={{ color: "#6366F1" }}>
              chat on WhatsApp
            </a>
            .
          </p>
        </div>
      </section>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px 80px" }}>
        <BookingForm lang="en" />
      </div>
      <SiteFooter lang="en" />
    </main>
  );
}
