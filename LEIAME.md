# Novelinha · render

Recebe o JSON de um episódio e devolve o MP4 (1080x1920, 30 fps, com trilha e efeitos). Sem navegador e sem senha nenhuma.

## Subir no Easypanel

1. Crie um repositório no GitHub (pode ser privado) e envie todos os arquivos desta pasta.
2. No Easypanel: **Criar serviço → App**, fonte **GitHub**, escolha o repositório, build **Dockerfile**.
3. Em **Domínios**, aponte um domínio para a **porta 3000** (ex.: `render.nuncatedisseram.com`).
4. Deploy. Teste abrindo `https://SEU-DOMINIO/health`.

Recomendado: em **Montagens (Mounts)**, crie um volume em `/app/arquivos` para os vídeos sobreviverem a um reinício. Os vídeos se apagam sozinhos depois de 3 dias.

## Rotas

| Rota | O que faz |
|---|---|
| `POST /render?esperar=1` | Renderiza e só responde quando o MP4 estiver pronto: `{ id, url, duracao }` |
| `POST /render` | Coloca na fila e responde na hora com o `id` |
| `GET /status/ID` | Situação do render e `url` quando pronto |
| `GET /arquivos/ID.mp4` | O vídeo (link público, serve para postar no Instagram) |
| `GET /kit` | Lista os tipos de cena e de som que existem |

No n8n, use um nó HTTP Request com timeout de 10 minutos no modo `esperar=1`. Um episódio de 37 s leva cerca de 2 minutos.

## Formato do episódio

Veja `exemplo-ep01.json`. Cada cena tem:

- `tipo`: uma cena do kit (`garagem_porta_malas`, `garagem_personagem`, `garagem_fuga`, `dinheiro`, `celular_tocando`, `celular_chamada`, `fachada_policia`, `voto`)
- `texto`: a legenda, palavra por palavra; `destaques` pinta palavras de `amarelo`, `verde`, `vermelho` ou `azul`
- `dur`: segundos; `falante`: etiqueta acima da legenda quando é fala de personagem
- `dinheiro` / `estrelas`: placar a partir daquela cena (`dinheiro_em`, `estrelas_em` = em que segundo muda)
- `sons`: lista `{ "em": segundos, "fx": "ring" }`; o corte entre cenas já tem whoosh automático
- `voz_url` ou `voz_base64` (opcional): narração da cena em MP3; a cena estica pra caber a voz e a legenda acompanha
- `zoom` `[inicio, fim]` e `tremor` (0 a 1) para a câmera

Personagem: `"manobrista"`, `"cliente"`, `"casual"` ou um objeto `{ "base": "casual", "cor": "#2f6fd0", "pele": "#8d5a3b", "cabelo": "#1b130e", "oculos": true, "bone": false, "nome": "@fulano" }`. O `nome` aparece numa etiqueta acima da cabeça, para quem comentou virar personagem.
