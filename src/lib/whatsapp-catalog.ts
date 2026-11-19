/**
 * WhatsApp Business catalog section — data.
 *
 * Content matches the WhatsApp Business catalog approved by the owner in
 * the Muse space (section "كتالوج واتساب أعمال", catalog cards SS-01..SS-05
 * and one illustrative work sample per service), ported verbatim from the
 * space on 2026-11-09.
 *
 * Two wording updates vs the space (recorded here so the owner can revert):
 * the space said the items were "ready to be added to the official catalog
 * later — not yet added". The catalog setup in WhatsApp Manager was
 * completed on 2026-11-09 (5 items uploaded to "Supra-Science Services",
 * all eligible, linked to +1 (917) 818-3426), so the lead/note now say the
 * cards mirror the official catalog items. Everything else — items, steps,
 * samples, price note — is unchanged.
 *
 * Rules: NO invented prices (the price line always says the price is set
 * by quotation after a scope review), NO client names, NO results. The
 * samples are clearly labelled hypothetical/illustrative, never presented
 * as completed client work. The SS-04 sample states the prototypes are
 * not certified medical devices.
 */

export type CatalogItem = {
  code: string;
  tag: string;
  short: string;
  includes: string[];
};

export type WorkSample = {
  title: string;
  idea: string;
  scope: string[];
  deliverables: string[];
};

export const CATALOG: Record<"en" | "ar", CatalogItem[]> = {
  ar: [
    {
      code: "SS-01",
      tag: "برمجيات",
      short: "تطبيق ويب أو جوال أو بوابة عملاء تُبنى حول سير عملك الفعلي، وتحل محل الجداول والأدوات المنفصلة.",
      includes: ["تحليل المتطلبات وتصميم التجربة", "التطوير والاختبار والنشر", "الكود المصدري والتوثيق ونافذة دعم"],
    },
    {
      code: "SS-02",
      tag: "ذكاء اصطناعي",
      short: "مساعدات ذكاء اصطناعي وخطوط معالجة بيانات وأتمتة تحوّل بياناتك ومستنداتك إلى إجابات وإجراءات.",
      includes: ["دراسة البيانات وحالة الاستخدام", "التكامل والتقييم على بياناتك", "التوثيق وإرشادات التشغيل"],
    },
    {
      code: "SS-03",
      tag: "إنترنت الأشياء",
      short: "نموذج أولي لجهاز متصل يستشعر أو يقيس أو يتحكم، مربوط بلوحة عرض أو نظام سحابي.",
      includes: ["اختيار الحساسات وتطوير البرمجية الثابتة", "الربط بالسحابة ولوحة العرض", "توثيق التوصيلات وتقرير اختبار"],
    },
    {
      code: "SS-04",
      tag: "بحث وتدريس",
      short: "نموذج أولي علمي أو طبي لتجميع الإشارات والقياس — لأغراض البحث والتدريس، بقدرات وحدود موثقة.",
      includes: ["سلسلة تجميع الإشارة ومعالجتها", "لوحة مراقبة وتسجيل بيانات", "توثيق هندسي وتقرير بالقيود"],
    },
    {
      code: "SS-05",
      tag: "أتمتة",
      short: "أتمتة مراسلات العملاء والحجوزات والمتابعات عبر واتساب، مع لوحة متابعة لفريقك.",
      includes: ["تكامل WhatsApp Cloud API والقوالب", "تدفقات الاستقبال والمتابعة والإشعارات", "لوحة المحادثات وإجراءات التشغيل"],
    },
  ],
  en: [
    {
      code: "SS-01",
      tag: "Software",
      short: "A web app, mobile app, or client portal built around your actual workflow, replacing spreadsheets and disconnected tools.",
      includes: ["Requirements analysis and UX design", "Development, testing, and deployment", "Source code, documentation, and a support window"],
    },
    {
      code: "SS-02",
      tag: "AI",
      short: "AI assistants, data pipelines, and automation that turn your data and documents into answers and actions.",
      includes: ["Data and use-case study", "Integration and evaluation on your data", "Documentation and operating guidance"],
    },
    {
      code: "SS-03",
      tag: "IoT",
      short: "A connected-device prototype that senses, measures, or controls — linked to a dashboard or cloud system.",
      includes: ["Sensor selection and firmware development", "Cloud connectivity and dashboard", "Wiring documentation and a test report"],
    },
    {
      code: "SS-04",
      tag: "Research & Teaching",
      short: "A scientific or medical-technology prototype for signal acquisition and measurement — for research and teaching, with documented capabilities and limits.",
      includes: ["Signal acquisition chain and processing", "Monitoring dashboard and data logging", "Engineering documentation and a limitations report"],
    },
    {
      code: "SS-05",
      tag: "Automation",
      short: "Automation of customer messaging, bookings, and follow-ups over WhatsApp, with a conversation dashboard for your team.",
      includes: ["WhatsApp Cloud API integration and templates", "Intake, follow-up, and notification flows", "Team conversation dashboard and operating procedures"],
    },
  ],
};

export const SAMPLES: Record<"en" | "ar", WorkSample[]> = {
  ar: [
    {
      title: "بوابة حجز ومتابعة طلبات — تصوّر افتراضي",
      idea: "نشاط خدمات صغير يستقبل الحجوزات وطلبات العملاء عبر رسائل متفرقة، فيتخيّل هذا النموذج بوابة واحدة تجمع الحجز والمتابعة في مكان واحد بدل تتبّعها يدوياً.",
      scope: ["صفحة حجز بنموذج منظّم واختيار للخدمة والموعد", "حساب عميل لمتابعة حالة الطلبات والحجوزات", "لوحة إدارة لاستقبال الطلبات وتحديث حالتها", "إشعارات بحالة الطلب عبر البريد أو واتساب"],
      deliverables: ["تطبيق ويب متجاوب يعمل على الهاتف والحاسوب", "لوحة إدارة للطلبات والحجوزات", "الكود المصدري والتوثيق ونافذة دعم متفق عليها"],
    },
    {
      title: "مساعد يجيب من مستندات داخلية — تصوّر افتراضي",
      idea: "فريق لديه أدلة إجراءات وسياسات ومستندات متناثرة، فيتخيّل هذا النموذج مساعداً يبحث فيها ويجيب من محتواها بدل التنقيب اليدوي في الملفات عند كل سؤال متكرر.",
      scope: ["تجميع المستندات الداخلية وفهرستها للبحث", "واجهة محادثة تجيب بالاستناد إلى المستندات المفهرسة", "تقييم جودة الإجابات على أسئلة واقعية من الفريق", "ضوابط وصول تحصر الإجابات في المستندات المسموحة"],
      deliverables: ["نظام مساعد يعمل ومتصل بمستندات النطاق", "تقرير تقييم لسلوك المساعد على عيّنات الأسئلة", "توثيق وإرشادات تشغيل للفريق"],
    },
    {
      title: "عقدة مراقبة بيئة لمساحة تخزين — تصوّر افتراضي",
      idea: "مساحة تخزين تحتاج متابعة مستمرة للحرارة والرطوبة دون مرور يدوي متكرر، فيتخيّل هذا النموذج عقدة استشعار ترسل قراءاتها إلى لوحة عرض يمكن الاطلاع عليها عن بُعد.",
      scope: ["اختيار حساس حرارة ورطوبة مناسب وتوصيله ومعايرته", "برمجية ثابتة لوحدة ESP32 تقرأ الحساس وترسل البيانات", "إرسال القراءات عبر MQTT أو HTTP إلى لوحة عرض", "تنبيهات عند خروج القراءات عن حدود يحددها النطاق"],
      deliverables: ["نموذج أولي عامل للعقدة وبرمجيتها الثابتة", "لوحة عرض للقراءات الحالية والسجل", "توثيق التوصيلات والمخططات وتقرير اختبار"],
    },
    {
      title: "محطة تجميع إشارة لأغراض تعليمية — تصوّر افتراضي",
      idea: "مختبر تعليمي يحتاج عرض إشارة فسيولوجية وشرح سلسلة قياسها للطلاب، فيتخيّل هذا النموذج محطة تجميع وعرض للإشارة لأغراض البحث والتدريس فقط — لا للتشخيص أو الاستخدام السريري.",
      scope: ["سلسلة تجميع إشارة من وحدة حساس مناسبة", "معالجة الإشارة وترشيحها وعرضها لحظياً", "تسجيل البيانات وتصديرها للتحليل اللاحق", "توثيق سلسلة الإشارة وقدراتها وحدودها"],
      deliverables: ["نموذج أولي (عتاد وبرمجيات) لتجميع الإشارة وعرضها", "توثيق هندسي لسلسلة الإشارة", "تقرير بالقيود يصرّح بأن النموذج ليس جهازاً طبياً معتمداً"],
    },
    {
      title: "تدفق حجز مواعيد عبر واتساب — تصوّر افتراضي",
      idea: "نشاط يستقبل طلبات المواعيد عبر واتساب ويتابعها يدوياً من هاتف واحد، فيتخيّل هذا النموذج تدفق استقبال منظّماً يجمع بيانات الحجز ويحوّل المحادثة إلى الفريق مع تذكيرات بالمواعيد.",
      scope: ["قوالب رسائل استقبال وطلب بيانات الحجز الأساسية", "أسئلة منظّمة لتأهيل الطلب قبل تحويله إلى الفريق", "تحويل المحادثات وتتبّع حالتها في لوحة للفريق", "تذكيرات بالمواعيد وإشعارات بتغيّر حالتها"],
      deliverables: ["سير عمل مراسلة متكامل عبر WhatsApp Cloud API", "مكتبة قوالب رسائل معتمدة للتدفق", "لوحة محادثات للفريق وإجراءات تشغيل مكتوبة"],
    },
  ],
  en: [
    {
      title: "Booking & order-tracking portal — a hypothetical scenario",
      idea: "A small service business receives bookings and customer requests through scattered messages; this sample imagines a single portal that gathers booking and follow-up in one place instead of tracking them by hand.",
      scope: ["A booking page with a structured form and service/time selection", "A customer account for following request and booking status", "An admin dashboard for receiving requests and updating their status", "Status notifications by email or WhatsApp"],
      deliverables: ["A responsive web application that works on phone and desktop", "An admin dashboard for requests and bookings", "Source code, documentation, and an agreed support window"],
    },
    {
      title: "An assistant answering from internal documents — a hypothetical scenario",
      idea: "A team has procedure guides, policies, and documents scattered across files; this sample imagines an assistant that searches them and answers from their content instead of digging through files manually for every repeated question.",
      scope: ["Collecting the internal documents and indexing them for search", "A chat interface that answers grounded in the indexed documents", "Evaluating answer quality on real questions from the team", "Access controls that limit answers to the permitted documents"],
      deliverables: ["A working assistant system connected to the scoped documents", "An evaluation report on the assistant's behavior over sample questions", "Documentation and operating guidance for the team"],
    },
    {
      title: "Environmental monitoring node for a storage space — a hypothetical scenario",
      idea: "A storage space needs continuous temperature and humidity monitoring without repeated manual checks; this sample imagines a sensor node that sends its readings to a dashboard that can be viewed remotely.",
      scope: ["Selecting a suitable temperature/humidity sensor, wiring, and calibrating it", "ESP32 firmware that reads the sensor and sends the data", "Sending readings over MQTT or HTTP to a dashboard", "Alerts when readings leave limits set by the scope"],
      deliverables: ["A working prototype of the node and its firmware", "A dashboard for current readings and history", "Wiring and schematic documentation and a test report"],
    },
    {
      title: "Signal acquisition station for teaching purposes — a hypothetical scenario",
      idea: "A teaching lab needs to display a physiological signal and explain its measurement chain to students; this sample imagines an acquisition and display station for research and teaching only — not for diagnosis or clinical use.",
      scope: ["A signal acquisition chain from a suitable sensor module", "Signal processing, filtering, and live visualization", "Data logging and export for later analysis", "Documentation of the signal chain, its capabilities, and its limits"],
      deliverables: ["A prototype (hardware and software) for signal acquisition and display", "Engineering documentation of the signal chain", "A limitations report stating plainly that the prototype is not a certified medical device"],
    },
    {
      title: "Appointment-booking flow over WhatsApp — a hypothetical scenario",
      idea: "A business receives appointment requests over WhatsApp and follows them up manually from a single phone; this sample imagines a structured intake flow that collects the booking details, hands the conversation to the team, and sends appointment reminders.",
      scope: ["Intake message templates requesting the essential booking details", "Structured questions that qualify the request before handing it to the team", "Handing conversations over and tracking their status in a team dashboard", "Appointment reminders and status-change notifications"],
      deliverables: ["An integrated messaging workflow over the WhatsApp Cloud API", "A library of approved message templates for the flow", "A team conversation dashboard and written operating procedures"],
    },
  ],
};

export const CAT_STEPS: Record<"en" | "ar", string[]> = {
  ar: [
    "تصفّح بنود الكتالوج المُعدّة لواتساب أعمال في هذه الصفحة.",
    "اختر بند الخدمة الأقرب لاحتياجك واقرأ نطاقه العام.",
    "اضغط «اطلب عبر واتساب» في البطاقة وأرسل رسالة تصف مشروعك باختصار.",
    "نرد عليك بأسئلة التوضيح، ثم نطاق مكتوب وعرض سعر لاعتمادك.",
  ],
  en: [
    "Browse the catalog items prepared for WhatsApp Business on this page.",
    "Pick the service item closest to your need and read its general scope.",
    "Use “Request on WhatsApp” on the card and send a message briefly describing your project.",
    "We reply with clarifying questions, then a written scope and quotation for your approval.",
  ],
};

export type CatalogStrings = {
  eyebrow: string;
  headingLead: string;
  headingGold: string;
  lead: string;
  howTitle: string;
  howText: string;
  openCatalog: string;
  startChat: string;
  stepsLabel: string;
  includesLabel: string;
  priceLabel: string;
  priceText: string;
  inquire: string;
  details: string;
  bottomNote: string;
  sampleEyebrow: string;
  sampleHeadingLead: string;
  sampleHeadingGold: string;
  sampleLead: string;
  sampleNoteBold: string;
  sampleNote: string;
  sampleBadge: string;
  ideaLabel: string;
  scopeLabel: string;
  deliverablesLabel: string;
  disclaimer: string;
  waIntro: string;
  itemLabel: string;
};

export const CATALOG_STRINGS: Record<"en" | "ar", CatalogStrings> = {
  ar: {
    eyebrow: "WhatsApp Business · كتالوج الخدمات",
    headingLead: "كتالوج",
    headingGold: "واتساب أعمال",
    lead: "هذه بنود كتالوج واتساب أعمال الرسمي لسوبرا-ساينس: خدماتنا الخمس بنطاقها العام. تصفّح البنود هنا، اختر الخدمة الأقرب لاحتياجك، وأرسل استفسارك عبر واتساب.",
    howTitle: "كيف تطلب من هذه البنود؟",
    howText: "بنود هذه الصفحة تعرض الخدمات ونطاقها العام فقط. السعر النهائي لا يظهر كرقم ثابت: يُحدَّد بعد دراسة متطلباتك، ويراجعه المدير شخصياً، وتصلك به وثيقة نطاق وعرض سعر مكتوبة قبل بدء أي عمل.",
    openCatalog: "فتح الكتالوج في واتساب ↗",
    startChat: "بدء محادثة واتساب",
    stepsLabel: "خطوات الطلب",
    includesLabel: "يشمل عادةً",
    priceLabel: "السعر: ",
    priceText: "يُحدَّد بعرض سعر بعد دراسة النطاق",
    inquire: "اطلب عبر واتساب",
    details: "التفاصيل الكاملة",
    bottomNote: "ملاحظة: هذه البطاقات تعكس بنود كتالوج واتساب أعمال الرسمي. إن لم يفتح رابط الكتالوج في جهازك، استخدم زر «اطلب عبر واتساب» في أي بطاقة وسيصلنا استفسارك بنفس الطريقة.",
    sampleEyebrow: "نماذج شغل توضيحية",
    sampleHeadingLead: "نماذج افتراضية —",
    sampleHeadingGold: "واحد لكل خدمة",
    sampleLead: "لكي تتخيّل شكل العمل قبل أن تطلبه: نموذج توضيحي افتراضي واحد مقابل كل بند من بنود الكتالوج الخمسة، يشرح فكرة عمل محتملة ونطاقها المعتاد ومخرجاتها المعتادة.",
    sampleNoteBold: "تنبيه واضح:",
    sampleNote: "كل النماذج التالية افتراضية وتوضيحية فقط، صيغت لشرح طبيعة العمل — ليست مشاريع عملاء منجزة، وليست أعمالاً حقيقية نفّذتها سوبرا-ساينس، ولا تنسب إلى أي عميل، ولا تتضمن أسعاراً أو نتائج.",
    sampleBadge: "نموذج توضيحي افتراضي",
    ideaLabel: "فكرة العمل",
    scopeLabel: "النطاق المعتاد",
    deliverablesLabel: "المخرجات المعتادة",
    disclaimer: "هذا نموذج توضيحي افتراضي لشرح طبيعة الخدمة فقط — ليس مشروع عميل منجزاً ولا عملاً حقيقياً، ولا يتضمن سعراً أو نتيجة.",
    waIntro: "استفسار عن بند مُعدّ لكتالوج واتساب أعمال — سوبرا-ساينس",
    itemLabel: "بند الكتالوج المُعدّ",
  },
  en: {
    eyebrow: "WhatsApp Business · Service Catalog",
    headingLead: "WhatsApp Business",
    headingGold: "Catalog",
    lead: "These are the items of the official Supra-Science WhatsApp Business catalog: our five services with their general scope. Browse the items here, pick the service closest to your need, and send your inquiry over WhatsApp.",
    howTitle: "How to request a service from these items",
    howText: "The items on this page show the services and their general scope only. There is no fixed price tag: the price is set after reviewing your requirements, personally reviewed by the director, and sent to you as a written scope and quotation before any work begins.",
    openCatalog: "Open the catalog in WhatsApp ↗",
    startChat: "Start a WhatsApp chat",
    stepsLabel: "How to order",
    includesLabel: "Typically includes",
    priceLabel: "Price: ",
    priceText: "Quoted after a scope review",
    inquire: "Request on WhatsApp",
    details: "Full details",
    bottomNote: "Note: these cards mirror the items in our official WhatsApp Business catalog. If the catalog link does not open on your device, use the “Request on WhatsApp” button on any card and your inquiry reaches us the same way.",
    sampleEyebrow: "Illustrative Work Samples",
    sampleHeadingLead: "Hypothetical samples —",
    sampleHeadingGold: "one per service",
    sampleLead: "So you can picture the work before requesting it: one hypothetical, illustrative sample for each of the five catalog items, explaining a possible work idea, its typical scope, and its typical deliverables.",
    sampleNoteBold: "Clear notice:",
    sampleNote: "every sample below is hypothetical and illustrative only, written to explain the nature of the work — they are not completed client projects, not real work carried out by Supra-Science, are not attributed to any client, and contain no prices or results.",
    sampleBadge: "Hypothetical illustrative sample",
    ideaLabel: "The work idea",
    scopeLabel: "Typical scope",
    deliverablesLabel: "Typical deliverables",
    disclaimer: "This is a hypothetical, illustrative sample explaining the nature of the service only — not a completed client project and not real work, with no price or result attached.",
    waIntro: "Inquiry about an item prepared for the WhatsApp Business catalog — Supra-Science",
    itemLabel: "Prepared catalog item",
  },
};
