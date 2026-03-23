import { Scene } from 'phaser';
import { Starfield } from '../Starfield';

export class Preloader extends Scene {
    starfield: Starfield;

    constructor() {
        super('Preloader');
    }

    init() {
        this.cameras.main.setBackgroundColor(0x000000);
        //  Create the dynamic starfield
        this.starfield = new Starfield(this);

        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(512 - 230, 384, 4, 28, 0xffffff);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress: number) => {

            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + (460 * progress);

        });
    }

    preload() {
        //  Load the assets for the game - Replace with your own assets
        this.load.setPath('assets');

        //  Images
        this.load.image('logo', 'logo.png');
        this.load.image('star', 'star.png');
        this.load.image('menu-background', 'menu-background.png');
        this.load.image('menu-player-name', 'menu-player-name.png');
        this.load.spritesheet('tree', 'trees.png', { frameWidth: 741, frameHeight: 900 });
        this.load.spritesheet('sign_curve', 'sign_curve.png', { frameWidth: 201, frameHeight: 390 });

        //  Menu
        this.load.atlas('menu', 'menu/full_sheet_clean.png', 'menu/atlas_curated.json');

        //  Vehicles
        this.load.atlas('vehicles', 'vehicle/full_sheet_clean.png', 'vehicle/atlas_auto.json');

        //  HUD
        this.load.atlas('hud', 'hud/full_sheet_clean.png', 'hud/atlas_auto.json');

        //  Sounds
        this.load.audio('menu-title', 'sounds/menu/01Title.mp3');
        this.load.audio('menu-highlight', 'sounds/effects/Highlight.wav');
        this.load.audio('menu-select', 'sounds/effects/Select.wav');

        //  SFX
        this.load.audio('Bonus', 'sounds/effects/Bonus.wav');
        this.load.audio('Crash', 'sounds/effects/Crash.wav');
        this.load.audio('Engine', 'sounds/effects/Engine.wav');
        this.load.audio('Explosion', 'sounds/effects/Explosion.wav');
        this.load.audio('Nitro', 'sounds/effects/Nitro.wav');
        this.load.audio('Turbo', 'sounds/effects/Turbo.wav');
    }

    create() {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start('RaceScene', { trackId: 1 });
    }

    update() {
    }
}
