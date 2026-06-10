// LGP (Língua Gestual Portuguesa) alphabet recogniser.
//
// Input: 21 MediaPipe HandLandmarker keypoints (x, y, z in normalised image
// coordinates). Output: best-matching letter + confidence (0..1).
//
// Approach: extract geometric features (finger extension via PIP joint angle +
// thumb position relative to palm) then map to a letter with hand-written
// rules. Designed for static one-handed signs only — letters that require
// motion (J, Z) are intentionally excluded.

const LM = {
  WRIST: 0,
  THUMB_CMC: 1, THUMB_MCP: 2, THUMB_IP: 3, THUMB_TIP: 4,
  INDEX_MCP: 5, INDEX_PIP: 6, INDEX_DIP: 7, INDEX_TIP: 8,
  MIDDLE_MCP: 9, MIDDLE_PIP: 10, MIDDLE_DIP: 11, MIDDLE_TIP: 12,
  RING_MCP: 13, RING_PIP: 14, RING_DIP: 15, RING_TIP: 16,
  PINKY_MCP: 17, PINKY_PIP: 18, PINKY_DIP: 19, PINKY_TIP: 20,
};

export const SUPPORTED_LETTERS = ['A','B','C','D','F','I','L','O','U','V','W','Y'];

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

// Per-finger feature: PIP joint angle (≈180° = straight, ≈90° = bent).
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
  // wrist → middle MCP is a stable scale reference for the hand.
  return dist(lm[LM.WRIST], lm[LM.MIDDLE_MCP]) || 1e-6;
}

// Average closure: how far fingertips are from their MCPs, normalised by palm
// size. Used to distinguish a closed fist from a curved/cupped hand.
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

// Score in [0..1] for how confidently a feature matches a target value.
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

  switch (letter) {
    case 'B': // 4 fingers up, thumb across palm
      return [
        ext.index && ext.middle && ext.ring && ext.pinky ? 1 : 0,
        below(angles.thumb, 150, 30),
      ];
    case 'D': // index up, others curled
      return [
        ext.index ? 1 : 0,
        !ext.middle && !ext.ring && !ext.pinky ? 1 : 0,
      ];
    case 'F': // index touches thumb (OK shape); middle/ring/pinky up
      return [
        ext.middle && ext.ring && ext.pinky ? 1 : 0,
        below(thumbIndexD, 0.35, 0.3),
      ];
    case 'I': // pinky only
      return [
        ext.pinky ? 1 : 0,
        !ext.index && !ext.middle && !ext.ring ? 1 : 0,
      ];
    case 'L': // thumb + index, perpendicular
      return [
        ext.index && ext.thumb ? 1 : 0,
        !ext.middle && !ext.ring && !ext.pinky ? 1 : 0,
      ];
    case 'U': // index + middle up, close together
      return [
        ext.index && ext.middle && !ext.ring && !ext.pinky ? 1 : 0,
        below(indexMiddleD, 0.4, 0.3),
      ];
    case 'V': // index + middle up, apart
      return [
        ext.index && ext.middle && !ext.ring && !ext.pinky ? 1 : 0,
        above(indexMiddleD, 0.55, 0.3),
      ];
    case 'W': // index + middle + ring up
      return [
        ext.index && ext.middle && ext.ring && !ext.pinky ? 1 : 0,
        1,
      ];
    case 'Y': // thumb + pinky
      return [
        ext.thumb && ext.pinky ? 1 : 0,
        !ext.index && !ext.middle && !ext.ring ? 1 : 0,
      ];
    case 'O': // all fingers curled to touch thumb forming circle
      return [
        !ext.index && !ext.middle && !ext.ring && !ext.pinky ? 1 : 0,
        near(ratio, 0.65, 0.35), // medium closure
        below(thumbIndexD, 0.5, 0.3),
      ];
    case 'C': // curved hand, palm cupped, thumb visible
      return [
        !ext.index && !ext.middle && !ext.ring && !ext.pinky ? 1 : 0,
        above(ratio, 0.85, 0.25), // fingers curved but extended
        above(thumbIndexD, 0.45, 0.3), // gap between thumb and index
      ];
    case 'A': // closed fist, thumb on the side
      return [
        !ext.index && !ext.middle && !ext.ring && !ext.pinky ? 1 : 0,
        below(ratio, 0.55, 0.2), // tight closure
        above(thumbMiddleD, 0.6, 0.3), // thumb stays on the side
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

// Stability filter: returns a letter only if the same letter has been the
// top guess for `holdFrames` consecutive frames with confidence ≥ minConf.
export function createStabilityFilter({ holdFrames = 12, minConf = 0.75 } = {}) {
  let last = null;
  let count = 0;
  let locked = null;

  return {
    push({ letter, confidence }) {
      if (!letter || confidence < minConf) {
        last = null;
        count = 0;
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
