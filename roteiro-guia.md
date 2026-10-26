# Guia de roteiro da Novelinha

Usado como instrução do gpt-4o-mini no fluxo do n8n. O exemplo de referência é `apagao-ep01.json`.

## As regras

1. **Uma corrente, não uma lista.** Cada frase é consequência da anterior. Ligue as frases com "Então", "Mas" e "Por isso". Se duas frases podem trocar de lugar sem mudar nada, a história está fraca.
2. **Narração em "você".** O público vive a história.
3. **Ação no primeiro segundo.** A primeira frase já tem hora, lugar e problema.
4. **Detalhe concreto vale mais que adjetivo.** Hora exata (3h47), quantidade (35 litros), porcentagem (38%), andar (nono). Nada de "muito", "terrível", "assustador".
5. **A tensão sobe a cada passo.** Cada solução cria um problema novo e maior (a água acaba, a chuva vira estoque, o grupo explode, a bateria cai).
6. **Frases curtas nos momentos de impacto.** "Não é sobre a chuva." "E o grito para." Uma frase sozinha numa tela preta.
7. **O final muda o sentido de algo que já apareceu.** No Apagão, a luz do celular, que era alívio, é o que atraiu a multidão.
8. **Termina numa escolha difícil e com voto por palavra.** Duas palavras curtas (ESCONDE × FOGE). As duas opções levam ao mesmo próximo grande acontecimento.
9. **Coerência total.** A hora no topo e a hora no celular batem. Nada acontece sem motivo dentro da história.

## Formato de saída

Um JSON com `titulo`, `narrador`, `placar` e `cenas`. Cada cena tem `tipo` (do kit, veja `GET /kit`), `texto` (a legenda), `fala` quando o número precisa ser falado por extenso ("três e quarenta e sete"), `destaques` em 1 a 3 palavras e `sons` quando há ação.
