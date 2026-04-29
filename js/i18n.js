// Lightweight i18n: string table + t(key) + applyI18n() that syncs DOM.
// Language choice persists in localStorage under 'fiveS.lang'.

const LANG_KEY = 'fiveS.lang';

const STRINGS = {
  es: {
    'welcome.title': 'Ejercicio 5S',
    'welcome.lede': 'Vas a vivir en carne propia cómo la metodología <strong>5S</strong> de Lean/Kaizen mejora un espacio de trabajo. Las 5S son un <em>sistema visual</em> que ayuda a reducir el desperdicio y lograr resultados operativos más consistentes, manteniendo un lugar de trabajo limpio y ordenado.',
    'welcome.cardS.title': 'Las 5 S',
    'welcome.cardS.seiri': '<strong>Seiri</strong> — Clasificar (eliminar lo innecesario)',
    'welcome.cardS.seiton': '<strong>Seiton</strong> — Ordenar (un lugar para cada cosa)',
    'welcome.cardS.seiso': '<strong>Seiso</strong> — Limpiar',
    'welcome.cardS.seiketsu': '<strong>Seiketsu</strong> — Estandarizar',
    'welcome.cardS.shitsuke': '<strong>Shitsuke</strong> — Sostener la disciplina',
    'welcome.cardMech.title': 'La mecánica',
    'welcome.cardMech.p1': 'Harás <strong>5 rondas de 20 segundos</strong>. En cada una debes hacer clic en los números del <strong>1 al 49 en orden</strong>, lo más rápido que puedas.',
    'welcome.cardMech.p2': 'En cada ronda aplicaremos una S al "taller" y vas a sentir cómo avanzas más lejos.',
    'welcome.langLabel': 'Idioma',
    'welcome.btnStart': 'Comenzar',
    'pre.task': 'Tu tarea',
    'pre.taskTitle': 'Encuentra los números <span class="title-blue">1 al 49</span> en orden',
    'pre.taskSub': '¿Hasta qué número llegas en 20 segundos?',
    'pre.btnStart': 'Empezar (20 s)',
    'hud.next': 'Siguiente',
    'hud.time': 'Tiempo',
    'hud.errors': 'Errores',
    'hud.cleanPrompt': '¡a limpiar!',
    'post.llegasteAl': 'Llegaste al número',
    'post.btnNext': 'Siguiente ronda',
    'post.btnSummary': 'Ver resumen',
    'post.howDidItGo': '¿Cómo te fue?',
    'post.noticedDiff': '¿Notaste la diferencia?',
    'post.completed49': '¡Completaste los 49!',
    'post.deltaPlus': (d) => `<strong>+${d}</strong> números más que la ronda anterior`,
    'post.deltaMinus': (d) => `<strong>${d}</strong> números menos que la ronda anterior`,
    'post.deltaSame': 'Mismo número que la ronda anterior',
    'post.errors0': 'Sin clics erróneos',
    'post.errors1': '1 clic erróneo',
    'post.errorsN': (n) => `${n} clics erróneos`,
    'post.eyebrow': (round, label) => `Ronda ${round} — ${label}`,
    'summary.eyebrow': 'Shitsuke — Disciplina',
    'summary.title': '¡Bien hecho!',
    'summary.lede': 'Acabas de sentir cómo cada S hace el trabajo más rápido, más fácil y con menos errores.',
    'summary.progress': 'Tu progreso',
    'summary.seiketsuNeeds': 'Seiketsu necesita Shitsuke',
    'summary.sustain1': 'Lograr un taller estandarizado es parte del trabajo. Lo <strong>difícil es sostenerlo</strong>. La quinta S —disciplina— es la que hace que las otras cuatro no se pierdan con el tiempo.',
    'summary.sustain2': 'Aplícalo en tu propio espacio: ¿qué harías hoy para empezar?',
    'summary.btnRestart': 'Reiniciar',
    'label.chaos': 'Caos',
    'label.sort': 'Sort',
    'label.setInOrder': 'Set in Order',
    'label.shine': 'Shine',
    'label.standardize': 'Standardize',
    'labelShort.chaos': 'Caos',
    'labelShort.sort': 'Sort',
    'labelShort.setInOrder': 'S.Order',
    'labelShort.shine': 'Shine',
    'labelShort.standardize': 'Std.',
    'round.chaos.eyebrow': 'Estado inicial — sin 5S',
    'round.chaos.title': 'Caos — antes de aplicar 5S',
    'round.chaos.description': 'Imagina un taller sin 5S: herramientas por todas partes, polvo, cosas que ya nadie usa. Encuentra los números 1 al 49 en orden. Tienes 20 segundos.',
    'round.sort.eyebrow': 'S1 — Sort (Seiri)',
    'round.sort.title': 'SORT — elimina lo innecesario',
    'round.sort.description': 'Aplicamos la primera S. Tiramos lo que no sirve: los números 50 al 99 ya no están. Las posiciones de 1 a 49 son las mismas. ¿Hasta cuánto llegas ahora?',
    'round.setInOrder.eyebrow': 'S2 — Set in Order (Seiton)',
    'round.setInOrder.title': 'SET IN ORDER — un lugar para cada cosa',
    'round.setInOrder.description': 'Clasificamos: cada cuadrante de la grilla 3×3 guarda un grupo de números consecutivos (1–6 en el primero, 7–11 en el siguiente, y así). Hay caos dentro de cada zona, pero ya sabes a qué zona ir.',
    'round.shine.eyebrow': 'S3 — Shine (Seiso)',
    'round.shine.title': 'SHINE — limpieza',
    'round.shine.description': 'Limpiamos el área: se van las manchas y los números opacos se ven nítidos. Mismos cuadrantes, menos fricción visual.',
    'round.standardize.eyebrow': 'S4 — Standardize (Seiketsu)',
    'round.standardize.title': 'STANDARDIZE — Seiketsu',
    'round.standardize.description': 'Ordenamos los números en una cuadrícula estándar, del 1 al 49 en secuencia. Fíjate cuánto más rápido terminas ahora.',
    'aria.tileNumber': (n) => `Número ${n}`,
    'doc.title': 'Ejercicio 5S — Lean en carne propia',
  },
  en: {
    'welcome.title': '5S Exercise',
    'welcome.lede': 'You are going to experience firsthand how the <strong>5S</strong> methodology from Lean/Kaizen improves a workspace. 5S is a <em>visual system</em> that helps reduce waste and achieve more consistent operational results through a clean and orderly workplace.',
    'welcome.cardS.title': 'The 5 S',
    'welcome.cardS.seiri': '<strong>Seiri</strong> — Sort (remove what is unnecessary)',
    'welcome.cardS.seiton': '<strong>Seiton</strong> — Set in order (a place for everything)',
    'welcome.cardS.seiso': '<strong>Seiso</strong> — Shine',
    'welcome.cardS.seiketsu': '<strong>Seiketsu</strong> — Standardize',
    'welcome.cardS.shitsuke': '<strong>Shitsuke</strong> — Sustain the discipline',
    'welcome.cardMech.title': 'How it works',
    'welcome.cardMech.p1': 'You will run <strong>5 rounds of 20 seconds</strong>. In each, click the numbers from <strong>1 to 49 in order</strong>, as fast as you can.',
    'welcome.cardMech.p2': 'Every round we apply one S to the "workshop" and you will feel yourself get further.',
    'welcome.langLabel': 'Language',
    'welcome.btnStart': 'Start',
    'pre.task': 'Your task',
    'pre.taskTitle': 'Find the numbers <span class="title-blue">1 to 49</span> in order',
    'pre.taskSub': 'How far do you get in 20 seconds?',
    'pre.btnStart': 'Start (20 s)',
    'hud.next': 'Next',
    'hud.time': 'Time',
    'hud.errors': 'Errors',
    'hud.cleanPrompt': 'cleaning!',
    'post.llegasteAl': 'You reached number',
    'post.btnNext': 'Next round',
    'post.btnSummary': 'See summary',
    'post.howDidItGo': 'How did it go?',
    'post.noticedDiff': 'Noticed the difference?',
    'post.completed49': 'You got all 49!',
    'post.deltaPlus': (d) => `<strong>+${d}</strong> numbers more than the previous round`,
    'post.deltaMinus': (d) => `<strong>${d}</strong> numbers fewer than the previous round`,
    'post.deltaSame': 'Same number as the previous round',
    'post.errors0': 'No wrong clicks',
    'post.errors1': '1 wrong click',
    'post.errorsN': (n) => `${n} wrong clicks`,
    'post.eyebrow': (round, label) => `Round ${round} — ${label}`,
    'summary.eyebrow': 'Shitsuke — Discipline',
    'summary.title': 'Well done!',
    'summary.lede': 'You just felt how each S makes the work faster, easier, and with fewer errors.',
    'summary.progress': 'Your progress',
    'summary.seiketsuNeeds': 'Seiketsu needs Shitsuke',
    'summary.sustain1': 'Getting to a standardized workshop is part of the job. The <strong>hard part is sustaining it</strong>. The fifth S —discipline— is what keeps the other four from eroding over time.',
    'summary.sustain2': 'Apply it in your own space: what would you do today to start?',
    'summary.btnRestart': 'Restart',
    'label.chaos': 'Chaos',
    'label.sort': 'Sort',
    'label.setInOrder': 'Set in Order',
    'label.shine': 'Shine',
    'label.standardize': 'Standardize',
    'labelShort.chaos': 'Chaos',
    'labelShort.sort': 'Sort',
    'labelShort.setInOrder': 'S.Order',
    'labelShort.shine': 'Shine',
    'labelShort.standardize': 'Std.',
    'round.chaos.eyebrow': 'Initial State — before 5S',
    'round.chaos.title': 'Chaos — before 5S',
    'round.chaos.description': 'Imagine a workshop without 5S: tools all over the place, dust, things no one uses anymore. Find the numbers 1 to 49 in order. You have 20 seconds.',
    'round.sort.eyebrow': 'S1 — Sort (Seiri)',
    'round.sort.title': 'SORT — remove the unnecessary',
    'round.sort.description': 'We apply the first S. We remove what is unnecessary: numbers 50–99 are gone. The positions of 1 to 49 stay the same. How far do you get now?',
    'round.setInOrder.eyebrow': 'S2 — Set in Order (Seiton)',
    'round.setInOrder.title': 'SET IN ORDER — a place for everything',
    'round.setInOrder.description': 'Classify: each cell of the 3×3 grid holds a consecutive group of numbers (1–6 in the first, 7–11 in the next, and so on). Chaos inside each zone, but now you know where to look.',
    'round.shine.eyebrow': 'S3 — Shine (Seiso)',
    'round.shine.title': 'SHINE — cleaning',
    'round.shine.description': 'We clean the area: stains go, dim numbers become crisp. Same quadrants, less visual friction.',
    'round.standardize.eyebrow': 'S4 — Standardize (Seiketsu)',
    'round.standardize.title': 'STANDARDIZE — Seiketsu',
    'round.standardize.description': 'We lay out the numbers in a standard grid, 1 to 49 in sequence. Notice how much faster you finish now.',
    'aria.tileNumber': (n) => `Number ${n}`,
    'doc.title': '5S Exercise — Lean firsthand',
  },
};

let currentLang = 'es';

function detectLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'es' || saved === 'en') return saved;
  } catch (_) {}
  const nav = (typeof navigator !== 'undefined' && navigator.language) || 'es';
  return nav.toLowerCase().startsWith('en') ? 'en' : 'es';
}

export function initI18n() {
  currentLang = detectLang();
  applyI18n();
}

export function getLang() {
  return currentLang;
}

export function setLang(lang) {
  if (lang !== 'es' && lang !== 'en') return;
  currentLang = lang;
  try { localStorage.setItem(LANG_KEY, lang); } catch (_) {}
  applyI18n();
}

export function t(key, ...args) {
  const table = STRINGS[currentLang] || STRINGS.es;
  const value = table[key];
  if (typeof value === 'function') return value(...args);
  if (value == null) return key;
  return value;
}

// Sync every element carrying data-i18n / data-i18n-html with current locale.
export function applyI18n() {
  document.documentElement.lang = currentLang;
  document.title = t('doc.title');
  for (const el of document.querySelectorAll('[data-i18n]')) {
    el.textContent = t(el.getAttribute('data-i18n'));
  }
  for (const el of document.querySelectorAll('[data-i18n-html]')) {
    el.innerHTML = t(el.getAttribute('data-i18n-html'));
  }
  // Language toggle: reflect pressed state
  for (const el of document.querySelectorAll('[data-lang-btn]')) {
    const btn = el;
    const isActive = btn.getAttribute('data-lang-btn') === currentLang;
    btn.setAttribute('aria-pressed', String(isActive));
    btn.classList.toggle('is-active', isActive);
  }
}
