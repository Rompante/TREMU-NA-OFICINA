import React, { useCallback, useState } from 'react';
import CameraView from './components/CameraView.jsx';
import TranslatorPanel from './components/GamePanel.jsx';
import AlphabetGuide from './components/AlphabetGuide.jsx';

const HOLD_FRAMES = 14;
const MAX_LEN = 40;
const APP_VERSION = '1.0';

export default function App() {
  const [started, setStarted] = useState(false);
  const [text, setText] = useState('');
  const [recognised, setRecognised] = useState({ candidate: null, confidence: 0, progress: 0 });
  const [showGuide, setShowGuide] = useState(false);

  // A câmara avisa sempre que muda a deteção. Quando uma letra fica "registada"
  // (seguraste o sinal o tempo suficiente), juntamo-la ao texto.
  const onRecognition = useCallback((info) => {
    setRecognised(info);
    if (info.committed) {
      setText((t) => (t + info.committed).slice(-MAX_LEN));
    }
  }, []);

  const backspace = useCallback(() => setText((t) => t.slice(0, -1)), []);
  const addSpace = useCallback(() => setText((t) => (t + ' ').slice(-MAX_LEN)), []);
  const clearText = useCallback(() => setText(''), []);

  return (
    <div className="app">
      <header className="header">
        <h1 className="brand">TREMU NA OFICINA</h1>
        <p className="tagline">
          Tradutor de Língua Gestual Portuguesa — faz o sinal e a app diz a letra
        </p>
      </header>

      {!started ? (
        <Intro onStart={() => setStarted(true)} onGuide={() => setShowGuide(true)} />
      ) : (
        <main className="layout">
          <CameraView holdFrames={HOLD_FRAMES} onRecognition={onRecognition} />
          <TranslatorPanel
            text={text}
            recognised={recognised}
            onBackspace={backspace}
            onSpace={addSpace}
            onClear={clearText}
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
        Faz um sinal do alfabeto manual da <strong>LGP</strong> à frente da câmara.
        A app reconhece e <strong>diz-te que letra estás a fazer</strong>. Segura o
        sinal um instante e a letra junta-se às outras, para formares palavras.
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
