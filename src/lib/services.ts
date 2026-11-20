/**
 * Service catalog — single source of truth for the public services pages.
 *
 * getServices(lang) reads the `services` table (migration 007) via the
 * public anon key and falls back to the baked-in static catalog when the
 * database is unreachable or the migration has not been applied yet.
 * The admin catalog editor (/admin/services) writes to the same table,
 * so the owner can add / edit / hide services without touching code.
 *
 * Nov-8 change: each static entry also carries an indicative starting
 * price (USD), a price note, and a public image. The database has no
 * price/image columns, so those fields always come from this file and
 * are merged onto the database rows by slug in mapRow().
 */

export type Service = {
  id: string;
  /** Indicative starting price in USD (0 = not set). */
  startingPriceUsd: number;
  /** Note shown with the starting price (EN/AR per language). */
  priceNote: string;
  /** Public image path, e.g. "/services/digital-products.webp". */
  image: string;
  imageWidth: number;
  imageHeight: number;
  title: string;
  problem: string;
  description: string;
  scope: string[];
  technologies: string;
  deliverables: string;
  needFromYou: string;
  examples: string[];
};

const STATIC_EN: Service[] = [
  {
    id: "digital-products",
    startingPriceUsd: 3500,
    priceNote: "Indicative starting price — the final price is set in your written quotation after we review the scope.",
    image: "/services/digital-products.webp",
    imageWidth: 1200,
    imageHeight: 675,
    title: "Digital products & applications",
    problem: "Your operations run on spreadsheets, messages, and disconnected tools — slow, error-prone, and hard to scale.",
    description: "We build the working application that replaces your spreadsheets and disconnected tools — web and mobile apps, admin dashboards, and integrations, delivered with source code, deployment, and documentation.",
    scope: ["Web applications and responsive client portals", "iOS and Android applications (cross-platform)", "Admin dashboards and internal tools", "Database design, REST APIs, and third-party integrations", "User experience design and usability testing"],
    technologies: "Modern web frameworks, cross-platform mobile toolkits, relational databases, REST/GraphQL APIs.",
    deliverables: "Working application, source code, deployment, documentation, and an agreed support window.",
    needFromYou: "A description of the workflow, the users involved, and any existing systems it must connect to.",
    examples: ["Client portal for bookings and order tracking", "Internal dashboard replacing shared spreadsheets", "Field data-collection app with offline mode"],
  },
  {
    id: "software-ai",
    startingPriceUsd: 4500,
    priceNote: "Indicative starting price — the final price is set in your written quotation after we review the scope.",
    image: "/services/software-ai.webp",
    imageWidth: 1200,
    imageHeight: 675,
    title: "Software & AI",
    problem: "You have data and repetitive decisions, but no system turning them into answers or actions.",
    description: "We build systems that turn your data and repetitive decisions into answers and actions — using Python, modern LLM APIs, and vector search, evaluated on your own data.",
    scope: ["Python services and APIs (FastAPI/Flask/Django where suitable)", "Language-model integration and AI assistants", "Data analysis and reporting pipelines", "Workflow and back-office automation", "Computer vision prototypes where the scope fits"],
    technologies: "Python, modern LLM APIs, vector search, task queues, standard MLOps practices.",
    deliverables: "Working system, evaluation of AI behavior on your data, documentation, and operating guidance.",
    needFromYou: "Sample data or documents, the decisions to automate, and the accuracy level your process requires.",
    examples: ["Support assistant answering from your documents", "Pipeline that extracts data from invoices", "Daily report generated from operational data"],
  },
  {
    id: "embedded-iot",
    startingPriceUsd: 3500,
    priceNote: "Indicative starting price — the final price is set in your written quotation after we review the scope.",
    image: "/services/embedded-iot.webp",
    imageWidth: 1200,
    imageHeight: 675,
    title: "Embedded systems & IoT",
    problem: "You need to sense, measure, or control something in the physical world — and connect it to software.",
    description: "We build working prototypes that sense, measure, and control the physical world — ESP32 firmware, sensors, MQTT, and cloud dashboards, with wiring documentation and a test report.",
    scope: ["Arduino and ESP32 firmware development", "Sensor selection, wiring, and calibration", "Device-to-cloud connectivity (MQTT/HTTP) and dashboards", "Communication protocols between devices", "PCB design where the project requires it"],
    technologies: "Arduino/ESP32 toolchains, common sensor buses (I2C/SPI/UART), MQTT, cloud dashboards.",
    deliverables: "Working prototype, firmware source, wiring/schematic documentation, and a test report.",
    needFromYou: "What must be measured or controlled, the environment it operates in, and power/connectivity constraints.",
    examples: ["Temperature and humidity monitoring node", "Smart controller for a small production line", "GPS asset tracker with a cloud dashboard"],
  },
  {
    id: "scientific",
    startingPriceUsd: 6500,
    priceNote: "Indicative starting price — the final price is set in your written quotation after we review the scope.",
    image: "/services/scientific.webp",
    imageWidth: 1200,
    imageHeight: 675,
    title: "Scientific & medical prototypes",
    problem: "You are researching or teaching with signals and sensors, and need a reliable prototype — not a consumer gadget.",
    description: "We build reliable research and teaching prototypes for signals and sensors — biomedical modules, documented signal chains, and an honest limitations report, not a consumer gadget.",
    scope: ["Sensor prototypes and signal acquisition chains", "Signal processing and visualization (ECG, SpO2, and similar, where feasible)", "Monitoring dashboards and data logging", "Engineering and research documentation"],
    technologies: "Biomedical sensor modules, ADC front-ends, Python/DSP tooling, web dashboards.",
    deliverables: "Prototype hardware/software, documented signal chain, and a limitations report.",
    needFromYou: "The signal or quantity of interest, the intended research or teaching use, and any accuracy requirements.",
    examples: ["Physiological signal acquisition prototype", "Lab sensor array with calibration records", "Environmental monitoring station"],
  },
  {
    id: "automation",
    startingPriceUsd: 1500,
    priceNote: "Indicative starting price — the final price is set in your written quotation after we review the scope.",
    image: "/services/automation.webp",
    imageWidth: 1200,
    imageHeight: 675,
    title: "Business automation & WhatsApp",
    problem: "Customer messages, orders, and follow-ups live in someone's phone — nothing is tracked, nothing is consistent.",
    description: "We move your customer messages, orders, and follow-ups out of a single phone into tracked, consistent workflows — WhatsApp Cloud API, templates, and a team dashboard.",
    scope: ["WhatsApp Cloud API integration and message templates", "Customer support assistants and structured intake", "Order and request tracking workflows", "Notifications and reminders", "Conversation dashboards for your team"],
    technologies: "WhatsApp Cloud API, webhook infrastructure, CRM integrations, automation pipelines.",
    deliverables: "Integrated messaging workflows, template library, team dashboard, and operating procedures.",
    needFromYou: "Your current messaging volume, the processes to automate, and who on your team handles conversations.",
    examples: ["WhatsApp appointment-booking flow", "Automated lead-qualification chat", "Order-status notifications via WhatsApp"],
  },
];

const STATIC_AR: Service[] = [
  {
    id: "digital-products",
    startingPriceUsd: 3500,
    priceNote: "سعر استرشادي أولي — يُحدَّد السعر النهائي في عرض السعر المكتوب بعد مراجعة نطاق مشروعك.",
    image: "/services/digital-products.webp",
    imageWidth: 1200,
    imageHeight: 675,
    title: "المنتجات والتطبيقات الرقمية",
    problem: "عملياتك تعمل على جداول ومراسلات وأدوات منفصلة — بطيئة وعرضة للأخطاء وصعبة التوسع.",
    description: "نبني التطبيق الذي يحل محل جداولك وأدواتك المنفصلة — تطبيقات ويب وجوال ولوحات إدارة وتكاملات، مع الكود المصدري والنشر والتوثيق.",
    scope: ["تطبيقات الويب وبوابات العملاء المتجاوبة", "تطبيقات iOS وأندرويد (متعددة المنصات)", "لوحات الإدارة والأدوات الداخلية", "تصميم قواعد البيانات وREST APIs والتكاملات مع الأنظمة الخارجية", "تصميم تجربة المستخدم واختبار سهولة الاستخدام"],
    technologies: "أطر الويب الحديثة، أدوات الجوال متعددة المنصات، قواعد البيانات العلائقية، REST/GraphQL APIs.",
    deliverables: "تطبيق يعمل، الكود المصدري، النشر، التوثيق، ونافذة دعم متفق عليها.",
    needFromYou: "وصف سير العمل والمستخدمين المعنيين وأي أنظمة قائمة يجب الربط معها.",
    examples: ["بوابة عميل للحجوزات وتتبع الطلبات", "لوحة داخلية تحل محل جداول البيانات المشتركة", "تطبيق جمع بيانات ميداني يعمل دون اتصال"],
  },
  {
    id: "software-ai",
    startingPriceUsd: 4500,
    priceNote: "سعر استرشادي أولي — يُحدَّد السعر النهائي في عرض السعر المكتوب بعد مراجعة نطاق مشروعك.",
    image: "/services/software-ai.webp",
    imageWidth: 1200,
    imageHeight: 675,
    title: "البرمجيات والذكاء الاصطناعي",
    problem: "لديك بيانات وقرارات متكررة، لكن لا نظام يحوّلها إلى إجابات أو إجراءات.",
    description: "نبني أنظمة تحول بياناتك وقراراتك المتكررة إلى إجابات وإجراءات — بايثون وواجهات نماذج اللغة والبحث المتجهي، مع تقييم على بياناتك أنت.",
    scope: ["خدمات وواجهات بايثون (FastAPI/Flask/Django حيث يناسب)", "تكامل نماذج اللغة ومساعدات الذكاء الاصطناعي", "خطوط تحليل البيانات وإعداد التقارير", "أتمتة سير العمل والعمليات المكتبية", "نماذج الرؤية الحاسوبية الأولية حيث يناسب النطاق"],
    technologies: "بايثون، واجهات نماذج اللغة الحديثة، البحث المتجهي، قوائم المهام، وممارسات MLOps القياسية.",
    deliverables: "نظام يعمل، تقييم سلوك الذكاء الاصطناعي على بياناتك، التوثيق، وإرشادات التشغيل.",
    needFromYou: "عيّنات من البيانات أو المستندات، والقرارات المراد أتمتتها، ومستوى الدقة الذي تتطلبه عمليتك.",
    examples: ["مساعد دعم يجيب من مستنداتك", "خط معالجة يستخرج البيانات من الفواتير", "تقرير يومي يُولَّد من بيانات التشغيل"],
  },
  {
    id: "embedded-iot",
    startingPriceUsd: 3500,
    priceNote: "سعر استرشادي أولي — يُحدَّد السعر النهائي في عرض السعر المكتوب بعد مراجعة نطاق مشروعك.",
    image: "/services/embedded-iot.webp",
    imageWidth: 1200,
    imageHeight: 675,
    title: "الأنظمة المدمجة وإنترنت الأشياء",
    problem: "تحتاج إلى استشعار شيء ما أو قياسه أو التحكم فيه في العالم المادي — وربطه بالبرمجيات.",
    description: "نبني نماذج أولية تعمل تستشعر العالم المادي وتقيسه وتتحكم فيه — برمجيات ESP32 وحساسات وMQTT ولوحات سحابية، مع توثيق التوصيلات وتقرير اختبار.",
    scope: ["تطوير البرمجيات الثابتة لأردوينو وESP32", "اختيار الحساسات وتوصيلها ومعايرتها", "الربط بين الأجهزة والسحابة (MQTT/HTTP) ولوحات العرض", "بروتوكولات الاتصال بين الأجهزة", "تصميم الدوائر المطبوعة PCB حيث يتطلب المشروع"],
    technologies: "سلاسل أدوات أردوينو/ESP32، نواقل الحساسات الشائعة (I2C/SPI/UART)، MQTT، لوحات السحابة.",
    deliverables: "نموذج أولي يعمل، الكود المصدري للبرمجية الثابتة، توثيق التوصيلات والمخططات، وتقرير اختبار.",
    needFromYou: "ما الذي يجب قياسه أو التحكم فيه، وبيئة التشغيل، وقيود الطاقة والاتصال.",
    examples: ["عقدة مراقبة الحرارة والرطوبة", "متحكم ذكي لخط إنتاج صغير", "متتبع أصول GPS مع لوحة سحابية"],
  },
  {
    id: "scientific",
    startingPriceUsd: 6500,
    priceNote: "سعر استرشادي أولي — يُحدَّد السعر النهائي في عرض السعر المكتوب بعد مراجعة نطاق مشروعك.",
    image: "/services/scientific.webp",
    imageWidth: 1200,
    imageHeight: 675,
    title: "النماذج العلمية والطبية الأولية",
    problem: "تعمل في البحث أو التدريس مع الإشارات والحساسات، وتحتاج نموذجاً موثوقاً — لا أداة استهلاكية.",
    description: "نبني نماذج بحثية وتعليمية موثوقة للإشارات والحساسات — وحدات طبية حيوية وسلسلة إشارة موثقة وتقرير بالقيود، لا أداة استهلاكية.",
    scope: ["نماذج الحساسات وسلاسل تجميع الإشارات", "معالجة الإشارات وعرضها (ECG وSpO2 وما شابه حيث يتوفر الجدوى)", "لوحات المراقبة وتسجيل البيانات", "التوثيق الهندسي والبحثي"],
    technologies: "وحدات الحساسات الطبية الحيوية، واجهات التحويل التناظري، أدوات بايثون ومعالجة الإشارات، لوحات الويب.",
    deliverables: "النموذج الأولي (عتاد وبرمجيات)، توثيق سلسلة الإشارة، وتقرير بالقيود.",
    needFromYou: "الإشارة أو الكمية المطلوبة، والاستخدام البحثي أو التعليمي المقصود، وأي متطلبات دقة.",
    examples: ["نموذج أولي لتجميع الإشارات الفسيولوجية", "مصفوفة حساسات مخبرية مع سجلات معايرة", "محطة مراقبة بيئية"],
  },
  {
    id: "automation",
    startingPriceUsd: 1500,
    priceNote: "سعر استرشادي أولي — يُحدَّد السعر النهائي في عرض السعر المكتوب بعد مراجعة نطاق مشروعك.",
    image: "/services/automation.webp",
    imageWidth: 1200,
    imageHeight: 675,
    title: "أتمتة الأعمال وواتساب",
    problem: "رسائل العملاء والطلبات والمتابعات تعيش في هاتف شخص ما — لا تتبّع ولا اتساق.",
    description: "ننقل رسائل عملائك وطلباتهم ومتابعاتهم من هاتف شخص واحد إلى سير عمل متتبع ومتسق — واتساب Cloud API وقوالب ولوحة فريق.",
    scope: ["تكامل WhatsApp Cloud API وقوالب الرسائل", "مساعدو خدمة العملاء والاستقبال المنظم", "سير عمل تتبّع الطلبات والطلبات", "الإشعارات والتذكيرات", "لوحات المحادثات لفريقك"],
    technologies: "WhatsApp Cloud API، بنية webhooks، تكاملات CRM، خطوط الأتمتة.",
    deliverables: "سير عمل مراسلة متكامل، مكتبة القوالب، لوحة الفريق، وإجراءات التشغيل.",
    needFromYou: "حجم المراسلات الحالي، والعمليات المراد أتمتتها، ومن في فريقك يتولى المحادثات.",
    examples: ["تدفق حجز مواعيد عبر واتساب", "محادثة آلية لتأهيل العملاء المحتملين", "إشعارات حالة الطلبات عبر واتساب"],
  },
];

export function staticServices(lang: "en" | "ar"): Service[] {
  return lang === "ar" ? STATIC_AR : STATIC_EN;
}

/**
 * Quick-Launch Scientific & AI Packages (added 2026-11-14, founder
 * decision 1): fast-decision, fixed-range packages aimed at medical
 * students, residents, and researchers in Saudi Arabia, the Gulf, and
 * the Maghreb — an ADDITION to the five engineering services above,
 * never a replacement. Prices are the approved indicative ranges; the
 * final price is always set in the written quotation after a scope
 * review. Deliberately kept OUT of getServices()/the WhatsApp catalog
 * data so the five engineering services and the SS-01..SS-05 catalog
 * stay exactly as approved.
 */
export type QuickLaunchPackage = {
  id: string;
  title: string;
  tagline: string;
  /** Approved indicative price range, e.g. "$49–$149". */
  priceRange: string;
  priceNote: string;
  /**
   * Published price tiers (founder decision, 2026-11-18): fixed tier prices
   * with a one-line output and the revision rounds for each tier. The final
   * price is always confirmed in the written quotation (SS-Q).
   */
  tiers?: QuickLaunchTier[];
  audience: string;
  scope: string[];
  deliverables: string;
  /** Optional published work sample (PDF under /files/samples/). */
  sampleUrl?: string;
  sampleLabel?: string;
};

export type QuickLaunchTier = {
  name: string;
  price: string;
  includes: string;
  revisions: string;
};

const QUICK_LAUNCH_EN: QuickLaunchPackage[] = [
  {
    id: "suprastat",
    title: "SupraStat™ — Statistical analysis",
    tagline: "Medical & academic statistics (SPSS / R / Python)",
    priceRange: "$49–$149",
    priceNote: "Prices shown are for standard cases. The final price is confirmed in your written quotation (SS-Q) after we review your data. Reduced local pricing for Yemen & North Africa on request.",
    tiers: [
      { name: "Basic", price: "$49", includes: "Descriptive statistics & hypothesis testing, publication-ready tables", revisions: "1 revision round" },
      { name: "Standard", price: "$79", includes: "Adds regression analysis", revisions: "2 revision rounds" },
      { name: "Advanced", price: "$149", includes: "Adds survival analysis & ROC / diagnostic accuracy, plus reproducible scripts", revisions: "2 revision rounds" },
    ],
    audience: "Residents, master’s & PhD students in Saudi Arabia, the Gulf, and the Maghreb.",
    scope: [
      "Hypothesis testing, regression & survival analysis",
      "ROC curves & diagnostic accuracy",
      "Publication-ready tables & figures",
      "Reproducible scripts (SPSS syntax / R / Python)",
    ],
    deliverables: "Analysis report with tables and figures, plus the reproducible script files.",
    sampleUrl: "/files/samples/suprastat-clinical-biostatistics-sample.pdf",
    sampleLabel: "View sample report (PDF, 2 pages)",
  },
  {
    id: "suprapub",
    title: "SupraPub™ — Publication editing & formatting",
    tagline: "Medical language editing for Scopus / PubMed journals",
    priceRange: "$59–$129",
    priceNote: "Prices shown are for standard cases. The final price is confirmed in your written quotation (SS-Q) after we review your manuscript. Reduced local pricing for Yemen & North Africa on request.",
    tiers: [
      { name: "Basic", price: "$59", includes: "Up to 3,000 words (body text)", revisions: "1 revision round" },
      { name: "Standard", price: "$89", includes: "Up to 5,000 words (body text)", revisions: "2 revision rounds" },
      { name: "Advanced", price: "$129", includes: "Up to 7,000 words (body text)", revisions: "2 revision rounds" },
    ],
    audience: "Arab researchers and doctors publishing in Q1–Q4 journals or earning SCFHS points.",
    scope: [
      "Medical English language editing",
      "Journal formatting (Q1–Q4 requirements)",
      "References, tables & figures formatting",
      "Cover-letter draft",
    ],
    deliverables: "Edited manuscript plus a formatted submission pack.",
    sampleUrl: "/files/samples/06-suprapub-sample.pdf",
    sampleLabel: "View editing sample (PDF, 2 pages)",
  },
  {
    id: "supramed",
    title: "SupraMed™ — OSCE & SMLE clinical training",
    tagline: "Intensive 1-on-1 clinical exam coaching",
    priceRange: "$25 / session · $89 for 4 sessions",
    priceNote: "Indicative range — the final price is set in your written quotation. Reduced local pricing for Yemen & North Africa on request.",
    audience: "Clinical-year medical students and interns in Saudi Arabia (SMLE), Yemen, and Oman.",
    scope: [
      "OSCE station practice with feedback",
      "SMLE-style question drills",
      "Clinical reasoning & exam strategy",
      "Personal study plan",
    ],
    deliverables: "Session notes, practice stations, and a study plan.",
    sampleUrl: "/files/samples/supramed-osce-oral-exam-sample.pdf",
    sampleLabel: "View 10-page sample (PDF)",
  },
  {
    id: "supraflow",
    title: "SupraFlow™ — WhatsApp automation & AI",
    tagline: "WhatsApp Business AI for clinics & businesses",
    priceRange: "$149–$299 setup (one-time)",
    priceNote: "Indicative range — the final price is set in your written quotation. Reduced local pricing for Yemen & North Africa on request.",
    audience: "Private clinics, dental & dermatology centers, and shops in Saudi Arabia, the UAE, and Yemen.",
    scope: [
      "WhatsApp Business & Cloud API setup",
      "AI receptionist flows (booking, FAQs)",
      "Appointment reminders & follow-ups",
      "Catalog setup & team dashboard",
    ],
    deliverables: "Working bot with templates, dashboard, and operating guide.",
    sampleUrl: "/files/samples/supraflow-whatsapp-ai-clinic-blueprint.pdf",
    sampleLabel: "View blueprint sample (PDF, 2 pages)",
  },
];

const QUICK_LAUNCH_AR: QuickLaunchPackage[] = [
  {
    id: "suprastat",
    title: "SupraStat™ — التحليل الإحصائي",
    tagline: "إحصاء طبي وأكاديمي (SPSS / R / Python)",
    priceRange: "$49–$149",
    priceNote: "الأسعار المعروضة للحالات القياسية، ويُعتمد السعر النهائي بعرض سعر مكتوب SS-Q بعد معاينة البيانات. أسعار محلية مخفّضة لليمن وشمال أفريقيا عند الطلب.",
    tiers: [
      { name: "الأساسية", price: "$49", includes: "إحصاء وصفي واختبار فرضيات، مع جداول جاهزة للنشر", revisions: "جولة مراجعة واحدة" },
      { name: "القياسية", price: "$79", includes: "تضيف تحليل الانحدار", revisions: "جولتا مراجعة" },
      { name: "المتقدمة", price: "$149", includes: "تضيف تحليل البقاء ومنحنيات ROC / دقة التشخيص، مع سكربتات قابلة لإعادة التنفيذ", revisions: "جولتا مراجعة" },
    ],
    audience: "أطباء الامتياز والمقيمون وطلاب الماجستير والدكتوراه في السعودية والخليج والمغرب العربي.",
    scope: [
      "اختبار الفرضيات والانحدار وتحليل البقاء",
      "منحنيات ROC ودقة التشخيص",
      "جداول وأشكال جاهزة للنشر",
      "سكربتات قابلة لإعادة التنفيذ (SPSS / R / Python)",
    ],
    deliverables: "تقرير تحليل مع الجداول والأشكال، مع ملفات السكربت.",
    sampleUrl: "/files/samples/suprastat-clinical-biostatistics-sample.pdf",
    sampleLabel: "عرض تقرير العينة (PDF، صفحتان)",
  },
  {
    id: "suprapub",
    title: "SupraPub™ — التدقيق اللغوي وتنسيق النشر",
    tagline: "تدقيق طبي وتنسيق لمجلات Scopus / PubMed",
    priceRange: "$59–$129",
    priceNote: "الأسعار المعروضة للحالات القياسية، ويُعتمد السعر النهائي بعرض سعر مكتوب SS-Q بعد معاينة المخطوطة. أسعار محلية مخفّضة لليمن وشمال أفريقيا عند الطلب.",
    tiers: [
      { name: "الأساسية", price: "$59", includes: "حتى 3,000 كلمة (متن البحث)", revisions: "جولة مراجعة واحدة" },
      { name: "القياسية", price: "$89", includes: "حتى 5,000 كلمة (متن البحث)", revisions: "جولتا مراجعة" },
      { name: "المتقدمة", price: "$129", includes: "حتى 7,000 كلمة (متن البحث)", revisions: "جولتا مراجعة" },
    ],
    audience: "الباحثون والأطباء العرب الراغبون في النشر في مجلات Q1–Q4 أو نقاط الهيئة السعودية للتخصصات الصحية.",
    scope: [
      "تدقيق اللغة الإنجليزية الطبية",
      "تنسيق المجلة (متطلبات Q1–Q4)",
      "تنسيق المراجع والجداول والأشكال",
      "مسودة خطاب التغطية",
    ],
    deliverables: "مخطوطة مدققة مع حزمة تقديم منسقة.",
    sampleUrl: "/files/samples/06-suprapub-sample.pdf",
    sampleLabel: "عرض عينة التحرير (PDF، صفحتان)",
  },
  {
    id: "supramed",
    title: "SupraMed™ — التدريب السريري OSCE وSMLE",
    tagline: "تدريب سريري مكثف فردي لاختبارات OSCE وSMLE",
    priceRange: "$25 / للجلسة · $89 لأربع جلسات",
    priceNote: "نطاق استرشادي — السعر النهائي في عرض السعر المكتوب. أسعار محلية مخفّضة لليمن وشمال أفريقيا عند الطلب.",
    audience: "طلاب الطب في السنوات السريرية وأطباء الامتياز في السعودية (SMLE) واليمن وعُمان.",
    scope: [
      "تدريب محطات OSCE مع تغذية راجعة",
      "أسئلة بأسلوب SMLE",
      "التفكير السريري واستراتيجية الاختبار",
      "خطة دراسة شخصية",
    ],
    deliverables: "ملاحظات الجلسات ومحطات تدريب وخطة دراسة.",
    sampleUrl: "/files/samples/supramed-osce-oral-exam-sample.pdf",
    sampleLabel: "عرض عينة 10 صفحات (PDF)",
  },
  {
    id: "supraflow",
    title: "SupraFlow™ — أتمتة واتساب والذكاء الاصطناعي",
    tagline: "واتساب أعمال ذكي للعيادات والشركات",
    priceRange: "$149–$299 تأسيس (دفعة واحدة)",
    priceNote: "نطاق استرشادي — السعر النهائي في عرض السعر المكتوب. أسعار محلية مخفّضة لليمن وشمال أفريقيا عند الطلب.",
    audience: "العيادات الخاصة ومراكز الأسنان والجلدية والمتاجر في السعودية والإمارات واليمن.",
    scope: [
      "إعداد WhatsApp Business وCloud API",
      "تدفقات استقبال ذكية (حجز وأسئلة شائعة)",
      "تذكيرات المواعيد والمتابعة",
      "إعداد الكتالوج ولوحة الفريق",
    ],
    deliverables: "بوت يعمل مع القوالب ولوحة تحكم ودليل تشغيل.",
    sampleUrl: "/files/samples/supraflow-whatsapp-ai-clinic-blueprint.pdf",
    sampleLabel: "عرض مخطط العينة (PDF، صفحتان)",
  },
];

export function quickLaunch(lang: "en" | "ar"): QuickLaunchPackage[] {
  return lang === "ar" ? QUICK_LAUNCH_AR : QUICK_LAUNCH_EN;
}

type ServiceRow = {
  slug: string; title_en: string; title_ar: string;
  problem_en: string; problem_ar: string;
  description_en: string; description_ar: string;
  scope_en: string[]; scope_ar: string[];
  technologies_en: string; technologies_ar: string;
  deliverables_en: string; deliverables_ar: string;
  need_from_you_en: string; need_from_you_ar: string;
  examples_en: string[]; examples_ar: string[];
};

function mapRow(r: ServiceRow, lang: "en" | "ar"): Service {
  const isEn = lang === "en";
  // Prices, price notes and images are NOT in the database (the
  // services table has no price/image columns) — they come from the
  // static catalog entry for the same slug.
  const stat = staticServices(lang).find((s) => s.id === r.slug);
  return {
    id: r.slug,
    startingPriceUsd: stat?.startingPriceUsd ?? 0,
    priceNote: stat?.priceNote ?? "",
    image: stat?.image ?? "",
    imageWidth: stat?.imageWidth ?? 800,
    imageHeight: stat?.imageHeight ?? 533,
    title: isEn ? r.title_en : r.title_ar,
    problem: isEn ? r.problem_en : r.problem_ar,
    description: isEn ? r.description_en : r.description_ar,
    scope: isEn ? r.scope_en ?? [] : r.scope_ar ?? [],
    technologies: isEn ? r.technologies_en : r.technologies_ar,
    deliverables: isEn ? r.deliverables_en : r.deliverables_ar,
    needFromYou: isEn ? r.need_from_you_en : r.need_from_you_ar,
    examples: isEn ? r.examples_en ?? [] : r.examples_ar ?? [],
  };
}

/** Fetch live catalog; fall back to static on any failure (never throws). */
export async function getServices(lang: "en" | "ar"): Promise<Service[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return staticServices(lang);
  try {
    // `next.revalidate` is a Next.js fetch extension — typed loosely here so
    // the module also compiles under plain tsc (used by unit tests).
    const init = {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 300 },
    } as RequestInit & { next?: { revalidate?: number } };
    const res = await fetch(
      `${url}/rest/v1/services?select=*&is_active=eq.true&order=sort_order.asc`,
      init
    );
    if (!res.ok) return staticServices(lang);
    const rows = (await res.json()) as ServiceRow[];
    if (!Array.isArray(rows) || rows.length === 0) return staticServices(lang);
    return rows.map((r) => mapRow(r, lang));
  } catch {
    return staticServices(lang);
  }
}
