import { RoadSegment } from './RoadSegment';
import { TrackData } from '../tracks/trackTypes';
import { RoadProjector } from './RoadProjector';

export class TrackManager {
    segments: RoadSegment[] = [];
    trackLength = 0;
    position = 0;
    segmentLength = 150; // Padrão clássico do OutRun

    constructor(trackData: TrackData) {
        this.buildTrack(trackData);
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
                // Vamos marcar os primeiros 15 segmentos (1500 unidades de Z se o length for 100)
                if (segmentIndex >= 0 && segmentIndex < 8) {
                    segment.isStartLine = true;
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

        for (let n = 0; n < drawDistance; n++) {
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
        roadWidth: number
    ) {
        let x = 0;
        let dx = 0;

        // Descobrimos em qual segmento a câmera está
        const startLine = Math.floor(this.position / this.segmentLength);

        for (let n = 0; n < segments.length; n++) {
            const segment = segments[n];

            // Se o índice visual (n) somado ao início ultrapassa o total de segmentos,
            // significa que esse segmento faz parte da 'próxima volta'.
            // Somamos trackLength para que o RoadProjector coloque ele lá na frente.
            const loopOffset = (startLine + n) >= this.segments.length ? this.trackLength : 0;

            RoadProjector.project(
                segment.p1,
                segment.p1.world.z + loopOffset, // Adicionamos o offset aqui
                cameraX - x,
                cameraY,
                this.position,
                cameraDepth,
                width,
                height,
                roadWidth
            );

            RoadProjector.project(
                segment.p2,
                segment.p2.world.z + loopOffset, // E aqui também
                cameraX - (x + dx),
                cameraY,
                this.position,
                cameraDepth,
                width,
                height,
                roadWidth
            );

            x += dx;
            dx += segment.curve;
        }
    }
}