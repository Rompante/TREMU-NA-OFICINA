import React, { useState } from 'react';
import SignVisual from './SignVisual.jsx';
import { SUPPORTED_LETTERS, createTemplate } from '../lib/lgpAlphabet.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Ecrã de calibração: o utilizador faz cada sinal uma vez e gravamos a forma
// da sua mão. A câmara (ao lado) continua a mostrar a mão para se posicionar.
export default function Calibration({ templates, latestLmRef, onCapture, onClearAll, onDone }) {
  const [i, setI] = useState(0);
  const [flash, setFlash] = useState(null);
  const [busy, setBusy] = useState(false);
  const letter = SUPPORTED_LETTERS[i];
  const doneCount = SUPPORTED_LETTERS.filter((l) => templates[l]).length;

  const next = () => setI((v) => (v + 1) % SUPPORTED_LETTERS.length);
  const prev = () => setI((v) => (v - 1 + SUPPORTED_LETTERS.length) % SUPPORTED_LETTERS.length);

  function exportar() {
    const data = JSON.stringify(templates);
    try { navigator.clipboard?.writeText(data); } catch { /* ignora */ }
    try {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'calibracao-lgp.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* ignora */ }
    setFlash('Calibração exportada (ficheiro descarregado e copiado).');
    setTimeout(() => setFlash(null), 2500);
  }

  async function grava() {
    if (busy) return;
    setBusy(true);
    // média de várias amostras (~0,2 s) para o modelo ficar mais estável
    const samples = [];
    for (let k = 0; k < 5; k++) {
      const lm = latestLmRef?.current;
      if (lm) samples.push(createTemplate(lm));
      await sleep(40);
    }
    setBusy(false);
    if (!samples.length) {
      setFlash('Não vejo a tua mão — põe a mão à frente da câmara.');
      return;
    }
    const avg = samples[0].map((_, j) =>
      samples.reduce((s, v) => s + v[j], 0) / samples.length);
    onCapture(letter, avg);
    setFlash(`Letra ${letter} gravada ✅`);
    setTimeout(() => setFlash(null), 1200);
    next();
  }

  return (
    <section className="panel">
      <div className="calib-head">
        <span className="label">Calibração — ensina o jogo</span>
        <span className="calib-count">{doneCount}/{SUPPORTED_LETTERS.length}</span>
      </div>

      <div className="detect">
        <span className="label">Faz este sinal e grava</span>
        <div className="detect-main">
          <SignVisual key={letter} letter={letter} variant="target" />
          <span className="big-letter">{letter}</span>
        </div>
        <span className="detect-hint">
          {templates[letter] ? 'Já gravado — podes regravar.' : 'Ainda por gravar.'}
        </span>
      </div>

      <p className="calib-flash">{flash || ' '}</p>

      <div className="actions">
        <button className="ghost" onClick={prev}>← Anterior</button>
        <button className="primary" onClick={grava} disabled={busy}>
          {busy ? 'A gravar…' : `Gravar ${letter}`}
        </button>
        <button className="ghost" onClick={next}>Seguinte →</button>
      </div>

      <div className="calib-grid">
        {SUPPORTED_LETTERS.map((l, idx) => (
          <button
            key={l}
            className={`calib-chip${templates[l] ? ' done' : ''}${idx === i ? ' current' : ''}`}
            onClick={() => setI(idx)}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="actions">
        <button className="ghost" onClick={onClearAll}>Recomeçar</button>
        <button className="ghost" onClick={exportar} disabled={!doneCount}>Exportar calibração</button>
        <button className="primary" onClick={onDone}>
          {doneCount >= SUPPORTED_LETTERS.length ? 'Concluir' : `Concluir (faltam ${SUPPORTED_LETTERS.length - doneCount})`}
        </button>
      </div>
    </section>
  );
}
