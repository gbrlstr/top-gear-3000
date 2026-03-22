# 🏎️ Pseudo-3D Road Engine: Explained

Welcome to the internal documentation of the Top Gear 3000 inspired road engine. This system is divided into three main areas: **Road Engine**, **Track Data**, and the **Main Scene**.

---

## 🛣️ 1. The Road Engine (`src/game/road/`)

This folder contains the "Brain" and "Eyes" of the system.

### `RoadSegment.ts`
The smallest unit of the track. It stores:
- **World Coordinates**: Where the segment is in 3D space (`x`, `y`, `z`).
- **Screen Coordinates**: Where the segment should be drawn on your monitor.
- **Visual Data**: Colors for the road, grass, and rumble strips.

### `RoadProjector.ts`
The **Math Engine**. It uses perspective projection to convert 3D world coordinates into 2D screen coordinates.
- It calculates the `scale` based on the distance (`dz`).
- It applies the camera's position and FOV (`cameraDepth`) to determine exactly where on the screen a point should appear.

### `RoadRenderer.ts`
The **Painter**. It takes the projected points and draws them using Phaser's Graphics object.
- It draws polygons for the Grass, Rumble Strips, Road, and Lane Markers.
- **Important**: It draws from the horizon down to the bottom of the screen to ensure correct layering.

### `TrackManager.ts`
The **Orchestrator**. It manages:
- **Movement**: Updates the player's position along the track based on speed.
- **Looping**: Handles the wrap-around logic so the circuit never ends.
- **Projection Flow**: It iterates through the visible segments and tells the `RoadProjector` to update their screen coordinates every frame.

---

## 🏁 2. Track Data (`src/game/tracks/`)

This folder defines what the race track actually looks like (curves, hills, lengths).

### `trackTypes.ts`
Defines the "blueprints" (Interfaces) for track data. It ensures that every track has a name, a palette (colors), and a list of segments.

### `trackBuilder.ts`
A toolbox of helper functions. Instead of writing every segment by hand, you use `addStraight`, `addCurve`, or `addHill` to generate blocks of segments quickly.

### `track1.ts`
The actual data for the first track ("Nebula Road"). You can edit this file to change the track layout.

---

## 🎮 3. The Scene (`src/game/scenes/`)

### `RaceScene.ts`
The **Game Controller**. This is where everything comes together:
- **Input**: Listens to your keyboard (Up/Down/Left/Right).
- **Physics**: Calculates acceleration, breaking, and centrifugal force (which pulls you out of curves).
- **Camera**: Defines how high and how far the camera "sees".
- **Visuals**: Updates the Car sprite (including the steering animations) and the Starfield background.

---

## 🛠️ How to make adjustments

- **To change the track shape**: Edit `src/game/tracks/track1.ts`.
- **To change the camera view**: Edit the `Constants` in `RaceScene.ts` (`camHeight`, `camDepth`, `roadWidth`).
- **To change how fast the car is**: Edit `maxSpeed` and `accel` in `RaceScene.ts`.
- **To change visual colors**: Edit the `palette` in `src/game/tracks/track1.ts`.
