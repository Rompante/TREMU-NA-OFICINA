import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

const MODEL_URL = '/models/hand_landmarker.task';
const WASM_DIR = '/wasm';

let landmarkerPromise = null;

function buildOptions(delegate) {
  return {
    baseOptions: { modelAssetPath: MODEL_URL, delegate },
    runningMode: 'VIDEO',
    numHands: 1,
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  };
}

export function loadHandLandmarker() {
  if (landmarkerPromise) return landmarkerPromise;
  landmarkerPromise = (async () => {
    const vision = await FilesetResolver.forVisionTasks(WASM_DIR);
    try {
      return await HandLandmarker.createFromOptions(vision, buildOptions('GPU'));
    } catch (e) {
      // Muitos browsers/máquinas não têm o delegado GPU disponível — recuar
      // para CPU em vez de deixar a aplicação rebentar.
      console.warn('[handTracker] GPU indisponível, a usar CPU:', e?.message || e);
      return HandLandmarker.createFromOptions(vision, buildOptions('CPU'));
    }
  })();
  // Se o carregamento falhar, permitir nova tentativa num próximo arranque.
  landmarkerPromise.catch(() => { landmarkerPromise = null; });
  return landmarkerPromise;
}

export async function attachCamera(videoEl) {
  if (!videoEl) throw new Error('Elemento de vídeo indisponível');
  // Pedimos resolução HD com a câmara frontal mas mantemos a proporção 4:3.
  // IMPORTANTE: o classificador geométrico usa landmarks normalizados (0-1),
  // que dependem da proporção da imagem. Foi afinado para 4:3 (como os antigos
  // 640x480), por isso mantemos 4:3 — só aumentamos a resolução. Mudar para
  // 16:9 distorceria a geometria e os gestos passariam a ser lidos errado.
  const baseVideo = {
    facingMode: 'user',
    width: { ideal: 1280 },
    height: { ideal: 960 },
    aspectRatio: { ideal: 4 / 3 },
    frameRate: { ideal: 30 },
  };
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: baseVideo, audio: false });
  } catch (e) {
    // Se a câmara não suportar HD, recuar para constraints mínimas em vez de falhar.
    console.warn('[handTracker] HD indisponível, a usar resolução por defeito:', e?.message || e);
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
  }
  videoEl.srcObject = stream;
  videoEl.muted = true;
  videoEl.playsInline = true;
  await new Promise((resolve) => {
    if (videoEl.readyState >= 1) return resolve();
    videoEl.addEventListener('loadedmetadata', () => resolve(), { once: true });
  });
  try {
    await videoEl.play();
  } catch (e) {
    // Em StrictMode (duplo mount em dev) o pedido de play pode ser
    // interrompido por um remount — isso é benigno, ignorar.
    if (e?.name !== 'AbortError') throw e;
  }
  return stream;
}

export function stopCamera(stream) {
  if (!stream) return;
  stream.getTracks().forEach((t) => t.stop());
}
