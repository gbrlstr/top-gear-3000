import { RoadSegment } from './RoadSegment';
import { TrackData } from '../tracks/trackTypes';
import { RoadProjector } from './RoadProjector';

export class TrackManager {
    segments: RoadSegment[] = [];
    trackLength = 0;
    position = 0;
    segmentLength = 150; // Padrão clássico do OutRun
    public currentTrack: TrackData;
    private macroPoints: { x: number, z: number }[] = [];
    private startLineStartZ = 0;
    private startLineEndZ = 0;

    constructor(trackData: TrackData) {
        this.currentTrack = trackData;
        this.buildTrack(trackData);
        this.generateMacroGeometry(trackData);
    }

    private generateMacroGeometry(track: TrackData) {
        this.macroPoints = [];
        if (track.macroPath && track.macroPath.length > 1) {
            this.macroPoints = this.expandMacroPath(track.macroPath);
            return;
        }

        let curAngle = 0;
        let curX = 0;
        let curZ = 0;

        const totalCurvePower = track.segments.reduce((acc, s) => acc + Math.abs(s.curve), 0);
        if (totalCurvePower === 0) return; // Prevent division by zero

        const turnFactor = (Math.PI * 2) / totalCurvePower;

        track.segments.forEach(seg => {
            const iterations = Math.max(1, Math.floor(seg.length / 10));
            const stepLen = seg.length / iterations;
            const stepTurn = (seg.curve * turnFactor * stepLen) / seg.length;

            for (let i = 0; i < iterations; i++) {
                curAngle += stepTurn;
                // INVERSÃO: Para ficar em pé, X usa SENO e Z usa COSSENO
                // E multiplicamos Z por -1 para que o "norte" seja para cima na tela
                curX += Math.sin(curAngle) * stepLen;
                curZ -= Math.cos(curAngle) * stepLen;
                this.macroPoints.push({ x: curX, z: curZ });
            }
        });
    }

    private expandMacroPath(points: { x: number, z: number }[]) {
        const expanded: { x: number, z: number }[] = [];

        for (let i = 0; i < points.length; i++) {
            const current = points[i];
            const next = points[(i + 1) % points.length];
            const steps = Math.max(1, Math.ceil(Math.hypot(next.x - current.x, next.z - current.z) * 3));

            for (let step = 0; step < steps; step++) {
                const t = step / steps;
                expanded.push({
                    x: current.x + (next.x - current.x) * t,
                    z: current.z + (next.z - current.z) * t
                });
            }
        }

        return expanded;
    }

    public getMacroPoints(): { x: number, z: number }[] {
        return this.macroPoints;
    }

    public getStartLineRange() {
        return {
            startZ: this.startLineStartZ,
            endZ: this.startLineEndZ
        };
    }

    public getRechargeSegmentAt(z: number) {
        const segment = this.getSegment(z);
        return segment.isRechargeZone ? segment : null;
    }

    public getRepairSegmentAt(z: number) {
        const segment = this.getSegment(z);
        return segment.isRepairZone ? segment : null;
    }

    public isPlayerOnRechargeZone(z: number, x: number) {
        const segment = this.getRechargeSegmentAt(z);
        if (!segment) return null;

        const normalizedX = Phaser.Math.Clamp(x, -1, 1);
        const width = Phaser.Math.Clamp(segment.rechargeWidth, 0.1, 1);

        const isOnRechargeSide = segment.rechargeSide === 'left'
            ? normalizedX <= (-1 + width * 2)
            : normalizedX >= (1 - width * 2);

        if (!isOnRechargeSide) return null;

        return {
            refuelPerSecond: segment.rechargeRefuelPerSecond
        };
    }

    public isPlayerOnRepairZone(z: number, x: number) {
        const segment = this.getRepairSegmentAt(z);
        if (!segment) return null;

        const normalizedX = Phaser.Math.Clamp(x, -1, 1);
        const width = Phaser.Math.Clamp(segment.repairWidth, 0.1, 1);

        const isOnRepairSide = segment.repairSide === 'left'
            ? normalizedX <= (-1 + width * 2)
            : normalizedX >= (1 - width * 2);

        if (!isOnRepairSide) return null;

        return {
            healPerSecond: segment.repairHealPerSecond
        };
    }

    private buildTrack(data: TrackData) {
        let z = 0;
        let y = 0;
        for (let s = 0; s < data.segments.length; s++) {
            const segData = data.segments[s];
            for (let i = 0; i < segData.length; i++) {
                const segmentIndex = this.segments.length; // Pega o índice atual
                const isEven = Math.floor(this.segments.length / 3) % 2 === 0;
                const colors = isEven ? data.palette.light : data.palette.dark;

                const segment = new RoadSegment(
                    this.segments.length,
                    z,
                    z + this.segmentLength,
                    segData.curve,
                    colors
                );

                // Exemplo: Adiciona uma árvore a cada 15 segmentos alternando os lados
                if (this.segments.length % 15 === 0) {
                    const isLeft = (this.segments.length / 15) % 2 === 0;
                    segment.sprites.push({
                        source: 'tree',
                        offset: isLeft ? -1.8 : 1.8,
                        scale: 2.0,
                        frame: isLeft ? 0 : 1 // Altera a cor conforme o lado ou posição
                    });
                }

                // Exemplo: Adiciona uma placa de sinalização em curvas fechadas
                if (Math.abs(segData.curve) > 2) {
                    if (this.segments.length % 10 === 0) {
                        const isLeftTurn = segData.curve < 0;
                        segment.sprites.push({
                            source: 'sign_curve',
                            offset: isLeftTurn ? 1.5 : -1.5,
                            frame: isLeftTurn ? 1 : 0,
                            scale: 2.0
                        });
                    }
                }

                // MARCAÇÃO DA LINHA DE CHEGADA:
                // Movemos para o meio da primeira reta (índice 30-37) para garantir que esteja em reta
                if (segmentIndex >= 30 && segmentIndex < 33) {
                    segment.isStartLine = true;
                    if (this.startLineStartZ === 0) {
                        this.startLineStartZ = segment.p1.world.z;
                    }
                    this.startLineEndZ = segment.p2.world.z;
                }

                if (
                    data.rechargeZone &&
                    segmentIndex >= data.rechargeZone.startSegment &&
                    segmentIndex <= data.rechargeZone.endSegment
                ) {
                    segment.isRechargeZone = true;
                    segment.rechargeSide = data.rechargeZone.side;
                    segment.rechargeColor = data.rechargeZone.color ?? 0xff2020;
                    segment.rechargeWidth = data.rechargeZone.width ?? 0.5;
                    segment.rechargeRefuelPerSecond = data.rechargeZone.refuelPerSecond ?? 26;
                }

                if (
                    data.repairZone &&
                    segmentIndex >= data.repairZone.startSegment &&
                    segmentIndex <= data.repairZone.endSegment
                ) {
                    segment.isRepairZone = true;
                    segment.repairSide = data.repairZone.side;
                    segment.repairColor = data.repairZone.color ?? 0x2a8cff;
                    segment.repairWidth = data.repairZone.width ?? 0.5;
                    segment.repairHealPerSecond = data.repairZone.healPerSecond ?? 18;
                }

                segment.p1.world.y = y;
                y += segData.hill;
                segment.p2.world.y = y;

                this.segments.push(segment);
                z += this.segmentLength;
            }
        }
        this.trackLength = this.segments.length * this.segmentLength;
    }

    update(speed: number) {
        this.position += speed;
        // Lógica de loop infinito (Wrap around)
        while (this.position >= this.trackLength) this.position -= this.trackLength;
        while (this.position < 0) this.position += this.trackLength;
    }

    getSegmentsToRender(drawDistance: number): RoadSegment[] {
        const startLine = Math.floor(this.position / this.segmentLength);
        const result: RoadSegment[] = [];

        // LIMITA drawDistance ao número total de segmentos disponíveis para evitar jitter de projeção
        const actualDrawDistance = Math.min(drawDistance, this.segments.length);

        for (let n = 0; n < actualDrawDistance; n++) {
            const segment = this.segments[(startLine + n) % this.segments.length];
            result.push(segment);
        }
        return result;
    }

    projectSegments(
        segments: RoadSegment[],
        cameraX: number,
        cameraY: number,
        cameraDepth: number,
        width: number,
        height: number,
        roadWidth: number,
        horizonY: number
    ) {
        let x = 0;
        let dx = 0;

        // Índice do segmento onde o carro está
        const startLine = Math.floor(this.position / this.segmentLength);

        for (let n = 0; n < segments.length; n++) {
            const segment = segments[n];

            // LÓGICA DE LOOP: Se o índice visual (startLine + n) ultrapassa o total de segmentos,
            // somamos o tamanho total da pista para projetá-los no horizonte à frente.
            const loopOffset = (startLine + n) >= this.segments.length ? this.trackLength : 0;

            // Projeção do Ponto 1
            RoadProjector.project(
                segment.p1,
                segment.p1.world.z + loopOffset,
                cameraX - x,
                cameraY,
                this.position,
                cameraDepth,
                width,
                height,
                roadWidth,
                horizonY
            );

            // Projeção do Ponto 2
            RoadProjector.project(
                segment.p2,
                segment.p2.world.z + loopOffset,
                cameraX - (x + dx),
                cameraY,
                this.position,
                cameraDepth,
                width,
                height,
                roadWidth,
                horizonY
            );

            x += dx;
            dx += segment.curve;
        }
    }

    public getSegment(z: number): RoadSegment {
        const index = Math.floor(z / this.segmentLength) % this.segments.length;
        return this.segments[index < 0 ? 0 : index];
    }
}