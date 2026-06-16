// Guarda/lê os modelos de calibração do utilizador (uma "fotografia" numérica
// de cada sinal feito pela sua própria mão). Fica no localStorage do browser,
// por isso não sai do dispositivo e mantém-se entre sessões.

const KEY = 'tno-lgp-templates-v1';

export function loadTemplates() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

export function saveTemplates(templates) {
  try {
    localStorage.setItem(KEY, JSON.stringify(templates));
  } catch {
    /* localStorage indisponível — ignora */
  }
}

export function clearTemplates() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignora */
  }
}
