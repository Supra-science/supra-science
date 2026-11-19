import type { Metadata } from "next";
import { SiteNav, SiteFooter } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "سياسة الخصوصية",
  description:
    "كيف تجمع سوبرا-ساينس بياناتك وتستخدمها وتحميها عند استخدام موقعنا وبوابة العملاء.",
  alternates: {
    canonical: "/ar/privacy",
    languages: { en: "/en/privacy", ar: "/ar/privacy", "x-default": "/ar/privacy" },
  },
};

export default function ArPrivacyPage() {
  return (
    <main className="shell" dir="rtl" lang="ar">
      <SiteNav lang="ar" />
      <section className="dashboard" style={{ maxWidth: 860 }}>
        <div className="eyebrow">قانوني</div>
        <h1 style={{ fontSize: 44, lineHeight: 1.5 }}>
          سياسة <span className="gold">الخصوصية</span>
        </h1>
        <p className="muted">آخر تحديث: نوفمبر 2026. تصف هذه السياسة كيفية تعامل سوبرا-ساينس مع معلوماتك. كُتبت لأنظمتنا الفعلية.</p>

        <div className="tile" style={{ marginTop: 24 }}>
          <h3>1. ما الذي نجمعه</h3>
          <p className="muted">
            عندما تتواصل معنا أو تستخدم بوابة العملاء، نجمع المعلومات التي
            تقدمها: اسمك وبريدك ورقم هاتفك وشركتك وأوصاف مشاريعك والملفات
            المرفوعة والرسائل. وعند إنشاء حساب نخزن بيانات الدخول بأمان ونربط
            مشاريعك وعروض أسعارك ومحادثاتك بحسابك.
          </p>
        </div>
        <div className="tile" style={{ marginTop: 12 }}>
          <h3>2. لماذا نجمعها</h3>
          <p className="muted">
            للرد على استفساراتك، وإعداد النطاقات وعروض الأسعار، وتنفيذ
            المشاريع، وتشغيل بوابة العملاء، والتواصل بشأن مشاريعك. لا نبيع
            بياناتك الشخصية.
          </p>
        </div>
        <div className="tile" style={{ marginTop: 12 }}>
          <h3>3. من يستطيع الوصول إليها</h3>
          <p className="muted">
            أعضاء فريق سوبرا-ساينس المخولون فقط. بيانات بوابتك معزولة بالحساب:
            لا يستطيع العملاء الآخرون رؤية مشاريعك أو عروضك أو رسائلك، وهذا
            العزل مفروض على مستوى الخادم لا في الواجهة فقط.
          </p>
        </div>
        <div className="tile" style={{ marginTop: 12 }}>
          <h3>4. مزايا الذكاء الاصطناعي</h3>
          <p className="muted">
            عند استخدام المساعد أو مولّد المعماريات تُعالَج مدخلاتك لتوليد
            الردود وقد تُحفظ ضمن سجل محادثاتك أو مسوداتك في حسابك. لا تُدخل
            أسراراً أو بيانات اعتماد أو بيانات شخصية منظمة عبر هذه الأدوات.
          </p>
        </div>
        <div className="tile" style={{ marginTop: 12 }}>
          <h3>5. المدفوعات</h3>
          <p className="muted">
            تُعالَج المدفوعات عبر صفحات مستضافة لدى مزود دفع معتمد. لا نطلب
            أرقام البطاقات ولا نستلمها ولا نخزنها أبداً.
          </p>
        </div>
        <div className="tile" style={{ marginTop: 12 }}>
          <h3>6. الاحتفاظ وحقوقك</h3>
          <p className="muted">
            نحتفظ بسجلات المشاريع والتواصل بالقدر اللازم لتشغيل حسابك والوفاء
            بالالتزامات القانونية. يمكنك طلب نسخة من بياناتك الشخصية أو
            تصحيحها أو حذفها عبر{" "}
            <a className="gold" href="mailto:Supra-science@proton.me">Supra-science@proton.me</a>.
            وقد يلزم الاحتفاظ ببعض السجلات (كعروض الأسعار والفواتير الصادرة)
            لأغراض المحاسبة.
          </p>
        </div>
        <div className="tile" style={{ marginTop: 12 }}>
          <h3>7. الأمن</h3>
          <p className="muted">
            نطبق التحقق من المصادقة على كل طلب، والتحكم بالوصول حسب الدور،
            والعزل على مستوى قاعدة البيانات، والتحقق من المدخلات، وتحديد معدل
            الطلبات على النقاط الحساسة. لا يوجد نظام آمن تماماً؛ نراقب ونحسّن
            باستمرار.
          </p>
        </div>
        <div className="tile" style={{ marginTop: 12 }}>
          <h3>8. التواصل</h3>
          <p className="muted">
            لأسئلة الخصوصية:{" "}
            <a className="gold" href="mailto:Supra-science@proton.me">Supra-science@proton.me</a>.
          </p>
        </div>
      </section>
      <SiteFooter lang="ar" />
    </main>
  );
}
