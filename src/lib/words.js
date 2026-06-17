// Palavras pt-PT de 4 letras para o jogo. Usam apenas letras do alfabeto
// suportado (sinais estáticos): A B C D E F G H I L M N O P R S T U V W Y.
// Cada entrada é um par [palavra, pista].

export const WORDS = [
  // — só com as 12 letras de base —
  ['BOLA', 'Brincamos com ela no recreio'],
  ['VILA', 'Mais pequena que uma cidade'],
  ['LUVA', 'Cobre as mãos no inverno'],
  ['VIDA', 'O contrário de morte'],
  ['CABO', 'Pode ser de telefone'],
  ['COVA', 'Buraco no chão'],
  ['FADO', 'Música tradicional portuguesa'],
  ['FILA', 'Espera-se aqui no supermercado'],
  ['BOCA', 'Por onde falamos e comemos'],
  ['VACA', 'Animal que dá leite'],
  ['FOCA', 'Mamífero aquático'],
  ['BICO', 'Tem o pássaro na cara'],
  ['LOBO', 'Animal selvagem do conto'],
  ['COCO', 'Fruto tropical com água dentro'],
  ['FACA', 'Corta a comida'],
  ['DADO', 'Pequeno cubo de jogar'],
  ['DOCA', 'Onde os barcos atracam'],
  ['DIVA', 'Cantora de grande fama'],
  ['AULA', 'Acontece na escola'],
  ['CACO', 'Pedaço de loiça partida'],

  // — com as letras novas (E G H M N P R S T) —
  ['MESA', 'Comemos em cima dela'],
  ['GATO', 'Faz miau'],
  ['RATO', 'Move o cursor no computador'],
  ['PATO', 'Faz quá-quá'],
  ['SAPO', 'Salta e vive no charco'],
  ['NOTA', 'Avaliação de um teste'],
  ['MARE', 'Sobe e desce no mar'],
  ['GELO', 'Água congelada'],
  ['TEIA', 'A aranha faz'],
  ['PENA', 'Cobre as aves'],
  ['SETA', 'Indica a direção'],
  ['META', 'Onde acaba a corrida'],
  ['REMO', 'Move o barco à mão'],
  ['MAPA', 'Mostra o caminho'],
  ['RAMO', 'Parte da árvore'],
  ['TEMA', 'Assunto de um trabalho'],
  ['ROSA', 'Flor com espinhos'],
  ['MOTA', 'Veículo de duas rodas'],
  ['SEDA', 'Tecido macio e brilhante'],
  ['PERA', 'Fruta com forma de sino'],
  ['VELA', 'Acende-se no bolo de anos'],
  ['SINO', 'Toca na igreja'],
  ['NABO', 'Legume branco da sopa'],
  ['MODA', 'Tendência de roupa'],
  ['REDE', 'Apanha peixe ou liga à internet'],
  ['TOPO', 'A parte mais alta'],
];

// Escolhe uma palavra ao acaso. Se `availableLetters` for dado (conjunto de
// letras que o jogo já reconhece), só escolhe palavras que se conseguem
// soletrar com essas letras — assim nunca sai uma palavra impossível de fazer.
export function pickRandomWord(history = [], availableLetters = null) {
  const recent = new Set(history.slice(-6));
  const av = availableLetters
    ? (availableLetters instanceof Set ? availableLetters : new Set(availableLetters))
    : null;
  const spellable = (w) => !av || [...w].every((ch) => av.has(ch));

  let pool = WORDS.filter(([w]) => spellable(w) && !recent.has(w));
  if (!pool.length) pool = WORDS.filter(([w]) => spellable(w));
  if (!pool.length) pool = WORDS;
  return pool[Math.floor(Math.random() * pool.length)];
}
