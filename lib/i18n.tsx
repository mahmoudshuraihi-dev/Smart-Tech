"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore, ReactNode } from "react";
import type { Stage, ServiceId } from "./models";

export type Locale = "ar" | "en";

export interface ServiceCopy {
  id: ServiceId;
  title: string;
  description: string;
}

export interface TestimonialCopy {
  name: string;
  role: string;
  quote: string;
}

export interface FaqCopy {
  q: string;
  a: string;
}

export interface Dict {
  meta: { title: string; description: string };
  nav: {
    home: string;
    services: string;
    testimonials: string;
    faq: string;
    about: string;
    contact: string;
    login: string;
    logout: string;
    dashboard: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    highlight: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  services: {
    heading: string;
    subheading: string;
    requestCta: string;
    loginRequired: string;
    items: ServiceCopy[];
  };
  testimonials: {
    heading: string;
    subheading: string;
    items: TestimonialCopy[];
  };
  faq: {
    heading: string;
    subheading: string;
    items: FaqCopy[];
  };
  about: {
    heading: string;
    body: string;
    stats: { value: string; label: string }[];
  };
  contact: {
    heading: string;
    body: string;
    emailLabel: string;
    phoneLabel: string;
    email: string;
    phone: string;
    socialLabel: string;
  };
  login: {
    heading: string;
    headingSignup: string;
    subheading: string;
    subheadingSignup: string;
    nameLabel: string;
    phoneLabel: string;
    phoneHint: string;
    emailLabel: string;
    passwordLabel: string;
    passwordHint: string;
    submit: string;
    submitSignup: string;
    switchToSignup: string;
    switchToLogin: string;
    errorInvalidCredential: string;
    errorEmailInUse: string;
    errorWeakPassword: string;
    errorWeakPasswordCustom: string;
    errorPhoneImplausible: string;
    errorTooManyRequests: string;
    errorNetwork: string;
    errorGeneric: string;
    backHome: string;
    remember: string;
    showPassword: string;
    hidePassword: string;
    forgotPassword: string;
    resetHeading: string;
    resetSubheading: string;
    resetSubmit: string;
    resetSentMessage: string;
    backToLogin: string;
    verifyEmailBanner: string;
    verifyEmailResend: string;
    verifyEmailSent: string;
    verifyEmailRefresh: string;
  };
  stages: Record<Stage, string>;
  dashboardClient: {
    heading: string;
    subheading: string;
    empty: string;
    browseServices: string;
    requestedOn: string;
    currentStage: string;
    progress: string;
    timeline: string;
    download: string;
    fileWaiting: string;
  };
  dashboardAdmin: {
    heading: string;
    subheading: string;
    listTitle: string;
    client: string;
    service: string;
    stage: string;
    selectPrompt: string;
    advanceTo: string;
    fileNameLabel: string;
    completeAndAttach: string;
    fileAttached: string;
    timeline: string;
    doneAll: string;
  };
  footer: { rights: string; tagline: string; quickLinks: string; company: string };
  common: { backHome: string; loading: string };
  errors: {
    boundaryHeading: string;
    boundaryBody: string;
    tryAgain: string;
  };
  errorsPage: {
    heading: string;
    subheading: string;
    empty: string;
    dismiss: string;
    navLink: string;
    claimsHeading: string;
    claimsSubheading: string;
    claimsEmpty: string;
    claimedBy: string;
    claimMessages: string;
  };
  chat: {
    heading: string;
    placeholder: string;
    send: string;
    attach: string;
    empty: string;
    selectConversation: string;
    noConversations: string;
    fileTooLarge: string;
    uploadFailed: string;
    paymentLabel: string;
    paymentPaid: string;
    paymentUnpaid: string;
    paymentPartial: string;
    botSettingsTitle: string;
    welcomeMessageLabel: string;
    rulesLabel: string;
    ruleQuestionPlaceholder: string;
    ruleAnswerPlaceholder: string;
    addRule: string;
    saveEdit: string;
    cancel: string;
    save: string;
    noRules: string;
    importWhatsapp: string;
    importTitle: string;
    importDescription: string;
    importChooseFile: string;
    importParsing: string;
    importWhoIsYou: string;
    importFoundMessages: string;
    importFoundMedia: string;
    importConfirm: string;
    importCancel: string;
    importSuccess: string;
    importSkippedFiles: string;
    importErrorNoMessages: string;
    importErrorTooManySenders: string;
    importErrorGeneric: string;
    importDone: string;
    supportTeamName: string;
    actionsMenu: string;
    clearConversation: string;
    clearConversationConfirm: string;
    deleteAccount: string;
    deleteAccountConfirm: string;
    actionFailed: string;
    actionPending: string;
    importPhoneLabel: string;
    importPhoneHint: string;
    importPhoneImplausible: string;
    importNameHintLabel: string;
  };
  pendingImports: {
    heading: string;
    subheading: string;
    backToMessages: string;
    add: string;
    empty: string;
    phone: string;
    messageCount: string;
  };
}

const SERVICES_AR: ServiceCopy[] = [
  {
    id: "editing",
    title: "التدقيق اللغوي والتحرير الأكاديمي",
    description:
      "مراجعة لغوية وأسلوبية دقيقة لنص رسالتك، مع الحفاظ الكامل على أفكارك ونتائجك كما هي.",
  },
  {
    id: "statistics",
    title: "الدعم الإحصائي وتحليل البيانات",
    description:
      "إرشادك في اختيار الاختبارات الإحصائية المناسبة وتفسير مخرجات SPSS وR دون إجراء التحليل نيابةً عنك.",
  },
  {
    id: "methodology",
    title: "استشارات منهجية البحث",
    description: "مراجعة تصميم بحثك وأدواتك ومنهجيتك، مع ملاحظات عملية لتقويتها.",
  },
  {
    id: "literature",
    title: "المساعدة في مراجعة الأدبيات",
    description: "مساعدتك على تنظيم وتصنيف المصادر التي جمعتها وربطها بأسئلة بحثك.",
  },
  {
    id: "formatting",
    title: "التنسيق والتوثيق العلمي",
    description: "ضبط التنسيق والتوثيق وفق أنظمة APA وMLA وShicago وغيرها.",
  },
  {
    id: "coaching",
    title: "التدريب على الكتابة الأكاديمية",
    description: "جلسات إرشادية لتطوير مهاراتك في الكتابة الأكاديمية وإدارة جدول رسالتك.",
  },
];

const SERVICES_EN: ServiceCopy[] = [
  {
    id: "editing",
    title: "Academic Editing & Proofreading",
    description:
      "Careful language and style review of your own thesis text — your ideas and findings stay entirely yours.",
  },
  {
    id: "statistics",
    title: "Statistical Analysis Support",
    description:
      "Guidance choosing the right statistical tests and interpreting SPSS/R output — you run the analysis, we help you understand it.",
  },
  {
    id: "methodology",
    title: "Research Methodology Consulting",
    description: "Feedback on your research design, tools, and methodology to help strengthen it.",
  },
  {
    id: "literature",
    title: "Literature Review Assistance",
    description: "Help organizing and mapping the sources you've gathered against your research questions.",
  },
  {
    id: "formatting",
    title: "Formatting & Citation Support",
    description: "Getting your formatting and referencing right in APA, MLA, Chicago and other styles.",
  },
  {
    id: "coaching",
    title: "Academic Writing Coaching",
    description: "Coaching sessions to build your academic writing skills and manage your thesis timeline.",
  },
];

const translations: Record<Locale, Dict> = {
  ar: {
    meta: {
      title: "Smart Tech — استشارات وخدمات بحثية وأكاديمية",
      description: "استشارات أكاديمية وبحثية متكاملة تدعم عملك الخاص من الفكرة إلى التسليم.",
    },
    nav: {
      home: "الرئيسية",
      services: "خدماتنا",
      testimonials: "آراء العملاء",
      faq: "الأسئلة الشائعة",
      about: "من نحن",
      contact: "تواصل معنا",
      login: "تسجيل الدخول",
      logout: "تسجيل الخروج",
      dashboard: "لوحتي",
    },
    hero: {
      eyebrow: "استشارات أكاديمية وبحثية متكاملة",
      title: "نرافقك في رحلتك البحثية،",
      highlight: "بشفافية كاملة من أول خطوة حتى التسليم",
      subtitle:
        "فريق من المستشارين الأكاديميين يدعم طلاب الماجستير والدكتوراه بالتدقيق اللغوي والاستشارات المنهجية والإحصائية — بينما يبقى بحثك وقرارك وعملك لك دائمًا.",
      ctaPrimary: "استعرض خدماتنا",
      ctaSecondary: "تابع حالة طلبك",
    },
    services: {
      heading: "خدماتنا",
      subheading: "دعم أكاديمي احترافي مصمم ليقوّي عملك الخاص، لا ليحل محلك فيه.",
      requestCta: "قدّم طلبًا لهذه الخدمة",
      loginRequired: "سجّل الدخول لتقديم طلب",
      items: SERVICES_AR,
    },
    testimonials: {
      heading: "آراء عملائنا",
      subheading: "تجارب حقيقية من طلاب استفادوا من دعمنا الاستشاري.",
      items: [
        {
          name: "نورة القحطاني",
          role: "طالبة ماجستير - إدارة أعمال",
          quote:
            "ساعدني فريق Smart Tech على تنظيم أفكاري ومراجعة أسلوبي دون أن يكتب حرفًا واحدًا بدلاً عني، وتعلمت الكثير في الطريق.",
        },
        {
          name: "خالد المطيري",
          role: "باحث دكتوراه - هندسة",
          quote:
            "الاستشارة المنهجية وفّرت عليّ أسابيع من التخبط، والمتابعة عبر لوحة التتبع كانت شفافة جدًا.",
        },
        {
          name: "ريم الحربي",
          role: "طالبة ماجستير - علم نفس",
          quote: "الدعم الإحصائي كان دقيقًا وواضحًا، وفهمت أخيرًا كيف أفسّر مخرجات SPSS الخاصة بي.",
        },
        {
          name: "سلمان العتيبي",
          role: "باحث دكتوراه - علوم حاسب",
          quote: "المساعدة في مراجعة الأدبيات وفّرت عليّ وقتًا كبيرًا في تنظيم المصادر وربطها بأسئلة بحثي بطريقة منطقية.",
        },
        {
          name: "لمياء الدوسري",
          role: "طالبة ماجستير - تربية",
          quote: "ضبط التنسيق والتوثيق حسب APA كان دقيقًا جدًا، وريّحني من تفاصيل كانت تضيّع وقتي.",
        },
        {
          name: "فهد الشمري",
          role: "باحث دكتوراه - صحة عامة",
          quote: "جلسات التدريب على الكتابة الأكاديمية غيّرت طريقة تنظيمي لأفكاري، وصرت أكتب بثقة أكبر.",
        },
        {
          name: "منيرة العنزي",
          role: "طالبة ماجستير - قانون",
          quote: "المراجعة اللغوية كانت احترافية ودقيقة، وحافظت على أسلوبي الخاص دون أن تغيّر أفكاري.",
        },
        {
          name: "عبدالله القرني",
          role: "باحث دكتوراه - كيمياء",
          quote: "الدعم الإحصائي ساعدني أفهم اختباراتي بشكل أعمق بدل ما أطبّقها بشكل عشوائي.",
        },
        {
          name: "هند الزهراني",
          role: "طالبة ماجستير - إعلام",
          quote: "استشارات المنهجية وضّحت لي نقاط ضعف في تصميم بحثي قبل ما أبدأ بجمع البيانات.",
        },
      ],
    },
    faq: {
      heading: "الأسئلة الشائعة",
      subheading: "كل ما تحتاج معرفته قبل أن تبدأ.",
      items: [
        {
          q: "هل تكتبون الرسالة أو الأطروحة بدلاً عني؟",
          a: "لا. نقدّم استشارات ودعمًا لغويًا وفنيًا لعملك الخاص فقط — التحليل والكتابة والقرارات البحثية تبقى لك دائمًا.",
        },
        {
          q: "كيف أتابع حالة طلبي؟",
          a: "بعد تسجيل الدخول، تجد لوحة متابعة خاصة بك تعرض المرحلة الحالية ونسبة الإنجاز وسجلًا زمنيًا كاملاً لكل مرحلة.",
        },
        {
          q: "ما هي مدة تنفيذ الخدمة عادةً؟",
          a: "تختلف المدة حسب نوع الخدمة وحجم العمل، ويمكنك دائمًا رؤية الجدول الزمني المحدث لطلبك.",
        },
        {
          q: "هل بياناتي وأبحاثي سرية؟",
          a: "نعم، نتعامل مع جميع الملفات والمحادثات بسرية تامة ولا نشاركها مع أي طرف ثالث.",
        },
        {
          q: "كيف أستلم الملف النهائي؟",
          a: 'بمجرد وصول طلبك لمرحلة "مكتمل"، يظهر زر تحميل الملف مباشرة داخل لوحة المتابعة الخاصة بك.',
        },
      ],
    },
    about: {
      heading: "من نحن",
      body: "سمارت تك فريق من المستشارين الأكاديميين والباحثين يرافق طلاب الماجستير والدكتوراه في مسيرتهم البحثية عبر دعم لغوي ومنهجي وإحصائي شفاف — من الفكرة الأولى إلى التسليم النهائي، وأنت صاحب القرار والعمل دائمًا.",
      stats: [
        { value: "+500", label: "طالبًا استفاد من استشاراتنا" },
        { value: "+8", label: "سنوات خبرة بحثية" },
        { value: "97%", label: "نسبة رضا العملاء" },
      ],
    },
    contact: {
      heading: "تواصل معنا",
      body: "لديك استفسار أو تريد مناقشة طلبك؟ راسلنا وسنعاود التواصل خلال 24 ساعة.",
      emailLabel: "البريد الإلكتروني",
      phoneLabel: "الهاتف",
      email: "hello@smarttech-consulting.com",
      phone: "+972 59 792 7632",
      socialLabel: "تابعنا",
    },
    login: {
      heading: "تسجيل الدخول",
      headingSignup: "إنشاء حساب",
      subheading: "ادخل بياناتك لمتابعة طلباتك أو إدارتها.",
      subheadingSignup: "أنشئ حسابًا لمتابعة طلباتك والتواصل مع فريقنا.",
      nameLabel: "الاسم",
      phoneLabel: "رقم الهاتف",
      phoneHint: "اكتب رمز الدولة مع الرقم، مثل 9665XXXXXXXX.",
      emailLabel: "البريد الإلكتروني",
      passwordLabel: "كلمة المرور",
      passwordHint: "8 أحرف على الأقل، وتشمل حرفًا ورقمًا.",
      submit: "دخول",
      submitSignup: "إنشاء الحساب",
      switchToSignup: "ليس لديك حساب؟ أنشئ حسابًا",
      switchToLogin: "لديك حساب بالفعل؟ سجّل الدخول",
      errorInvalidCredential: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
      errorEmailInUse: "هذا البريد الإلكتروني مستخدم بالفعل — جرّب تسجيل الدخول بدلاً من ذلك.",
      errorWeakPassword: "كلمة المرور ضعيفة جدًا — يجب أن تتكون من 6 أحرف على الأقل.",
      errorWeakPasswordCustom: "كلمة المرور يجب أن تتكون من 8 أحرف على الأقل، وتشمل حرفًا ورقمًا.",
      errorPhoneImplausible: "رقم الهاتف قصير جدًا — تأكد من كتابة رمز الدولة معه.",
      errorTooManyRequests: "محاولات كثيرة جدًا، حاول مرة أخرى بعد قليل.",
      errorNetwork: "تعذّر الاتصال بالخادم، تحقق من اتصالك بالإنترنت.",
      errorGeneric: "حدث خطأ غير متوقع، حاول مرة أخرى.",
      backHome: "العودة للرئيسية",
      remember: "تذكرني",
      showPassword: "إظهار كلمة المرور",
      hidePassword: "إخفاء كلمة المرور",
      forgotPassword: "نسيت كلمة المرور؟",
      resetHeading: "استرجاع كلمة المرور",
      resetSubheading: "اكتب بريدك الإلكتروني وبنرسلّك رابط لإعادة تعيين كلمة المرور.",
      resetSubmit: "إرسال رابط الاسترجاع",
      resetSentMessage: "إذا كان هذا البريد مسجّل عندنا، رح يوصلك رابط لإعادة تعيين كلمة المرور خلال دقائق.",
      backToLogin: "الرجوع لتسجيل الدخول",
      verifyEmailBanner: "لسا ما أكدت بريدك الإلكتروني — تحقّق من صندوق الوارد.",
      verifyEmailResend: "إعادة إرسال رسالة التأكيد",
      verifyEmailSent: "تم إرسال رسالة التأكيد.",
      verifyEmailRefresh: "أكدت بريدي — تحديث",
    },
    stages: {
      received: "تم استلام الطلب",
      in_review: "قيد الدراسة والتجهيز",
      in_progress: "قيد التنفيذ",
      revision: "تحت المراجعة والتعديل",
      completed: "مكتمل وجاهز للتسليم",
    },
    dashboardClient: {
      heading: "لوحة متابعة طلباتي",
      subheading: "تابع حالة كل طلب لحظة بلحظة.",
      empty: "لا توجد طلبات بعد.",
      browseServices: "استعرض الخدمات",
      requestedOn: "تاريخ الطلب",
      currentStage: "المرحلة الحالية",
      progress: "نسبة الإنجاز",
      timeline: "السجل الزمني",
      download: "تحميل الملف النهائي",
      fileWaiting: "الملف سيظهر هنا عند اكتمال الطلب",
    },
    dashboardAdmin: {
      heading: "لوحة تحكم الإدارة",
      subheading: "تابع كل الطلبات وحدّث مراحل تنفيذها.",
      listTitle: "كل الطلبات",
      client: "العميل",
      service: "الخدمة",
      stage: "المرحلة",
      selectPrompt: "اختر طلبًا من القائمة لعرض تفاصيله وتحديث مرحلته.",
      advanceTo: "نقل الطلب إلى المرحلة التالية",
      fileNameLabel: "اسم الملف النهائي",
      completeAndAttach: "إرفاق الملف وتحديد الطلب كمكتمل",
      fileAttached: "تم إرفاق الملف",
      timeline: "السجل الزمني",
      doneAll: "اكتمل الطلب بجميع مراحله.",
    },
    footer: {
      rights: "جميع الحقوق محفوظة",
      tagline: "استشارات أكاديمية وبحثية متكاملة تدعم عملك الخاص.",
      quickLinks: "روابط سريعة",
      company: "الشركة",
    },
    common: { backHome: "العودة للرئيسية", loading: "جارٍ التحميل..." },
    errors: {
      boundaryHeading: "حدث خطأ غير متوقع",
      boundaryBody: "نعتذر عن الخلل. جرّب مرة أخرى، أو رجع للرئيسية.",
      tryAgain: "حاول مرة أخرى",
    },
    errorsPage: {
      heading: "سجل الأخطاء",
      subheading: "الأخطاء التقنية يلي حصلت على الموقع تلقائيًا — للمتابعة الفنية فقط.",
      empty: "لا توجد أخطاء مسجّلة.",
      dismiss: "إخفاء",
      navLink: "سجل الأخطاء",
      claimsHeading: "سجل ربط محادثات واتساب",
      claimsSubheading: "كل مرة انربطت فيها محادثة واتساب مستوردة مسبقًا بحساب طالب جديد — راجعها إذا شكيت إنه رقم اتربط بحساب غلط.",
      claimsEmpty: "لا يوجد ربط محادثات بعد.",
      claimedBy: "ارتبطت بحساب",
      claimMessages: "رسالة",
    },
    chat: {
      heading: "المحادثات",
      placeholder: "اكتب رسالة...",
      send: "إرسال",
      attach: "إرفاق ملف",
      empty: "لا توجد رسائل بعد. ابدأ المحادثة!",
      selectConversation: "اختر محادثة من القائمة لعرضها.",
      noConversations: "لا توجد محادثات بعد.",
      fileTooLarge: "حجم الملف كبير جدًا (الحد الأقصى 20 ميجابايت).",
      uploadFailed: "تعذّر رفع الملف حاليًا — جرّب إرسال النص بدون مرفق، أو حاول لاحقًا.",
      paymentLabel: "حالة الدفع",
      paymentPaid: "مدفوع بالكامل",
      paymentUnpaid: "غير مدفوع",
      paymentPartial: "دفعة جزئية",
      botSettingsTitle: "إعدادات الرد التلقائي",
      welcomeMessageLabel: "رسالة الترحيب",
      rulesLabel: "الأسئلة المتكررة",
      ruleQuestionPlaceholder: "السؤال أو الكلمات المفتاحية",
      ruleAnswerPlaceholder: "الرد التلقائي",
      addRule: "إضافة",
      saveEdit: "حفظ التعديل",
      cancel: "إلغاء",
      save: "حفظ",
      noRules: "لا توجد أسئلة متكررة بعد.",
      importWhatsapp: "استيراد محادثة واتساب",
      importTitle: "استيراد محادثة واتساب",
      importDescription: "ارفع ملف تصدير المحادثة من واتساب (.txt أو .zip مع الوسائط) لنقلها إلى هذه المحادثة.",
      importChooseFile: "اختر ملف التصدير",
      importParsing: "جارٍ تحليل الملف...",
      importWhoIsYou: "أي اسم هو أنت (الإدارة)؟",
      importFoundMessages: "تم العثور على {count} رسالة",
      importFoundMedia: "و {count} ملف وسائط",
      importConfirm: "استيراد",
      importCancel: "إلغاء",
      importSuccess: "تم استيراد {count} رسالة",
      importSkippedFiles: "تم تخطي {count} ملف (حجم كبير جدًا)",
      importErrorNoMessages: "لم يتم العثور على أي رسائل صالحة في هذا الملف.",
      importErrorTooManySenders: "هذا يبدو كمحادثة جماعية (أكثر من شخصين) — الاستيراد يدعم محادثات فردية فقط.",
      importErrorGeneric: "تعذّرت قراءة هذا الملف. تأكد أنه ملف تصدير واتساب صالح.",
      importDone: "تم",
      supportTeamName: "فريق الدعم",
      actionsMenu: "خيارات إضافية",
      clearConversation: "حذف المحادثة",
      clearConversationConfirm: "رح يتم حذف كل رسائل هذه المحادثة نهائيًا. حساب الطالب رح يضل شغال ويقدر يبلش محادثة جديدة. هذا الإجراء ما ممكن التراجع عنه.",
      deleteAccount: "حذف حساب الطالب نهائيًا",
      deleteAccountConfirm: "رح يتم حذف حساب هذا الطالب بالكامل نهائيًا — تسجيل الدخول، بياناته، محادثته، وكل طلباته. هذا الإجراء ما ممكن التراجع عنه أبدًا.",
      actionFailed: "تعذّر تنفيذ الإجراء، حاول مرة أخرى.",
      actionPending: "جارٍ التنفيذ...",
      importPhoneLabel: "رقم هاتف الطالب (واتساب)",
      importPhoneHint: "اكتب رمز الدولة مع الرقم، مثل 9665XXXXXXXX — نفس الصيغة يلي رح يستخدمها الطالب وقت التسجيل.",
      importPhoneImplausible: "رقم الهاتف قصير جدًا — تأكد من كتابة رمز الدولة معه.",
      importNameHintLabel: "اسم الطالب (للتنظيم عندك فقط)",
    },
    pendingImports: {
      heading: "استيراد محادثات واتساب مسبقًا",
      subheading: "لطلاب لسا ما سجلو حساب — رح تنربط المحادثة تلقائيًا أول ما يسجلو بنفس رقم الهاتف.",
      backToMessages: "الرجوع للمحادثات",
      add: "إضافة محادثة",
      empty: "لا توجد محادثات بانتظار الربط.",
      phone: "رقم الهاتف",
      messageCount: "عدد الرسائل",
    },
  },
  en: {
    meta: {
      title: "Smart Tech — Academic Research Consulting",
      description: "Integrated academic and research consulting that supports your own work, start to finish.",
    },
    nav: {
      home: "Home",
      services: "Services",
      testimonials: "Testimonials",
      faq: "FAQ",
      about: "About",
      contact: "Contact",
      login: "Log In",
      logout: "Log Out",
      dashboard: "My Dashboard",
    },
    hero: {
      eyebrow: "Integrated academic & research consulting",
      title: "We support your research journey,",
      highlight: "with full transparency from day one to delivery",
      subtitle:
        "A team of academic consultants helping master's and PhD students with editing, methodology, and statistical guidance — while your research, decisions, and work always stay yours.",
      ctaPrimary: "Explore our services",
      ctaSecondary: "Track your request",
    },
    services: {
      heading: "Our Services",
      subheading: "Professional academic support designed to strengthen your own work, not replace it.",
      requestCta: "Request this service",
      loginRequired: "Log in to submit a request",
      items: SERVICES_EN,
    },
    testimonials: {
      heading: "What Our Clients Say",
      subheading: "Real experiences from students who used our consulting support.",
      items: [
        {
          name: "Noura Al-Qahtani",
          role: "Master's Student, Business Administration",
          quote:
            "Smart Tech helped me organize my ideas and refine my writing style — without writing a single word for me. I learned so much along the way.",
        },
        {
          name: "Khalid Al-Mutairi",
          role: "PhD Researcher, Engineering",
          quote:
            "The methodology consulting saved me weeks of trial and error, and the tracking dashboard kept everything transparent.",
        },
        {
          name: "Reem Al-Harbi",
          role: "Master's Student, Psychology",
          quote: "The statistical support was precise and clear — I finally understood how to interpret my own SPSS output.",
        },
        {
          name: "Salman Al-Otaibi",
          role: "PhD Researcher, Computer Science",
          quote: "The literature review assistance saved me so much time organizing sources and connecting them to my research questions logically.",
        },
        {
          name: "Lamia Al-Dosari",
          role: "Master's Student, Education",
          quote: "Getting the APA formatting and citations right was incredibly precise — it saved me from details that used to eat up my time.",
        },
        {
          name: "Fahad Al-Shammari",
          role: "PhD Researcher, Public Health",
          quote: "The academic writing coaching sessions changed how I organize my ideas — I write with much more confidence now.",
        },
        {
          name: "Muneera Al-Anazi",
          role: "Master's Student, Law",
          quote: "The language review was professional and precise, keeping my own voice intact without changing my ideas.",
        },
        {
          name: "Abdullah Al-Qarni",
          role: "PhD Researcher, Chemistry",
          quote: "The statistical support helped me actually understand my tests instead of just applying them randomly.",
        },
        {
          name: "Hind Al-Zahrani",
          role: "Master's Student, Media Studies",
          quote: "The methodology consulting revealed weaknesses in my research design before I even started collecting data.",
        },
      ],
    },
    faq: {
      heading: "Frequently Asked Questions",
      subheading: "Everything you need to know before you start.",
      items: [
        {
          q: "Do you write the thesis or dissertation for me?",
          a: "No. We provide consulting, editing, and technical support for your own work only — the analysis, writing, and research decisions always remain yours.",
        },
        {
          q: "How do I track my request?",
          a: "After logging in, you get a personal dashboard showing the current stage, a progress bar, and a full timeline of every stage change.",
        },
        {
          q: "How long does a service usually take?",
          a: "It depends on the service and workload — you can always see the up-to-date timeline for your request.",
        },
        {
          q: "Is my data and research confidential?",
          a: "Yes — all files and conversations are treated as strictly confidential and are never shared with third parties.",
        },
        {
          q: "How do I receive the final file?",
          a: 'Once your request reaches the "Completed" stage, a download button appears right inside your tracking dashboard.',
        },
      ],
    },
    about: {
      heading: "About Us",
      body: "Smart Tech is a team of academic consultants and researchers who support graduate students throughout their research journey — with transparent language, methodology, and statistical support from the first idea to final delivery. You always remain the author and decision-maker.",
      stats: [
        { value: "500+", label: "students supported" },
        { value: "8+", label: "years of research experience" },
        { value: "97%", label: "client satisfaction rate" },
      ],
    },
    contact: {
      heading: "Get in Touch",
      body: "Have a question or want to discuss your request? Reach out and we'll get back to you within 24 hours.",
      emailLabel: "Email",
      phoneLabel: "Phone",
      email: "hello@smarttech-consulting.com",
      phone: "+972 59 792 7632",
      socialLabel: "Follow us",
    },
    login: {
      heading: "Log In",
      headingSignup: "Create Account",
      subheading: "Enter your details to track or manage requests.",
      subheadingSignup: "Create an account to track requests and message our team.",
      nameLabel: "Name",
      phoneLabel: "Phone number",
      phoneHint: "Include your country code, e.g. 9665XXXXXXXX.",
      emailLabel: "Email",
      passwordLabel: "Password",
      passwordHint: "At least 8 characters, including a letter and a number.",
      submit: "Log In",
      submitSignup: "Create Account",
      switchToSignup: "Don't have an account? Sign up",
      switchToLogin: "Already have an account? Log in",
      errorInvalidCredential: "Incorrect email or password.",
      errorEmailInUse: "That email is already in use — try logging in instead.",
      errorWeakPassword: "That password is too weak — use at least 6 characters.",
      errorWeakPasswordCustom: "Password must be at least 8 characters and include a letter and a number.",
      errorPhoneImplausible: "That phone number looks too short — make sure to include the country code.",
      errorTooManyRequests: "Too many attempts — please try again shortly.",
      errorNetwork: "Couldn't reach the server — check your internet connection.",
      errorGeneric: "Something went wrong — please try again.",
      backHome: "Back to home",
      remember: "Remember me",
      showPassword: "Show password",
      hidePassword: "Hide password",
      forgotPassword: "Forgot password?",
      resetHeading: "Reset your password",
      resetSubheading: "Enter your email and we'll send you a link to reset your password.",
      resetSubmit: "Send reset link",
      resetSentMessage: "If that email has an account with us, a reset link is on its way — check your inbox in a few minutes.",
      backToLogin: "Back to login",
      verifyEmailBanner: "You haven't verified your email yet — check your inbox.",
      verifyEmailResend: "Resend verification email",
      verifyEmailSent: "Verification email sent.",
      verifyEmailRefresh: "I've verified — refresh",
    },
    stages: {
      received: "Request received",
      in_review: "In review & preparation",
      in_progress: "In progress",
      revision: "Under review & revision",
      completed: "Completed & ready",
    },
    dashboardClient: {
      heading: "My Requests",
      subheading: "Track every request, stage by stage.",
      empty: "No requests yet.",
      browseServices: "Browse services",
      requestedOn: "Requested on",
      currentStage: "Current stage",
      progress: "Progress",
      timeline: "Timeline",
      download: "Download final file",
      fileWaiting: "The file will appear here once the request is completed",
    },
    dashboardAdmin: {
      heading: "Admin Dashboard",
      subheading: "Track every request and update its stage.",
      listTitle: "All requests",
      client: "Client",
      service: "Service",
      stage: "Stage",
      selectPrompt: "Select a request from the list to view details and update its stage.",
      advanceTo: "Advance to next stage",
      fileNameLabel: "Final file name",
      completeAndAttach: "Attach file & mark as completed",
      fileAttached: "File attached",
      timeline: "Timeline",
      doneAll: "This request has completed every stage.",
    },
    footer: {
      rights: "All rights reserved",
      tagline: "Integrated academic and research consulting that supports your own work.",
      quickLinks: "Quick Links",
      company: "Company",
    },
    common: { backHome: "Back to home", loading: "Loading..." },
    errors: {
      boundaryHeading: "Something went wrong",
      boundaryBody: "Sorry about that. Try again, or head back home.",
      tryAgain: "Try again",
    },
    errorsPage: {
      heading: "Error log",
      subheading: "Technical errors that happened on the site, logged automatically — for troubleshooting only.",
      empty: "No errors recorded.",
      dismiss: "Dismiss",
      navLink: "Error log",
      claimsHeading: "WhatsApp import claim log",
      claimsSubheading: "Every time a pre-imported WhatsApp conversation got linked to a new student account — check here if you suspect a number got linked to the wrong account.",
      claimsEmpty: "No import claims yet.",
      claimedBy: "Claimed by account",
      claimMessages: "message(s)",
    },
    chat: {
      heading: "Messages",
      placeholder: "Type a message...",
      send: "Send",
      attach: "Attach a file",
      empty: "No messages yet. Start the conversation!",
      selectConversation: "Select a conversation from the list to view it.",
      noConversations: "No conversations yet.",
      fileTooLarge: "File is too large (20MB max).",
      uploadFailed: "Couldn't upload the file right now — try sending the text without it, or try again later.",
      paymentLabel: "Payment status",
      paymentPaid: "Paid in full",
      paymentUnpaid: "Unpaid",
      paymentPartial: "Partial payment",
      botSettingsTitle: "Auto-reply settings",
      welcomeMessageLabel: "Welcome message",
      rulesLabel: "Frequent questions",
      ruleQuestionPlaceholder: "Question or trigger keywords",
      ruleAnswerPlaceholder: "Auto-reply",
      addRule: "Add",
      saveEdit: "Save changes",
      cancel: "Cancel",
      save: "Save",
      noRules: "No frequent questions yet.",
      importWhatsapp: "Import WhatsApp chat",
      importTitle: "Import WhatsApp Chat",
      importDescription: "Upload a WhatsApp chat export (.txt, or .zip with media) to bring it into this conversation.",
      importChooseFile: "Choose export file",
      importParsing: "Parsing file...",
      importWhoIsYou: "Which name is you (admin)?",
      importFoundMessages: "Found {count} messages",
      importFoundMedia: "and {count} media files",
      importConfirm: "Import",
      importCancel: "Cancel",
      importSuccess: "Imported {count} messages",
      importSkippedFiles: "{count} file(s) skipped (too large)",
      importErrorNoMessages: "No valid messages were found in this file.",
      importErrorTooManySenders: "This looks like a group chat (more than 2 people) — import only supports one-on-one chats.",
      importErrorGeneric: "Couldn't read this file. Make sure it's a valid WhatsApp export.",
      importDone: "Done",
      supportTeamName: "Support Team",
      actionsMenu: "More actions",
      clearConversation: "Delete conversation",
      clearConversationConfirm: "This permanently deletes every message in this conversation. The student's account stays active and they can start a fresh conversation. This cannot be undone.",
      deleteAccount: "Permanently delete account",
      deleteAccountConfirm: "This permanently deletes this student's entire account — their login, profile, conversation, and every request. This cannot be undone.",
      actionFailed: "Couldn't complete that action — try again.",
      actionPending: "Working...",
      importPhoneLabel: "Student's phone number (WhatsApp)",
      importPhoneHint: "Include the country code, e.g. 9665XXXXXXXX — the same format the student will use when signing up.",
      importPhoneImplausible: "That phone number looks too short — make sure to include the country code.",
      importNameHintLabel: "Student name (for your own reference only)",
    },
    pendingImports: {
      heading: "Pre-import WhatsApp chats",
      subheading: "For students who haven't signed up yet — this links automatically the moment they sign up with the same phone number.",
      backToMessages: "Back to messages",
      add: "Add conversation",
      empty: "No conversations waiting to be linked.",
      phone: "Phone",
      messageCount: "Messages",
    },
  },
};

interface I18nContextValue {
  locale: Locale;
  dir: "rtl" | "ltr";
  t: Dict;
  toggleLocale: () => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);
const KEY = "st_locale";

// No live cross-tab sync needed, so subscribe is a no-op — useSyncExternalStore is used purely
// for its SSR-safe read: server snapshot ("ar") on the first pass, resynced to the real stored
// value before paint, with no flash-of-wrong-locale and no setState-in-effect.
function subscribe() {
  return () => {};
}
function getSnapshot(): Locale {
  try {
    const stored = window.localStorage.getItem(KEY);
    if (stored === "ar" || stored === "en") return stored;
  } catch {
    // ignore
  }
  return "ar";
}
function getServerSnapshot(): Locale {
  return "ar";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const persisted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [override, setOverride] = useState<Locale | null>(null);
  const locale = override ?? persisted;

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  const toggleLocale = () => {
    const next = locale === "ar" ? "en" : "ar";
    try {
      window.localStorage.setItem(KEY, next);
    } catch {
      // ignore
    }
    setOverride(next);
  };

  return (
    <I18nContext.Provider
      value={{ locale, dir: locale === "ar" ? "rtl" : "ltr", t: translations[locale], toggleLocale }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
