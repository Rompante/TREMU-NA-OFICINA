import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

const MODEL_URL = '/models/hand_landmarker.task';
const WASM_DIR = '/wasm';

let landmarkerPromise = null;

// O runtime WASM do MediaPipe escreve logs internos na consola em formato
// glog — ex.: "W0611 18:06:40.044000 2136208 gl_context.cc:1118] OpenGL error
// checking is disabled". São informativos/avisos internos conhecidos (versão
// do GL, NORM_RECT sem IMAGE_DIMENSIONS, etc.), não indicam problemas na app
// e não há opção pública para os desligar. Filtramos APENAS linhas com este
// prefixo exato — erros reais nunca têm este formato e continuam visíveis.
const MEDIAPIPE_GLOG = /^[IWEF]\d{4}\s+\d{1,2}:\d{2}:\d{2}\.\d+\s+\d+\s+\S+\.cc:\d+\]/;
let consoleFiltered = false;

function filterMediapipeConsoleNoise() {
  if (consoleFiltered) return;
  consoleFiltered = true;
  for (const level of ['log', 'info', 'warn', 'error']) {
    const original = console[level].bind(console);
    console[level] = (...args) => {
      if (typeof args[0] === 'string' && MEDIAPIPE_GLOG.test(args[0])) return;
      original(...args);
    };
  }
}

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
  filterMediapipeConsoleNoise();
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
  // Resolução modesta (640x480, 4:3) com a câmara frontal. Processar imagens
  // grandes (HD) a cada frame com o modelo das mãos é pesado e causa "lag",
  // sobretudo sem GPU. 640x480 é mais que suficiente para detetar a mão e fica
  // bastante mais fluido. Mantemos 4:3 (a geometria dos landmarks é normalizada,
  // mas 4:3 mantém-se por consistência com a calibração).
  const baseVideo = {
    facingMode: 'user',
    width: { ideal: 640 },
    height: { ideal: 480 },
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
