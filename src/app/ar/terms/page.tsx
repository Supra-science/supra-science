import type { Metadata } from "next";
import { SiteNav, SiteFooter } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "الشروط والأحكام",
  description:
    "الشروط المنظمة لاستخدام موقع سوبرا-ساينس وبوابة العملاء وعروض الأسعار والمشاريع.",
  alternates: {
    canonical: "/ar/terms",
    languages: { en: "/en/terms", ar: "/ar/terms", "x-default": "/ar/terms" },
  },
};

export default function ArTermsPage() {
  return (
    <main className="shell" dir="rtl" lang="ar">
      <SiteNav lang="ar" />
      <section className="dashboard" style={{ maxWidth: 860 }}>
        <div className="eyebrow">قانوني</div>
        <h1 style={{ fontSize: 44, lineHeight: 1.5 }}>
          الشروط <span className="gold">والأحكام</span>
        </h1>
        <p className="muted">آخر تحديث: نوفمبر 2026. تنظم هذه الشروط استخدامك لموقع سوبرا-ساينس وبوابة العملاء. شروط كل مشروع تُحدد في النطاق وعرض السعر المعتمدين، وهي المرجع لذلك المشروع.</p>

        <div className="tile" style={{ marginTop: 24 }}>
          <h3>1. الخدمات</h3>
          <p className="muted">
            تقدم سوبرا-ساينس خدمات البرمجيات والذكاء الاصطناعي والأنظمة
            المدمجة/إنترنت الأشياء والنماذج العلمية الأولية وأتمتة الأعمال كما
            هو موصوف في صفحة الخدمات. كل مشروع يُحدد بنطاق مكتوب وجدول زمني
            وعرض سعر تعتمده قبل بدء العمل.
          </p>
        </div>
        <div className="tile" style={{ marginTop: 12 }}>
          <h3>2. عروض الأسعار والدفع</h3>
          <p className="muted">
            يحدد عرض السعر السعر وما يشمله وما يستثنيه والجدول الزمني ومدة
            الصلاحية وشروط الدفع. يصبح عرض السعر ملزماً عند قبولك له كتابياً.
            تتم المدفوعات عبر صفحات مستضافة لدى مزود معتمد؛ ولا نجمع بيانات
            البطاقات مباشرة أبداً.
          </p>
        </div>
        <div className="tile" style={{ marginTop: 12 }}>
          <h3>3. المحتوى المولّد بالذكاء الاصطناعي</h3>
          <p className="muted">
            مسودات المعماريات وردود المساعد وثائق عمل أولية موسومة بوضوح
            كمسودات. ليست تصاميم هندسية معتمدة، ويجب ألا تُعامل كتصاميم معتمدة
            أو حرجة للسلامة أو صالحة طبياً دون مراجعة مختص مؤهل واختبارات
            مناسبة.
          </p>
        </div>
        <div className="tile" style={{ marginTop: 12 }}>
          <h3>4. النماذج الأولية وقيودها</h3>
          <p className="muted">
            تُسلَّم نماذج العتاد والنماذج العلمية بقدرات وقيود موثقة. ليست
            أجهزة طبية معتمدة ولا تصلح للتشخيص السريري أو الاستخدام الحرج
            للسلامة ما لم تُعتمد وتُوثَّق صراحة كذلك.
          </p>
        </div>
        <div className="tile" style={{ marginTop: 12 }}>
          <h3>5. الملكية الفكرية</h3>
          <p className="muted">
            عند السداد الكامل والتسليم تستلم المخرجات المحددة في نطاقك، بما
            فيها الكود المصدري والتوثيق، كما ينص النطاق المعتمد. وتبقى الأدوات
            والمكتبات ومكونات المنصة السابقة ملكاً لأصحابها.
          </p>
        </div>
        <div className="tile" style={{ marginTop: 12 }}>
          <h3>6. الاستخدام المقبول</h3>
          <p className="muted">
            توافق على عدم إساءة استخدام البوابة أو محاولة الوصول غير المصرح أو
            التدخل في بيانات المستخدمين الآخرين أو إدخال محتوى غير قانوني. قد
            نعلّق الحسابات المخالفة لهذه الشروط.
          </p>
        </div>
        <div className="tile" style={{ marginTop: 12 }}>
          <h3>7. المسؤولية</h3>
          <p className="muted">
            نقدّم عملاً هندسياً مهنياً بعناية معقولة، لكننا لا نضمن نتائج
            أعمال محددة. وتقتصر مسؤوليتنا عن أي مشروع على الرسوم المدفوعة عنه،
            إلا حيث لا يجيز القانون هذا التحديد.
          </p>
        </div>
        <div className="tile" style={{ marginTop: 12 }}>
          <h3>8. التواصل</h3>
          <p className="muted">
            لأسئلة حول هذه الشروط:{" "}
            <a className="gold" href="mailto:Supra-science@proton.me">Supra-science@proton.me</a>.
          </p>
        </div>
      </section>
      <SiteFooter lang="ar" />
    </main>
  );
}
