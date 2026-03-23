export interface EnemyVehicle {
    id: number;
    z: number;          // Posição na pista (0 até trackLength)
    x: number;          // Posição lateral (-0.8 a 0.8)
    speed: number;      // Velocidade do NPC
    color: string;      // Cor do carro (ex: 'r01', 'r02')
    frame: string;      // Frame do carro (ex: '00', '01')
    targetX: number;    // X alvo para mudança de faixa
    steering: number;   // Valor atual de direção (-1 a 1) para visual
    flipX: boolean;     // Se o sprite deve ser invertido
    laps: number;       // Voltas completadas
    lastZ: number;      // Última posição Z (para detecção de volta)
    finished: boolean;  // Se já cruzou a linha de chegada final
    targetSpeed: number; // Velocidade final desejada
    accelRate: number;  // Aceleração base do NPC
    preferredLane: number; // Faixa preferida para estabilizar o pelotão
    launchDelay: number; // Atraso curto de largada para evitar empilhamento
    percent: number;    // Tempo acumulado de corrida do NPC
}