export const LANGUAGES = {
  en: { name: 'English', flag: '🇬🇧', apiLang: 'english' },
  it: { name: 'Italiano', flag: '🇮🇹', apiLang: 'italian' },
  uk: { name: 'Українська', flag: '🇺🇦', apiLang: 'ukrainian' },
};

export const DEFAULT_LANG = 'it';

const translations = {
  en: {
    welcome: `👋 Welcome to Permesso Tracker Bot!

I can track your Italian residence permit status and notify you daily at 9:00 AM Rome time.

<b>Commands:</b>
/add <code>PRATICA_NUMBER</code> - Add your pratica to track
/remove - Stop tracking
/status - Check current status
/info - Show your tracked pratica
/lang - Change language

<b>Example:</b>
/add 26FR000001`,

    langPrompt: `🌐 <b>Select your language:</b>`,
    langChanged: (lang) => `✅ Language changed to ${LANGUAGES[lang].flag} ${LANGUAGES[lang].name}`,
    
    addMissing: `❌ Please provide your pratica number.

<b>Example:</b> /add 26FR000001`,
    addValidating: '🔍 Validating pratica number...',
    addInvalid: '❌ Could not validate pratica. Please check the number.',
    addSuccess: (pratica) => `✅ Pratica <code>${pratica}</code> added!

You will receive daily updates at 9:00 AM Rome time.`,
    
    removeNone: '❌ You have no pratica being tracked.',
    removeSuccess: '✅ Tracking removed. Use /add to track a new pratica.',
    
    statusNone: '❌ No pratica tracked. Use /add <pratica> first.',
    statusChecking: '🔍 Checking status...',
    statusError: '❌ Could not fetch status.',
    
    infoNone: '❌ No pratica tracked. Use /add <pratica> first.',
    infoTitle: '📋 <b>Your Tracker</b>',
    
    notifyTitle: '📋 <b>Permesso di Soggiorno</b>',
    notifyError: (pratica) => `❌ Could not fetch status for ${pratica}`,
    
    error: (msg) => `❌ Error: ${msg}`,
    praticaLabel: 'Pratica',
    dateLabel: 'Date',
    addedLabel: 'Added',
    currentStatus: 'Current status',

    cmdStart: 'Start the bot',
    cmdAdd: 'Add pratica number to track',
    cmdStatus: 'Check current permesso status',
    cmdInfo: 'Show tracked pratica info',
    cmdRemove: 'Stop tracking pratica',
    cmdLang: 'Change language',
  },

  it: {
    welcome: `👋 Benvenuto nel Permesso Tracker Bot!

Posso monitorare lo stato del tuo permesso di soggiorno e notificarti ogni giorno alle 9:00 ora di Roma.

<b>Comandi:</b>
/add <code>NUMERO_PRATICA</code> - Aggiungi la tua pratica
/remove - Smetti di monitorare
/status - Controlla lo stato attuale
/info - Mostra la tua pratica
/lang - Cambia lingua

<b>Esempio:</b>
/add 26FR000001`,

    langPrompt: `🌐 <b>Seleziona la tua lingua:</b>`,
    langChanged: (lang) => `✅ Lingua cambiata in ${LANGUAGES[lang].flag} ${LANGUAGES[lang].name}`,
    
    addMissing: `❌ Inserisci il numero della pratica.

<b>Esempio:</b> /add 26FR000001`,
    addValidating: '🔍 Validazione del numero pratica...',
    addInvalid: '❌ Impossibile validare la pratica. Controlla il numero.',
    addSuccess: (pratica) => `✅ Pratica <code>${pratica}</code> aggiunta!

Riceverai aggiornamenti giornalieri alle 9:00 ora di Roma.`,
    
    removeNone: '❌ Non hai nessuna pratica monitorata.',
    removeSuccess: '✅ Monitoraggio rimosso. Usa /add per monitorare una nuova pratica.',
    
    statusNone: '❌ Nessuna pratica monitorata. Usa /add <pratica> prima.',
    statusChecking: '🔍 Controllo stato...',
    statusError: '❌ Impossibile recuperare lo stato.',
    
    infoNone: '❌ Nessuna pratica monitorata. Usa /add <pratica> prima.',
    infoTitle: '📋 <b>Il Tuo Tracker</b>',
    
    notifyTitle: '📋 <b>Permesso di Soggiorno</b>',
    notifyError: (pratica) => `❌ Impossibile recuperare lo stato per ${pratica}`,
    
    error: (msg) => `❌ Errore: ${msg}`,
    praticaLabel: 'Pratica',
    dateLabel: 'Data',
    addedLabel: 'Aggiunto',
    currentStatus: 'Stato attuale',

    cmdStart: 'Avvia il bot',
    cmdAdd: 'Aggiungi numero pratica da monitorare',
    cmdStatus: 'Controlla lo stato del permesso',
    cmdInfo: 'Mostra info pratica monitorata',
    cmdRemove: 'Smetti di monitorare la pratica',
    cmdLang: 'Cambia lingua',
  },

  uk: {
    welcome: `👋 Ласкаво просимо до Permesso Tracker Bot!

Я можу відстежувати статус вашого дозволу на проживання та надсилати сповіщення щодня о 9:00 за римським часом.

<b>Команди:</b>
/add <code>НОМЕР_СПРАВИ</code> - Додати справу для відстеження
/remove - Припинити відстеження
/status - Перевірити поточний статус
/info - Показати вашу справу
/lang - Змінити мову

<b>Приклад:</b>
/add 26FR000001`,

    langPrompt: `🌐 <b>Оберіть мову:</b>`,
    langChanged: (lang) => `✅ Мову змінено на ${LANGUAGES[lang].flag} ${LANGUAGES[lang].name}`,
    
    addMissing: `❌ Будь ласка, вкажіть номер справи.

<b>Приклад:</b> /add 26FR000001`,
    addValidating: '🔍 Перевірка номера справи...',
    addInvalid: '❌ Не вдалося перевірити справу. Перевірте номер.',
    addSuccess: (pratica) => `✅ Справу <code>${pratica}</code> додано!

Ви отримуватимете щоденні оновлення о 9:00 за римським часом.`,
    
    removeNone: '❌ У вас немає справ для відстеження.',
    removeSuccess: '✅ Відстеження видалено. Використовуйте /add щоб додати нову справу.',
    
    statusNone: '❌ Немає справи для відстеження. Спочатку використайте /add <справа>.',
    statusChecking: '🔍 Перевірка статусу...',
    statusError: '❌ Не вдалося отримати статус.',
    
    infoNone: '❌ Немає справи для відстеження. Спочатку використайте /add <справа>.',
    infoTitle: '📋 <b>Ваш Трекер</b>',
    
    notifyTitle: '📋 <b>Permesso di Soggiorno</b>',
    notifyError: (pratica) => `❌ Не вдалося отримати статус для ${pratica}`,
    
    error: (msg) => `❌ Помилка: ${msg}`,
    praticaLabel: 'Справа',
    dateLabel: 'Дата',
    addedLabel: 'Додано',
    currentStatus: 'Поточний статус',

    cmdStart: 'Запустити бота',
    cmdAdd: 'Додати номер справи для відстеження',
    cmdStatus: 'Перевірити статус перебування',
    cmdInfo: 'Показати інфо про справу',
    cmdRemove: 'Припинити відстеження справи',
    cmdLang: 'Змінити мову',
  },
};

export function t(lang, key, ...args) {
  const langData = translations[lang] || translations[DEFAULT_LANG];
  const value = langData[key];
  
  if (typeof value === 'function') {
    return value(...args);
  }
  return value || key;
}

export function getApiLang(lang) {
  return LANGUAGES[lang]?.apiLang || LANGUAGES[DEFAULT_LANG].apiLang;
}
