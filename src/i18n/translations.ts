import { LanguageCode, Translation } from "../types";

export const TRANSLATIONS: Record<LanguageCode, Translation> = {
  uz: {
    // Page titles
    page_title_index: "Checkpoint tizimi",
    page_title_login_org: "Tashkilot ID",
    page_title_pin: "Login",
    page_title_list: "Foydalanuvchi ro'yxati",
    page_title_checkin: "Checkpoint Monitoring",

    // Common
    app_title: "Checkpoint tizimi",
    enter_system: "Tizimga kirish",
    loading: "Yuklanmoqda...",
    retry: "Qayta urinish",
    back: "Orqaga",
    logout: "Chiqish", // ✏️ "Logout" → "Chiqish"
    error: "Xatolik",
    success: "Muvaffaqiyat",
    cancel: "Bekor qilish",
    ok: "OK",
    continue: "Davom etirish",
    history: "Tarix",
    clear_logs: "Loglarni tozalash",
    confirm_clear_logs: "Loglarni tozalashni tasdiqlaysizmi?",
    clear_logs_warning: "Barcha loglar o'chiriladi",
    loading_logs: "Loglar yuklanmoqda...",
    no_logs: "Loglar yo'q",
    checkin_history: "Tekshiruv tarixi",
    offline: "Offline",
    failed: "Xatolik",
    not_synced: "Sinxronizatsiya qilinmadi",
    scan_nfc_tag: "NFC tag skan qilish",
    scanning: "Skan qilinmoqda...",
    scan_failed: "Skan xatoligi",
    already_logged_in: "Siz allaqachon tizimga kirdingiz", // ✏️ "kirgansiz" → "kirdingiz"

    // Login page
    organization_id: "Tashkilot ID",
    enter_org_id: "Tashkilotingiz identifikatorini kiriting",
    login: "Kirish",
    current_org: "Joriy tashkilot",
    change_org: "Boshqa tashkilot",
    checking_org: "Tashkilot tekshirilmoqda...",
    successfully_logged_in: "Muvaffaqiyatli kirdingiz",
    org_not_found: "Tashkilot topilmadi",
    internet_error: "Internet ulanmadi",
    confirm_change_org: "Tashkilotni o'zgartirmoqchimisiz?",
    confirm_exit: "Ilovadan chiqmoqchimisiz?",
    app_ready: "Ilova tayyor",
    gps_permission_denied: "GPS ruxsati berilmadi",

    // PIN page
    login_to_system: "Tizimga kirish",
    login_field: "Login",
    password: "Parol",
    selected_user: "Tanlangan foydalanuvchi",
    enter_pin: "6 xonali PIN kiriting",
    pin_required: "PIN kiritilmadi",
    pin_digits_required: "PIN 6 xonali bo'lishi kerak",
    successfully_logged_in_msg: "Muvaffaqiyatli kirdingiz",
    login_error: "Login xatoligi",
    server_error_msg: "Server xatoligi",

    // List page
    select_user: "Foydalanuvchini tanlang",
    loading_users: "Foydalanuvchilar yuklanmoqda...",
    no_users_found: "Foydalanuvchilar topilmadi",
    no_internet: "Internet yo'q",
    internet_connected: "Internet ulandi",
    internet_disconnected: "Internet uzildi",
    loading_error: "Yuklash xatoligi",
    server_error: "Server javob bermadi",

    // Checkin page
    user: "Foydalanuvchi",
    tap_tag: "Telefonni belgiga tekkazing",
    last_log: "Oxirgi log",
    no_last_log: "yo'q",
    checkin_success: "Tekshiruv muvaffaqiyatli",
    last_log_prefix: "Oxirgi tekshiruv",
    confirm_logout: "Tizimdan chiqmoqchimisiz?", // ✏️ "Logout qilmoqchimisiz?" → "Tizimdan chiqmoqchimisiz?"
    internet_or_server_error: "Internet yoki server xatoligi",
    offline_checkin_saved: "Ma'lumotlar saqlandi (offline)",
    retry_connection: "Qayta ulanish",
    nfc_unavailable_short: "NFC mavjud emas",
    nfc_retry_attempt: "Qayta urinib ko'rish", // ✏️ "Qayta urinish" → "Qayta urinib ko'rish"
    nfc_checking: "NFC tekshirilmoqda...",
    max_retry_reached: "Urinishlar soni tugadi", // ✏️ "Maksimal urinishlar soni yetdi" → "Urinishlar soni tugadi"
    restart_app: "Ilovani qayta ishga tushuring",
    restart_app_nfc: "Ilovani qayta ishga tushuring (NFC uchun)",
    enable_nfc: "NFC ni yoqish",
    nfc_settings_manual: "NFC ni sozlamalardan yoqing",

    // Validation
    login_required: "Login kiritilmadi",
    login_length_error: "Login 3-50 belgi orasida bo'lishi kerak",
    password_required: "Parol kiritilmadi",
    password_length_error: "Parol 4-50 belgi orasida bo'lishi kerak",
    organization_id_required: "Tashkilot ID kiritilmadi",
    organization_id_length_error:
      "Tashkilot ID 3-50 belgi orasida bo'lishi kerak",

    // Unknown
    unknown: "Noma'lum",
    invalid_data: "Noto'g'ri ma'lumot",
    user_id_missing: "Foydalanuvchi ID topilmadi",
  },
  ru: {
    // Page titles
    page_title_index: "Система чекпоинтов",
    page_title_login_org: "ID организации",
    page_title_pin: "Вход",
    page_title_list: "Список пользователей",
    page_title_checkin: "Мониторинг чекпоинтов",

    // Common
    app_title: "Система чекпоинтов",
    enter_system: "Войти в систему",
    loading: "Загрузка...",
    retry: "Повторить",
    back: "Назад",
    logout: "Выйти",
    error: "Ошибка",
    success: "Успех",
    cancel: "Отмена",
    ok: "OK",
    continue: "Продолжить",
    history: "История",
    clear_logs: "Очистить логи",
    confirm_clear_logs: "Подтвердить очистку логов?",
    clear_logs_warning: "Все логи будут удалены",
    loading_logs: "Загрузка логов...",
    no_logs: "Нет логов",
    checkin_history: "История проверок",
    offline: "Офлайн", // ✏️ "Офлайн" (bir "ф")
    failed: "Ошибка",
    not_synced: "Не синхронизировано",
    scan_nfc_tag: "Сканировать NFC тег",
    scanning: "Сканирование...",
    scan_failed: "Ошибка сканирования",
    already_logged_in: "Вы уже вошли в систему",

    // Login page
    organization_id: "ID организации",
    enter_org_id: "Введите идентификатор вашей организации",
    login: "Войти",
    current_org: "Текущая организация",
    change_org: "Другая организация",
    checking_org: "Проверка организации...",
    successfully_logged_in: "Успешный вход",
    org_not_found: "Организация не найдена",
    internet_error: "Нет интернета",
    confirm_change_org: "Хотите сменить организацию?",
    confirm_exit: "Выйти из приложения?",
    app_ready: "Приложение готово",
    gps_permission_denied: "Разрешение GPS не предоставлено",

    // PIN page
    login_to_system: "Вход в систему",
    login_field: "Логин",
    password: "Пароль",
    selected_user: "Выбранный пользователь",
    enter_pin: "Введите 6-значный PIN",
    pin_required: "PIN не введен",
    pin_digits_required: "PIN должен быть 6-значным",
    successfully_logged_in_msg: "Успешный вход",
    login_error: "Ошибка входа",
    server_error_msg: "Ошибка сервера",

    // List page
    select_user: "Выберите пользователя",
    loading_users: "Загрузка пользователей...",
    no_users_found: "Пользователи не найдены",
    no_internet: "Нет интернета",
    internet_connected: "Интернет подключен",
    internet_disconnected: "Интернет отключен",
    loading_error: "Ошибка загрузки",
    server_error: "Сервер не отвечает",

    // Checkin page
    user: "Пользователь",
    tap_tag: "Прикоснитесь телефоном к метке",
    last_log: "Последняя запись",
    no_last_log: "нет",
  checkin_success: "Проверка выполнена успешно",
    last_log_prefix: "Последняя проверка",
    confirm_logout: "Выйти из системы?",
    internet_or_server_error: "Ошибка интернета или сервера",
    offline_checkin_saved: "Данные сохранены (офлайн)", // "оффлайн" → "офлайн"
    retry_connection: "Повторное подключение",
    nfc_unavailable_short: "NFC недоступно", // "недоступен" → "недоступно"
    nfc_retry_attempt: "Повторная попытка",
    nfc_checking: "Проверка NFC...",
    max_retry_reached: "Достигнуто максимальное количество попыток",
    restart_app: "Перезапустите приложение",
    restart_app_nfc: "Перезапустите приложение (для NFC)",
    enable_nfc: "Включить NFC",
    nfc_settings_manual: "Включите NFC в настройках",

    // Validation
    login_required: "Логин не введен",
    login_length_error: "Логин должен быть 3-50 символов",
    password_required: "Пароль не введен",
    password_length_error: "Пароль должен быть 4-50 символов",
    organization_id_required: "ID организации не введен",
    organization_id_length_error: "ID организации должен быть 3-50 символов",

    // Unknown
    unknown: "Неизвестно",
    invalid_data: "Неверные данные",
    user_id_missing: "ID пользователя не найден",
  },
  uz_cyrl: {
    // Page titles
    page_title_index: "Чекпоинт тизими",
    page_title_login_org: "Ташкилот ID",
    page_title_pin: "Логин",
    page_title_list: "Фойдаланувчи рўйхати",
    page_title_checkin: "Чекпоинт мониторинг",

    // Common
    app_title: "Чекпоинт тизими",
    enter_system: "Тизимга кириш",
    loading: "Юкланмоқда...",
    retry: "Қайта уриниш",
    back: "Орқага",
    logout: "Чиқиш", // ✏️ "Логаут" → "Чиқиш"
    error: "Хатолик",
    success: "Муваффақият",
    cancel: "Бекор қилиш",
    ok: "OK",
    continue: "Давом этириш",
    history: "Тарих",
    clear_logs: "Логларни тозалаш",
    confirm_clear_logs: "Логларни тозалашни тасдиқлайсизми?",
    clear_logs_warning: "Барча логлар ўчирилади",
    loading_logs: "Логлар юкланмоқда...",
    no_logs: "Логлар йўқ",
  checkin_history: "Текширув тарихи",
    offline: "Офлайн",
    failed: "Хатолик",
    not_synced: "Синхронизация қилинмади",
    scan_nfc_tag: "NFC тег скан қилиш",
    scanning: "Скан қилинмоқда...",
    scan_failed: "Скан хатолиги",
    already_logged_in: "Сиз аллақачон тизимга кирдингиз", // ✏️ "киргансиз" → "кирдингиз"

    // Login page
    organization_id: "Ташкилот ID",
    enter_org_id: "Ташкилотингиз идентификаторини киритинг",
    login: "Кириш",
    current_org: "Жорий ташкилот",
    change_org: "Бошқа ташкилот",
    checking_org: "Ташкилот текширилмоқда...",
    successfully_logged_in: "Муваффақиятли кирдингиз",
    org_not_found: "Ташкилот топилмади",
    internet_error: "Интернет уланмади",
    confirm_change_org: "Ташкилотни ўзгартирмоқчимисиз?",
    confirm_exit: "Иловадан чиқмоқчимисиз?",
    app_ready: "Илова тайёр",
    gps_permission_denied: "GPS рухсати берилмади",

    // PIN page
    login_to_system: "Тизимга кириш",
    login_field: "Логин",
    password: "Парол",
    selected_user: "Танланган фойдаланувчи",
    enter_pin: "6 хонали PIN киритинг",
    pin_required: "PIN киритилмади",
    pin_digits_required: "PIN 6 хонали бўлиши керак",
    successfully_logged_in_msg: "Муваффақиятли кирдингиз",
    login_error: "Логин хатолиги",
    server_error_msg: "Сервер хатолиги",

    // List page
    select_user: "Фойдаланувчини танланг",
    loading_users: "Фойдаланувчилар юкланмоқда...",
    no_users_found: "Фойдаланувчилар топилмади",
    no_internet: "Интернет йўқ",
    internet_connected: "Интернет уланди",
    internet_disconnected: "Интернет узилди",
    loading_error: "Юклаш хатолиги",
    server_error: "Сервер жавоб бермади",

    // Checkin page
    user: "Фойдаланувчи",
    tap_tag: "Телефонни белгига текказинг",
    last_log: "Охирги лог",
    no_last_log: "йўқ",
    checkin_success: "Текширув муваффақиятли",
    last_log_prefix: "Охирги текширув",
    confirm_logout: "Тизимдан чиқмоқчимисиз?", // ✏️ "Логаут қилмоқчимисиз?" → "Тизимдан чиқмоқчимисиз?"
    internet_or_server_error: "Интернет ёки сервер хатолиги",
    offline_checkin_saved: "Маълумотлар сақланди (офлайн)", // ✏️ "оффлайн" → "офлайн"
    retry_connection: "Қайта уланиш",
    nfc_unavailable_short: "NFC мавжуд эмас",
    nfc_retry_attempt: "Қайта уринib кўриш", // ✏️ "Қайта уриниш" → "Қайта уринib кўриш"
    nfc_checking: "NFC текширилмоқда...",
    max_retry_reached: "Уринишлар сони тугади", // ✏️ "Максималь уринишлар сони етди" → "Уринишлар сони тугади"
    restart_app: "Иловани қайта ишга тушуринг",
    restart_app_nfc: "Иловани қайта ишга тушуринг (NFC учун)",
    enable_nfc: "NFC ни ёқиш",
    nfc_settings_manual: "NFC ни созламалардан ёқинг",

    // Validation
    login_required: "Логин киритилмади",
    login_length_error: "Логин 3-50 белги орасида бўлиши керак",
    password_required: "Парол киритилмади",
    password_length_error: "Парол 4-50 белги орасида бўлиши керак",
    organization_id_required: "Ташкилот ID киритилмади",
    organization_id_length_error: "Ташкилот ID 3-50 белги орасида бўлиши керак",

    // Unknown
    unknown: "Номаълум",
    invalid_data: "Нотўғри маълумот",
    user_id_missing: "Фойдаланувчи ID топилмади",
  },
};
