import React, { useState } from 'react';
import SignVisual from './SignVisual.jsx';
import { SUPPORTED_LETTERS, createTemplate } from '../lib/lgpAlphabet.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Ecrã para ADICIONAR mãos. Cada pessoa pode gravar a sua mão em cada letra;
// as amostras somam-se à calibração embutida, tornando o reconhecimento mais
// robusto. A câmara (ao lado) mostra a mão para a posicionar.
export default function Calibration({ templates, latestLmRef, onCapture, onClearAll, onDone }) {
  const [i, setI] = useState(0);
  const [flash, setFlash] = useState(null);
  const [busy, setBusy] = useState(false);
  const letter = SUPPORTED_LETTERS[i];
  const count = (l) => (templates[l] ? templates[l].length : 0);

  const next = () => setI((v) => (v + 1) % SUPPORTED_LETTERS.length);
  const prev = () => setI((v) => (v - 1 + SUPPORTED_LETTERS.length) % SUPPORTED_LETTERS.length);

  async function grava() {
    if (busy) return;
    setBusy(true);
    // média de várias amostras (~0,2 s) para a mão gravada ficar estável
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
    setFlash(`Mão adicionada à letra ${letter} ✅`);
    setTimeout(() => setFlash(null), 1400);
    next();
  }

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

  return (
    <section className="panel">
      <div className="calib-head">
        <span className="label">Adicionar mãos — melhora o reconhecimento</span>
      </div>
      <p className="calib-sub">
        Faz o sinal e grava. Cada pessoa pode juntar a sua mão a cada letra —
        quantas mais mãos, mais certeiro fica.
      </p>

      <div className="detect">
        <span className="label">Faz este sinal e grava</span>
        <div className="detect-main">
          <SignVisual key={letter} letter={letter} variant="target" />
          <span className="big-letter">{letter}</span>
        </div>
        <span className="detect-hint">{count(letter)} mão(s) gravada(s) nesta letra</span>
      </div>

      <p className="calib-flash">{flash || ' '}</p>

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
            className={`calib-chip${idx === i ? ' current' : ''}${count(l) > 1 ? ' done' : ''}`}
            onClick={() => setI(idx)}
          >
            <span>{l}</span>
            <small>{count(l)}</small>
          </button>
        ))}
      </div>

      <div className="actions">
        <button className="ghost" onClick={onClearAll}>Repor (só a base)</button>
        <button className="ghost" onClick={exportar}>Exportar</button>
        <button className="primary" onClick={onDone}>Concluir e jogar</button>
      </div>
    </section>
  );
}
