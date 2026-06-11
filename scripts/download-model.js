// Ensures the MediaPipe hand-landmark model and the tasks-vision WASM runtime
// are present under /public so the app can serve them locally — no third-party
// fetches at runtime. Runs as predev/prebuild via npm scripts.

import { createWriteStream, existsSync, mkdirSync, copyFileSync, readdirSync, statSync, renameSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const MODEL_DIR = join(ROOT, 'public', 'models');
const MODEL_PATH = join(MODEL_DIR, 'hand_landmarker.task');

const WASM_DIR = join(ROOT, 'public', 'wasm');
const WASM_SRC = join(ROOT, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm');

async function downloadModel() {
  if (existsSync(MODEL_PATH) && statSync(MODEL_PATH).size > 1_000_000) {
    console.log('[setup] hand_landmarker.task já presente — saltar download');
    return;
  }
  mkdirSync(MODEL_DIR, { recursive: true });
  console.log(`[setup] A descarregar modelo: ${MODEL_URL}`);
  const res = await fetch(MODEL_URL);
  if (!res.ok || !res.body) {
    throw new Error(`Falha ao descarregar o modelo (HTTP ${res.status})`);
  }
  // Escrever primeiro para um ficheiro temporário e só depois renomear, para
  // que um download interrompido não deixe um .task corrompido no lugar.
  const tmpPath = `${MODEL_PATH}.download`;
  try {
    await pipeline(res.body, createWriteStream(tmpPath));
    renameSync(tmpPath, MODEL_PATH);
  } catch (e) {
    rmSync(tmpPath, { force: true });
    throw e;
  }
  console.log(`[setup] Modelo guardado em ${MODEL_PATH}`);
}

function copyWasm() {
  if (!existsSync(WASM_SRC)) {
    console.warn('[setup] WASM runtime ainda não instalado. Corre `npm install` primeiro.');
    return;
  }
  mkdirSync(WASM_DIR, { recursive: true });
  for (const f of readdirSync(WASM_SRC)) {
    copyFileSync(join(WASM_SRC, f), join(WASM_DIR, f));
  }
  console.log(`[setup] WASM copiado para ${WASM_DIR}`);
}

try {
  await downloadModel();
  copyWasm();
} catch (e) {
  console.error('[setup] Erro:', e.message);
  process.exitCode = 1;
}
