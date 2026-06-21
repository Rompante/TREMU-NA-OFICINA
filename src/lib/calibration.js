// Guarda as mãos adicionadas pelos utilizadores (além da calibração embutida).
// Formato: { [letra]: number[][] } — VÁRIAS amostras por letra, para se poderem
// juntar as mãos de várias pessoas e o reconhecimento ficar mais robusto.
// Fica no localStorage do browser (não sai do dispositivo).

// v4: o formato dos modelos mudou para "features" (ângulos+distâncias). Os
// modelos antigos (posições) são incompatíveis, por isso esta versão recomeça.
const KEY = 'tno-lgp-user-v4';

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
