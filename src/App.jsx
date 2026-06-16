import React, { useCallback, useMemo, useRef, useState } from 'react';
import CameraView from './components/CameraView.jsx';
import WordleGame from './components/WordleGame.jsx';
import Calibration from './components/Calibration.jsx';
import AlphabetGuide from './components/AlphabetGuide.jsx';
import { pickRandomWord } from './lib/words.js';
import { evaluateGuess } from './lib/wordle.js';
import { SUPPORTED_LETTERS } from './lib/lgpAlphabet.js';
import { DEFAULT_TEMPLATES } from './lib/defaultTemplates.js';
import { loadUserTemplates, saveUserTemplates, clearUserTemplates } from './lib/calibration.js';

const HOLD_FRAMES = 14;
const WORD_LEN = 4;
const MAX_TRIES = 6;
const APP_VERSION = '1.7';

// Junta a calibração embutida (1 amostra por letra) com as mãos adicionadas
// pelo utilizador (várias amostras), num só conjunto { letra: amostras[] }.
function buildTemplates(user) {
  const out = {};
  for (const l of SUPPORTED_LETTERS) {
    const base = DEFAULT_TEMPLATES[l] ? [DEFAULT_TEMPLATES[l]] : [];
    out[l] = [...base, ...(user[l] || [])];
  }
  return out;
}

export default function App() {
  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState('play'); // 'play' | 'calibrate'
  const [userTemplates, setUserTemplates] = useState(() => loadUserTemplates());
  const [recognised, setRecognised] = useState({ candidate: null, confidence: 0, progress: 0 });
  const [showGuide, setShowGuide] = useState(false);

  // Estado do jogo (Wordle gestual)
  const [secret, setSecret] = useState(() => pickRandomWord()[0]);
  const [rows, setRows] = useState([]); // [{ guess, result }]
  const [current, setCurrent] = useState('');
  const [status, setStatus] = useState('playing'); // 'playing' | 'won' | 'lost'

  const latestLmRef = useRef(null);
  const historyRef = useRef([]);
  const stateRef = useRef({});
  stateRef.current = { mode, status };

  const templates = useMemo(() => buildTemplates(userTemplates), [userTemplates]);
  const addedHands = Object.values(userTemplates).reduce((a, arr) => a + (arr?.length || 0), 0);

  const onRecognition = useCallback((info) => {
    setRecognised(info);
    const s = stateRef.current;
    if (info.committed && s.mode === 'play' && s.status === 'playing') {
      setCurrent((c) => (c.length < WORD_LEN ? c + info.committed : c));
    }
  }, []);

  const backspace = useCallback(() => setCurrent((c) => c.slice(0, -1)), []);

  const submit = useCallback(() => {
    if (current.length !== WORD_LEN || status !== 'playing') return;
    const result = evaluateGuess(current, secret);
    const next = [...rows, { guess: current, result }];
    setRows(next);
    setCurrent('');
    if (current === secret) setStatus('won');
    else if (next.length >= MAX_TRIES) setStatus('lost');
  }, [current, secret, rows, status]);

  const newGame = useCallback(() => {
    historyRef.current = [...historyRef.current, secret].slice(-8);
    setSecret(pickRandomWord(historyRef.current)[0]);
    setRows([]);
    setCurrent('');
    setStatus('playing');
  }, [secret]);

  const captureTemplate = useCallback((letter, tpl) => {
    setUserTemplates((prev) => {
      const next = { ...prev, [letter]: [...(prev[letter] || []), tpl] };
      saveUserTemplates(next);
      return next;
    });
  }, []);
  const resetCalibration = useCallback(() => {
    clearUserTemplates();
    setUserTemplates({});
  }, []);

  return (
    <div className="app">
      <header className="header">
        <h1 className="brand">TREMU NA OFICINA</h1>
        <p className="tagline">
          Adivinha a palavra de 4 letras — soletra as tentativas em Língua Gestual Portuguesa
        </p>
      </header>

      {!started ? (
        <Intro onStart={() => setStarted(true)} onGuide={() => setShowGuide(true)} />
      ) : (
        <>
          <div className="toolbar">
            <div className="tabs">
              <button
                className={`tab${mode === 'play' ? ' active' : ''}`}
                onClick={() => setMode('play')}
              >Jogar</button>
              <button
                className={`tab${mode === 'calibrate' ? ' active' : ''}`}
                onClick={() => setMode('calibrate')}
              >Calibração{addedHands ? ` (+${addedHands})` : ''}</button>
            </div>
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
                onDone={() => setMode('play')}
              />
            ) : (
              <WordleGame
                secret={secret}
                rows={rows}
                current={current}
                status={status}
                recognised={recognised}
                onBackspace={backspace}
                onSubmit={submit}
                onNewGame={newGame}
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
        Há uma <strong>palavra secreta de 4 letras</strong>. Tens <strong>6
        tentativas</strong> para a adivinhar — e soletras cada tentativa com a
        mão, usando o alfabeto manual da <strong>LGP</strong> à frente da câmara.
      </p>
      <p>
        As células pintam-se: <span className="chip ok">verde</span> = letra certa
        no sítio certo, <span className="chip warn">amarelo</span> = existe mas
        noutro sítio, <span className="chip off">cinzento</span> = não existe.
      </p>
      <p>
        O reconhecimento já vem pronto. No separador <strong>Calibração</strong>
        podes <strong>adicionar a tua mão</strong> (e a dos teus colegas) para
        ficar ainda mais certeiro.
      </p>
      <div className="intro-actions">
        <button className="primary" onClick={onStart}>Começar a jogar</button>
        <button className="ghost" onClick={onGuide}>Ver alfabeto</button>
      </div>
    </section>
  );
}
