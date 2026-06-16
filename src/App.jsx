import React, { useCallback, useRef, useState } from 'react';
import CameraView from './components/CameraView.jsx';
import TranslatorPanel from './components/GamePanel.jsx';
import Calibration from './components/Calibration.jsx';
import AlphabetGuide from './components/AlphabetGuide.jsx';
import { loadTemplates, saveTemplates, clearTemplates } from './lib/calibration.js';

const HOLD_FRAMES = 14;
const MAX_LEN = 40;
const APP_VERSION = '1.1';

export default function App() {
  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState('translate'); // 'translate' | 'calibrate'
  const [templates, setTemplates] = useState(() => loadTemplates());
  const [text, setText] = useState('');
  const [recognised, setRecognised] = useState({ candidate: null, confidence: 0, progress: 0 });
  const [showGuide, setShowGuide] = useState(false);
  const latestLmRef = useRef(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const calibratedCount = Object.keys(templates).length;

  const onRecognition = useCallback((info) => {
    setRecognised(info);
    if (info.committed && modeRef.current === 'translate') {
      setText((t) => (t + info.committed).slice(-MAX_LEN));
    }
  }, []);

  const backspace = useCallback(() => setText((t) => t.slice(0, -1)), []);
  const addSpace = useCallback(() => setText((t) => (t + ' ').slice(-MAX_LEN)), []);
  const clearText = useCallback(() => setText(''), []);

  const captureTemplate = useCallback((letter, tpl) => {
    setTemplates((prev) => {
      const next = { ...prev, [letter]: tpl };
      saveTemplates(next);
      return next;
    });
  }, []);
  const resetCalibration = useCallback(() => {
    clearTemplates();
    setTemplates({});
  }, []);

  const start = () => {
    setStarted(true);
    setMode(calibratedCount >= 2 ? 'translate' : 'calibrate');
  };

  return (
    <div className="app">
      <header className="header">
        <h1 className="brand">TREMU NA OFICINA</h1>
        <p className="tagline">
          Tradutor de Língua Gestual Portuguesa — faz o sinal e a app diz a letra
        </p>
      </header>

      {!started ? (
        <Intro onStart={start} onGuide={() => setShowGuide(true)} />
      ) : (
        <>
          <div className="toolbar">
            <div className="tabs">
              <button
                className={`tab${mode === 'translate' ? ' active' : ''}`}
                onClick={() => setMode('translate')}
              >Tradutor</button>
              <button
                className={`tab${mode === 'calibrate' ? ' active' : ''}`}
                onClick={() => setMode('calibrate')}
              >Calibração ({calibratedCount}/12)</button>
            </div>
            {mode === 'translate' && calibratedCount < 12 && (
              <span className="toolbar-warn">
                ⚠️ Calibra todas as letras para o reconhecimento funcionar bem.
              </span>
            )}
          </div>

          <main className="layout">
            <CameraView
              holdFrames={HOLD_FRAMES}
              onRecognition={onRecognition}
              templates={templates}
              latestLmRef={latestLmRef}
            />
            {mode === 'calibrate' ? (
              <Calibration
                templates={templates}
                latestLmRef={latestLmRef}
                onCapture={captureTemplate}
                onClearAll={resetCalibration}
                onDone={() => setMode('translate')}
              />
            ) : (
              <TranslatorPanel
                text={text}
                recognised={recognised}
                onBackspace={backspace}
                onSpace={addSpace}
                onClear={clearText}
                onGuide={() => setShowGuide(true)}
              />
            )}
          </main>
        </>
      )}

      {showGuide && <AlphabetGuide onClose={() => setShowGuide(false)} />}

      <footer className="footer">
        <span>v{APP_VERSION} · Stand-alone · corre 100 % no navegador · sem serviços externos</span>
      </footer>
    </div>
  );
}

function Intro({ onStart, onGuide }) {
  return (
    <section className="intro">
      <h2>Bem-vindo(a)!</h2>
      <p>
        Faz um sinal do alfabeto manual da <strong>LGP</strong> à frente da câmara
        e a app <strong>diz-te que letra estás a fazer</strong>, juntando as letras
        para formares palavras.
      </p>
      <p>
        Primeiro há uma <strong>calibração rápida</strong>: fazes cada sinal uma
        vez para a app aprender a <strong>tua</strong> mão. Assim o reconhecimento
        fica muito mais certeiro (fica guardado no teu dispositivo).
      </p>
      <ul>
        <li>Mantém uma só mão à frente da câmara, com boa luz.</li>
        <li>Letras suportadas: A, B, C, D, F, I, L, O, U, V, W, Y.</li>
        <li>Baixa a mão entre letras para escreveres a mesma letra duas vezes.</li>
      </ul>
      <div className="intro-actions">
        <button className="primary" onClick={onStart}>Começar</button>
        <button className="ghost" onClick={onGuide}>Ver alfabeto</button>
      </div>
    </section>
  );
}
