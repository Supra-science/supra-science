"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { getRecaptchaToken, loadRecaptcha } from "@/lib/recaptcha";

export type SiteLang = "en" | "ar";

/** ISO country code + dialing prefix + English/Arabic names (248 entries, as in the live bundle). */
const COUNTRIES: Array<{ iso: string; dial: string; en: string; ar: string }> = [
  { iso: "AF", dial: "93", en: "Afghanistan", ar: "أفغانستان" },
  { iso: "AL", dial: "355", en: "Albania", ar: "ألبانيا" },
  { iso: "DZ", dial: "213", en: "Algeria", ar: "الجزائر" },
  { iso: "AS", dial: "1", en: "American Samoa", ar: "ساموا الأمريكية" },
  { iso: "AD", dial: "376", en: "Andorra", ar: "أندورا" },
  { iso: "AO", dial: "244", en: "Angola", ar: "أنغولا" },
  { iso: "AI", dial: "1", en: "Anguilla", ar: "أنغويلا" },
  { iso: "AQ", dial: "672", en: "Antarctica", ar: "القارة القطبية الجنوبية" },
  { iso: "AG", dial: "1", en: "Antigua and Barbuda", ar: "أنتيغوا وباربودا" },
  { iso: "AR", dial: "54", en: "Argentina", ar: "الأرجنتين" },
  { iso: "AM", dial: "374", en: "Armenia", ar: "أرمينيا" },
  { iso: "AW", dial: "297", en: "Aruba", ar: "أروبا" },
  { iso: "AU", dial: "61", en: "Australia", ar: "أستراليا" },
  { iso: "AT", dial: "43", en: "Austria", ar: "النمسا" },
  { iso: "AZ", dial: "994", en: "Azerbaijan", ar: "أذربيجان" },
  { iso: "BS", dial: "1", en: "Bahamas", ar: "جزر البهاما" },
  { iso: "BH", dial: "973", en: "Bahrain", ar: "البحرين" },
  { iso: "BD", dial: "880", en: "Bangladesh", ar: "بنغلاديش" },
  { iso: "BB", dial: "1", en: "Barbados", ar: "باربادوس" },
  { iso: "BY", dial: "375", en: "Belarus", ar: "بيلاروسيا" },
  { iso: "BE", dial: "32", en: "Belgium", ar: "بلجيكا" },
  { iso: "BZ", dial: "501", en: "Belize", ar: "بليز" },
  { iso: "BJ", dial: "229", en: "Benin", ar: "بنين" },
  { iso: "BM", dial: "1", en: "Bermuda", ar: "برمودا" },
  { iso: "BT", dial: "975", en: "Bhutan", ar: "بوتان" },
  { iso: "BO", dial: "591", en: "Bolivia", ar: "بوليفيا" },
  { iso: "BA", dial: "387", en: "Bosnia and Herzegovina", ar: "البوسنة والهرسك" },
  { iso: "BW", dial: "267", en: "Botswana", ar: "بوتسوانا" },
  { iso: "BV", dial: "47", en: "Bouvet Island", ar: "جزيرة بوفيه" },
  { iso: "BR", dial: "55", en: "Brazil", ar: "البرازيل" },
  { iso: "IO", dial: "246", en: "British Indian Ocean Territory", ar: "إقليم المحيط الهندي البريطاني" },
  { iso: "BN", dial: "673", en: "Brunei", ar: "بروناي" },
  { iso: "BG", dial: "359", en: "Bulgaria", ar: "بلغاريا" },
  { iso: "BF", dial: "226", en: "Burkina Faso", ar: "بوركينا فاسو" },
  { iso: "BI", dial: "257", en: "Burundi", ar: "بوروندي" },
  { iso: "KH", dial: "855", en: "Cambodia", ar: "كمبوديا" },
  { iso: "CM", dial: "237", en: "Cameroon", ar: "الكاميرون" },
  { iso: "CA", dial: "1", en: "Canada", ar: "كندا" },
  { iso: "CV", dial: "238", en: "Cape Verde", ar: "الرأس الأخضر" },
  { iso: "KY", dial: "1", en: "Cayman Islands", ar: "جزر كايمان" },
  { iso: "CF", dial: "236", en: "Central African Republic", ar: "جمهورية أفريقيا الوسطى" },
  { iso: "TD", dial: "235", en: "Chad", ar: "تشاد" },
  { iso: "CL", dial: "56", en: "Chile", ar: "تشيلي" },
  { iso: "CN", dial: "86", en: "China", ar: "الصين" },
  { iso: "CX", dial: "61", en: "Christmas Island", ar: "جزيرة عيد الميلاد" },
  { iso: "CC", dial: "61", en: "Cocos Islands", ar: "جزر كوكوس" },
  { iso: "CO", dial: "57", en: "Colombia", ar: "كولومبيا" },
  { iso: "KM", dial: "269", en: "Comoros", ar: "جزر القمر" },
  { iso: "CG", dial: "242", en: "Congo (Republic)", ar: "الكونغو" },
  { iso: "CD", dial: "243", en: "Congo (DRC)", ar: "الكونغو الديمقراطية" },
  { iso: "CK", dial: "682", en: "Cook Islands", ar: "جزر كوك" },
  { iso: "CR", dial: "506", en: "Costa Rica", ar: "كوستاريكا" },
  { iso: "HR", dial: "385", en: "Croatia", ar: "كرواتيا" },
  { iso: "CU", dial: "53", en: "Cuba", ar: "كوبا" },
  { iso: "CW", dial: "599", en: "Curaçao", ar: "كوراساو" },
  { iso: "CY", dial: "357", en: "Cyprus", ar: "قبرص" },
  { iso: "CZ", dial: "420", en: "Czech Republic", ar: "التشيك" },
  { iso: "DK", dial: "45", en: "Denmark", ar: "الدنمارك" },
  { iso: "DJ", dial: "253", en: "Djibouti", ar: "جيبوتي" },
  { iso: "DM", dial: "1", en: "Dominica", ar: "دومينيكا" },
  { iso: "DO", dial: "1", en: "Dominican Republic", ar: "جمهورية الدومينيكان" },
  { iso: "EC", dial: "593", en: "Ecuador", ar: "الإكوادور" },
  { iso: "EG", dial: "20", en: "Egypt", ar: "مصر" },
  { iso: "SV", dial: "503", en: "El Salvador", ar: "السلفادور" },
  { iso: "GQ", dial: "240", en: "Equatorial Guinea", ar: "غينيا الاستوائية" },
  { iso: "ER", dial: "291", en: "Eritrea", ar: "إريتريا" },
  { iso: "EE", dial: "372", en: "Estonia", ar: "إستونيا" },
  { iso: "SZ", dial: "268", en: "Eswatini", ar: "إسواتيني" },
  { iso: "ET", dial: "251", en: "Ethiopia", ar: "إثيوبيا" },
  { iso: "FK", dial: "500", en: "Falkland Islands", ar: "جزر فوكلاند" },
  { iso: "FO", dial: "298", en: "Faroe Islands", ar: "جزر فارو" },
  { iso: "FJ", dial: "679", en: "Fiji", ar: "فيجي" },
  { iso: "FI", dial: "358", en: "Finland", ar: "فنلندا" },
  { iso: "FR", dial: "33", en: "France", ar: "فرنسا" },
  { iso: "GF", dial: "594", en: "French Guiana", ar: "غويانا الفرنسية" },
  { iso: "PF", dial: "689", en: "French Polynesia", ar: "بولينيزيا الفرنسية" },
  { iso: "TF", dial: "262", en: "French Southern Territories", ar: "الأقاليم الفرنسية الجنوبية" },
  { iso: "GA", dial: "241", en: "Gabon", ar: "الغابون" },
  { iso: "GM", dial: "220", en: "Gambia", ar: "غامبيا" },
  { iso: "GE", dial: "995", en: "Georgia", ar: "جورجيا" },
  { iso: "DE", dial: "49", en: "Germany", ar: "ألمانيا" },
  { iso: "GH", dial: "233", en: "Ghana", ar: "غانا" },
  { iso: "GI", dial: "350", en: "Gibraltar", ar: "جبل طارق" },
  { iso: "GR", dial: "30", en: "Greece", ar: "اليونان" },
  { iso: "GL", dial: "299", en: "Greenland", ar: "غرينلاند" },
  { iso: "GD", dial: "1", en: "Grenada", ar: "غرينادا" },
  { iso: "GP", dial: "590", en: "Guadeloupe", ar: "غوادلوب" },
  { iso: "GU", dial: "1", en: "Guam", ar: "غوام" },
  { iso: "GT", dial: "502", en: "Guatemala", ar: "غواتيمالا" },
  { iso: "GG", dial: "44", en: "Guernsey", ar: "غيرنزي" },
  { iso: "GN", dial: "224", en: "Guinea", ar: "غينيا" },
  { iso: "GW", dial: "245", en: "Guinea-Bissau", ar: "غينيا بيساو" },
  { iso: "GY", dial: "592", en: "Guyana", ar: "غيانا" },
  { iso: "HT", dial: "509", en: "Haiti", ar: "هايتي" },
  { iso: "HM", dial: "672", en: "Heard Island", ar: "جزيرة هيرد" },
  { iso: "VA", dial: "39", en: "Vatican", ar: "الفاتيكان" },
  { iso: "HN", dial: "504", en: "Honduras", ar: "هندوراس" },
  { iso: "HK", dial: "852", en: "Hong Kong", ar: "هونغ كونغ" },
  { iso: "HU", dial: "36", en: "Hungary", ar: "المجر" },
  { iso: "IS", dial: "354", en: "Iceland", ar: "آيسلندا" },
  { iso: "IN", dial: "91", en: "India", ar: "الهند" },
  { iso: "ID", dial: "62", en: "Indonesia", ar: "إندونيسيا" },
  { iso: "IR", dial: "98", en: "Iran", ar: "إيران" },
  { iso: "IQ", dial: "964", en: "Iraq", ar: "العراق" },
  { iso: "IE", dial: "353", en: "Ireland", ar: "أيرلندا" },
  { iso: "IM", dial: "44", en: "Isle of Man", ar: "جزيرة مان" },
  { iso: "IL", dial: "972", en: "Israel", ar: "إسرائيل" },
  { iso: "IT", dial: "39", en: "Italy", ar: "إيطاليا" },
  { iso: "CI", dial: "225", en: "Côte d'Ivoire", ar: "ساحل العاج" },
  { iso: "JM", dial: "1", en: "Jamaica", ar: "جامايكا" },
  { iso: "JP", dial: "81", en: "Japan", ar: "اليابان" },
  { iso: "JE", dial: "44", en: "Jersey", ar: "جيرسي" },
  { iso: "JO", dial: "962", en: "Jordan", ar: "الأردن" },
  { iso: "KZ", dial: "7", en: "Kazakhstan", ar: "كازاخستان" },
  { iso: "KE", dial: "254", en: "Kenya", ar: "كينيا" },
  { iso: "KI", dial: "686", en: "Kiribati", ar: "كيريباتي" },
  { iso: "KP", dial: "850", en: "North Korea", ar: "كوريا الشمالية" },
  { iso: "KR", dial: "82", en: "South Korea", ar: "كوريا الجنوبية" },
  { iso: "KW", dial: "965", en: "Kuwait", ar: "الكويت" },
  { iso: "KG", dial: "996", en: "Kyrgyzstan", ar: "قيرغيزستان" },
  { iso: "LA", dial: "856", en: "Laos", ar: "لاوس" },
  { iso: "LV", dial: "371", en: "Latvia", ar: "لاتفيا" },
  { iso: "LB", dial: "961", en: "Lebanon", ar: "لبنان" },
  { iso: "LS", dial: "266", en: "Lesotho", ar: "ليسوتو" },
  { iso: "LR", dial: "231", en: "Liberia", ar: "ليبيريا" },
  { iso: "LY", dial: "218", en: "Libya", ar: "ليبيا" },
  { iso: "LI", dial: "423", en: "Liechtenstein", ar: "ليختنشتاين" },
  { iso: "LT", dial: "370", en: "Lithuania", ar: "ليتوانيا" },
  { iso: "LU", dial: "352", en: "Luxembourg", ar: "لوكسمبورغ" },
  { iso: "MO", dial: "853", en: "Macao", ar: "ماكاو" },
  { iso: "MG", dial: "261", en: "Madagascar", ar: "مدغشقر" },
  { iso: "MW", dial: "265", en: "Malawi", ar: "ملاوي" },
  { iso: "MY", dial: "60", en: "Malaysia", ar: "ماليزيا" },
  { iso: "MV", dial: "960", en: "Maldives", ar: "المالديف" },
  { iso: "ML", dial: "223", en: "Mali", ar: "مالي" },
  { iso: "MT", dial: "356", en: "Malta", ar: "مالطا" },
  { iso: "MH", dial: "692", en: "Marshall Islands", ar: "جزر مارشال" },
  { iso: "MQ", dial: "596", en: "Martinique", ar: "مارتينيك" },
  { iso: "MR", dial: "222", en: "Mauritania", ar: "موريتانيا" },
  { iso: "MU", dial: "230", en: "Mauritius", ar: "موريشيوس" },
  { iso: "YT", dial: "262", en: "Mayotte", ar: "مايوت" },
  { iso: "MX", dial: "52", en: "Mexico", ar: "المكسيك" },
  { iso: "FM", dial: "691", en: "Micronesia", ar: "ميكرونيزيا" },
  { iso: "MD", dial: "373", en: "Moldova", ar: "مولدوفا" },
  { iso: "MC", dial: "377", en: "Monaco", ar: "موناكو" },
  { iso: "MN", dial: "976", en: "Mongolia", ar: "منغوليا" },
  { iso: "ME", dial: "382", en: "Montenegro", ar: "الجبل الأسود" },
  { iso: "MS", dial: "1", en: "Montserrat", ar: "مونتسيرات" },
  { iso: "MA", dial: "212", en: "Morocco", ar: "المغرب" },
  { iso: "MZ", dial: "258", en: "Mozambique", ar: "موزمبيق" },
  { iso: "MM", dial: "95", en: "Myanmar", ar: "ميانمار" },
  { iso: "NA", dial: "264", en: "Namibia", ar: "ناميبيا" },
  { iso: "NR", dial: "674", en: "Nauru", ar: "ناورو" },
  { iso: "NP", dial: "977", en: "Nepal", ar: "نيبال" },
  { iso: "NL", dial: "31", en: "Netherlands", ar: "هولندا" },
  { iso: "NC", dial: "687", en: "New Caledonia", ar: "كاليدونيا الجديدة" },
  { iso: "NZ", dial: "64", en: "New Zealand", ar: "نيوزيلندا" },
  { iso: "NI", dial: "505", en: "Nicaragua", ar: "نيكاراغوا" },
  { iso: "NE", dial: "227", en: "Niger", ar: "النيجر" },
  { iso: "NG", dial: "234", en: "Nigeria", ar: "نيجيريا" },
  { iso: "NU", dial: "683", en: "Niue", ar: "نيوي" },
  { iso: "NF", dial: "672", en: "Norfolk Island", ar: "جزيرة نورفولك" },
  { iso: "MK", dial: "389", en: "North Macedonia", ar: "مقدونيا الشمالية" },
  { iso: "MP", dial: "1", en: "Northern Mariana Islands", ar: "جزر ماريانا الشمالية" },
  { iso: "NO", dial: "47", en: "Norway", ar: "النرويج" },
  { iso: "OM", dial: "968", en: "Oman", ar: "عُمان" },
  { iso: "PK", dial: "92", en: "Pakistan", ar: "باكستان" },
  { iso: "PW", dial: "680", en: "Palau", ar: "بالاو" },
  { iso: "PS", dial: "970", en: "Palestine", ar: "فلسطين" },
  { iso: "PA", dial: "507", en: "Panama", ar: "بنما" },
  { iso: "PG", dial: "675", en: "Papua New Guinea", ar: "بابوا غينيا الجديدة" },
  { iso: "PY", dial: "595", en: "Paraguay", ar: "باراغواي" },
  { iso: "PE", dial: "51", en: "Peru", ar: "بيرو" },
  { iso: "PH", dial: "63", en: "Philippines", ar: "الفلبين" },
  { iso: "PN", dial: "64", en: "Pitcairn", ar: "جزر بيتكيرن" },
  { iso: "PL", dial: "48", en: "Poland", ar: "بولندا" },
  { iso: "PT", dial: "351", en: "Portugal", ar: "البرتغال" },
  { iso: "PR", dial: "1", en: "Puerto Rico", ar: "بورتوريكو" },
  { iso: "QA", dial: "974", en: "Qatar", ar: "قطر" },
  { iso: "RE", dial: "262", en: "Réunion", ar: "ريونيون" },
  { iso: "RO", dial: "40", en: "Romania", ar: "رومانيا" },
  { iso: "RU", dial: "7", en: "Russia", ar: "روسيا" },
  { iso: "RW", dial: "250", en: "Rwanda", ar: "رواندا" },
  { iso: "BL", dial: "590", en: "Saint Barthélemy", ar: "سان بارتيليمي" },
  { iso: "SH", dial: "290", en: "Saint Helena", ar: "سانت هيلينا" },
  { iso: "KN", dial: "1", en: "Saint Kitts and Nevis", ar: "سانت كيتس ونيفيس" },
  { iso: "LC", dial: "1", en: "Saint Lucia", ar: "سانت لوسيا" },
  { iso: "MF", dial: "590", en: "Saint Martin", ar: "سان مارتن" },
  { iso: "PM", dial: "508", en: "Saint Pierre and Miquelon", ar: "سان بيير وميكلون" },
  { iso: "VC", dial: "1", en: "Saint Vincent and the Grenadines", ar: "سانت فنسنت والغرينادين" },
  { iso: "WS", dial: "685", en: "Samoa", ar: "ساموا" },
  { iso: "SM", dial: "378", en: "San Marino", ar: "سان مارينو" },
  { iso: "ST", dial: "239", en: "São Tomé and Príncipe", ar: "ساو تومي وبرينسيبي" },
  { iso: "SA", dial: "966", en: "Saudi Arabia", ar: "السعودية" },
  { iso: "SN", dial: "221", en: "Senegal", ar: "السنغال" },
  { iso: "RS", dial: "381", en: "Serbia", ar: "صربيا" },
  { iso: "SC", dial: "248", en: "Seychelles", ar: "سيشل" },
  { iso: "SL", dial: "232", en: "Sierra Leone", ar: "سيراليون" },
  { iso: "SG", dial: "65", en: "Singapore", ar: "سنغافورة" },
  { iso: "SX", dial: "1", en: "Sint Maarten", ar: "سينت مارتن" },
  { iso: "SK", dial: "421", en: "Slovakia", ar: "سلوفاكيا" },
  { iso: "SI", dial: "386", en: "Slovenia", ar: "سلوفينيا" },
  { iso: "SB", dial: "677", en: "Solomon Islands", ar: "جزر سليمان" },
  { iso: "SO", dial: "252", en: "Somalia", ar: "الصومال" },
  { iso: "ZA", dial: "27", en: "South Africa", ar: "جنوب أفريقيا" },
  { iso: "GS", dial: "500", en: "South Georgia", ar: "جورجيا الجنوبية" },
  { iso: "SS", dial: "211", en: "South Sudan", ar: "جنوب السودان" },
  { iso: "ES", dial: "34", en: "Spain", ar: "إسبانيا" },
  { iso: "LK", dial: "94", en: "Sri Lanka", ar: "سريلانكا" },
  { iso: "SD", dial: "249", en: "Sudan", ar: "السودان" },
  { iso: "SR", dial: "597", en: "Suriname", ar: "سورينام" },
  { iso: "SJ", dial: "47", en: "Svalbard", ar: "سفالبارد" },
  { iso: "SE", dial: "46", en: "Sweden", ar: "السويد" },
  { iso: "CH", dial: "41", en: "Switzerland", ar: "سويسرا" },
  { iso: "SY", dial: "963", en: "Syria", ar: "سوريا" },
  { iso: "TW", dial: "886", en: "Taiwan", ar: "تايوان" },
  { iso: "TJ", dial: "992", en: "Tajikistan", ar: "طاجيكستان" },
  { iso: "TZ", dial: "255", en: "Tanzania", ar: "تنزانيا" },
  { iso: "TH", dial: "66", en: "Thailand", ar: "تايلاند" },
  { iso: "TL", dial: "670", en: "Timor-Leste", ar: "تيمور الشرقية" },
  { iso: "TG", dial: "228", en: "Togo", ar: "توغو" },
  { iso: "TK", dial: "690", en: "Tokelau", ar: "توكيلاو" },
  { iso: "TO", dial: "676", en: "Tonga", ar: "تونغا" },
  { iso: "TT", dial: "1", en: "Trinidad and Tobago", ar: "ترينيداد وتوباغو" },
  { iso: "TN", dial: "216", en: "Tunisia", ar: "تونس" },
  { iso: "TR", dial: "90", en: "Turkey", ar: "تركيا" },
  { iso: "TM", dial: "993", en: "Turkmenistan", ar: "تركمانستان" },
  { iso: "TC", dial: "1", en: "Turks and Caicos Islands", ar: "جزر توركس وكايكوس" },
  { iso: "TV", dial: "688", en: "Tuvalu", ar: "توفالو" },
  { iso: "UG", dial: "256", en: "Uganda", ar: "أوغندا" },
  { iso: "UA", dial: "380", en: "Ukraine", ar: "أوكرانيا" },
  { iso: "AE", dial: "971", en: "United Arab Emirates", ar: "الإمارات العربية المتحدة" },
  { iso: "GB", dial: "44", en: "United Kingdom", ar: "بريطانيا" },
  { iso: "US", dial: "1", en: "United States", ar: "الولايات المتحدة" },
  { iso: "UM", dial: "1", en: "US Minor Outlying Islands", ar: "جزر الولايات المتحدة النائية" },
  { iso: "UY", dial: "598", en: "Uruguay", ar: "أوروغواي" },
  { iso: "UZ", dial: "998", en: "Uzbekistan", ar: "أوزبكستان" },
  { iso: "VU", dial: "678", en: "Vanuatu", ar: "فانواتو" },
  { iso: "VE", dial: "58", en: "Venezuela", ar: "فنزويلا" },
  { iso: "VN", dial: "84", en: "Vietnam", ar: "فيتنام" },
  { iso: "VG", dial: "1", en: "Virgin Islands (British)", ar: "جزر فيرجن البريطانية" },
  { iso: "VI", dial: "1", en: "Virgin Islands (U.S.)", ar: "جزر فيرجن الأمريكية" },
  { iso: "WF", dial: "681", en: "Wallis and Futuna", ar: "واليس وفوتونا" },
  { iso: "EH", dial: "212", en: "Western Sahara", ar: "الصحراء الغربية" },
  { iso: "YE", dial: "967", en: "Yemen", ar: "اليمن" },
  { iso: "ZM", dial: "260", en: "Zambia", ar: "زامبيا" },
  { iso: "ZW", dial: "263", en: "Zimbabwe", ar: "زيمبابوي" },
  { iso: "AX", dial: "358", en: "Åland Islands", ar: "جزر آلاند" },
];
/** Countries shown first in the dial-code list (after the United States). */
const PRIORITY_COUNTRIES = ["US", "GB", "CA", "AU", "DE", "FR", "IN", "SA", "AE", "EG", "YE", "JO", "KW", "QA", "BH", "OM", "IQ", "TR", "MY", "ID", "PK", "BD", "NG", "KE", "ZA", "BR", "MX", "ES", "IT", "NL", "SE", "CH", "RU", "UA", "PL", "JP", "KR", "CN", "TH", "VN", "PH", "SG", "NZ", "IE", "PT", "GR", "IL", "MA", "DZ", "TN", "LY", "SD", "ET", "GH", "SN", "CI"];

/** Normalise raw input into `+<dial><digits>`: strip the dial prefix if already present, drop a leading 0. */
function formatPhone(dial: string, raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith(dial)) digits = digits.slice(dial.length);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits ? `+${dial}${digits}` : "";
}

/** Detect the country from a pasted `+<dial>...` number: longest matching dial prefix wins. */
function detectCountry(
  digits: string,
  currentIso: string,
): { iso: string; dial: string; en: string; ar: string } | null {
  let longest = 0;
  for (const c of COUNTRIES) {
    if (digits.startsWith(c.dial)) longest = Math.max(longest, c.dial.length);
  }
  if (longest === 0) return null;
  const matches = COUNTRIES.filter(
    (c) => c.dial.length === longest && digits.startsWith(c.dial),
  );
  return (
    matches.find((c) => c.iso === currentIso) ??
    matches.find((c) => PRIORITY_COUNTRIES.includes(c.iso)) ??
    matches[0]
  );
}

/** Country-code select + national-number input. Internal to this file (not exported in the bundle). */
function PhoneInput({
  lang,
  value,
  onChange,
}: {
  lang: SiteLang;
  value: string;
  onChange: (phone: string) => void;
}) {
  const [countryIso, setCountryIso] = useState("US");
  const country =
    COUNTRIES.find((c) => c.iso === countryIso) ??
    COUNTRIES.find((c) => c.iso === "US")!;
  const options = useMemo(() => {
    const locale = lang === "ar" ? "ar" : "en";
    const rest = COUNTRIES.filter((c) => c.iso !== "US").sort((a, b) =>
      a[lang].localeCompare(b[lang], locale),
    );
    return [COUNTRIES.find((c) => c.iso === "US")!, ...rest];
  }, [lang]);
  const digits = value.replace(/\D/g, "");
  const localPart = digits.startsWith(country.dial)
    ? digits.slice(country.dial.length)
    : digits;

  return (
    <span className="phone-row">
      <select
        aria-label={lang === "ar" ? "مفتاح الدولة" : "Country code"}
        value={countryIso}
        onChange={(e) => {
          const next =
            COUNTRIES.find((c) => c.iso === e.target.value) ?? country;
          setCountryIso(next.iso);
          onChange(formatPhone(next.dial, localPart));
        }}
      >
        {options.map((c) => (
          <option key={c.iso} value={c.iso}>
            +{c.dial} · {lang === "ar" ? c.ar : c.en}
          </option>
        ))}
      </select>
      <input
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        aria-label={lang === "ar" ? "رقم الهاتف" : "Phone number"}
        dir="ltr"
        value={localPart}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw.trim().startsWith("+")) {
            const detected = detectCountry(raw.replace(/\D/g, ""), countryIso);
            if (detected && detected.iso !== countryIso) {
              setCountryIso(detected.iso);
              onChange(formatPhone(detected.dial, raw));
              return;
            }
          }
          onChange(formatPhone(country.dial, raw));
        }}
        placeholder={`+${country.dial} ...`}
      />
    </span>
  );
}

const STRINGS = {
  en: {
    name: "Name",
    namePh: "Your name",
    email: "Email",
    emailPh: "you@example.com",
    phone: "Phone (optional)",
    subject: "Subject",
    subjectPh: "What is this about?",
    message: "Message",
    messagePh: "Describe your project or question…",
    preferred: "Preferred contact",
    emailOpt: "Email",
    whatsappOpt: "WhatsApp",
    meetOpt: "Google Meet",
    submit: "Send message",
    sending: "Sending…",
    received: "Received ✓",
    thanks: "Thank you",
    another: "Send another message",
    receivedDefault: "Message received.",
    errorDefault: "Could not send your message.",
    networkError: "Network error. Please try again or email us directly.",
    errors: {
      name: "Please enter your name (at least 2 characters).",
      email: "Please enter a valid email address.",
      subject: "Please enter a subject (at least 3 characters).",
      message: "Please write a message (at least 10 characters).",
    },
    note: "Every submission is validated and you get a confirmation on success. For an immediate channel, email or WhatsApp us directly. We never share your details. This site is protected by reCAPTCHA and the Google ",
    privacy: "Privacy Policy",
    terms: "Terms of Service",
    applySuffix: " apply.",
  },
  ar: {
    name: "الاسم الكامل",
    namePh: "اسمك الكريم",
    email: "البريد الإلكتروني",
    emailPh: "you@example.com",
    phone: "الهاتف (اختياري)",
    subject: "الموضوع",
    subjectPh: "ما موضوع رسالتك؟",
    message: "الرسالة",
    messagePh: "صف مشروعك أو استفسارك…",
    preferred: "طريقة التواصل المفضلة",
    emailOpt: "البريد الإلكتروني",
    whatsappOpt: "واتساب",
    meetOpt: "Google Meet",
    submit: "إرسال الرسالة",
    sending: "جارٍ الإرسال…",
    received: "تم الاستلام ✓",
    thanks: "شكراً لك",
    another: "أرسل رسالة أخرى",
    receivedDefault: "تم استلام رسالتك.",
    errorDefault: "تعذّر إرسال رسالتك.",
    networkError: "خطأ في الشبكة. حاول مجدداً أو راسلنا مباشرة عبر البريد.",
    errors: {
      name: "يرجى إدخال الاسم (حرفان على الأقل).",
      email: "يرجى إدخال بريد إلكتروني صحيح.",
      subject: "يرجى إدخال الموضوع (3 أحرف على الأقل).",
      message: "يرجى كتابة رسالة (10 أحرف على الأقل).",
    },
    note: "كل إرسال يُتحقق منه وتصلك رسالة تأكيد عند النجاح. ولقناة فورية راسلنا بالبريد أو واتساب مباشرة. لا نشارك بياناتك أبداً. هذا الموقع محمي بواسطة reCAPTCHA وتسري عليه ",
    privacy: "سياسة خصوصية Google",
    terms: "شروط الخدمة",
    applySuffix: ".",
  },
};

type ContactFields = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  preferred_contact: string;
};

const EMPTY_FORM: ContactFields = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
  preferred_contact: "email",
};

/**
 * Public contact form (client component). Posts to /api/contact with a
 * reCAPTCHA token (action "contact"). Client-side validation mirrors the
 * server rules: name ≥ 2 chars, valid email, subject ≥ 3 chars,
 * message ≥ 10 chars; the first invalid field receives focus.
 * (Reconstructed from the Nov-8 live bundle, module 45473.)
 *
 * In Nov-5 the form was inline in src/app/contact/page.tsx (a client
 * page, no validation messages, plain phone input, preferred-contact
 * options email/whatsapp/call, no reCAPTCHA). Nov-8 extracts it here,
 * adds the country-code phone input, the "Google Meet" contact option
 * (replacing "Phone call"), inline field errors, and reCAPTCHA.
 */
export function ContactForm({ lang }: { lang: SiteLang }) {
  const t = STRINGS[lang];
  const [form, setForm] = useState<ContactFields>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFields, string>>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [note, setNote] = useState("");

  useEffect(() => {
    loadRecaptcha();
  }, []);

  const setField =
    (field: keyof ContactFields) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      if (field in errors) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };

  async function submit(e: FormEvent) {
    e.preventDefault();
    const nextErrors: Partial<Record<keyof ContactFields, string>> = {};
    if (form.name.trim().length < 2) nextErrors.name = t.errors.name;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = t.errors.email;
    }
    if (form.subject.trim().length < 3) nextErrors.subject = t.errors.subject;
    if (form.message.trim().length < 10) nextErrors.message = t.errors.message;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const first = Object.keys(nextErrors)[0];
      document.getElementById(`contact-${first}`)?.focus();
      return;
    }

    setStatus("sending");
    setNote("");
    try {
      const recaptchaToken = await getRecaptchaToken("contact");
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, recaptcha_token: recaptchaToken }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus("done");
        setNote(data.note || t.receivedDefault);
        setForm(EMPTY_FORM);
      } else {
        setStatus("error");
        setNote(data.error || t.errorDefault);
      }
    } catch {
      setStatus("error");
      setNote(t.networkError);
    }
  }

  if (status === "done") {
    return (
      <div>
        <div className="eyebrow">{t.received}</div>
        <h2 style={{ fontSize: 24 }}>
          {t.thanks}
          {form.name ? (lang === "ar" ? `، ${form.name}` : `, ${form.name}`) : ""}
          .
        </h2>
        <p className="muted">{note}</p>
        <button className="btn secondary" onClick={() => setStatus("idle")}>
          {t.another}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate style={{ display: "grid", gap: 12 }}>
      <label className="field">
        {t.name}
        <input
          id="contact-name"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "contact-name-error" : undefined}
          minLength={2}
          maxLength={120}
          value={form.name}
          onChange={setField("name")}
          placeholder={t.namePh}
        />
      </label>
      {errors.name && (
        <p className="error" id="contact-name-error" role="alert" style={{ margin: "-6px 0 0" }}>
          {errors.name}
        </p>
      )}

      <label className="field">
        {t.email}
        <input
          id="contact-email"
          type="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "contact-email-error" : undefined}
          value={form.email}
          onChange={setField("email")}
          placeholder={t.emailPh}
        />
      </label>
      {errors.email && (
        <p className="error" id="contact-email-error" role="alert" style={{ margin: "-6px 0 0" }}>
          {errors.email}
        </p>
      )}

      <label className="field">
        {t.phone}
        <PhoneInput
          lang={lang}
          value={form.phone}
          onChange={(phone) => setForm((f) => ({ ...f, phone }))}
        />
      </label>

      <label className="field">
        {t.subject}
        <input
          id="contact-subject"
          aria-invalid={!!errors.subject}
          aria-describedby={errors.subject ? "contact-subject-error" : undefined}
          minLength={3}
          maxLength={200}
          value={form.subject}
          onChange={setField("subject")}
          placeholder={t.subjectPh}
        />
      </label>
      {errors.subject && (
        <p className="error" id="contact-subject-error" role="alert" style={{ margin: "-6px 0 0" }}>
          {errors.subject}
        </p>
      )}

      <label className="field">
        {t.message}
        <textarea
          id="contact-message"
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "contact-message-error" : undefined}
          minLength={10}
          maxLength={5000}
          rows={5}
          value={form.message}
          onChange={setField("message")}
          placeholder={t.messagePh}
        />
      </label>
      {errors.message && (
        <p className="error" id="contact-message-error" role="alert" style={{ margin: "-6px 0 0" }}>
          {errors.message}
        </p>
      )}

      <label className="field">
        {t.preferred}
        <select value={form.preferred_contact} onChange={setField("preferred_contact")}>
          <option value="email">{t.emailOpt}</option>
          <option value="whatsapp">{t.whatsappOpt}</option>
          <option value="meet">{t.meetOpt}</option>
        </select>
      </label>

      {status === "error" && <p className="error">{note}</p>}

      <button className="btn" type="submit" disabled={status === "sending"}>
        {status === "sending" ? t.sending : t.submit}
      </button>

      <p className="muted" style={{ fontSize: 12 }}>
        {t.note}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
          {t.privacy}
        </a>{" "}
        {lang === "ar" ? "و" : "and"}{" "}
        <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer">
          {t.terms}
        </a>
        {t.applySuffix}
      </p>
    </form>
  );
}
