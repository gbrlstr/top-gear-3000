# Top Gear 3000 - Checklist de Regras e Implementacao

Este documento consolida o que ja existe no projeto, o que precisa ser ajustado para ficar mais fiel ao jogo original e o que ainda falta implementar no modo Championship.

## Objetivo

Usar este arquivo como checklist vivo para acompanhar:

- o que ja foi implementado
- o que precisa ser corrigido
- o que ainda sera desenvolvido

## Base Atual do Projeto

### Ja implementado

- [x] Corrida com jogador e IA
- [x] Grid com 20 participantes
- [x] Tabela de liga com acumulacao de pontos por corrida
- [x] Tela de resultados com classificacao e total de pontos
- [x] Nome do jogador persistido em `localStorage`
- [x] Dificuldade salva em `localStorage`
- [x] Sistema de dano no carro
- [x] Sistema de combustivel com consumo durante a corrida
- [x] Zona de reparo implementada na pista
- [x] Sequencia de pistas com avancar para proxima corrida

### Parcial / implementado de forma incompleta

- [ ] Dificuldade afeta o menu, mas ainda nao altera a progressao real do campeonato
- [ ] Existe sistema de pontos, mas a tabela do Championship original ainda precisa ser validada
- [x] A interface usa o conceito de `RECHARGE`, e agora a logica foi separada de `REPAIR`
- [ ] Ha varias pistas geradas/registradas, mas o conjunto ainda nao representa o campeonato original completo

## Checklist de Ajustes Prioritarios

### 1. Regras de pista: Repair x Recharge

- [x] Separar corretamente faixa vermelha e faixa azul
- [x] Fazer a faixa vermelha recarregar combustivel
- [x] Fazer a faixa azul reparar a estrutura do carro
- [x] Ajustar HUD, efeitos sonoros e feedback visual para refletir essa separacao

### 2. Economia do Championship

- [x] Criar sistema de `credits`
- [x] Recompensar o jogador ao final de cada corrida
- [x] Exibir ganhos no resultado pos-corrida
- [x] Persistir saldo de credits entre corridas

### 3. Bonus e bonus secretos

- [ ] Implementar bonus coletaveis na pista
- [ ] Implementar bonus secretos no fim da corrida
- [ ] Bonus A: terminar a corrida com boost ativo
- [ ] Bonus B: manter como pendente de confirmacao
- [ ] Bonus C: nao colidir com outros carros
- [ ] Bonus D: nao colidir com obstaculos ou bordas relevantes
- [ ] Bonus E: nao sair para fora da pista
- [ ] Criar telemetria para rastrear colisao, off-road e uso de boost

### 4. Progressao de upgrades

- [ ] Implementar loja/garage entre corridas
- [ ] Adicionar upgrades de engine
- [ ] Adicionar upgrades de gearbox
- [ ] Adicionar upgrades de tires
- [ ] Adicionar upgrades de armor
- [ ] Adicionar upgrades de boost
- [ ] Adicionar suporte a weapons
- [ ] Persistir upgrades comprados

### 5. Dificuldade real de campeonato

- [ ] Fazer `EASY`, `NORMAL` e `HARD` alterarem o campeonato
- [ ] Variar quantidade de pistas por dificuldade
- [ ] Variar velocidade / agressividade da IA por dificuldade
- [ ] Variar liberacao de upgrades por dificuldade
- [ ] Definir regras de progressao por temporada/campeonato

### 6. Estrutura de campeonato

- [ ] Substituir progressao linear simples por campeonato estruturado
- [ ] Persistir pista atual, classificacao geral e estado do campeonato
- [ ] Criar fluxo claro entre corrida, resultados e tela de upgrades
- [ ] Permitir continuar campeonato salvo

### 7. Pistas e conteudo

- [ ] Expandir numero total de pistas para se aproximar das `47` do original
- [ ] Mapear quais pistas entram em cada dificuldade
- [ ] Adicionar variacoes de clima/visibilidade
- [ ] Adicionar corridas noturnas e com neblina mais marcantes
- [ ] Adicionar pistas com menos recarga para forcar estrategia

### 8. Parallax e backgrounds por mapa

- [x] Implementar sistema de parallax para os cenarios de fundo
- [x] Associar um background especifico para cada mapa/pista
- [x] Definir camadas de fundo com velocidades diferentes para reforcar profundidade
- [x] Integrar o parallax com curva, movimento lateral e velocidade do carro
- [ ] Ajustar transicao visual entre pistas com backgrounds diferentes
- [ ] Suportar variacoes de visibilidade conforme clima, noite e neblina
- [x] Garantir que cada mapa use o background correto durante a corrida
- [ ] Validar performance do parallax sem comprometer a fluidez da renderizacao

### 9. Recursos especiais do Top Gear 3000

- [ ] Implementar `Boost`
- [ ] Implementar `Jump`
- [ ] Implementar `Attractor`
- [ ] Implementar `Warp`
- [ ] Implementar `Infrared` em corridas noturnas
- [ ] Permitir alternancia entre recursos/weapons

### 10. Estruturas especiais de pista

- [ ] Implementar atalhos
- [ ] Implementar pistas bifurcadas
- [ ] Implementar warp pads
- [ ] Implementar bonus aleatorios na pista

### 11. IA do campeonato

- [ ] Fazer os rivais evoluirem ao longo do campeonato
- [ ] Ajustar velocidade da IA conforme progresso do jogo
- [ ] Revisar comportamento da IA em pistas especiais, atalhos e recursos

### 12. Persistencia

- [ ] Salvar estado completo do campeonato
- [ ] Salvar pontos, credits, upgrades e pista atual
- [ ] Criar estrutura de save clara para futuras expansoes
- [ ] Avaliar suporte a password system ou equivalente moderno

## Validacoes Importantes

- [ ] Confirmar a tabela exata de pontos do modo Championship original
- [ ] Confirmar detalhes do Bonus B secreto
- [ ] Confirmar a ordem e distribuicao oficial das pistas por dificuldade
- [ ] Confirmar regras exatas de liberacao de upgrades

## Ordem Recomendada de Implementacao

- [x] 1. Separar `Repair` e `Recharge`
- [x] 2. Implementar `credits` e tela de ganhos
- [ ] 3. Implementar rastreamento e concessao de bonus secretos
- [ ] 4. Implementar upgrades persistentes
- [ ] 5. Fazer a dificuldade afetar o campeonato de verdade
- [x] 6. Implementar parallax e backgrounds por mapa
- [ ] 7. Estruturar progressao completa do Championship
- [ ] 8. Expandir pistas, atalhos, bonus de pista e weapons

## Observacoes

- A wiki usada como referencia descreve claramente a economia, os upgrades, os bonus secretos, os recursos especiais e a diferenca entre Repair e Recharge.
- A pagina consultada nao deixa explicita a tabela completa de pontos do Championship, entao esse item ainda precisa de validacao externa.
- Este arquivo pode ser atualizado conforme cada etapa for sendo concluida.
