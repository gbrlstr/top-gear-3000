import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { Starfield } from '../Starfield';
import { TrackManager } from '../road/TrackManager';
import { RoadRenderer } from '../road/RoadRenderer';
import { track1 } from '../tracks/track1';
import { EnemyVehicle } from '../elements/EnemyVehicle';
import { HUDManager } from '../ui/HUDManager';

export class RaceScene extends Scene {
    private playerVehicle!: Phaser.GameObjects.Sprite;
    private trackManager!: TrackManager;
    private roadGraphics!: Phaser.GameObjects.Graphics;
    private starfield!: Starfield;
    private hudManager!: HUDManager;

    // Player variables
    private playerX = 0.2; // Ajuste o X do player aqui (-1.0 a 1.0)
    private speed = 0;

    // Constants
    private maxSpeed = 12000; // Aumente o valor nominal para o cálculo de física
    private roadWidth = 2000;
    private drawDistance = 500; // Aumente para compensar os segmentos curtos
    private camHeight = 1000;   // Baixar a câmera aumenta a sensação de velocidade
    private camDepth = 0.8;     // Profundidade menor achata a pista e a faz passar mais rápido
    private spriteGroup!: Phaser.GameObjects.Group;
    private accel = 35;       // Aceleração inicial forte
    private breaking = -100;   // Travões potentes
    private decel = -15;      // Atrito natural

    private steeringValue = 0;

    private currentLap: number = 1;
    private totalLaps: number = 3;
    private lastPosition: number = 0;
    private enemies: EnemyVehicle[] = [];
    private isRacing: boolean = false;


    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

    constructor() {
        super('RaceScene');
    }

    create() {
        // Inicializa o gerenciador de pista
        const selectedTrack = track1;
        this.trackManager = new TrackManager(selectedTrack);

        // Fundo (Estrelas)
        this.starfield = new Starfield(this);

        // Camada de renderização da estrada
        this.roadGraphics = this.add.graphics().setName('roadGraphics').setDepth(10);

        // GRUPO PARA SPRITES LATERAIS (Árvores/Placas)
        // Usamos um grupo para gerenciar imagens individuais, permitindo escalas diferentes.
        this.spriteGroup = this.add.group().setDepth(20);

        // Veículo do jogador
        this.playerVehicle = this.add.sprite(this.scale.width / 2, this.scale.height - 100, 'vehicles', 'rear_r01_c00');
        this.playerVehicle.setDepth(1000);

        // Controles
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
        }

        // Inicializa o Gerenciador de HUD
        this.hudManager = new HUDManager(this);
        this.hudManager.create();

        this.createEnemies();

        EventBus.emit('current-scene-ready', this);
    }

    update(_time: number, delta: number) {
        const dt = delta / 1000;

        if (!this.isRacing) {
            const countdownFinished = this.hudManager.updateCountdown(dt);

            if (countdownFinished) {
                this.isRacing = true;
            }

            // Garante que os inimigos fiquem retos e parados durante o countdown
            this.enemies.forEach(enemy => {
                enemy.frame = '00';
                enemy.flipX = false;
                enemy.steering = 0;
                enemy.targetX = enemy.x; // Mantém na posição inicial
            });

            this.updatePlayerVisuals(_time);
            this.renderRoad();
            if (this.starfield) this.starfield.update();
            this.updateRankings();
            return;
        }

        this.handleInput(dt);

        const currentPos = this.trackManager.position;

        // DETEÇÃO DE VOLTA: 
        // Se a posição "pulou" do fim para o início
        if (currentPos < this.lastPosition && this.speed > 0) {
            this.onLapComplete();
        }

        // Atualiza a posição na pista
        this.trackManager.update(this.speed * dt);

        this.renderRoad();
        this.updatePlayerVisuals(_time);

        this.lastPosition = currentPos;

        this.hudManager.updateSpeed(this.speed);

        if (this.starfield) {
            this.starfield.update();
        }

        this.enemies.forEach(enemy => {
            if (enemy.finished) {
                enemy.speed = Math.max(0, enemy.speed - dt * 2000);
            } else {
                // Aceleração progressiva até a velocidade alvo
                if (enemy.speed < enemy.targetSpeed) {
                    enemy.speed += 2000 * dt;
                    if (enemy.speed > enemy.targetSpeed) enemy.speed = enemy.targetSpeed;
                }
            }

            enemy.z += enemy.speed * dt;

            // DETEÇÃO DE VOLTA PARA NPC
            if (enemy.z >= this.trackManager.trackLength) {
                enemy.z -= this.trackManager.trackLength;
                enemy.laps++;
                if (enemy.laps >= this.totalLaps) {
                    enemy.finished = true;
                }
            }
            enemy.lastZ = enemy.z;

            // --- INTELIGÊNCIA DE DESVIO/ULTRAPASSAGEM ---
            const carAhead = this.getCarAhead(enemy);
            if (carAhead && (carAhead.z - enemy.z) < 1500 && Math.abs(carAhead.x - enemy.x) < 0.4) {
                // Se alguém está na frente e na mesma zona lateral, muda de faixa
                enemy.targetX = carAhead.x > 0 ? -0.3 : 0.3;
            } else if (Math.abs(enemy.x - enemy.targetX) < 0.01) {
                // Se não há ninguém, garante que está numa das faixas padrão
                enemy.targetX = enemy.targetX > 0 ? 0.3 : -0.3;
            }

            // Movimentação suave lateral
            const steerSpeed = 0.5 * dt;
            if (Math.abs(enemy.x - enemy.targetX) > 0.01) {
                const dir = enemy.x < enemy.targetX ? 1 : -1;
                enemy.x += dir * steerSpeed;
                enemy.steering = dir;
            } else {
                enemy.x = enemy.targetX;
                enemy.steering = 0;
            }

            // Clamp para não sair da pista
            enemy.x = Phaser.Math.Clamp(enemy.x, -0.9, 0.9);

            // --- ATUALIZAÇÃO VISUAL (FIXA: SEM CURVA PARA NPCs) ---
            enemy.frame = '00';
            enemy.flipX = false;
        });

        this.updateRankings();
    }

    private updateRankings() {
        const trackLen = this.trackManager.trackLength;

        // Calcula a distância total percorrida por cada um
        const participants = [
            { name: 'PLAYER', dist: (this.currentLap - 1) * trackLen + this.trackManager.position, isPlayer: true },
            ...this.enemies.map(e => ({ name: `AI ${e.id + 1}`, dist: e.laps * trackLen + e.z, isPlayer: false }))
        ];

        // Ordena por distância (descendente)
        participants.sort((a, b) => b.dist - a.dist);

        this.hudManager.updateRankings(participants);
    }

    private handleInput(dt: number) {
        if (!this.cursors) return;

        const speedPercent = this.speed / this.maxSpeed;

        // ACELERAÇÃO PROGRESSIVA: 
        // O carro acelera rápido até aos 150 KM/H e depois demora mais a subir
        const powerMult = speedPercent < 0.5 ? 1.0 : 1.0 - (speedPercent - 0.5);
        const currentAccel = this.accel * powerMult * 60 * dt;

        const braking = this.breaking * 60 * dt;
        const decel = this.decel * 60 * dt;

        // 1. Controlos de Velocidade
        if (this.cursors.up.isDown) {
            this.speed += currentAccel;
        } else if (this.cursors.down.isDown) {
            this.speed += braking;
        } else {
            this.speed += decel; // Desaceleração por inércia
        }

        // Trava a velocidade entre 0 e o Máximo lógico
        this.speed = Phaser.Math.Clamp(this.speed, 0, this.maxSpeed);

        // 2. Direção Dinâmica
        if (this.speed > 0) {
            // O carro é mais sensível a baixa velocidade e "pesado" a alta velocidade
            const steerPower = (2.5 - (speedPercent * 1.5)) * dt;
            const steerVisualStep = 4 * dt;

            if (this.cursors.left.isDown) {
                this.playerX -= steerPower;
                this.steeringValue = Phaser.Math.Clamp(this.steeringValue - steerVisualStep, -1, 1);
            } else if (this.cursors.right.isDown) {
                this.playerX += steerPower;
                this.steeringValue = Phaser.Math.Clamp(this.steeringValue + steerVisualStep, -1, 1);
            } else {
                // Centralização automática do volante
                if (this.steeringValue > 0) this.steeringValue = Math.max(0, this.steeringValue - steerVisualStep);
                if (this.steeringValue < 0) this.steeringValue = Math.min(0, this.steeringValue + steerVisualStep);
            }
        }

        // 3. Força Centrífuga (Curvas)
        const currentSegment = this.trackManager.segments[
            Math.floor(this.trackManager.position / this.trackManager.segmentLength) % this.trackManager.segments.length
        ];

        if (currentSegment && this.speed > 500) {
            // A força aumenta com o quadrado da velocidade
            const centrifugal = currentSegment.curve * (speedPercent * speedPercent) * 0.6 * dt;
            this.playerX -= centrifugal;
        }

        // 4. Limites e Penalidade de Grama
        this.playerX = Phaser.Math.Clamp(this.playerX, -2, 2);

        if (Math.abs(this.playerX) > 1.0) { // Fora da estrada
            const offRoadLimit = this.maxSpeed * 0.3; // Velocidade máxima na grama é 90 KM/H
            if (this.speed > offRoadLimit) {
                this.speed += (this.breaking * 0.5) * 60 * dt; // Abranda rápido na grama
            }
        }
    }

    private updatePlayerVisuals(time: number) {
        const carColor = 'r01';
        let frameIdx = '00';

        const steer = this.steeringValue;
        const absSteering = Math.abs(steer);

        // Troca de frames conforme intensidade da curva do jogador
        if (absSteering > 0.66) frameIdx = '03';
        else if (absSteering > 0.33) frameIdx = '02';
        else if (absSteering > 0.08) frameIdx = '01';
        else if (this.speed > 0) {
            // Efeito de vibração em velocidade (alterna frames 00 e 01)
            frameIdx = (Math.floor(time / 100) % 2 === 0) ? '00' : '01';
        }

        this.playerVehicle.setFrame(`rear_${carColor}_c${frameIdx}`);
        this.playerVehicle.setFlipX(steer < 0);

        // Posiciona o carro em relação à projeção 2D da estrada
        const currentSegment = this.trackManager.segments[
            Math.floor(this.trackManager.position / this.trackManager.segmentLength) % this.trackManager.segments.length
        ];

        const roadCenterX = currentSegment?.p1.screen.x || this.scale.width / 2;
        const laneOffsetPixels = this.playerX * (currentSegment?.p1.screen.w || 200) * 1.0;

        this.playerVehicle.x = roadCenterX + laneOffsetPixels;

        // --- LÓGICA DE ESCALA DINÂMICA (IGUAL AOS INIMIGOS) ---
        // Calculamos o scale de projeção inverso para a posição Y do carro
        // scale = (y_screen - height/2) / (camHeight * height/2)
        const h2 = this.scale.height / 2;
        const camHeight = this.camHeight;
        const screenY = this.playerVehicle.y;
        const projectionScale = (screenY - h2) / (camHeight * h2);

        // Aplica o mesmo multiplicador de resolução dos inimigos (4000)
        this.playerVehicle.setScale(projectionScale * 4500);
    }

    private renderRoad() {
        const baseSegmentIndex = Math.floor(this.trackManager.position / this.trackManager.segmentLength) % this.trackManager.segments.length;
        const currentSegment = this.trackManager.segments[baseSegmentIndex];

        // Interpolação da altura para evitar "trancos" em subidas
        const percent = (this.trackManager.position % this.trackManager.segmentLength) / this.trackManager.segmentLength;
        const playerYWorld = Phaser.Math.Linear(currentSegment.p1.world.y, currentSegment.p2.world.y, percent);

        const segmentsToRender = this.trackManager.getSegmentsToRender(this.drawDistance);

        this.trackManager.projectSegments(
            segmentsToRender,
            this.playerX * this.roadWidth,
            this.camHeight + playerYWorld, // Soma a altura do mundo à altura da câmera
            this.camDepth,
            this.scale.width,
            this.scale.height,
            this.roadWidth
        );

        // Ajusta a posição Y visual do carro para que ele não fique "flutuando" ou "entrando" na pista
        // Em subidas, o carro deve subir levemente na tela
        this.playerVehicle.y = (this.scale.height - 120) - (this.speed / this.maxSpeed) * 10;

        RoadRenderer.render(
            this.roadGraphics,
            this.spriteGroup, // O grupo que você criou no create()
            this.scale.width,
            this.scale.height * 0.35,
            segmentsToRender,
            this.enemies // O array de 10 carros
        );
    }

    private onLapComplete() {
        this.currentLap++;

        if (this.currentLap > this.totalLaps) {
            this.speed = 0;
            this.hudManager.setFinish();
            // Aqui podes disparar uma cena de Game Over ou Vitória
            this.scene.start('GameOver', { score: this.speed });
        } else {
            this.hudManager.onLapComplete(this.currentLap, this.totalLaps);
        }
    }

    private createEnemies() {
        // CORES: Podes adicionar ou remover cores aqui (r00 a r19)
        const colors = ['r00', 'r03', 'r05', 'r07', 'r11', 'r14', 'r17', 'r19'];

        for (let i = 0; i < 9; i++) {
            // GRID DE LARGADA:
            // O Player está fixo na tela em Z=0.
            // Para que os inimigos não fiquem em cima do player, começamos em Z=400.

            const row = Math.floor(i / 2);

            // ESPAÇAMENTO Z: Aumenta o 400 para distanciar as filas longitudinalmente
            const z = 2550 - (row * 400);

            // POSIÇÃO X: -0.3 é esquerda, 0.3 é direita. 
            // AJUSTE AQUI para aproximar os carros do centro ou borda
            const x = (i % 2 === 0) ? 0.3 : -0.2;

            let finalX = x;
            let finalZ = z;

            // GRID DE LARGADA FINAL:
            // NPCs em 5 filas, com buffer Z=400 para o Player
            if (i === 8) {
                finalZ = 2750 - (row * 400);
                finalX = -0.15;
            }


            const color = colors[i % colors.length];
            this.enemies.push({
                id: i,
                z: finalZ,
                x: finalX,
                speed: 0,
                targetSpeed: Phaser.Math.Between(8000, 14000),
                color: color,
                frame: '00',
                targetX: finalX,
                steering: 0,
                flipX: false,
                laps: 0,
                lastZ: finalZ,
                finished: false,
                percent: 0
            });
        }
    }

    private getCarAhead(subject: EnemyVehicle) {
        let closest: any = null;
        let minDist = 2000;

        // Check other NPCs
        this.enemies.forEach(other => {
            if (other.id === subject.id) return;
            let dist = other.z - subject.z;
            // Trata o wrap-around da pista
            if (dist < 0) dist += this.trackManager.trackLength;

            if (dist > 0 && dist < minDist) {
                closest = other;
                minDist = dist;
            }
        });

        // Check if player is ahead (and within range)
        const playerZ = this.trackManager.position;
        let playerDist = playerZ - subject.z;
        if (playerDist < 0) playerDist += this.trackManager.trackLength;

        if (playerDist > 0 && playerDist < minDist) {
            // Player lateral range is -1 to 1, we use this.playerX from the class
            closest = { z: playerZ, x: this.playerX };
        }

        return closest;
    }
}