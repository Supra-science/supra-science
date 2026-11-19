import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav, SiteFooter } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "من نحن",
  description:
    "سوبرا-ساينس ممارسة هندسية تقودها الخبرة، تبني البرمجيات وأنظمة الذكاء الاصطناعي والأجهزة المدمجة والنماذج العلمية الأولية — وتسلّمها أنظمة عاملة. تعرّف على منهجنا وكيف تتواصل معنا.",
  alternates: {
    canonical: "/ar/about",
    languages: { en: "/en/about", ar: "/ar/about", "x-default": "/ar/about" },
  },
};

export default function ArAboutPage() {
  return (
    <main className="shell" dir="rtl" lang="ar">
      <SiteNav lang="ar" />
      <section className="dashboard">
        <div className="eyebrow">من نحن</div>
        <h1 style={{ fontSize: 44, lineHeight: 1.5 }}>
          ممارسة هندسية تقودها الخبرة، <span className="gold">لا قالب جاهز.</span>
        </h1>
        <p className="lead">
          سوبرا-ساينس ممارسة تقنية وهندسية لها هدف واحد: تحويل الأفكار إلى
          أنظمة عاملة تُسلَّم وتعمل. نصمم ونبني البرمجيات وحلول الذكاء
          الاصطناعي والأجهزة المتصلة والنماذج العلمية الأولية — ونبقى
          مسؤولين عنها من أول محادثة حتى التسليم وما بعده.
        </p>

        <div className="panel" style={{ marginTop: 28 }}>
          <div className="eyebrow">كيف نفكر</div>
          <h2 style={{ fontSize: 28, margin: "12px 0", lineHeight: 1.7 }}>
            البرمجيات والذكاء والعتاد — <span className="gold">نظام واحد بقيادة واحدة.</span>
          </h2>
          <p className="lead" style={{ fontSize: 15 }}>
            معظم مشاريع التقنية تنهار عند الحد الفاصل بين التخصصات: تطبيق لا
            يطابق الجهاز، ونموذج لا يناسب سير العمل، ونموذج أولي لا يصبح
            منتجاً أبداً. نعمل عبر هذا الحد بقصد وخبرة. التطبيق والذكاء
            والعتاد تُصمم معاً، وتُحدد معاً، وتُسلَّم معاً — نظاماً واحداً
            يعمل.
          </p>
        </div>

        <div className="tiles" style={{ marginTop: 24 }}>
          <article className="tile">
            <h3>ماذا نفعل</h3>
            <p className="muted">
              المنتجات والتطبيقات الرقمية، أنظمة البرمجيات والذكاء الاصطناعي،
              الأجهزة المدمجة وإنترنت الأشياء، النماذج العلمية والطبية الأولية،
              وأتمتة الأعمال مع تكامل واتساب.{" "}
              <Link className="gold" href="/ar/services">← الخدمات</Link>
            </p>
          </article>
          <article className="tile">
            <h3>كيف نعمل</h3>
            <p className="muted">
              نبدأ باستشارة، ثم نطاق مكتوب بجدول زمني وعرض سعر. نقاط مراجعة
              أثناء البناء، واختبار صارم قبل التسليم، وتوثيق كامل عند التسليم.{" "}
              <Link className="gold" href="/ar/process">← منهجيتنا</Link>
            </p>
          </article>
          <article className="tile">
            <h3>ما الذي لن نفعله</h3>
            <p className="muted">
              لن نخترع أسعاراً أو شهادات أو عملاء أو اعتمادات. لن نقدّم نموذجاً
              أولياً على أنه جهاز طبي معتمد، ولا مسودة على أنها تصميم معتمد.
              ما ندّعيه، نستطيع إظهاره.
            </p>
          </article>
        </div>

        <div className="panel" style={{ marginTop: 24 }}>
          <div style={{ display: "flex", gap: 28, alignItems: "center", flexWrap: "wrap" }}>
            <img
              className="leader-photo"
              src="/leadership/dr-faisal-alradaei.webp"
              alt="د. فيصل الرداعي"
              width={600}
              height={600}
            />
            <div style={{ flex: "1 1 300px" }}>
              <div className="eyebrow">القيادة</div>
              <h2 style={{ fontSize: 30, margin: "12px 0 4px", lineHeight: 1.7 }}>
                د. فيصل الرداعي
              </h2>
              <p className="gold" style={{ fontSize: 15, fontWeight: 700, margin: "0 0 14px" }}>
                المدير — سوبرا ساينس
              </p>
            </div>
          </div>
          <p className="lead" style={{ fontSize: 15, marginTop: 18 }}>
            يقود سوبرا-ساينس د. فيصل الرداعي، جامعاً بين الممارسة الهندسية
            وخلفية في العلوم الطبية — ولهذا تُبنى نماذجنا العلمية والطبية
            الأولية بدقة غير معتادة في جودة القياس والتوثيق الصادق للقيود.
          </p>
        </div>

        <div className="panel" style={{ marginTop: 24, textAlign: "center", padding: "40px 30px" }}>
          <h2 style={{ fontSize: 30, margin: "0 0 12px", lineHeight: 1.6 }}>
            اعمل <span className="gold">معنا.</span>
          </h2>
          <p className="lead" style={{ margin: "0 auto 22px", maxWidth: 560 }}>
            أسرع طريق للبدء استشارة: صِف مشكلتك، وسنقول لك بصراحة إن كانت ضمن
            قدرتنا — وإن لم تكن، سنخبرك بذلك أيضاً.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link className="btn" href="/ar/contact">
              اطلب استشارة
            </Link>
            <a className="btn secondary" href="https://wa.me/19178183426">
              واتساب
            </a>
          </div>
          <p className="muted" style={{ marginTop: 18 }}>
            <a className="gold" href="mailto:Supra-science@proton.me">Supra-science@proton.me</a>
          </p>
        </div>
      </section>
      <SiteFooter lang="ar" />
    </main>
  );
}
