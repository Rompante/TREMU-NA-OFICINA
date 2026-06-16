// Lógica do jogo estilo "palavra do dia": avalia uma tentativa contra a
// palavra secreta e devolve, por posição, 'correct' (letra certa no sítio
// certo), 'present' (existe mas noutro sítio) ou 'absent' (não existe).
// Trata letras repetidas como o Wordle (conta as ocorrências).
export function evaluateGuess(guess, secret) {
  const n = secret.length;
  const result = new Array(n).fill('absent');
  const counts = {};
  for (const ch of secret) counts[ch] = (counts[ch] || 0) + 1;

  // 1ª passagem — letras certas no sítio certo (verde)
  for (let i = 0; i < n; i++) {
    if (guess[i] === secret[i]) {
      result[i] = 'correct';
      counts[guess[i]]--;
    }
  }
  // 2ª passagem — letras que existem mas noutro sítio (amarelo)
  for (let i = 0; i < n; i++) {
    if (result[i] === 'correct') continue;
    const ch = guess[i];
    if (counts[ch] > 0) {
      result[i] = 'present';
      counts[ch]--;
    }
  }
  return result;
}
