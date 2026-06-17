# TREMU NA OFICINA

Jogo de inclusão social em **React + JavaScript** no estilo "palavra do dia"
(Wordle), mas **gestual**: há uma palavra secreta de **4 letras** e o jogador
tem **6 tentativas** para a adivinhar, **soletrando** cada tentativa com a mão
através do alfabeto manual da **Língua Gestual Portuguesa (LGP)** à frente da
câmara. As células pintam-se a **verde** (letra certa no sítio certo),
**amarelo** (existe noutro sítio) ou **cinzento** (não existe). O reconhecimento
corre **inteiramente no navegador** — sem servidores nem APIs externas.

## Como funciona

1. O modelo de mãos da MediaPipe (`hand_landmarker.task`) corre via WebAssembly
   no browser e devolve **21 pontos de referência** da mão por *frame*.
2. O reconhecimento (`src/lib/lgpAlphabet.js`) usa **comparação com modelos**
   (calibração): compara a mão atual com exemplos gravados de cada letra e
   escolhe a **mais parecida**. A mão é **normalizada** (posição, tamanho e
   rotação) para não depender de onde está no ecrã.
3. Para pares muito parecidos (A/S, O/E, U/V, W/Y, W/U) há um **desempate**
   geométrico que decide pela característica que os distingue (posição do
   polegar, forma/abertura dos dedos, etc.).
4. A letra só é **registada** quando o sinal é mantido alguns *frames* — evita
   falsos positivos.

A calibração já vem **embutida** em
[`src/lib/defaultTemplates.js`](src/lib/defaultTemplates.js) (várias mãos por
letra), por isso o jogo reconhece **sem ninguém ter de calibrar**. No separador
**Calibração** é possível **adicionar mais mãos** (do próprio ou de colegas)
para o reconhecimento ficar ainda mais robusto — quantas mais mãos, melhor.

## Letras suportadas

**21 letras**, sinais **estáticos** a uma mão:
`A B C D E F G H I L M N O P R S T U V W Y`.

Ficam de fora `J K Q X Z` porque os seus sinais têm **movimento** (a câmara só
analisa poses paradas).

As formas de cada sinal seguem o **alfabeto manual oficial da LGP**, do cartaz
da **Associação Portuguesa de Surdos (APS)** — e não o alfabeto internacional.
As imagens estão em [`public/signs/`](public/signs/) (uma por letra) e podem ser
substituídas por outras com o mesmo nome (ex.: `A.png`).

## Banco de palavras

Está em [`src/lib/words.js`](src/lib/words.js): palavras pt-PT de quatro letras,
formadas apenas pelas letras suportadas. O jogo só escolhe palavras que se
**conseguem soletrar** com as letras atualmente reconhecidas.

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
  App.jsx                 maestro: estado do jogo + liga as peças
  main.jsx                bootstrap React
  styles.css              tema escuro acessível
  components/
    CameraView.jsx        câmara + canvas + loop de deteção da mão
    WordleGame.jsx        tabuleiro do jogo (tentativas, cores, vitória)
    Calibration.jsx       ecrã para adicionar mãos à calibração
    AlphabetGuide.jsx     modal com o alfabeto (imagem + descrição)
    SignVisual.jsx        imagem do sinal (public/signs) com recuo p/ esquema
    SignIllustration.jsx  esquema SVG da mão por letra (recurso)
  lib/
    handTracker.js        carrega o HandLandmarker e gere a câmara
    lgpAlphabet.js        reconhecimento (comparação + desempates) + estabilidade
    defaultTemplates.js   calibração embutida (várias mãos por letra)
    calibration.js        guarda/lê mãos adicionadas (localStorage)
    wordle.js             regra das cores verde/amarelo/cinzento
    words.js              banco de palavras + seleção filtrada
public/
  signs/                  imagens dos sinais (alfabeto oficial APS)
scripts/
  download-model.js       descarrega modelo + copia WASM para /public
docs/
  TREMU-NA-OFICINA-explicacao.docx   documento de apoio (explicação do jogo)
```

## Notas

- O reconhecimento compara com mãos reais (calibração) — quanto mais mãos por
  letra, mais robusto. Funciona melhor com **boa luz**, **fundo simples** e a
  **mão toda visível** na câmara.
- O reconhecimento por câmara nunca é 100%: pode falhar uma letra ocasional
  (mãos muito diferentes das calibradas ou má luz). Há o botão **Apagar** para
  corrigir.
- O sistema é deliberadamente *stand-alone*: **nenhuma imagem** sai do
  dispositivo.
