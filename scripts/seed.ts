// Seed-скрипт Phase 2: каталог сообществ (Discovery) — фейковые пользователи,
// 6 сообществ, категории постов, посты, комментарии, лайки и очки участников.
//
// Запуск: npm run seed
// Требует SUPABASE_SERVICE_ROLE_KEY в .env.local (только для этого скрипта,
// в клиентский код секретный ключ никогда не попадает).

import ws from "ws";
// Node < 22 не имеет глобального WebSocket, а supabase-js всегда
// инициализирует realtime-клиент в конструкторе.
// @ts-expect-error -- полифилл для Node
globalThis.WebSocket ??= ws;

import { config } from "dotenv";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/types/database.types";

config({ path: resolve(__dirname, "../.env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error(
    "Нужны NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в .env.local"
  );
}

const admin = createClient<Database>(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SEED_EMAIL_SUFFIX = "+mentraseed@gmail.com";
const SEED_PASSWORD = "MentraDemo2026!";

function avatarUrl(name: string) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("");
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=5B6EF5&color=fff&bold=true`;
}

// ── Фейковые пользователи (RU/TJ/UZ имена) ──────────────────────────────

const SEED_USERS = [
  { name: "Анна Смирнова", slug: "anna.smirnova" },
  { name: "Дмитрий Волков", slug: "dmitry.volkov" },
  { name: "Екатерина Новикова", slug: "ekaterina.novikova" },
  { name: "Фарход Рахимов", slug: "farhod.rahimov" },
  { name: "Мадина Каримова", slug: "madina.karimova" },
  { name: "Шерали Назаров", slug: "sherali.nazarov" },
  { name: "Гулнора Юсупова", slug: "gulnora.yusupova" },
  { name: "Далер Саидов", slug: "daler.saidov" },
  { name: "Азиз Турсунов", slug: "aziz.tursunov" },
  { name: "Нилуфар Тошева", slug: "nilufar.tosheva" },
  { name: "Ботир Юлдашев", slug: "botir.yuldashev" },
  { name: "Зарина Абдуллаева", slug: "zarina.abdullaeva" },
  { name: "Жасур Эргашев", slug: "jasur.ergashev" },
  { name: "Севара Носирова", slug: "sevara.nosirova" },
] as const;

const COMMENT_POOL = [
  "Спасибо, очень полезно!",
  "Согласна на все сто.",
  "А можете скинуть шаблон в комментарии?",
  "У меня похожая ситуация была, помогло почти то же самое.",
  "Отличный разбор, сохранила себе.",
  "Как раз то, что искала, спасибо!",
  "Работает не всегда, но попробовать точно стоит.",
  "Спасибо, что делитесь опытом, это очень мотивирует.",
  "А что делать, если не сработало с первого раза?",
  "Актуально, как раз думала об этом на этой неделе.",
];

// ── Сообщества ────────────────────────────────────────────────────────

interface PostSpec {
  title: string;
  content: string;
  category: number; // индекс в categories
  pinned?: boolean;
}

// ── Курс (Phase 4) ───────────────────────────────────────────────────
// Полностью наполняем один курс в сообществе "Школа продаж Б2Б":
// 11 уроков вместо реального видео используют один и тот же стабильный
// публичный YouTube-ролик как заглушку (первый видео на YouTube,
// "Me at the zoo" — короткий, точно не будет удалён, безопасен для демо).

const PLACEHOLDER_VIDEO_URL = "https://www.youtube.com/watch?v=jNQXAC9IVRw";
const COURSE_COMMUNITY_SLUG = "prodazhi-b2b";

interface LessonSpec {
  title: string;
  content: string;
  durationMin: number;
}

interface ModuleSpec {
  title: string;
  lessons: LessonSpec[];
}

interface CourseSpec {
  title: string;
  description: string;
  modules: ModuleSpec[];
}

const COURSE: CourseSpec = {
  title: "Холодные продажи: система",
  description:
    "Пошаговая система холодных звонков для B2B: от первого касания до закрытия сделки. 3 модуля, которые проведут вас от подготовки до отработки возражений.",
  modules: [
    {
      title: "Подготовка к звонку",
      lessons: [
        {
          title: "Почему 90% холодных звонков проваливаются",
          content:
            "Большинство звонков проваливаются ещё до того, как менеджер произнёс первое слово: нет чёткой цели звонка, скрипт написан под всех клиентов сразу, а квалификация происходит уже после презентации. В этом уроке разберём три главные причины провала и как их избежать.",
          durationMin: 6,
        },
        {
          title: "Как составить портрет идеального клиента",
          content:
            "Прежде чем звонить, нужно понимать, кому вы звоните. Разберём модель ICP (Ideal Customer Profile): размер компании, отрасль, роль ЛПР и триггеры, которые говорят о готовности к покупке.",
          durationMin: 8,
        },
        {
          title: "Сбор информации о компании перед звонком",
          content:
            "Пять минут в LinkedIn и на сайте компании перед звонком радикально меняют разговор. Показываю чек-лист: что искать, где искать и как использовать найденное в первые 30 секунд разговора.",
          durationMin: 7,
        },
        {
          title: "Скрипт: структура первого касания",
          content:
            "Хороший скрипт — не список фраз для зачитывания, а каркас разговора. Разберём пятиблочную структуру: представление, зацепка, квалифицирующий вопрос, ценностное предложение, договорённость о следующем шаге.",
          durationMin: 9,
        },
      ],
    },
    {
      title: "Сам звонок",
      lessons: [
        {
          title: "Первые 10 секунд: как пройти секретаря",
          content:
            "Секретарь — не противник, а человек, который выполняет свою работу. Разберём три рабочих подхода: прямой, партнёрский и через рекомендацию — и почему агрессия почти всегда проигрывает.",
          durationMin: 7,
        },
        {
          title: "Квалификация клиента по методу BANT",
          content:
            "Budget, Authority, Need, Timing — четыре вопроса, которые за две минуты покажут, стоит ли продолжать разговор. Разберём, как задавать эти вопросы, не превращая звонок в допрос.",
          durationMin: 8,
        },
        {
          title: "Презентация ценности за 30 секунд",
          content:
            "У вас есть буквально полминуты, чтобы клиент решил, слушать дальше или положить трубку. Формула: боль клиента → как вы её решаете → доказательство (кейс или цифра).",
          durationMin: 6,
        },
        {
          title: "Как назначить встречу, а не продать в лоб",
          content:
            "Цель холодного звонка почти никогда не продажа — это следующий шаг. Разберём, как формулировать предложение о встрече так, чтобы согласие было логичным, а не давлением.",
          durationMin: 7,
        },
      ],
    },
    {
      title: "Работа с возражениями и закрытие",
      lessons: [
        {
          title: "Топ-5 возражений и ответы на них",
          content:
            "«Дорого», «нам не надо», «отправьте на почту», «я подумаю», «у нас уже есть поставщик» — разбираем каждое возражение и рабочий способ провести диалог дальше.",
          durationMin: 10,
        },
        {
          title: "Техника «чувствую-чувствовал-обнаружил»",
          content:
            "Классическая техника эмпатичной работы с возражением: показать, что понимаете чувства клиента, что другие клиенты чувствовали то же самое, и что они обнаружили в итоге. Разберём на живых примерах.",
          durationMin: 8,
        },
        {
          title: "Как закрыть сделку без давления",
          content:
            "Закрытие — это не финальный трюк, а логичное продолжение разговора, в котором клиент уже увидел ценность. Разберём мягкие техники закрытия и как понять, что клиент готов.",
          durationMin: 9,
        },
      ],
    },
  ],
};

interface CommunitySpec {
  slug: string;
  name: string;
  description: string;
  isPrivate: boolean;
  priceMonthly: number | null;
  currency: string;
  ownerIndex: number; // индекс в SEED_USERS
  adminIndexes: number[];
  categories: { name: string; emoji: string }[];
  posts: PostSpec[];
}

const COMMUNITIES: CommunitySpec[] = [
  {
    slug: "prodazhi-b2b",
    name: "Школа продаж Б2Б",
    description:
      "Сообщество для B2B-продажников и руководителей отделов продаж в Центральной Азии. Разбираем реальные кейсы, скрипты звонков и техники закрытия сделок. Еженедельные созвоны с экспертами и разбор ваших переговоров.",
    isPrivate: false,
    priceMonthly: 199,
    currency: "TJS",
    ownerIndex: 1,
    adminIndexes: [3],
    categories: [
      { name: "Кейсы", emoji: "📊" },
      { name: "Скрипты и шаблоны", emoji: "📝" },
      { name: "Вопросы", emoji: "❓" },
      { name: "Общение", emoji: "💬" },
    ],
    posts: [
      { title: "Как мы подняли конверсию в звонок с 12% до 27%", content: "Поделюсь механикой, которую внедрили в отделе за квартал: пересобрали скрипт холодного звонка и добавили квалификацию по BANT ещё на этапе секретаря. Конверсия выросла почти вдвое, готов разобрать детали в комментариях.", category: 0, pinned: true },
      { title: "Шаблон коммерческого предложения для B2B", content: "Выложил шаблон КП, который используем для сделок от 500 000 сомони. Структура: боль клиента → решение → кейсы → цена с якорем. Забирайте и адаптируйте под свою нишу.", category: 1 },
      { title: "Как реагировать на возражение «нам ничего не надо»?", content: "Столкнулся с этим на трёх звонках подряд на этой неделе. Что используете вы, чтобы пройти дальше через такую отговорку секретаря?", category: 2 },
      { title: "Закрыли сделку на 1,2 млн после полугода переговоров", content: "Долгая история с тендером в госсекторе. Главный урок: не бросать клиента после первого отказа и держать контакт через полезный контент.", category: 0 },
      { title: "Делимся любимыми книгами про продажи", content: "Начну: «СПИН-продажи» Рекхэма перечитываю раз в год. А что читаете вы?", category: 3 },
      { title: "Скрипт для повторного касания после тишины клиента", content: "Клиент пропал после хорошей встречи? Вот шаблон письма, который возвращает в диалог примерно треть таких клиентов.", category: 1 },
      { title: "Сколько у вас касаний до первой продажи в среднем?", content: "Собираю статистику по разным нишам, интересно сравнить B2B IT, услуги и производство.", category: 2 },
      { title: "Ошибка, которая стоила нам крупного клиента", content: "Не отправили коммерческое предложение сразу после встречи и потеряли momentum — клиент ушёл к конкурентам за три дня. Делюсь, чтобы вы не повторяли.", category: 0 },
      { title: "Кто из Душанбе — встречаемся офлайн в эту субботу", content: "Планируем нетворкинг-завтрак для участников комьюнити, пишите в комментарии, если интересно.", category: 3 },
      { title: "Как перестать демпинговать и продавать по своей цене", content: "Три месяца назад убрал скидки по умолчанию из скрипта — выручка не упала, а маржа выросла на 18%.", category: 0 },
    ],
  },
  {
    slug: "nutriciologiya",
    name: "Нутрициология с нуля",
    description:
      "Практическое сообщество для тех, кто хочет разобраться в нутрициологии и здоровом питании без жёстких диет. Разбираем состав продуктов, ведём дневники питания и делимся рецептами. Подходит и новичкам, и тем, кто хочет углубить знания.",
    isPrivate: false,
    priceMonthly: 149,
    currency: "TJS",
    ownerIndex: 4,
    adminIndexes: [6],
    categories: [
      { name: "Рецепты", emoji: "🥗" },
      { name: "Разбор случаев", emoji: "🔍" },
      { name: "Вопросы эксперту", emoji: "🙋‍♀️" },
      { name: "Мотивация", emoji: "🔥" },
    ],
    posts: [
      { title: "Завтрак с высоким белком за 10 минут", content: "Творог, овсянка, ложка арахисовой пасты и ягоды — 28 г белка и никакого сахара. Делюсь пропорциями в комментариях.", category: 0, pinned: true },
      { title: "Разобрали рацион участницы — нашли скрытый сахар в «полезных» йогуртах", content: "Часто оказывается, что фитнес-йогурт содержит больше сахара, чем обычный десерт. Учимся читать состав.", category: 1 },
      { title: "Правда ли, что после 18:00 нельзя есть углеводы?", content: "Слышала это правило миллион раз, но не понимаю, откуда оно взялось и работает ли вообще.", category: 2 },
      { title: "Минус 6 кг за 2 месяца без голодовок", content: "Делюсь не ради хвастовства, а чтобы показать: без экстремальных диет тоже реально. Главное — дефицит калорий и белок в каждом приёме пищи.", category: 3 },
      { title: "Овощной суп-пюре, который едят даже дети", content: "Тыква, морковь, немного имбиря — согревающий и лёгкий вариант на ужин.", category: 0 },
      { title: "Как считать калории, если готовлю на всю семью?", content: "Постоянно путаюсь в порциях, когда еда общая. Есть ли лайфхаки?", category: 2 },
      { title: "Почему вес встал, хотя питание не менялось", content: "Разобрали пример: дело оказалось в скрытых перекусах, которые не фиксировались в дневнике.", category: 1 },
      { title: "Год в сообществе — и я наконец не боюсь весов", content: "Спасибо всем за поддержку, это было непросто, но привычки правда меняются постепенно.", category: 3 },
    ],
  },
  {
    slug: "english-upper-intermediate",
    name: "Английский до Upper-Intermediate",
    description:
      "Открытое сообщество для тех, кто учит английский от Intermediate до Upper-Intermediate. Разговорные клубы, разбор грамматики и живое общение с носителями уровня. Присоединяйтесь бесплатно и практикуйтесь каждый день.",
    isPrivate: false,
    priceMonthly: null,
    currency: "TJS",
    ownerIndex: 2,
    adminIndexes: [9],
    categories: [
      { name: "Грамматика", emoji: "📘" },
      { name: "Разговорный клуб", emoji: "🗣" },
      { name: "Домашние задания", emoji: "📝" },
      { name: "Общение", emoji: "💬" },
    ],
    posts: [
      { title: "Present Perfect vs Past Simple — простое объяснение", content: "Разбираю на примерах, когда действительно важна связь с настоящим, а когда нет. Сохраняйте себе.", category: 0, pinned: true },
      { title: "Встреча разговорного клуба в субботу в 18:00", content: "Тема этой недели — путешествия. Ссылка на звонок появится за час до начала.", category: 1 },
      { title: "Домашка по Unit 7: Conditionals", content: "Прикрепляю задание на второй и третий тип условных предложений, сдаём до среды.", category: 2 },
      { title: "Поделитесь любимым сериалом на английском для практики", content: "Смотрю Friends в оригинале уже третий раз, субтитры почти не нужны.", category: 3 },
      { title: "Фразовые глаголы, которые реально используют носители", content: "get over, look forward to, come up with — собрал топ-10 из реальных подкастов.", category: 0 },
      { title: "Итоги встречи: обсуждали работу мечты", content: "Было классно послушать истории участников, отдельное спасибо тем, кто решился говорить впервые.", category: 1 },
      { title: "Как исправить ошибку в артиклях раз и навсегда", content: "Собрал правило в одну табличку, вроде наконец стало понятно самой себе.", category: 2 },
      { title: "Кто готовится к IELTS параллельно — как справляетесь с нагрузкой?", content: "Совмещаю с работой, иногда сложно найти время на практику каждый день.", category: 3 },
    ],
  },
  {
    slug: "ielts-7",
    name: "Подготовка к IELTS 7.0+",
    description:
      "Интенсивное сообщество для тех, кто готовится сдать IELTS на 7.0 и выше. Разбор Writing Task 2, тренировки Speaking с обратной связью и еженедельные пробные тесты. Для студентов, которые планируют учёбу или работу за рубежом.",
    isPrivate: false,
    priceMonthly: 249,
    currency: "TJS",
    ownerIndex: 8,
    adminIndexes: [11],
    categories: [
      { name: "Writing", emoji: "✍️" },
      { name: "Speaking", emoji: "🎤" },
      { name: "Listening & Reading", emoji: "🎧" },
      { name: "Мотивация", emoji: "🔥" },
    ],
    posts: [
      { title: "Разбор эссе на 6.5 — что мешает получить 7", content: "Основная проблема — слабая связность абзацев (cohesion), несмотря на хорошую лексику. Показываю правки построчно.", category: 0, pinned: true },
      { title: "Топ фраз для Part 2, которые звучат естественно", content: "Вместо «I think that» используйте «What really stands out to me is...» — сразу поднимает впечатление от речи.", category: 1 },
      { title: "Пробный тест в субботу — записывайтесь", content: "Полный формат, 3 часа, с разбором ошибок в прямом эфире после теста.", category: 2 },
      { title: "Сдала на 7.5 со второй попытки — что изменила в подготовке", content: "Главное — перестала зубрить шаблоны и начала реально тренировать тайминг под секундомер.", category: 3 },
      { title: "Структура Task 1 для diagram, которая всегда заходит экзаменатору", content: "Overview → главные тренды → детали с цифрами. Делюсь шаблоном фраз для описания графиков.", category: 0 },
      { title: "Как не паниковать перед Part 3", content: "Собрали лайфхаки от тех, кто уже сдавал: дышать, переспрашивать вопрос своими словами, не бояться пауз.", category: 1 },
      { title: "Ошибка, которую все делают в Matching Headings", content: "Читаете весь абзац целиком вместо первого и последнего предложения — теряете время. Разбираю технику скорочтения.", category: 2 },
      { title: "Через месяц экзамен — как не выгореть на финишной прямой", content: "Делюсь своим расписанием подготовки на оставшиеся недели, буду рада, если поделитесь своим.", category: 3 },
    ],
  },
  {
    slug: "smm-dlya-biznesa",
    name: "SMM для бизнеса",
    description:
      "Комьюнити для предпринимателей и маркетологов, которые продвигают бизнес в соцсетях. Обсуждаем тренды, инструменты и реальные кейсы продвижения в Instagram и Telegram для рынка Центральной Азии. Вступайте бесплатно.",
    isPrivate: false,
    priceMonthly: null,
    currency: "TJS",
    ownerIndex: 12,
    adminIndexes: [7],
    categories: [
      { name: "Кейсы", emoji: "📈" },
      { name: "Тренды", emoji: "🚀" },
      { name: "Инструменты", emoji: "🛠" },
      { name: "Вопросы", emoji: "❓" },
    ],
    posts: [
      { title: "Как локальная пекарня набрала 5000 подписчиков за 3 месяца без бюджета", content: "Ключ — сторис с процессом выпечки каждый день и коллаборации с локальными блогерами.", category: 0, pinned: true },
      { title: "Reels всё ещё работают в 2026, но формат изменился", content: "Аудитория устала от танцев, заходят обучающие ролики с конкретной пользой за 20-30 секунд.", category: 1 },
      { title: "Бесплатный сервис для планирования постов в Telegram", content: "Пользуюсь уже полгода, экономит часа два в неделю на рутине.", category: 2 },
      { title: "Стоит ли вести бизнес-страницу и личный блог одновременно?", content: "Не понимаю, не размывается ли аудитория между двумя аккаунтами.", category: 3 },
      { title: "Запустили Telegram-канал для стоматологии — вот что сработало", content: "Экспертный контент про уход за зубами заходит лучше, чем прямая реклама услуг.", category: 0 },
      { title: "Локально-ориентированный контент набирает обороты в регионе", content: "Посты на таджикском и узбекском вперемешку с русским показывают вовлечённость выше на треть.", category: 1 },
      { title: "Canva-шаблоны для сторис, которые экономят время", content: "Собрал папку шаблонов под разные типы постов, кину ссылку в комментариях.", category: 2 },
      { title: "Как считать ROI с продвижения, если продажи идут через директ?", content: "Постоянно теряю концы между рекламой и реальными продажами в переписке.", category: 3 },
    ],
  },
  {
    slug: "zhenskiy-biznes-klub-dushanbe",
    name: "Женский бизнес-клуб Душанбе",
    description:
      "Сообщество для женщин-предпринимательниц Душанбе и региона. Нетворкинг, разбор бизнес-задач и поддержка на каждом этапе роста бизнеса. Офлайн-встречи раз в месяц и обмен полезными контактами.",
    isPrivate: false,
    priceMonthly: 179,
    currency: "TJS",
    ownerIndex: 11,
    adminIndexes: [4],
    categories: [
      { name: "Нетворкинг", emoji: "🤝" },
      { name: "Истории успеха", emoji: "✨" },
      { name: "Вопросы", emoji: "❓" },
      { name: "Мероприятия", emoji: "📅" },
    ],
    posts: [
      { title: "От домашней кухни до цеха на 8 человек за два года", content: "Делюсь историей своей кондитерской: начинали с заказов для знакомых, сейчас поставляем в три кофейни города.", category: 1, pinned: true },
      { title: "Ищу партнёра для совместного проекта в сфере эко-упаковки", content: "Есть идея и часть финансирования, нужен человек с опытом в производстве.", category: 0 },
      { title: "Встреча клуба в эту пятницу — тема «Финансовая грамотность»", content: "Приглашённый спикер — практикующий финансовый консультант, будет разбор личных вопросов.", category: 3 },
      { title: "Как оформить бизнес официально, если начинала неформально?", content: "Веду небольшое производство год, пора легализовываться, но не знаю, с чего начать.", category: 2 },
      { title: "Первый миллион выручки — и это только начало", content: "Спасибо клубу за поддержку в самые сложные первые месяцы, без вас бросила бы раньше.", category: 1 },
      { title: "Кто работает с поставщиками тканей — поделитесь контактами", content: "Ищу надёжного поставщика хлопка для новой линии одежды.", category: 0 },
      { title: "Итоги ноябрьской встречи: фото и главные инсайты", content: "Обсуждали делегирование, самое частое возражение — «проще сделать самой». Разобрали, как с этим работать.", category: 3 },
      { title: "Как совмещать бизнес и маленьких детей без выгорания?", content: "Честно — не всегда получается, но нашла несколько вещей, которые помогают. Поделюсь, если интересно.", category: 2 },
    ],
  },
];

function randomSubset<T>(arr: T[], min: number, max: number): T[] {
  const count = Math.min(arr.length, min + Math.floor(Math.random() * (max - min + 1)));
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function daysAgo(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

// Дата вступления, разбросанная по последним ~30 дням со смещением к
// недавним дням (растущая кривая на графике "Рост участников" в дашборде
// создателя) — без этого все участники "вступают" в момент запуска сидинга,
// и график превращается в один вертикальный скачок.
function randomJoinedAt(isOwner: boolean) {
  if (isOwner) return daysAgo(30);
  const skewedDays = Math.pow(Math.random(), 1.8) * 29 + 1;
  return daysAgo(skewedDays);
}

async function seedCourse(communityId: string) {
  const { data: course, error: courseError } = await admin
    .from("courses")
    .insert({
      community_id: communityId,
      title: COURSE.title,
      description: COURSE.description,
      is_published: true,
      sort_order: 0,
    })
    .select("id")
    .single();
  if (courseError || !course) {
    throw new Error(`Не удалось создать курс: ${courseError?.message}`);
  }

  let lessonCount = 0;
  const lessonIds: string[] = [];
  for (let moduleIndex = 0; moduleIndex < COURSE.modules.length; moduleIndex++) {
    const moduleSpec = COURSE.modules[moduleIndex];
    const { data: module, error: moduleError } = await admin
      .from("modules")
      .insert({ course_id: course.id, title: moduleSpec.title, sort_order: moduleIndex })
      .select("id")
      .single();
    if (moduleError || !module) {
      throw new Error(`Не удалось создать модуль "${moduleSpec.title}": ${moduleError?.message}`);
    }

    const { data: lessons, error: lessonsError } = await admin
      .from("lessons")
      .insert(
        moduleSpec.lessons.map((lesson, lessonIndex) => ({
          module_id: module.id,
          title: lesson.title,
          content: lesson.content,
          video_url: PLACEHOLDER_VIDEO_URL,
          duration_min: lesson.durationMin,
          sort_order: lessonIndex,
        }))
      )
      .select("id");
    if (lessonsError || !lessons) {
      throw new Error(`Не удалось создать уроки модуля "${moduleSpec.title}": ${lessonsError?.message}`);
    }
    lessonIds.push(...lessons.map((l) => l.id));
    lessonCount += moduleSpec.lessons.length;
  }

  console.log(`  курс "${COURSE.title}": ${COURSE.modules.length} модуля, ${lessonCount} уроков`);
  return lessonIds;
}

async function cleanupPreviousSeed(slugs: string[]) {
  console.log("Очистка предыдущих seed-данных...");

  const { data: existingCommunities } = await admin
    .from("communities")
    .select("id")
    .in("slug", slugs);

  if (existingCommunities && existingCommunities.length > 0) {
    const communityIds = existingCommunities.map((c) => c.id);
    const { data: existingPosts } = await admin
      .from("posts")
      .select("id")
      .in("community_id", communityIds);

    if (existingPosts && existingPosts.length > 0) {
      const postIds = existingPosts.map((p) => p.id);
      // likes.target_id не имеет FK (полиморфная цель) — чистим вручную,
      // иначе после удаления постов останутся осиротевшие записи.
      await admin.from("likes").delete().eq("target_type", "post").in("target_id", postIds);
    }

    await admin.from("communities").delete().in("id", communityIds);
    console.log(`  удалено сообществ: ${communityIds.length}`);
  }

  const { data: users } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const seedUsers = (users?.users ?? []).filter((u) => u.email?.endsWith(SEED_EMAIL_SUFFIX));
  for (const u of seedUsers) {
    await admin.auth.admin.deleteUser(u.id);
  }
  if (seedUsers.length > 0) {
    console.log(`  удалено фейковых пользователей: ${seedUsers.length}`);
  }
}

async function createSeedUsers() {
  console.log("Создание фейковых пользователей...");
  const ids: string[] = [];
  for (const u of SEED_USERS) {
    const email = `${u.slug}${SEED_EMAIL_SUFFIX}`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: SEED_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: u.name, avatar_url: avatarUrl(u.name) },
    });
    if (error || !data.user) {
      throw new Error(`Не удалось создать пользователя ${email}: ${error?.message}`);
    }
    ids.push(data.user.id);
  }
  console.log(`  создано: ${ids.length}`);
  return ids;
}

// ── Mentra AI bot (Phase 6, "Итоги недели") ─────────────────────────────
// Системный автор для постов с еженедельными итогами. Не состоит ни в одном
// сообществе — фронтенд определяет бота по profiles.full_name === "Mentra AI".

const MENTRA_AI_BOT_EMAIL = `mentra-ai-bot${SEED_EMAIL_SUFFIX}`;

async function createMentraAiBot() {
  console.log("Создание системного профиля Mentra AI...");
  const { data, error } = await admin.auth.admin.createUser({
    email: MENTRA_AI_BOT_EMAIL,
    password: SEED_PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name: "Mentra AI",
      avatar_url:
        "https://ui-avatars.com/api/?name=AI&background=5B6EF5&color=fff&bold=true",
    },
  });
  if (error || !data.user) {
    throw new Error(`Не удалось создать профиль Mentra AI: ${error?.message}`);
  }
  console.log(`  создан: ${data.user.id}`);
}

async function main() {
  const slugs = COMMUNITIES.map((c) => c.slug);
  await cleanupPreviousSeed(slugs);
  const userIds = await createSeedUsers();
  await createMentraAiBot();

  // profiles создаются триггером handle_new_user асинхронно относительно
  // ответа admin.createUser — даём базе секунду на то, чтобы триггеры точно
  // отработали, прежде чем на них ссылаться внешними ключами.
  await new Promise((r) => setTimeout(r, 1500));

  for (const spec of COMMUNITIES) {
    console.log(`\nСообщество: ${spec.name}`);
    const ownerId = userIds[spec.ownerIndex];

    const { data: community, error: communityError } = await admin
      .from("communities")
      .insert({
        slug: spec.slug,
        name: spec.name,
        description: spec.description,
        owner_id: ownerId,
        is_private: spec.isPrivate,
        price_monthly: spec.priceMonthly,
        currency: spec.currency,
      })
      .select("id")
      .single();

    if (communityError || !community) {
      throw new Error(`Не удалось создать сообщество ${spec.slug}: ${communityError?.message}`);
    }
    const communityId = community.id;

    // ── участники: все фейковые пользователи вступают во все сообщества ──
    const membershipRows = userIds.map((userId, idx) => ({
      community_id: communityId,
      user_id: userId,
      role:
        idx === spec.ownerIndex
          ? ("owner" as const)
          : spec.adminIndexes.includes(idx)
            ? ("admin" as const)
            : ("member" as const),
      joined_at: randomJoinedAt(idx === spec.ownerIndex),
    }));
    const { data: memberships, error: membershipError } = await admin
      .from("memberships")
      .insert(membershipRows)
      .select("id, user_id");
    if (membershipError || !memberships) {
      throw new Error(`Не удалось создать участников для ${spec.slug}: ${membershipError?.message}`);
    }
    const membershipIdByUser = new Map(memberships.map((m) => [m.user_id, m.id]));
    console.log(`  участников: ${memberships.length}`);

    // ── категории постов ──
    const { data: categories, error: categoriesError } = await admin
      .from("post_categories")
      .insert(
        spec.categories.map((c, i) => ({
          community_id: communityId,
          name: c.name,
          emoji: c.emoji,
          sort_order: i,
        }))
      )
      .select("id");
    if (categoriesError || !categories) {
      throw new Error(`Не удалось создать категории для ${spec.slug}: ${categoriesError?.message}`);
    }

    // ── посты ──
    let postIndex = 0;
    for (const postSpec of spec.posts) {
      const authorId = userIds[(spec.ownerIndex + postIndex) % userIds.length];
      const postDaysAgo = spec.posts.length - postIndex + Math.floor(Math.random() * 3);
      const { data: post, error: postError } = await admin
        .from("posts")
        .insert({
          community_id: communityId,
          author_id: authorId,
          category_id: categories[postSpec.category].id,
          title: postSpec.title,
          content: postSpec.content,
          is_pinned: postSpec.pinned ?? false,
          created_at: daysAgo(postDaysAgo),
        })
        .select("id, author_id")
        .single();
      if (postError || !post) {
        throw new Error(`Не удалось создать пост "${postSpec.title}": ${postError?.message}`);
      }

      // Комментарии/лайки происходят когда-то МЕЖДУ публикацией поста и
      // сегодня — иначе все точки активности легли бы на один день (день
      // запуска сидинга) и график "Активность за неделю" был бы одной
      // гигантской колонкой вместо распределения по дням.
      const activityDaysAgo = () => Math.random() * Math.min(postDaysAgo, 6);

      // ── комментарии (2-4, от случайных участников) ──
      const commenters = randomSubset(userIds, 2, 4);
      for (const commenterId of commenters) {
        const commentedAt = daysAgo(activityDaysAgo());
        await admin.from("comments").insert({
          post_id: post.id,
          author_id: commenterId,
          content: COMMENT_POOL[Math.floor(Math.random() * COMMENT_POOL.length)],
          created_at: commentedAt,
        });
        const membershipId = membershipIdByUser.get(commenterId);
        if (membershipId) {
          await admin.from("points_events").insert({
            membership_id: membershipId,
            event_type: "comment_created",
            points: 1,
            created_at: commentedAt,
          });
        }
      }

      // ── лайки (3-9 от случайных участников) ──
      const likers = randomSubset(userIds, 3, 9);
      for (const likerId of likers) {
        const { error: likeError } = await admin.from("likes").insert({
          user_id: likerId,
          target_type: "post",
          target_id: post.id,
        });
        if (!likeError) {
          const authorMembershipId = membershipIdByUser.get(post.author_id);
          if (authorMembershipId) {
            await admin.from("points_events").insert({
              membership_id: authorMembershipId,
              event_type: "like_received",
              points: 1,
              created_at: daysAgo(activityDaysAgo()),
            });
          }
        }
      }

      // ── очки за сам пост ──
      const authorMembershipId = membershipIdByUser.get(post.author_id);
      if (authorMembershipId) {
        await admin.from("points_events").insert({
          membership_id: authorMembershipId,
          event_type: "post_created",
          points: 2,
          created_at: daysAgo(postDaysAgo),
        });
      }

      postIndex += 1;
    }
    console.log(`  постов: ${spec.posts.length}`);

    if (spec.slug === COURSE_COMMUNITY_SLUG) {
      const lessonIds = await seedCourse(communityId);

      // Немного прогресса за последнюю неделю — иначе метрика "Уроки
      // завершены" в дашборде создателя всегда будет нулевой.
      const learners = randomSubset(userIds, 4, 7);
      let completedCount = 0;
      for (const learnerId of learners) {
        const completedLessons = randomSubset(lessonIds, 1, Math.min(4, lessonIds.length));
        for (const lessonId of completedLessons) {
          const completedAt = daysAgo(Math.random() * 6);
          const { error: progressError } = await admin
            .from("lesson_progress")
            .insert({ user_id: learnerId, lesson_id: lessonId, completed_at: completedAt });
          if (!progressError) {
            completedCount += 1;
            const membershipId = membershipIdByUser.get(learnerId);
            if (membershipId) {
              await admin.from("points_events").insert({
                membership_id: membershipId,
                event_type: "lesson_completed",
                points: 3,
                created_at: completedAt,
              });
            }
          }
        }
      }
      console.log(`  прогресс по урокам: ${completedCount} завершений`);
    }
  }

  console.log("\nГотово. Все 6 сообществ засеяны.");
  console.log(`Пароль для входа под любым фейковым пользователем: ${SEED_PASSWORD}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Ошибка seed-скрипта:", err);
    process.exit(1);
  });
