export class RoadProjector {
    static project(
        point: any,
        worldZ: number,
        cameraX: number,
        cameraY: number,
        cameraZ: number,
        cameraDepth: number,
        width: number,
        height: number,
        roadWidth: number
    ) {
        const dz = worldZ - cameraZ;

        if (dz <= 0.1) {
            point.screen.scale = 0;
            point.screen.x = 0;
            point.screen.y = 0;
            point.screen.w = 0;
            return;
        }

        const scale = cameraDepth / dz;

        point.screen.scale = scale;
        point.screen.x = Math.round((width / 2) + scale * (point.world.x - cameraX) * width / 2);
        point.screen.y = Math.round((height / 2) - scale * (point.world.y - cameraY) * height / 2);
        point.screen.w = Math.round(scale * roadWidth * width / 2);
    }
}
