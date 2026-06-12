import React from 'react';

// Esquema da mão para cada letra suportada. NÃO é uma fotografia nem pretende
// substituir uma referência oficial — é um apoio visual gerado a partir das
// descrições do próprio jogo (que dedos estão esticados/dobrados e a posição
// do polegar). Serve de ponte até existirem fotos reais em public/signs/.

const BASE_X = { index: 41, middle: 52, ring: 63, pinky: 72 };
const TOP = { index: 16, middle: 10, ring: 18, pinky: 28 };
const WIDTH = { index: 11, middle: 11, ring: 11, pinky: 9 };
const BASE_Y = 66;

function Palm() {
  return <rect x="33" y="58" width="46" height="48" rx="16" />;
}

function Finger({ name, extended, x, rotate = 0 }) {
  const w = WIDTH[name];
  const cx = x ?? BASE_X[name];
  if (extended) {
    const top = TOP[name];
    return (
      <rect
        x={cx - w / 2}
        y={top}
        width={w}
        height={BASE_Y - top + 8}
        rx={w / 2}
        transform={rotate ? `rotate(${rotate} ${cx} ${BASE_Y})` : undefined}
      />
    );
  }
  // Dedo dobrado: pequeno "nó" no topo da palma (dá o aspeto de punho).
  return <rect x={cx - w / 2} y="55" width={w} height="16" rx={w / 2} />;
}

function Thumb({ variant }) {
  switch (variant) {
    case 'across': // dobrado por cima da palma (B, W)
      return <rect x="30" y="49" width="30" height="12" rx="6" transform="rotate(-10 45 55)" />;
    case 'out': // esticado na horizontal para o lado (L, Y)
      return <rect x="5" y="82" width="32" height="13" rx="6.5" />;
    case 'up': // esticado para cima ao lado do punho (B)
      return <rect x="26" y="22" width="12" height="38" rx="6" />;
    case 'front': // atravessado à frente dos dedos dobrados (A)
      return <rect x="33" y="62" width="32" height="11" rx="5.5" transform="rotate(-6 49 67)" />;
    case 'side': // ligeiramente aberto ao lado (D)
      return <rect x="20" y="64" width="13" height="30" rx="6.5" transform="rotate(26 26 79)" />;
    case 'tuck': // encostado aos dedos (punho: A, I, U, V)
    default:
      return <rect x="23" y="60" width="12" height="26" rx="6" transform="rotate(18 29 73)" />;
  }
}

// Configuração por letra. `ext`: dedos esticados. `x`/`rot`: ajustes finos.
const SIGNS = {
  A: { ext: [], thumb: 'front' },
  B: { ext: [], thumb: 'up' },
  D: { ext: ['index', 'middle', 'ring', 'pinky'], thumb: 'tuck' },
  I: { ext: ['pinky'], thumb: 'tuck' },
  L: { ext: ['index'], thumb: 'out' },
  U: { ext: ['index', 'middle'], thumb: 'tuck', x: { index: 46, middle: 58 } },
  V: { ext: ['index', 'middle'], thumb: 'tuck', x: { index: 43, middle: 61 }, rot: { index: -15, middle: 15 } },
  W: { ext: ['index', 'middle', 'ring'], thumb: 'across', rot: { index: -14, ring: 14 } },
  Y: { ext: ['pinky'], thumb: 'out' },
};

export default function SignIllustration({ letter }) {
  const cfg = SIGNS[letter];

  return (
    <svg className="sign-svg" viewBox="0 0 100 120" role="img"
         aria-label={`Esquema do sinal da letra ${letter}`}>
      <g fill="currentColor">
        {letter === 'O' && (
          <>
            <rect x="35" y="66" width="42" height="40" rx="16" />
            <circle cx="50" cy="44" r="20" fill="none" stroke="currentColor" strokeWidth="12" />
          </>
        )}
        {letter === 'C' && (
          <path d="M72 32 A26 26 0 1 0 72 96" fill="none" stroke="currentColor"
                strokeWidth="13" strokeLinecap="round" />
        )}
        {letter === 'F' && (
          <>
            <Palm />
            <Finger name="middle" extended />
            <Finger name="ring" extended />
            <Finger name="pinky" extended />
            <circle cx="35" cy="42" r="11" fill="none" stroke="currentColor" strokeWidth="7" />
          </>
        )}
        {cfg && (
          <>
            <Palm />
            <Thumb variant={cfg.thumb} />
            {['index', 'middle', 'ring', 'pinky'].map((name) => (
              <Finger
                key={name}
                name={name}
                extended={cfg.ext.includes(name)}
                x={cfg.x?.[name]}
                rotate={cfg.rot?.[name] || 0}
              />
            ))}
          </>
        )}
      </g>
    </svg>
  );
}
