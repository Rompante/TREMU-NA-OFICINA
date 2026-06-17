const LM = {
  WRIST: 0,
  THUMB_CMC: 1, THUMB_MCP: 2, THUMB_IP: 3, THUMB_TIP: 4,
  INDEX_MCP: 5, INDEX_PIP: 6, INDEX_DIP: 7, INDEX_TIP: 8,
  MIDDLE_MCP: 9, MIDDLE_PIP: 10, MIDDLE_DIP: 11, MIDDLE_TIP: 12,
  RING_MCP: 13, RING_PIP: 14, RING_DIP: 15, RING_TIP: 16,
  PINKY_MCP: 17, PINKY_PIP: 18, PINKY_DIP: 19, PINKY_TIP: 20,
};

export const SUPPORTED_LETTERS = ['A','B','C','D','E','F','G','H','I','L','M','N','O','P','R','S','T','U','V','W','Y'];

function sub(a, b) { return [a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0)]; }
function len(v) { return Math.hypot(v[0], v[1], v[2]); }
function dot(a, b) { return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]; }
function dist(a, b) { return len(sub(a, b)); }
function angleAt(a, b, c) {
  const v1 = sub(a, b), v2 = sub(c, b);
  const m = len(v1) * len(v2) + 1e-9;
  const cos = Math.max(-1, Math.min(1, dot(v1, v2) / m));
  return (Math.acos(cos) * 180) / Math.PI;
}

function fingerAngles(lm) {
  return {
    thumb: angleAt(lm[LM.THUMB_MCP], lm[LM.THUMB_IP], lm[LM.THUMB_TIP]),
    index: angleAt(lm[LM.INDEX_MCP], lm[LM.INDEX_PIP], lm[LM.INDEX_TIP]),
    middle: angleAt(lm[LM.MIDDLE_MCP], lm[LM.MIDDLE_PIP], lm[LM.MIDDLE_TIP]),
    ring: angleAt(lm[LM.RING_MCP], lm[LM.RING_PIP], lm[LM.RING_TIP]),
    pinky: angleAt(lm[LM.PINKY_MCP], lm[LM.PINKY_PIP], lm[LM.PINKY_TIP]),
  };
}

function extended(angles) {
  return {
    thumb: angles.thumb > 150,
    index: angles.index > 160,
    middle: angles.middle > 160,
    ring: angles.ring > 160,
    pinky: angles.pinky > 160,
  };
}

function palmSize(lm) {
  return dist(lm[LM.WRIST], lm[LM.MIDDLE_MCP]) || 1e-6;
}

function averageTipMcpRatio(lm) {
  const p = palmSize(lm);
  const tips = [
    [LM.INDEX_TIP, LM.INDEX_MCP],
    [LM.MIDDLE_TIP, LM.MIDDLE_MCP],
    [LM.RING_TIP, LM.RING_MCP],
    [LM.PINKY_TIP, LM.PINKY_MCP],
  ];
  let s = 0;
  for (const [tip, mcp] of tips) s += dist(lm[tip], lm[mcp]) / p;
  return s / tips.length;
}

function near(value, target, tolerance) {
  return Math.max(0, 1 - Math.abs(value - target) / tolerance);
}
function above(value, threshold, slack) {
  if (value >= threshold) return 1;
  return Math.max(0, 1 - (threshold - value) / slack);
}
function below(value, threshold, slack) {
  if (value <= threshold) return 1;
  return Math.max(0, 1 - (value - threshold) / slack);
}

function scoreLetter(letter, lm, ext, angles, ratio) {
  const p = palmSize(lm);
  const thumbIndexD = dist(lm[LM.THUMB_TIP], lm[LM.INDEX_TIP]) / p;
  const thumbMiddleD = dist(lm[LM.THUMB_TIP], lm[LM.MIDDLE_MCP]) / p;
  const indexMiddleD = dist(lm[LM.INDEX_TIP], lm[LM.MIDDLE_TIP]) / p;
  const thumbOutFromPalm = dist(lm[LM.THUMB_TIP], lm[LM.INDEX_MCP]) / p;
  const thumbVec = sub(lm[LM.THUMB_TIP], lm[LM.THUMB_MCP]);
  const indexVec = sub(lm[LM.INDEX_TIP], lm[LM.INDEX_MCP]);
  const cosTI = dot(thumbVec, indexVec) / (len(thumbVec) * len(indexVec) + 1e-9);
  const thumbIndexAngle = (Math.acos(Math.max(-1, Math.min(1, cosTI))) * 180) / Math.PI;
  // Direção do polegar em relação ao eixo da mão (pulso -> base do médio):
  // ~0° = polegar alinhado com a mão (para cima, B); ~90° = polegar para o
  // lado (na horizontal, A).
  const handUp = sub(lm[LM.MIDDLE_MCP], lm[LM.WRIST]);
  const cosTH = dot(handUp, thumbVec) / (len(handUp) * len(thumbVec) + 1e-9);
  const thumbHandAngle = (Math.acos(Math.max(-1, Math.min(1, cosTH))) * 180) / Math.PI;

  switch (letter) {
    case 'B':
      // LGP: mão fechada (punho) com o polegar esticado PARA CIMA — tipo 👍.
      // (O alfabeto internacional usa a mão espalmada; aqui seguimos a LGP.)
      return [
        ext.thumb && !ext.index && !ext.middle && !ext.ring && !ext.pinky ? 1 : 0,
        below(thumbHandAngle, 45, 35),
      ];
    case 'D':
      // LGP: mão espalmada — os quatro dedos esticados e juntos (na foto
      // oficial aparece deitada/na horizontal). NÃO é o indicador sozinho.
      // O `above(ratio,...)` exige a mão BEM esticada, para não confundir
      // com o C (mão curvada, em que os dedos não estão totalmente abertos).
      return [
        ext.index && ext.middle && ext.ring && ext.pinky ? 1 : 0,
        below(indexMiddleD, 0.4, 0.25),
        above(ratio, 1.2, 0.3),
      ];
    case 'F':
      return [
        ext.middle && ext.ring && ext.pinky ? 1 : 0,
        below(thumbIndexD, 0.35, 0.3),
      ];
    case 'I':
      // LGP: só o mindinho esticado (polegar dobrado, senão é o Y).
      return [
        ext.pinky && !ext.thumb ? 1 : 0,
        !ext.index && !ext.middle && !ext.ring ? 1 : 0,
      ];
    case 'L':
      return [
        ext.index && !ext.middle && !ext.ring && !ext.pinky ? 1 : 0,
        above(thumbOutFromPalm, 0.75, 0.35),
        near(thumbIndexAngle, 90, 45),
      ];
    case 'U':
      return [
        ext.index && ext.middle && !ext.ring && !ext.pinky ? 1 : 0,
        below(indexMiddleD, 0.4, 0.3),
      ];
    case 'V':
      return [
        ext.index && ext.middle && !ext.ring && !ext.pinky ? 1 : 0,
        above(indexMiddleD, 0.55, 0.3),
      ];
    case 'W':
      return [
        ext.index && ext.middle && ext.ring && !ext.pinky ? 1 : 0,
        1,
      ];
    case 'Y':
      return [
        ext.thumb && ext.pinky ? 1 : 0,
        !ext.index && !ext.middle && !ext.ring ? 1 : 0,
      ];
    case 'O':
      return [
        !ext.index && !ext.middle && !ext.ring && !ext.pinky ? 1 : 0,
        near(ratio, 0.65, 0.35),
        below(thumbIndexD, 0.5, 0.3),
      ];
    case 'C':
      // LGP: mão em forma de C (dedos curvados, polegar afastado). Tolerante
      // no ratio e na abertura do polegar, para apanhar o C mesmo quando os
      // dedos não estão perfeitamente curvados.
      return [
        !ext.index && !ext.middle && !ext.ring && !ext.pinky ? 1 : 0,
        above(ratio, 0.72, 0.4),
        above(thumbIndexD, 0.35, 0.35),
      ];
    case 'A':
      // LGP: mão fechada (punho) com o polegar ESTICADO PARA O LADO (na
      // horizontal). NÃO é um murro (polegar dobrado) nem o B (polegar para
      // cima) — distingue-se pela direção do polegar (perpendicular à mão).
      return [
        ext.thumb && !ext.index && !ext.middle && !ext.ring && !ext.pinky ? 1 : 0,
        above(thumbHandAngle, 55, 35),
      ];
    default:
      return [0];
  }
}

export function classify(lm) {
  if (!lm || lm.length < 21) return { letter: null, confidence: 0, ext: null };
  const angles = fingerAngles(lm);
  const ext = extended(angles);
  const ratio = averageTipMcpRatio(lm);

  let best = { letter: null, confidence: 0 };
  for (const letter of SUPPORTED_LETTERS) {
    const parts = scoreLetter(letter, lm, ext, angles, ratio);
    const score = parts.reduce((a, b) => a + b, 0) / parts.length;
    if (score > best.confidence) best = { letter, confidence: score };
  }
  return { ...best, ext, ratio };
}

// ---------------------------------------------------------------------------
// Reconhecimento por CALIBRAÇÃO (comparação com modelos do próprio utilizador)
// ---------------------------------------------------------------------------
// Muito mais fiável que as regras geométricas: o utilizador grava cada sinal
// uma vez e depois comparamos a mão atual com esses modelos (o mais parecido
// ganha). Normalizamos a mão (posição, tamanho e rotação) para a comparação
// não depender de onde/como a mão está no ecrã.

const Z_WEIGHT = 0.25; // a profundidade do MediaPipe é ruidosa -> pouco peso
const DIST_SCALE = 2.6; // distância a partir da qual a "proximidade" chega a ~0
// Peso de cada ponto da mão na comparação. As PONTAS dos dedos são o que mais
// distingue sinais parecidos (ex.: C aberto vs punho A), por isso pesam mais.
// O pulso é a origem (não discrimina) -> peso 0.
const LM_WEIGHT = (() => {
  const w = new Array(21).fill(1);
  w[0] = 0;
  for (const t of [4, 8, 12, 16, 20]) w[t] = 2.4; // pontas dos dedos
  for (const d of [3, 7, 11, 15, 19]) w[d] = 1.4; // falanges distais
  return w;
})();

export function normalizeLandmarks(lm) {
  const w0 = lm[0];
  const pts = lm.map((p) => [p.x - w0.x, p.y - w0.y, (p.z || 0) - (w0.z || 0)]);
  const mcp = pts[LM.MIDDLE_MCP];
  const scale = Math.hypot(mcp[0], mcp[1], mcp[2]) || 1e-6;
  // rodar no plano xy para o eixo da mão (pulso->MCP médio) apontar "para cima"
  const ang = Math.atan2(mcp[1], mcp[0]);
  const rot = -Math.PI / 2 - ang;
  const cos = Math.cos(rot), sin = Math.sin(rot);
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const [x, y, z] = pts[i];
    const wt = Math.sqrt(LM_WEIGHT[i]);
    out.push(((x * cos - y * sin) / scale) * wt);
    out.push(((x * sin + y * cos) / scale) * wt);
    out.push((z / scale) * Z_WEIGHT * wt);
  }
  return out;
}

function sqDist(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; s += d * d; }
  return s;
}

// templates: { [letra]: number[][] }  (VÁRIAS amostras normalizadas por letra).
// Para cada letra usamos a amostra mais próxima (a mão mais parecida), e depois
// escolhemos a melhor letra. Aceita também uma só amostra (number[]).
export function classifyWithTemplates(lm, templates) {
  const v = normalizeLandmarks(lm);
  let best = null, bestD = Infinity, second = null, secondD = Infinity;
  for (const letter of Object.keys(templates)) {
    let samples = templates[letter];
    if (!samples || !samples.length) continue;
    if (typeof samples[0] === 'number') samples = [samples]; // retrocompatível
    let d = Infinity;
    for (const s of samples) { const sd = sqDist(v, s); if (sd < d) d = sd; }
    if (d < bestD) { second = best; secondD = bestD; best = letter; bestD = d; }
    else if (d < secondD) { second = letter; secondD = d; }
  }
  if (best === null) return { letter: null, confidence: 0, second: null, ext: null };

  const rawBestD = bestD;
  const rawMargin = secondD === Infinity ? 1 : Math.max(0, (secondD - bestD) / (secondD + 1e-6));

  // Desempate geométrico para pares mesmo parecidos, quando estão renhidos:
  // a comparação geral sozinha falha aqui, por isso usamos uma característica
  // específica para decidir.
  if (second && rawMargin < 0.22) {
    const pair = [best, second];
    const has = (a, b) => pair.includes(a) && pair.includes(b);
    const angles = fingerAngles(lm);
    const ext = extended(angles);
    if (has('A', 'S')) {
      // A = polegar esticado para o lado; S = polegar dobrado/à frente.
      best = ext.thumb ? 'A' : 'S';
    } else if (has('O', 'E')) {
      // O = mão mais aberta/redonda; E = dedos mais dobrados (pontas recolhidas).
      best = averageTipMcpRatio(lm) > 0.62 ? 'O' : 'E';
    } else if (has('U', 'V')) {
      // U = indicador e médio juntos; V = afastados.
      const p = palmSize(lm);
      const imd = dist(lm[LM.INDEX_TIP], lm[LM.MIDDLE_TIP]) / p;
      best = imd > 0.5 ? 'V' : 'U';
    }
    if (best !== pair[0]) second = pair[0];
  }

  const closeness = Math.max(0, 1 - rawBestD / DIST_SCALE);
  const confidence = Math.max(0, Math.min(1, closeness * (0.7 + 0.3 * rawMargin)));
  return { letter: best, confidence, second, ext: null };
}

export function createTemplate(lm) {
  return normalizeLandmarks(lm);
}

export function createStabilityFilter({ holdFrames = 12, minConf = 0.75 } = {}) {
  let last = null;
  let count = 0;
  let locked = null;

  return {
    push({ letter, confidence }) {
      if (!letter || confidence < minConf) {
        last = null;
        count = 0;
        // Ao baixar a mão (ou perder confiança) liberta o "lock", para se
        // poder registar a mesma letra novamente a seguir (ex.: escrever "OO").
        locked = null;
        return { committed: null, candidate: letter, progress: 0 };
      }
      if (letter === last) count++;
      else { last = letter; count = 1; }
      const progress = Math.min(1, count / holdFrames);
      if (count >= holdFrames && letter !== locked) {
        locked = letter;
        return { committed: letter, candidate: letter, progress: 1 };
      }
      return { committed: null, candidate: letter, progress };
    },
    reset() { last = null; count = 0; locked = null; },
    clearLock() { locked = null; },
  };
}
