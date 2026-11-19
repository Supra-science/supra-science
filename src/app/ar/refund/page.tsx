import type { Metadata } from "next";
import { SiteNav, SiteFooter } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "سياسة الاسترداد وإلغاء الخدمات",
  description:
    "شروط واضحة للاسترداد والإلغاء والمراجعة على أساس المراحل لمشاريع وخدمات سوبرا-ساينس الهندسية والعلمية.",
  alternates: {
    canonical: "/ar/refund",
    languages: { en: "/en/refund", ar: "/ar/refund", "x-default": "/ar/refund" },
  },
};

export default function ArRefundPage() {
  return (
    <main className="shell" dir="rtl" lang="ar">
      <SiteNav lang="ar" />
      <section className="dashboard" style={{ maxWidth: 860 }}>
        <div className="eyebrow">قانوني</div>
        <h1 style={{ fontSize: 44, lineHeight: 1.5 }}>
          سياسة الاسترداد <span className="gold">وإلغاء الخدمات</span>
        </h1>
        <p className="muted">آخر تحديث: نوفمبر 2026. تخضع جميع المشاريع والباقات في سوبرا-ساينس لنطاق مكتوب وعرض سعر يُعتمدان قبل السداد. تضمن هذه السياسة حماية حقوق العميل وجودة المخرجات.</p>

        <div className="tile" style={{ marginTop: 24 }}>
          <h3>1. استرداد كامل قبل بدء التنفيذ</h3>
          <p className="muted">
            يحق للعميل استرداد كامل المبلغ المدفوع (مخصوماً منه رسوم التحويل
            الخارجية إن وجدت) في حال طلب الإلغاء قبل بدء التنفيذ الفعلي أو
            التحليل الإحصائي أو التدريب المباشر، أو في حال تأخر التسليم عن
            الموعد المكتوب دون عذر أو تمديد معتمد من العميل.
          </p>
        </div>
        <div className="tile" style={{ marginTop: 12 }}>
          <h3>2. الحماية المرحلية للمشاريع</h3>
          <p className="muted">
            في المشاريع المقسمة إلى مراحل، تُحتسب المستحقات لكل مرحلة منجزة
            ومعتمدة على حدة؛ وعند طلب الإيقاف أثناء المشروع، تُسترد كامل
            المبالغ المتبقية للمراحل غير المنفذة، بينما لا تُسترد المراحل
            المنجزة والمعتمدة.
          </p>
        </div>
        <div className="tile" style={{ marginTop: 12 }}>
          <h3>3. المراجعة والتعديل المجاني</h3>
          <p className="muted">
            تشمل جميع الباقات جولتي (2) تعديل مجانيتين خلال 7 أيام من التسليم
            لضمان مطابقة المخرجات للنطاق المتفق عليه.
          </p>
        </div>
        <div className="tile" style={{ marginTop: 12 }}>
          <h3>4. تسليم الملفات المصدرية النهائية</h3>
          <p className="muted">
            بعد معاينة العميل للمسودة واعتمادها واستلام الملفات المصدرية
            المفتوحة أو المنتجات الرقمية القابلة للتحميل، يُعتبر التسليم
            نهائياً ولا يخضع للاسترداد.
          </p>
        </div>
        <div className="tile" style={{ marginTop: 12 }}>
          <h3>5. كيفية طلب الإلغاء أو الاسترداد</h3>
          <p className="muted">
            تواصل معنا عبر البريد الرسمي{" "}
            <a className="gold" href="mailto:Supra-science@proton.me">Supra-science@proton.me</a>{" "}
            أو عبر واتساب{" "}
            <a className="gold" href="https://wa.me/19178183426">+1 (917) 818-3426</a>{" "}
            مع ذكر رقم عرض السعر. تُعاد المبالغ المستردة عبر قناة الدفع نفسها
            حيثما أمكن.
          </p>
        </div>
      </section>
      <SiteFooter lang="ar" />
    </main>
  );
}
