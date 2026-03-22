# 🏎️ Motor de Estrada Pseudo-3D: Explicado

Bem-vindo à documentação interna do motor de estrada inspirado no Top Gear 3000. Este sistema está dividido em três áreas principais: **Motor de Estrada**, **Dados da Pista** e a **Cena Principal**.

---

## 🛣️ 1. O Motor de Estrada (`src/game/road/`)

Esta pasta contém o "Cérebro" e os "Olhos" do sistema.

### `RoadSegment.ts`
A menor unidade da pista. Ela armazena:
- **Coordenadas de Mundo**: Onde o segmento está no espaço 3D (`x`, `y`, `z`).
- **Coordenadas de Tela**: Onde o segmento deve ser desenhado no seu monitor.
- **Dados Visuais**: Cores para a estrada, grama e zebras (rumble strips).

### `RoadProjector.ts`
O **Motor Matemático**. Ele usa projeção de perspectiva para converter coordenadas de mundo 3D em coordenadas de tela 2D.
- Calcula a escala (`scale`) baseada na distância (`dz`).
- Aplica a posição da câmera e o campo de visão (`cameraDepth`) para determinar exatamente onde na tela um ponto deve aparecer.

### `RoadRenderer.ts`
O **Pintor**. Ele pega os pontos projetados e os desenha usando o objeto Graphics do Phaser.
- Desenha polígonos para a Grama, Zebras, Estrada e Marcadores de Faixa.
- **Importante**: Ele desenha do horizonte para baixo para garantir que as camadas fiquem corretas (o que está longe fica atrás do que está perto).

### `TrackManager.ts`
O **Orquestrador**. Ele gerencia:
- **Movimento**: Atualiza a posição do jogador ao longo da pista com base na velocidade.
- **Looping**: Cuida da lógica de "dar a volta" para que o circuito nunca termine.
- **Fluxo de Projeção**: Itera pelos segmentos visíveis e diz ao `RoadProjector` para atualizar suas coordenadas de tela a cada quadro.

---

## 🏁 2. Dados da Pista (`src/game/tracks/`)

Esta pasta define como a pista de corrida realmente se parece (curvas, subidas, comprimentos).

### `trackTypes.ts`
Define os "modelos" (Interfaces) para os dados da pista. Garante que cada pista tenha um nome, uma paleta de cores e uma lista de segmentos.

### `trackBuilder.ts`
Uma caixa de ferramentas com funções auxiliares. Em vez de escrever cada segmento à mão, você usa `addStraight` (reta), `addCurve` (curva) ou `addHill` (subida) para gerar blocos de segmentos rapidamente.

### `track1.ts`
Os dados reais da primeira pista ("Nebula Road"). Você pode editar este arquivo para mudar o layout da pista.

---

## 🎮 3. A Cena (`src/game/scenes/`)

### `RaceScene.ts`
O **Controlador do Jogo**. É onde tudo se une:
- **Entrada**: Escuta seu teclado (Setas).
- **Física**: Calcula aceleração, frenagem e força centrífuga (que te empurra para fora nas curvas).
- **Câmera**: Define a altura e a profundidade que a câmera "enxerga".
- **Visuais**: Atualiza o sprite do Carro (incluindo as animações de curva) e o fundo de estrelas (Starfield).

---

## 🛠️ Como fazer ajustes

- **Mudar o formato da pista**: Edite `src/game/tracks/track1.ts`.
- **Mudar a visão da câmera**: Edite as constantes em `RaceScene.ts` (`camHeight`, `camDepth`, `roadWidth`).
- **Mudar a velocidade do carro**: Edite `maxSpeed` e `accel` em `RaceScene.ts`.
- **Mudar as cores visuais**: Edite a paleta (`palette`) em `src/game/tracks/track1.ts`.
