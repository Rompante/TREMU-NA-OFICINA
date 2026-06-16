import React from 'react';

const WORD_LEN = 4;
const MAX_TRIES = 6;

// Tabuleiro estilo Wordle, jogado por gestos. As letras vêm do reconhecimento
// (a câmara) e preenchem a linha atual; ao confirmar, as células pintam-se.
export default function WordleGame({
  secret, rows, current, status, recognised, onBackspace, onSubmit, onNewGame, onGuide,
}) {
  const candidate = recognised?.candidate || null;
  const progress = recognised?.progress || 0;
  const over = status !== 'playing';

  return (
    <section className="panel game">
      <div className="game-status">
        {status === 'won' && <span className="msg ok">Acertaste! 🎉</span>}
        {status === 'lost' && <span className="msg bad">A palavra era <strong>{secret}</strong></span>}
        {status === 'playing' && (
          <span className="msg">Tentativa {rows.length + 1} de {MAX_TRIES}</span>
        )}
      </div>

      <div className="board">
        {Array.from({ length: MAX_TRIES }).map((_, r) => {
          const submitted = rows[r];
          const isCurrent = !submitted && r === rows.length && !over;
          return (
            <div className="board-row" key={r}>
              {Array.from({ length: WORD_LEN }).map((_, c) => {
                let ch = '';
                let state = '';
                if (submitted) {
                  ch = submitted.guess[c];
                  state = submitted.result[c];
                } else if (isCurrent) {
                  ch = current[c] || '';
                  if (ch) state = 'filled';
                }
                const delay = submitted ? { animationDelay: `${c * 90}ms` } : undefined;
                return (
                  <div
                    key={c}
                    className={`cell ${state}${submitted ? ' reveal' : ''}`}
                    style={delay}
                  >
                    {ch}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {!over && (
        <div className="detect compact">
          <div className="detect-line">
            <span className="label">Estás a fazer</span>
            <span className={`big-letter detected${progress >= 1 ? ' ok' : ''}`}>
              {candidate || '—'}
            </span>
            {candidate && (
              <span className="conf">{Math.round((recognised?.confidence || 0) * 100)}%</span>
            )}
          </div>
          <div className="detect-bar">
            <div className="detect-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
        </div>
      )}

      <div className="actions">
        {over ? (
          <button className="primary" onClick={onNewGame}>Nova palavra</button>
        ) : (
          <>
            <button className="ghost" onClick={onBackspace} disabled={!current.length}>⌫ Apagar</button>
            <button className="primary" onClick={onSubmit} disabled={current.length !== WORD_LEN}>
              Confirmar
            </button>
          </>
        )}
        <button className="ghost" onClick={onGuide}>Ver alfabeto</button>
      </div>
    </section>
  );
}
