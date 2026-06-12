import React, { useCallback, useEffect, useRef, useState } from 'react';
import CameraView from './components/CameraView.jsx';
import GamePanel from './components/GamePanel.jsx';
import AlphabetGuide from './components/AlphabetGuide.jsx';
import { pickRandomWord } from './lib/words.js';

const HOLD_FRAMES = 14;

export default function App() {
  const [started, setStarted] = useState(false);
  const [round, setRound] = useState(() => newRound([]));
  const [letterIndex, setLetterIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [solved, setSolved] = useState(0);
  const [recognised, setRecognised] = useState({ letter: null, confidence: 0, progress: 0 });
  const [showGuide, setShowGuide] = useState(false);
  const [celebrate, setCelebrate] = useState(0);
  const historyRef = useRef([]);

  function newRound(history) {
    const [word, hint] = pickRandomWord(history);
    return { word, hint, letters: word.split('') };
  }

  const advance = useCallback(() => {
    if (letterIndex + 1 < round.letters.length) {
      setLetterIndex((i) => i + 1);
      setScore((s) => s + 10);
    } else {
      setScore((s) => s + 25);
      setSolved((s) => s + 1);
      setCelebrate((c) => c + 1);
      historyRef.current = [...historyRef.current, round.word].slice(-20);
      setRound(newRound(historyRef.current));
      setLetterIndex(0);
    }
  }, [letterIndex, round]);

  const skip = useCallback(() => {
    historyRef.current = [...historyRef.current, round.word].slice(-20);
    setRound(newRound(historyRef.current));
    setLetterIndex(0);
  }, [round]);

  const target = round.letters[letterIndex];

  const onRecognition = useCallback((info) => {
    setRecognised(info);
    if (info.committed && info.committed === target) {
      advance();
    }
  }, [advance, target]);

  return (
    <div className="app">
      <header className="header">
        <h1 className="brand">TREMU NA OFICINA</h1>
        <p className="tagline">Jogo de inclusão social — Língua Gestual Portuguesa</p>
      </header>

      {!started ? (
        <Intro onStart={() => setStarted(true)} onGuide={() => setShowGuide(true)} />
      ) : (
        <main className="layout">
          <CameraView
            target={target}
            holdFrames={HOLD_FRAMES}
            onRecognition={onRecognition}
          />
          <GamePanel
            word={round.word}
            hint={round.hint}
            letterIndex={letterIndex}
            score={score}
            solved={solved}
            recognised={recognised}
            onSkip={skip}
            onGuide={() => setShowGuide(true)}
          />
        </main>
      )}

      {celebrate > 0 && (
        <div key={celebrate} className="celebrate" aria-hidden="true">
          <span className="celebrate-text">Boa! <strong>+25</strong> 🎉</span>
        </div>
      )}

      {showGuide && <AlphabetGuide onClose={() => setShowGuide(false)} />}

      <footer className="footer">
        <span>Stand-alone · corre 100 % no navegador · sem serviços externos</span>
      </footer>
    </div>
  );
}

function Intro({ onStart, onGuide }) {
  return (
    <section className="intro">
      <h2>Bem-vindo(a)!</h2>
      <p>
        Vais ver uma palavra de quatro letras. Faz cada letra na câmara usando
        o alfabeto manual da <strong>LGP</strong> — quando o sistema reconhecer
        e segurares por um instante, a letra acende e passas à seguinte.
      </p>
      <ul>
        <li>Mantém uma só mão à frente da câmara, com boa luz.</li>
        <li>Letras suportadas: A, B, C, D, F, I, L, O, U, V, W, Y.</li>
        <li>Letras com movimento (J, Z) não entram nesta versão.</li>
      </ul>
      <div className="intro-actions">
        <button className="primary" onClick={onStart}>Começar</button>
        <button className="ghost" onClick={onGuide}>Ver alfabeto</button>
      </div>
    </section>
  );
}
