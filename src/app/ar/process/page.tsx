import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav, SiteFooter } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "منهجية العمل",
  description:
    "منهجية سوبرا-ساينس في التسليم: الاستشارة، التحديد، عرض السعر، التصميم والبناء، الاختبار، التسليم، والدعم.",
  alternates: {
    canonical: "/ar/process",
    languages: { en: "/en/process", ar: "/ar/process", "x-default": "/ar/process" },
  },
};

const PHASES = [
  {
    n: "01",
    title: "الاستشارة",
    text: "تصف المشكلة والهدف والقيود — في مكالمة أو عبر واتساب أو نموذج الاستشارة. نطرح الأسئلة الحاسمة التي تحدد جدوى المشروع وما إذا كنا الفريق الأقدر عليه.",
    out: "فهم مشترك للمشكلة.",
  },
  {
    n: "02",
    title: "المتطلبات والجدوى",
    text: "نحوّل الحوار إلى متطلبات مكتوبة ملزمة: ما الذي يجب أن يفعله النظام، وما الذي يجب ألا يفعله، وبيئة تشغيله، والبيانات التي يتعامل معها. وفي مشاريع الذكاء الاصطناعي والعتاد نصرّح علناً بما تستطيع التقنية تقديمه بموثوقية وما لا تستطيع — بلا مبالغة.",
    out: "وثيقة متطلبات تعتمدها.",
  },
  {
    n: "03",
    title: "النطاق والجدول وعرض السعر",
    text: "تستلم نطاقاً مكتوباً ملزماً: المخرجات والجدول الزمني والسعر وما يشمله وما يستثنيه وشروط الدفع. لا يبدأ شيء حتى تعتمده. وعروض الأسعار يراجعها إنسان خبير — ولا تُولَّد نهائية آلياً أبداً.",
    out: "نطاق وعرض سعر معتمدان.",
  },
  {
    n: "04",
    title: "التصميم والنمذجة",
    text: "المعمارية وتصميم الواجهات والنماذج الأولية — قبل أن يُكتب الكود. في أعمال الأنظمة المدمجة يعني ذلك برمجيات ثابتة ونماذج حساسات يمكنك رؤيتها واختبارها بنفسك؛ وفي البرمجيات نسخاً عاملة يمكنك تجربتها.",
    out: "تصاميم ونماذج لمراجعتك.",
  },
  {
    n: "05",
    title: "البناء ونقاط المراجعة",
    text: "يتقدم التطوير عبر نقاط مراجعة ملزمة. ترى التقدم عند مراحل محددة وتصحح المسار مبكراً — لا في النهاية حين يفوت الأوان.",
    out: "نظام يعمل، يُراجَع على مراحل.",
  },
  {
    n: "06",
    title: "الاختبار والتسليم",
    text: "اختبار وظيفي صارم مقابل المتطلبات المعتمدة، ثم التسليم: النشر والكود المصدري والتوثيق الكامل. النماذج الأولية تُسلَّم مع تقرير اختبار وقائمة موثقة بالقيود.",
    out: "نظام مختبَر وموثَّق ومُسلَّم.",
  },
  {
    n: "07",
    title: "الدعم",
    text: "نافذة دعم متفق عليها بعد التسليم للإصلاحات والأسئلة — نبقى معك بعد التسليم. الصيانة الأطول أو المراحل الجديدة تُسعَّر على حدة — ولا تُفترض أبداً.",
    out: "دعم محدد بعد التسليم.",
  },
];

export default function ArProcessPage() {
  return (
    <main className="shell" dir="rtl" lang="ar">
      <SiteNav lang="ar" />
      <section className="dashboard">
        <div className="eyebrow">المنهجية</div>
        <h1 style={{ fontSize: 44, lineHeight: 1.5 }}>
          كيف <span className="gold">نعمل.</span>
        </h1>
        <p className="lead">
          سبع مراحل، لكل منها مخرج واضح تعتمده قبل الانتقال. لا مفاجآت، ولا
          توسّع نطاق بالصدفة، ولا «ظننا أنك تقصد» عند التسليم — منهجية تقود مشروعك من الفكرة إلى
          نظام يعمل.
        </p>
        <div style={{ marginTop: 32 }}>
          {PHASES.map((p) => (
            <section key={p.n} className="panel" style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
                <div className="eyebrow" style={{ fontSize: 14, minWidth: 40 }}>{p.n}</div>
                <div style={{ flex: "1 1 320px" }}>
                  <h2 style={{ fontSize: 26, margin: "0 0 10px" }}>{p.title}</h2>
                  <p className="lead" style={{ fontSize: 15 }}>{p.text}</p>
                  <p style={{ fontSize: 13, marginBottom: 0 }}>
                    <span className="gold">المخرج: </span>
                    <span className="muted">{p.out}</span>
                  </p>
                </div>
              </div>
            </section>
          ))}
        </div>
        <div className="panel" style={{ textAlign: "center", padding: "40px 30px" }}>
          <h2 style={{ fontSize: 30, margin: "0 0 12px", lineHeight: 1.6 }}>
            ابدأ من <span className="gold">المرحلة 01.</span>
          </h2>
          <p className="lead" style={{ margin: "0 auto 22px", maxWidth: 560 }}>
            كل مشروع يبدأ باستشارة. صِف فكرتك — ونقود بقية العملية حتى التسليم.
          </p>
          <Link className="btn" href="/ar/contact">
            اطلب استشارة
          </Link>
        </div>
      </section>
      <SiteFooter lang="ar" />
    </main>
  );
}
