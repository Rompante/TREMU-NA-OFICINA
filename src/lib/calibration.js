// Guarda as mãos adicionadas pelos utilizadores (além da calibração embutida).
// Formato: { [letra]: number[][] } — VÁRIAS amostras por letra, para se poderem
// juntar as mãos de várias pessoas e o reconhecimento ficar mais robusto.
// Fica no localStorage do browser (não sai do dispositivo).

const KEY = 'tno-lgp-user-v3';

export function loadUserTemplates() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

export function saveUserTemplates(templates) {
  try {
    localStorage.setItem(KEY, JSON.stringify(templates));
  } catch {
    /* localStorage indisponível — ignora */
  }
}

export function clearUserTemplates() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignora */
  }
}
