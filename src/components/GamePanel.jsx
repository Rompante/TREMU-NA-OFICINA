import React from 'react';
import SignVisual from './SignVisual.jsx';

// Painel do tradutor: mostra, ao vivo, a letra que estás a fazer e vai
// juntando as letras registadas para formares palavras.
export default function TranslatorPanel({
  text, recognised, onBackspace, onSpace, onClear, onGuide,
}) {
  const candidate = recognised?.candidate || null;
  const progress = recognised?.progress || 0;
  const done = progress >= 1;

  return (
    <section className="panel">
      <div className="detect">
        <span className="label">Estás a fazer</span>
        <div className="detect-main">
          {candidate ? (
            <SignVisual key={candidate} letter={candidate} variant="target" />
          ) : (
            <div className="detect-empty">Mostra um sinal à câmara…</div>
          )}
          <span className={`big-letter detected${done ? ' ok' : ''}`}>
            {candidate || '—'}
          </span>
        </div>
        <div className="detect-bar">
          <div className="detect-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
        <span className="detect-hint">
          {candidate
            ? done
              ? 'Letra registada! ✅'
              : 'Segura o sinal para registar…'
            : 'Sem mão detetada'}
        </span>
      </div>

      <div className="output">
        <span className="label">O que escreveste</span>
        <div className="output-text">
          {text
            ? <span>{text}</span>
            : <span className="output-placeholder">faz sinais para escrever</span>}
          <span className="cursor" aria-hidden="true">|</span>
        </div>
      </div>

      <div className="actions">
        <button className="ghost" onClick={onSpace}>␣ Espaço</button>
        <button className="ghost" onClick={onBackspace}>⌫ Apagar</button>
        <button className="ghost" onClick={onClear}>Limpar</button>
        <button className="ghost" onClick={onGuide}>Ver alfabeto</button>
      </div>
    </section>
  );
}
