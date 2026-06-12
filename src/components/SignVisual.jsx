import React, { useState } from 'react';
import SignIllustration from './SignIllustration.jsx';

// Mostra o sinal de uma letra: usa a foto oficial (public/signs/<LETRA>.png)
// quando existe; caso contrário recua para o esquema desenhado. Nunca fica
// vazio. O `variant` controla o tamanho conforme o contexto (guia / jogo).
export default function SignVisual({ letter, variant = '' }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={`sign-visual ${variant}`}>
      {failed ? (
        <SignIllustration letter={letter} />
      ) : (
        <img
          src={`/signs/${letter}.png`}
          alt={`Sinal da letra ${letter} em Língua Gestual Portuguesa`}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}
