import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav, SiteFooter } from "@/components/site-chrome";
import { HeroVisual } from "@/components/hero-visual";
import { FreeOffers } from "@/components/free-offers";
import FaqSection, { FaqJsonLd } from "@/components/faq-section";

export const metadata: Metadata = {
  title: {
    absolute: "سوبرا-ساينس | هندسة وبرمجيات وذكاء اصطناعي وأنظمة مترابطة",
  },
  description:
    "سوبرا-ساينس تصمم وتبني البرمجيات وأنظمة الذكاء الاصطناعي والأجهزة المتصلة والتقنيات العلمية — من المتطلبات إلى تسليم نظام يعمل، بقيادة فريق واحد يتحمل مسؤوليته كاملة. اطلب استشارة.",
  alternates: {
    canonical: "/ar",
    languages: { en: "/en", ar: "/ar", "x-default": "/ar" },
  },
};

const PRICE_NOTE =
  "سعر استرشادي أولي — يُحدَّد السعر النهائي في عرض السعر المكتوب بعد مراجعة نطاق مشروعك.";

const SERVICES = [
  {
    href: "/ar/services#digital-products",
    title: "المنتجات والتطبيقات الرقمية",
    text: "تطبيقات الويب وiOS وأندرويد، بوابات العملاء، لوحات الإدارة، قواعد البيانات وواجهات API — نبنيها حول سير عملك، لا حول قالب جاهز.",
    img: "/services/digital-products.webp",
    w: 1200,
    h: 675,
    price: 3500,
  },
  {
    href: "/ar/services#software-ai",
    title: "البرمجيات والذكاء الاصطناعي",
    text: "أنظمة بايثون، تكامل نماذج اللغة، تحليل البيانات، أتمتة سير العمل، والرؤية الحاسوبية — حيث تثبت التقنية جدواها في نطاقك.",
    img: "/services/software-ai.webp",
    w: 1200,
    h: 675,
    price: 4500,
  },
  {
    href: "/ar/services#embedded-iot",
    title: "الأنظمة المدمجة وإنترنت الأشياء",
    text: "برمجة أردوينو وESP32، الحساسات، الربط بين الأجهزة والسحابة، والنماذج الأولية — وتصميم دوائر يتحمل ظروف التشغيل الحقيقية.",
    img: "/services/embedded-iot.webp",
    w: 1200,
    h: 675,
    price: 3500,
  },
  {
    href: "/ar/services#scientific",
    title: "النماذج العلمية والطبية الأولية",
    text: "نماذج حساسات، تجميع الإشارات ومعالجتها، لوحات مراقبة، وتوثيق هندسي وبحثي دقيق — بقياس موثوق وقيود موثقة بصدق.",
    img: "/services/scientific.webp",
    w: 1200,
    h: 675,
    price: 6500,
  },
  {
    href: "/ar/services#automation",
    title: "أتمتة الأعمال وواتساب",
    text: "مساعدو خدمة عملاء، تكامل WhatsApp Cloud API، سير عمل CRM، إشعارات، ولوحات متابعة — نحوّل مراسلاتك إلى نظام يعمل.",
    img: "/services/automation.webp",
    w: 1200,
    h: 675,
    price: 1500,
  },
];

type SampleCard = {
  href: string;
  title: string;
  text: string;
  label: string;
  lo?: number;
  hi?: number;
  moLo?: number;
  moHi?: number;
  per?: number;
  pack?: number;
};

/* الأسعار أرقام تُنسَّق عند العرض، مثل SERVICES أعلاه — اختبار الموقع
   العام يمنع الأسعار الحرفية في مصدر الصفحة. */
const SAMPLES: SampleCard[] = [
  {
    href: "/files/samples/suprastat-clinical-biostatistics-sample.pdf",
    title: "SupraStat™ — التحليل الإحصائي",
    text: "إحصاء طبي وأكاديمي (SPSS / R / Python).",
    lo: 49,
    hi: 149,
    label: "عرض تقرير العينة (PDF، صفحتان)",
  },
  {
    href: "/files/samples/supraflow-whatsapp-ai-clinic-blueprint.pdf",
    title: "SupraFlow™ — أتمتة واتساب والذكاء الاصطناعي",
    text: "واتساب أعمال ذكي للعيادات والشركات.",
    lo: 149,
    hi: 299,
    moLo: 39,
    moHi: 69,
    label: "عرض مخطط العينة (PDF، صفحتان)",
  },
  {
    href: "/files/samples/supramed-osce-oral-exam-sample.pdf",
    title: "SupraMed™ — التدريب السريري OSCE وSMLE",
    text: "تدريب سريري مكثف فردي لاختبارات OSCE وSMLE.",
    per: 25,
    pack: 89,
    label: "عرض عينة 10 صفحات (PDF)",
  },
  {
    href: "/files/samples/06-suprapub-sample.pdf",
    title: "SupraPub™ — تحرير المنشورات",
    text: "تحرير مخطوطات طبية وأكاديمية — عينة قبل/بعد.",
    lo: 59,
    hi: 129,
    label: "عرض عينة التحرير (PDF، صفحتان)",
  },
];

function samplePrice(s: SampleCard): string {
  if (s.moLo !== undefined) return `$${s.lo}–$${s.hi} تأسيس + $${s.moLo}–$${s.moHi} / شهرياً`;
  if (s.per !== undefined) return `$${s.per} / للجلسة · $${s.pack} لأربع جلسات`;
  return `$${s.lo}–$${s.hi}`;
}

const EVALUATE = [
  {
    title: "تحديد المشكلة",
    text: "نبدأ من المشكلة لا من التقنية: ما الذي يجب أن يتغير، ولمن، وكيف تقيس نجاحه — قبل أن يُكتب سطر واحد.",
    out: "بيان مكتوب بالمشكلة.",
  },
  {
    title: "تقييم الجدوى",
    text: "نُخضع الفكرة لاختبار صارم: الفيزياء والبيانات والميزانية والجدول الزمني — ونقول لك بصراحة إن لم تكن قابلة للتنفيذ.",
    out: "قرار مضي/توقف مع الأسباب.",
  },
  {
    title: "المعمارية التقنية",
    text: "نصمم النظام قبل أن نكتب الكود: المكونات وتدفق البيانات والتكاملات والمخاطر وحدود ما سيُبنى — فلا مفاجآت أثناء البناء.",
    out: "مسودة معمارية تراجعها.",
  },
  {
    title: "النطاق وعرض السعر والتسليم",
    text: "نطاق مكتوب ثابت وجدول زمني وسعر ملزم. نقاط مراجعة أثناء البناء، ثم اختبار وتوثيق وتسليم — ونسلّم ما تعاقدنا عليه.",
    out: "نظام مسلَّم وموثق.",
  },
];

const WHY = [
  {
    title: "فريق واحد مسؤول",
    text: "البرمجيات والعتاد والذكاء الاصطناعي في يد واحدة — مسؤولية كاملة لا تتشتت بين موردين.",
  },
  {
    title: "تحديد هندسي أولاً",
    text: "نحدد بدقة ما سيُبنى وتكلفته وما يستثنيه — قبل أن يبدأ أي عمل.",
  },
  {
    title: "عروض أسعار صادقة",
    text: "كل رقم يراجعه إنسان ويرتبط بنطاق مكتوب — لا باقات مخترعة ولا أرقام من فراغ.",
  },
  {
    title: "تواصل مباشر",
    text: "تحدث مباشرة مع الفريق الذي يبني نظامك — لا وسطاء ولا رسائل آلية — بالبريد أو واتساب، بالعربية أو الإنجليزية.",
  },
];

export default function ArHomePage() {
  return (
    <main className="shell">
      <SiteNav lang="ar" />

      {/* HERO */}
      <section className="hero">
        <div>
          <div className="eyebrow">Engineering · AI · Connected Systems</div>
          <h1 className="reveal reveal-2">
            نصمم ونبني <span className="gold">التقنية المترابطة</span> — برمجيات وذكاء وعتاد، بقيادة واحدة وتسليم واحد.
          </h1>
          <p className="lead reveal reveal-3">
            سوبرا-ساينس ممارسة هندسية تقودها الخبرة. نقود الفكرة من المتطلبات، عبر المعمارية
            والنماذج الأولية، حتى تسليم نظام يعمل — للشركات التي تحتاج برمجيات أو أنظمة ذكاء
            اصطناعي أو أجهزة متصلة أو نماذج علمية أولية، يبنيها فريق واحد يتحمل مسؤوليتها كاملة.
          </p>
          <div className="reveal reveal-4" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
            <Link className="btn" href="/ar/contact">
              اطلب استشارة
            </Link>
            <Link className="btn secondary" href="/ar/services">
              استكشف الخدمات
            </Link>
          </div>
        </div>
        <div className="reveal reveal-3">
          <HeroVisual lang="ar" />
          <p className="muted" style={{ fontSize: 12, marginTop: 10, textAlign: "center" }}>
            ممارسة واحدة بقيادة واحدة — خمسة مجالات هندسية مترابطة.
          </p>
        </div>
      </section>

      {/* STAT STRIP */}
      <section className="section" style={{ paddingTop: 0, paddingBottom: 0 }}>
        <div className="statstrip reveal reveal-5">
          <div className="stat"><strong>EN / AR</strong><span>تنفيذ ثنائي اللغة</span></div>
          <div className="stat"><strong>5</strong><span>مجالات خدمية</span></div>
          <div className="stat"><strong>جهة واحدة</strong><span>تتحمل المسؤولية كاملة</span></div>
          <div className="stat"><strong>✓</strong><span>عروض تُبنى على النطاق</span></div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="section">
        <div className="section-head">
          <div className="eyebrow">الخدمات</div>
          <h2>
            مجالات <span className="gold">قوتنا</span>
          </h2>
          <p className="lead">
            خمسة مجالات هندسية تقودها خبرة واحدة متكاملة. كل تعاقد يُحدَّد نطاقه ويُسعَّر بدقة
            على حدة —{" "}
            <Link className="gold" href="/ar/contact">اطلب عرض سعر</Link> لمشروعك.
          </p>
        </div>
        <div className="tiles-2">
          {SERVICES.map((s) => (
            <Link key={s.href} href={s.href} className="tile" style={{ textDecoration: "none", color: "inherit" }}>
              <div className="service-img-wrap" style={{ marginBottom: 14 }}>
                <img src={s.img} alt={s.title} loading="lazy" width={s.w} height={s.h} />
              </div>
              <h3>{s.title}</h3>
              <p className="muted">{s.text}</p>
              <p style={{ margin: "10px 0 4px" }}>
                <span className="gold" style={{ fontWeight: 700 }}>
                  يبدأ من ${s.price.toLocaleString("en-US")}
                </span>
              </p>
              <p className="muted" style={{ fontSize: 12.5, margin: "0 0 4px" }}>
                {PRICE_NOTE}
              </p>
              <span className="gold" style={{ fontSize: 13 }}>اعرف المزيد ←</span>
            </Link>
          ))}
          <div className="tile" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <h3>لا تعرف من أين تبدأ؟</h3>
            <p className="muted">
              صف مشكلتك في استشارة — وسنقول لك بصراحة ووضوح إن كانت ضمن قدرتنا.
            </p>
            <Link className="gold" style={{ fontSize: 13 }} href="/ar/contact">
              تحدث معنا ←
            </Link>
          </div>
        </div>
      </section>

      {/* WORK SAMPLES */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="section-head">
          <div className="eyebrow">عينات أعمال</div>
          <h2>
            شاهد العمل <span className="gold">قبل أن تقرر</span>
          </h2>
          <p className="lead">
            عينات حقيقية مما تقدمه باقات التنفيذ السريع — افتح ملف PDF واحكم
            على الجودة بنفسك.
          </p>
        </div>
        <div className="tiles-2">
          {SAMPLES.map((s) => (
            <a
              key={s.href}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="tile"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <h3>{s.title}</h3>
              <p className="muted">{s.text}</p>
              <p style={{ margin: "10px 0 4px" }}>
                <span className="gold" style={{ fontWeight: 700 }}>
                  {samplePrice(s)}
                </span>
              </p>
              <p className="muted" style={{ fontSize: 12.5, margin: "0 0 4px" }}>
                {PRICE_NOTE}
              </p>
              <span className="gold" style={{ fontSize: 13 }}>{s.label} ←</span>
            </a>
          ))}
          <div className="tile" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <h3>باقات التنفيذ السريع الأربع</h3>
            <p className="muted">
              SupraStat وSupraPub وSupraMed وSupraFlow — نطاقات استرشادية
              ثابتة، وبنفس انضباط النطاق المكتوب.
            </p>
            <Link className="gold" style={{ fontSize: 13 }} href="/ar/services#quick-launch">
              اطلع على الباقات ←
            </Link>
          </div>
        </div>
      </section>

      {/* FREE OFFERS */}
      <section className="section" style={{ paddingTop: 0 }}>
        <FreeOffers lang="ar" />
      </section>

      {/* EVALUATION */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="section-head">
          <div className="eyebrow">التعاقد</div>
          <h2>
            كيف <span className="gold">نقيّم</span> مشروعك بصرامة
          </h2>
          <p className="lead">
            قبل أي عرض سعر، تمر فكرتك عبر أربع بوابات صارمة. إن أخفقت في واحدة أخبرناك بالسبب —
            قبل أن تنفق فلساً واحداً.
          </p>
        </div>
        <div className="tiles-4">
          {EVALUATE.map((e, i) => (
            <article key={e.title} className="tile">
              <div className="eyebrow">0{i + 1}</div>
              <h3 style={{ marginTop: 8 }}>{e.title}</h3>
              <p className="muted">{e.text}</p>
              <p style={{ fontSize: 12.5, marginBottom: 0 }}>
                <span className="gold">تستلم: </span>
                <span className="muted">{e.out}</span>
              </p>
            </article>
          ))}
        </div>
        <p style={{ marginTop: 18 }}>
          <Link className="gold" href="/ar/process">
            اطلع على منهجية التسليم الكاملة ←
          </Link>
        </p>
      </section>

      {/* WHY */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="section-head">
          <div className="eyebrow">لماذا سوبرا-ساينس</div>
          <h2>
            الوضوح أساسنا، <span className="gold">والالتزام قوتنا</span>
          </h2>
        </div>
        <div className="tiles-2">
          {WHY.map((w) => (
            <article key={w.title} className="tile">
              <h3>{w.title}</h3>
              <p className="muted">{w.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* LEADERSHIP */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="panel">
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
              <h2 style={{ fontSize: 30, margin: "10px 0 4px" }}>د. فيصل الرداعي</h2>
              <p className="gold" style={{ fontWeight: 700, margin: "0 0 10px" }}>المدير — سوبرا ساينس</p>
              <p className="muted" style={{ margin: 0 }}>
                ممارسة هندسية يقودها مؤسسها بيد ثابتة — تجمع بين هندسة البرمجيات والأنظمة وخلفية
                في العلوم الطبية. كل نطاق وعرض سعر يمر على المدير ويراجعه بنفسه قبل أن يصلك.
              </p>
            </div>
            <Link className="btn secondary" href="/ar/about">
              عن الممارسة
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="section-head">
          <div className="eyebrow">الأسئلة الشائعة</div>
          <h2>
            أسئلة <span className="gold">وأجوبة.</span>
          </h2>
          <p className="lead">
            الأسئلة التي يطرحها العملاء قبل أن يقرروا. ولأي شيء آخر —{" "}
            <Link className="gold" href="/ar/contact">اسألنا مباشرة</Link> — نجيبك بوضوح.
          </p>
        </div>
        <FaqSection lang="ar" />
        <FaqJsonLd lang="ar" />
        <p style={{ marginTop: 18 }}>
          <Link className="gold" href="/ar/faq">
            اطلع على كل الأسئلة ←
          </Link>
        </p>
      </section>

      {/* CONTACT */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="section-head">
          <div className="eyebrow">تواصل معنا</div>
          <h2>
            تحدث إلى <span className="gold">سوبرا-ساينس</span>
          </h2>
          <p className="lead">
            أخبرنا عن مشروعك — وسيرد عليك من يبنيه، بالعربية أو الإنجليزية.
          </p>
        </div>
        <div className="channels">
          <a className="channel" href="/ar/contact">
            <span className="ic">✎</span>
            <span><b>نموذج الاستشارة</b><span>صف مشروعك — نرد بنطاق وعرض سعر.</span></span>
          </a>
          <a className="channel" href="https://wa.me/19178183426?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20%D8%B3%D9%88%D8%A8%D8%B1%D8%A7-%D8%B3%D8%A7%D9%8A%D9%86%D8%B3%D8%8C%20%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A3%D9%86%20%D8%A3%D8%A8%D8%AF%D8%A3%20%D9%85%D8%B4%D8%B1%D9%88%D8%B9%D8%A7%D9%8B.">
            <span className="ic">◉</span>
            <span><b>واتساب — +1 (917) 818-3426</b><span>خط مباشر للأسئلة والقرارات السريعة.</span></span>
          </a>
          <a className="channel" href="mailto:Supra-science@proton.me">
            <span className="ic">@</span>
            <span><b>Supra-science@proton.me</b><span>البريد الرسمي للعروض والمستندات.</span></span>
          </a>
          <Link className="channel" href="/ar/faq">
            <span className="ic">?</span>
            <span><b>الأسئلة الشائعة</b><span>النطاق والجداول الزمنية وعروض الأسعار ومنهجية العمل — بإجابات واضحة.</span></span>
          </Link>
        </div>
        <p style={{ marginTop: 18 }}>
          <Link className="gold" href="/ar/contact">
            افتح نموذج التواصل الكامل ←
          </Link>
        </p>
      </section>

      <SiteFooter lang="ar" />
    </main>
  );
}
