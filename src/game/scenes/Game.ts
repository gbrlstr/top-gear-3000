import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { Starfield } from '../Starfield';

export class Game extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    starfield: Starfield;
    gameText: Phaser.GameObjects.Text;

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x000000);

        this.starfield = new Starfield(this);

        this.gameText = this.add.text(512, 384, 'Make something fun!\nand share it with us:\nsupport@phaser.io', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);

        EventBus.emit('current-scene-ready', this);
    }

    update()
    {
    }

    changeScene ()
    {
        this.scene.start('GameOver');
    }
}
