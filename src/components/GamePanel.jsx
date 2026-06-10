import React from 'react';

export default function GamePanel({
  word, hint, letterIndex, score, solved, recognised, onSkip, onGuide,
}) {
  const letters = word.split('');
  const target = letters[letterIndex];
  const candidate = recognised?.candidate;
  const progress = recognised?.progress || 0;
  const matches = candidate && candidate === target;

  return (
    <section className="panel">
      <div className="scoreboard">
        <div><span className="label">Pontos</span><span className="value">{score}</span></div>
        <div><span className="label">Palavras</span><span className="value">{solved}</span></div>
      </div>

      <div className="word-row">
        {letters.map((l, i) => {
          const done = i < letterIndex;
          const active = i === letterIndex;
          const cls = `letter-tile${done ? ' done' : ''}${active ? ' active' : ''}`;
          return (
            <div key={i} className={cls}>
              <span className="letter">{done ? l : active ? l : '·'}</span>
              {active && progress > 0 && (
                <div className="progress" style={{ width: `${Math.round(progress * 100)}%` }} />
              )}
            </div>
          );
        })}
      </div>

      <p className="hint-text">Dica: <em>{hint}</em></p>

      <div className="recognised">
        <span className="label">A letra atual</span>
        <span className="big-letter">{target}</span>
        <span className="label">Estás a fazer</span>
        <span className={`big-letter detected${matches ? ' ok' : ''}`}>
          {candidate || '—'}
        </span>
      </div>

      <div className="actions">
        <button className="ghost" onClick={onSkip}>Saltar palavra</button>
        <button className="ghost" onClick={onGuide}>Ver alfabeto</button>
      </div>
    </section>
  );
}
