import { GameObjects, Scene } from 'phaser';

import { EventBus } from '../EventBus';
import { Starfield } from '../Starfield';

type MenuState = 'MAIN' | 'CHAMPIONSHIP' | 'OPTIONS';

export class MainMenu extends Scene {
    starfield: Starfield;
    logo: GameObjects.Image;
    logoTween: Phaser.Tweens.Tween | null;
    menuOptions: GameObjects.Text[] = [];
    selectedOption: number = 0;
    selectionBox: GameObjects.Graphics;
    currentState: MenuState = 'MAIN';

    // Settings
    difficulty: string = 'HARD';
    musicOn: boolean = true;

    constructor() {
        super('MainMenu');
    }

    create() {
        this.loadSettings();
        
        this.cameras.main.setBackgroundColor(0x000000);
        this.starfield = new Starfield(this);

        this.logo = this.add.image(512, 220, 'logo').setDepth(100);
        this.logo.setScale(0.2);

        this.selectionBox = this.add.graphics().setDepth(99);

        // Keyboard input handling
        if (this.input.keyboard) {
            this.input.keyboard.on('keydown-UP', () => this.moveSelection(-1));
            this.input.keyboard.on('keydown-DOWN', () => this.moveSelection(1));
            this.input.keyboard.on('keydown-ENTER', () => this.confirmSelection());
            this.input.keyboard.on('keydown-SPACE', () => this.confirmSelection());
        }

        // Initialize with MAIN menu
        this.showMenu('MAIN');

        EventBus.emit('current-scene-ready', this);

        // Play the menu music
        if (this.musicOn) {
            this.sound.play('menu-title', { loop: true, volume: 0.2 });
        }
    }

    private loadSettings() {
        const savedDifficulty = localStorage.getItem('tg3k_difficulty');
        if (savedDifficulty) {
            this.difficulty = savedDifficulty;
        }

        const savedMusic = localStorage.getItem('tg3k_music');
        if (savedMusic !== null) {
            this.musicOn = savedMusic === 'true';
        }
    }

    private saveSettings() {
        localStorage.setItem('tg3k_difficulty', this.difficulty);
        localStorage.setItem('tg3k_music', this.musicOn.toString());
    }

    private showMenu(state: MenuState) {
        this.currentState = state;
        
        // Clear existing options
        this.menuOptions.forEach(opt => opt.destroy());
        this.menuOptions = [];
        
        let labels: string[] = [];
        let yStart = 440;
        let spacing = 80;
        let fontSize = '44px';

        if (state === 'MAIN') {
            labels = ['CHAMPIONSHIP', 'VS MODE'];
            yStart = 440;
            spacing = 100;
            fontSize = '44px';
        } else if (state === 'CHAMPIONSHIP') {
            labels = ['OPTIONS', '1 PLAYER FULL', '1 PLAYER SPLIT', '2 PLAYERS', 'PASSWORD', 'EXIT'];
            yStart = 340;
            spacing = 65;
            fontSize = '36px';
        } else if (state === 'OPTIONS') {
            labels = [
                `DIFFICULTY      ${this.difficulty}`,
                `MUSIC           ${this.musicOn ? 'ON' : 'OFF'}`,
                'EXIT'
            ];
            yStart = 420;
            spacing = 90;
            fontSize = '36px';
        }

        const fontConfig = {
            fontFamily: '"Press Start 2P"',
            fontSize: fontSize,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            align: 'center'
        };

        labels.forEach((label, index) => {
            const text = this.add.text(512, yStart + (index * spacing), label, fontConfig)
                .setOrigin(0.5)
                .setDepth(100)
                .setInteractive({ useHandCursor: true });
            
            text.on('pointerdown', () => {
                this.selectedOption = index;
                this.updateSelectionBox();
                this.confirmSelection();
            });

            this.applyGradient(text);
            this.menuOptions.push(text);
        });

        this.selectedOption = 0;
        this.updateSelectionBox();
    }

    private applyGradient(text: GameObjects.Text) {
        const grad = text.context.createLinearGradient(0, 0, 0, text.height);
        grad.addColorStop(0, '#a6e1ff'); // Light blue top
        grad.addColorStop(0.5, '#4dabff'); // Mid blue
        grad.addColorStop(1, '#003d99'); // Dark blue bottom
        text.setFill(grad);
        text.setStroke('#ffffff', 2);
    }

    private moveSelection(direction: number) {
        if (this.menuOptions.length === 0) return;
        
        this.selectedOption = Phaser.Math.Wrap(this.selectedOption + direction, 0, this.menuOptions.length);
        this.updateSelectionBox();
        this.sound.play('menu-highlight', { volume: 0.5 });
    }

    private updateSelectionBox() {
        this.selectionBox.clear();
        if (this.menuOptions.length === 0) return;

        this.selectionBox.lineStyle(4, 0xff0000);
        
        const target = this.menuOptions[this.selectedOption];
        const bounds = target.getBounds();
        
        this.selectionBox.strokeRect(
            bounds.x - 24, 
            bounds.y - 12, 
            bounds.width + 48, 
            bounds.height + 24
        );
    }

    private confirmSelection() {
        if (this.menuOptions.length === 0) return;
        
        const selectedLabel = this.menuOptions[this.selectedOption].text;

        if (this.currentState === 'MAIN') {
            if (selectedLabel === 'CHAMPIONSHIP') {
                this.showMenu('CHAMPIONSHIP');
                this.sound.play('menu-highlight', { volume: 0.8 });
            } else {
                this.finishMenu();
            }
        } else if (this.currentState === 'CHAMPIONSHIP') {
            if (selectedLabel === 'OPTIONS') {
                this.showMenu('OPTIONS');
                this.sound.play('menu-highlight', { volume: 0.8 });
            } else if (selectedLabel === 'EXIT') {
                this.showMenu('MAIN');
                this.sound.play('menu-highlight', { volume: 0.8 });
            } else if (selectedLabel === '1 PLAYER FULL') {
                this.scene.start('GameSettings');
                this.sound.play('menu-highlight', { volume: 0.8 });
            } else {
                this.finishMenu();
            }
        } else if (this.currentState === 'OPTIONS') {
            if (selectedLabel.includes('DIFFICULTY')) {
                this.cycleDifficulty();
            } else if (selectedLabel.includes('MUSIC')) {
                this.toggleMusic();
            } else if (selectedLabel === 'EXIT') {
                this.showMenu('CHAMPIONSHIP');
                this.sound.play('menu-highlight', { volume: 0.8 });
            }
        }
    }

    private cycleDifficulty() {
        const levels = ['EASY', 'NORMAL', 'HARD'];
        let idx = levels.indexOf(this.difficulty);
        this.difficulty = levels[(idx + 1) % levels.length];
        this.saveSettings();
        this.refreshCurrentMenu();
        this.sound.play('menu-highlight', { volume: 0.5 });
    }

    private toggleMusic() {
        this.musicOn = !this.musicOn;
        this.saveSettings();
        if (this.musicOn) {
            if (!this.sound.get('menu-title')?.isPlaying) {
                this.sound.play('menu-title', { loop: true, volume: 0.2 });
            }
        } else {
            this.sound.stopByKey('menu-title');
        }
        this.refreshCurrentMenu();
        this.sound.play('menu-highlight', { volume: 0.5 });
    }

    private refreshCurrentMenu() {
        const savedIdx = this.selectedOption;
        this.showMenu(this.currentState);
        this.selectedOption = savedIdx;
        this.updateSelectionBox();
    }

    update() {
    }

    changeScene() {
        this.confirmSelection();
    }

    private finishMenu() {
        // Stop all sounds when leaving the scene
        this.sound.stopAll();

        if (this.logoTween) {
            this.logoTween.stop();
            this.logoTween = null;
        }

        this.scene.start('Game');
    }

    moveLogo(vueCallback: ({ x, y }: { x: number, y: number }) => void) {
        if (this.logoTween) {
            if (this.logoTween.isPlaying()) {
                this.logoTween.pause();
            }
            else {
                this.logoTween.play();
            }
        }
        else {
            this.logoTween = this.tweens.add({
                targets: this.logo,
                x: { value: 750, duration: 3000, ease: 'Back.easeInOut' },
                y: { value: 80, duration: 1500, ease: 'Sine.easeOut' },
                yoyo: true,
                repeat: -1,
                onUpdate: () => {
                    if (vueCallback) {
                        vueCallback({
                            x: Math.floor(this.logo.x),
                            y: Math.floor(this.logo.y)
                        });
                    }
                }
            });
        }
    }
}
