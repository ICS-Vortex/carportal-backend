import { APP_ROUTES } from "../constants/routes";
import type { HandlerContext } from "../utils/http";
import { sendJson } from "../utils/http";

const landingContent = {
  slides: [
    {
      id: "control-center",
      eyebrow: "Платформа для водія",
      title: "Керуйте сервісом, регламентом і нагадуваннями в одному місці.",
      detail: "Вебкабінет і мобільний сценарій поєднують гараж, історію обслуговування, майбутні роботи та швидкий доступ до даних по кожному авто.",
      primaryCta: { label: "Увійти до кабінету", href: APP_ROUTES.auth },
      secondaryCta: { label: "Дізнатися про mobile", href: "#mobile-app" },
      metrics: [
        { value: "24/7", label: "доступ до історії авто" },
        { value: "Онлайн", label: "актуальний стан сервісу" },
        { value: "2", label: "канали нагадувань" }
      ]
    },
    {
      id: "service-visibility",
      eyebrow: "Прозорий сервіс",
      title: "Журнал ТО без паперових нотаток і забутих записів.",
      detail: "Зберігайте сервісні роботи, пробіг, стан автомобіля і привʼязку до процедур регламенту, щоб бачити реальну картину по машині.",
      primaryCta: { label: "Перейти до входу", href: APP_ROUTES.auth },
      secondaryCta: { label: "Новини продукту", href: "#portal-news" },
      metrics: [
        { value: "VIN", label: "ідентифікація авто" },
        { value: "ТО", label: "регламентні події" },
        { value: "Email", label: "нагадування про сервіс" }
      ]
    },
    {
      id: "mobile-sync",
      eyebrow: "Веб + mobile",
      title: "Переходьте від лендингу до кабінету і далі до мобільного застосунку.",
      detail: "Головна сторінка презентує сервіс, а після входу користувач потрапляє в захищений кабінет без змішування маркетингу та внутрішнього функціоналу.",
      primaryCta: { label: "Спробувати сервіс", href: APP_ROUTES.auth },
      secondaryCta: { label: "Дивитися релізи", href: "#portal-news" },
      metrics: [
        { value: "Web", label: "публічна презентація" },
        { value: "Кабінет", label: "захищений простір водія" },
        { value: "iOS/Android", label: "мобільний напрям" }
      ]
    }
  ],
  banners: [
    {
      id: "catalog-banner",
      tag: "Каталог",
      title: "Регламенти і процедури вже керуються централізовано",
      detail: "Зміни в каталозі одразу стають доступними в інтерфейсах без ручної правки фронтенду.",
      href: APP_ROUTES.auth,
      actionLabel: "Увійти в сервіс"
    },
    {
      id: "email-banner",
      tag: "Нагадування",
      title: "Система готує події і для кабінету, і для email",
      detail: "Користувач бачить найближчі роботи у себе в кабінеті та отримує додатковий канал сповіщень.",
      href: APP_ROUTES.auth,
      actionLabel: "Перейти до авторизації"
    }
  ],
  audience: [
    {
      id: "owners",
      title: "Для власників авто",
      detail: "Контроль пробігу, сервісних подій та історії обслуговування без окремих таблиць і блокнотів."
    },
    {
      id: "first-visit",
      title: "Для нових користувачів",
      detail: "Публічна головна пояснює продукт і веде в потрібний сценарій: вебкабінет або майбутній mobile app."
    },
    {
      id: "operations",
      title: "Для щоденного використання",
      detail: "Внутрішній кабінет відділений від маркетингового шару, тому приватні дані не змішуються з презентацією."
    },
    {
      id: "mobile",
      title: "Для мобільного доступу",
      detail: "Під iOS та Android уже закладено окремий шлях, щоб сервіс масштабувався без переробки логіки."
    }
  ],
  downloads: [
    {
      platform: "iOS",
      title: "App Store",
      caption: "Швидкий доступ до гаража, історії сервісу і найближчих подій.",
      href: "#",
      status: "soon"
    },
    {
      platform: "Android",
      title: "Google Play",
      caption: "Перегляд нагадувань, записів ТО і картки автомобіля зі смартфона.",
      href: "#",
      status: "soon"
    }
  ],
  news: [
    {
      id: "news-cms",
      title: "Оновлення правил обслуговування вже синхронізуються з кабінетом",
      detail: "Адміністратор додає процедури та шаблони, а користувачі одразу бачать оновлення в кабінеті без моків.",
      tag: "Release",
      publishedAt: "2026-03-16"
    },
    {
      id: "news-landing",
      title: "Головна сторінка переведена в окремий маркетинговий режим",
      detail: "Публічний лендинг більше не показує елементи приватного кабінету й виступає як стартова сторінка продукту.",
      tag: "UX",
      publishedAt: "2026-03-16"
    },
    {
      id: "news-mobile",
      title: "Готується mobile-first сценарій для iOS та Android",
      detail: "Наступний етап після вебкабінету: окремий мобільний вхід у сервісну історію та нагадування.",
      tag: "Mobile",
      publishedAt: "2026-03-16"
    }
  ]
};

export async function getLandingContent(context: HandlerContext): Promise<void> {
  sendJson(context.res, 200, { ...landingContent, generatedAt: new Date().toISOString() });
}