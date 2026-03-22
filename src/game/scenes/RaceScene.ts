import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { Starfield } from '../Starfield';
import { TrackManager } from '../road/TrackManager';
import { RoadRenderer } from '../road/RoadRenderer';
import { track1 } from '../tracks/track1';

export class RaceScene extends Scene {
    private playerVehicle!: Phaser.GameObjects.Sprite;
    private speedText!: Phaser.GameObjects.Text;
    private trackManager!: TrackManager;
    private roadGraphics!: Phaser.GameObjects.Graphics;
    private starfield!: Starfield;

    // Player variables
    private playerX = 0;
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
        this.playerVehicle.setScale(4);
        this.playerVehicle.setDepth(1000);

        // Controles
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
        }

        // HUD de Velocidade
        this.speedText = this.add.text(this.scale.width - 200, this.scale.height - 50, '0 KPH', {
            fontFamily: '"Press Start 2P"',
            fontSize: '23px',
            color: '#ffff00'
        }).setDepth(2000);

        EventBus.emit('current-scene-ready', this);
    }

    update(_time: number, delta: number) {
        const dt = delta / 1000;

        this.handleInput(dt);

        // Atualiza a posição na pista
        this.trackManager.update(this.speed * dt);

        this.renderRoad();
        this.updatePlayerVisuals(_time);

        // EXIBIÇÃO EM KM/H (Realista)
        // Dividimos por 40 para que 12000 no código = 300 KM/H no ecrã
        const kmh = Math.floor(this.speed / 40);
        this.speedText.setText(`${kmh} KM/H`);

        if (this.starfield) {
            this.starfield.update();
        }
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
        const laneOffsetPixels = this.playerX * (currentSegment?.p1.screen.w || 200) * 0.9;

        this.playerVehicle.x = roadCenterX + laneOffsetPixels;
        this.playerVehicle.y = this.scale.height - 110;
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
        this.playerVehicle.y = (this.scale.height - 110) - (this.speed / this.maxSpeed) * 10;

        RoadRenderer.render(
            this.roadGraphics,
            this.spriteGroup, // ADICIONE ESTE PARÂMETRO
            this.scale.width,
            this.scale.height * 0.35,
            segmentsToRender
        );
    }
}