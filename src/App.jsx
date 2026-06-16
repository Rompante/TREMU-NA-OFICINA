import React, { useCallback, useRef, useState } from 'react';
import CameraView from './components/CameraView.jsx';
import WordleGame from './components/WordleGame.jsx';
import AlphabetGuide from './components/AlphabetGuide.jsx';
import { pickRandomWord } from './lib/words.js';
import { evaluateGuess } from './lib/wordle.js';
import { DEFAULT_TEMPLATES } from './lib/defaultTemplates.js';

const HOLD_FRAMES = 14;
const WORD_LEN = 4;
const MAX_TRIES = 6;
const APP_VERSION = '1.6';

// Calibração embutida — o jogo reconhece os sinais sem ser preciso calibrar.
const TEMPLATES = DEFAULT_TEMPLATES;

export default function App() {
  const [started, setStarted] = useState(false);
  const [recognised, setRecognised] = useState({ candidate: null, confidence: 0, progress: 0 });
  const [showGuide, setShowGuide] = useState(false);

  // Estado do jogo (Wordle gestual)
  const [secret, setSecret] = useState(() => pickRandomWord()[0]);
  const [rows, setRows] = useState([]); // [{ guess, result }]
  const [current, setCurrent] = useState('');
  const [status, setStatus] = useState('playing'); // 'playing' | 'won' | 'lost'

  const historyRef = useRef([]);
  const statusRef = useRef(status);
  statusRef.current = status;

  const onRecognition = useCallback((info) => {
    setRecognised(info);
    if (info.committed && statusRef.current === 'playing') {
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
        <main className="layout">
          <CameraView
            holdFrames={HOLD_FRAMES}
            onRecognition={onRecognition}
            templates={TEMPLATES}
          />
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
        </main>
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
      <ul>
        <li>Mantém uma só mão à frente da câmara, com boa luz.</li>
        <li>Faz uma letra, baixa a mão, e faz a seguinte.</li>
        <li>Letras suportadas: A, B, C, D, F, I, L, O, U, V, W, Y.</li>
      </ul>
      <div className="intro-actions">
        <button className="primary" onClick={onStart}>Começar a jogar</button>
        <button className="ghost" onClick={onGuide}>Ver alfabeto</button>
      </div>
    </section>
  );
}
