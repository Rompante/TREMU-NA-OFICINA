import React from 'react';
import SignVisual from './SignVisual.jsx';

// As descrições das letras novas são aproximadas — a imagem oficial ao lado é
// a referência certa.
const ENTRIES = [
  { letter: 'A', desc: 'Mão fechada em punho, com o polegar esticado para o lado (na horizontal).' },
  { letter: 'B', desc: 'Mão fechada em punho, com o polegar esticado para cima.' },
  { letter: 'C', desc: 'Mão curvada formando a forma da letra C, polegar e dedos arqueados.' },
  { letter: 'D', desc: 'Mão espalmada, com os quatro dedos esticados e juntos (na foto, na horizontal).' },
  { letter: 'E', desc: 'Dedos dobrados com as pontas junto ao polegar (mão meio fechada).' },
  { letter: 'F', desc: 'Polegar e indicador formam um círculo (OK); médio, anelar e mindinho esticados.' },
  { letter: 'G', desc: 'Indicador e polegar esticados, a apontar para o lado.' },
  { letter: 'H', desc: 'Indicador e médio esticados juntos.' },
  { letter: 'I', desc: 'Punho fechado com o mindinho esticado para cima.' },
  { letter: 'L', desc: 'Polegar e indicador formam um L; os outros dedos dobrados.' },
  { letter: 'M', desc: 'Três dedos dobrados por cima do polegar.' },
  { letter: 'N', desc: 'Dois dedos (indicador e médio) dobrados por cima do polegar.' },
  { letter: 'O', desc: 'Todos os dedos curvados a tocar no polegar, formando um O.' },
  { letter: 'P', desc: 'Indicador a apontar para baixo, polegar e médio afastados.' },
  { letter: 'R', desc: 'Indicador e médio esticados e cruzados.' },
  { letter: 'S', desc: 'Mão fechada em punho, polegar à frente dos dedos.' },
  { letter: 'T', desc: 'Polegar entre o indicador e o médio dobrados.' },
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
          Esta versão reconhece sinais estáticos a uma mão. As letras com
          movimento (J, K, Q, X, Z) ficam para uma próxima iteração.
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
