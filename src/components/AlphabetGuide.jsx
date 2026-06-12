import React from 'react';
import SignVisual from './SignVisual.jsx';

const ENTRIES = [
  { letter: 'A', desc: 'Mão fechada em punho, com o polegar atravessado à frente dos dedos.' },
  { letter: 'B', desc: 'Mão fechada em punho, com o polegar esticado para cima.' },
  { letter: 'C', desc: 'Mão curvada formando a forma da letra C, polegar e dedos arqueados.' },
  { letter: 'D', desc: 'Indicador esticado para cima, polegar toca nos outros dedos dobrados.' },
  { letter: 'F', desc: 'Polegar e indicador formam um círculo (OK); médio, anelar e mindinho esticados.' },
  { letter: 'I', desc: 'Punho fechado com o mindinho esticado para cima.' },
  { letter: 'L', desc: 'Polegar e indicador formam um L; os outros dedos dobrados.' },
  { letter: 'O', desc: 'Todos os dedos curvados a tocar no polegar, formando um O.' },
  { letter: 'U', desc: 'Indicador e médio esticados juntos para cima.' },
  { letter: 'V', desc: 'Indicador e médio esticados afastados (sinal de paz).' },
  { letter: 'W', desc: 'Indicador, médio e anelar esticados para cima, polegar segura o mindinho.' },
  { letter: 'Y', desc: 'Polegar e mindinho esticados, os outros dedos dobrados.' },
];

export default function AlphabetGuide({ onClose }) {
  return (
    <div className="modal" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>Alfabeto LGP — letras suportadas</h2>
          <button className="close" onClick={onClose} aria-label="Fechar">×</button>
        </header>
        <p className="modal-intro">
          Esta versão reconhece sinais estáticos a uma mão. Letras como J e Z
          (que envolvem movimento) ficam para uma próxima iteração.
        </p>
        <ul className="alphabet-grid">
          {ENTRIES.map(({ letter, desc }) => (
            <li key={letter}>
              <SignVisual letter={letter} variant="guide" />
              <div className="alpha-info">
                <span className="alpha-letter">{letter}</span>
                <span className="alpha-desc">{desc}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
