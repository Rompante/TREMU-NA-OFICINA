# TREMU NA OFICINA

Jogo de inclusão social em **React + JavaScript** no estilo "palavra do dia"
(Wordle), mas **gestual**: há uma palavra secreta de **4 letras** e o jogador
tem **6 tentativas** para a adivinhar, **soletrando** cada tentativa com a mão
através do alfabeto manual da **Língua Gestual Portuguesa (LGP)** à frente da
câmara. As células pintam-se a verde (letra certa no sítio certo), amarelo
(existe noutro sítio) ou cinzento (não existe). O reconhecimento corre
**inteiramente no navegador** — sem servidores nem APIs externas durante o jogo.

O reconhecimento usa **comparação com modelos** (calibração embutida em
[`src/lib/defaultTemplates.js`](src/lib/defaultTemplates.js)): a app já traz
gravada a forma dos 12 sinais e classifica a mão atual pelo modelo mais
parecido — muito mais robusto do que regras geométricas genéricas, e sem o
jogador ter de calibrar nada. A mão é normalizada (posição, tamanho e rotação),
por isso funciona para várias pessoas.

## Como funciona

1. O modelo de mãos da MediaPipe (`hand_landmarker.task`) corre via WebAssembly
   no browser e devolve 21 pontos de referência da mão por *frame*.
2. Um classificador geométrico próprio (`src/lib/lgpAlphabet.js`) avalia
   ângulos das articulações e distâncias relativas para identificar a letra.
3. A letra fica "registada" quando se mantém o gesto durante ~14 *frames* — só
   aí é escrita, para evitar falsos positivos. Baixando a mão liberta-se o
   bloqueio, para se poder escrever a mesma letra outra vez (ex.: "OO").

## Letras suportadas

Apenas sinais **estáticos** a uma mão: `A B C D F I L O U V W Y`.
Letras com movimento (J, Z) ficam fora desta versão.

As formas de cada sinal seguem o **alfabeto manual oficial da Língua Gestual
Portuguesa**, conforme o cartaz da **Associação Portuguesa de Surdos (APS)** —
e não o alfabeto internacional. Por exemplo, em LGP o **A** é o punho com o
polegar à frente dos dedos, o **B** é o punho com o polegar para cima, e o
**D** é a mão espalmada. O guia "Ver alfabeto" mostra cada sinal; podem
colocar-se fotografias reais em [`public/signs/`](public/signs/) (uma por
letra, ex.: `A.png`), que substituem automaticamente as ilustrações.

## Banco de palavras

Está em [`src/lib/words.js`](src/lib/words.js). São ~25 palavras pt-PT de
quatro letras, todas formadas apenas pelas letras suportadas acima.

## Como correr

```bash
npm install
npm run dev
```

Os scripts `predev` / `prebuild` descarregam automaticamente:

- o modelo MediaPipe `hand_landmarker.task` para `public/models/` (≈7 MB,
  descarregado uma única vez);
- a *runtime* WASM da `@mediapipe/tasks-vision` para `public/wasm/`.

Depois do primeiro arranque, **a aplicação funciona offline**.

Abrir [http://127.0.0.1:5173](http://127.0.0.1:5173) e autorizar o acesso à
câmara.

## Build de produção

```bash
npm run build
npm run preview
```

A pasta `dist/` resultante pode ser servida por qualquer *static host*.

## Estrutura

```
src/
  App.jsx                 estado global do jogo
  main.jsx                bootstrap React
  styles.css              tema escuro acessível
  components/
    CameraView.jsx        câmara + canvas + loop de inferência
    GamePanel.jsx         palavra-alvo, pontuação, progresso, sinal-alvo
    AlphabetGuide.jsx     modal com o alfabeto (imagem + descrição)
    SignVisual.jsx        foto do sinal (public/signs) com recuo p/ ilustração
    SignIllustration.jsx  esquema SVG da mão por letra (gerado no código)
  lib/
    handTracker.js        carrega o HandLandmarker e gere a câmara
    lgpAlphabet.js        classificador geométrico + filtro de estabilidade
    words.js              banco de palavras + amostragem
public/
  signs/                  fotos reais dos sinais (opcional: A.png, B.png, …)
scripts/
  download-model.js       descarrega modelo + copia WASM para /public
```

## Notas

- O reconhecimento é heurístico (sem treino de ML adicional). Funciona para
  utilizadores principiantes que façam os sinais de forma clara, com luz
  razoável e fundo neutro.
- O sistema é deliberadamente *stand-alone*: nenhum estado do utilizador é
  enviado para fora do dispositivo.
