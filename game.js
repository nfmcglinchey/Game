// First: define all classes
class MainMenu extends Phaser.Scene {
  constructor() { super('MainMenu'); }
  create() {
    this.add.text(400, 300, 'Start Game', { fontSize: '32px', color: '#000' }).setOrigin(0.5);
    this.input.on('pointerdown', () => this.scene.start('LevelSelect'));
  }
}

class LevelSelect extends Phaser.Scene {
  constructor() { super('LevelSelect'); }
  create() {
    this.add.text(400, 200, 'Level 1: Forest', { fontSize: '24px', color: '#000' }).setOrigin(0.5);
    this.add.text(400, 300, 'Level 2: Dungeon', { fontSize: '24px', color: '#000' }).setOrigin(0.5);
    this.add.text(400, 400, 'Level 3: City', { fontSize: '24px', color: '#000' }).setOrigin(0.5);
    this.input.on('pointerdown', (pointer) => {
      if (pointer.y < 250) this.scene.start('ForestLevel');
      else if (pointer.y < 350) this.scene.start('DungeonLevel');
      else this.scene.start('CityLevel');
    });
  }
}

class ForestLevel extends Phaser.Scene {
  constructor() { super('ForestLevel'); }
  preload() {
    this.load.image('player', 'assets/player.png');
    this.load.image('enemy', 'assets/enemy.png');
    this.load.image('platform', 'assets/platform.png');
    this.load.image('door', 'assets/door.png');
  }
  create() {
    // ...
  }
  update() {
    // ...
  }
  // ...
}

class DungeonLevel extends Phaser.Scene {
  constructor() { super('DungeonLevel'); }
  preload() {
    this.load.image('player', 'assets/player.png');
    this.load.image('platform', 'assets/platform.png');
    this.load.image('key', 'assets/key.png');
    this.load.image('door', 'assets/door.png');
  }
  create() {
    // ...
  }
  update() {
    // ...
  }
  // ...
}

class CityLevel extends Phaser.Scene {
  constructor() { super('CityLevel'); }
  preload() {
    this.load.image('player', 'assets/player.png');
    this.load.image('platform', 'assets/platform.png');
    this.load.image('boss', 'assets/boss.png');
    this.load.image('bike', 'assets/bike.png');
  }
  create() {
    // ...
  }
  update() {
    // ...
  }
  // ...
}

class GameOver extends Phaser.Scene {
  constructor() { super('GameOver'); }
  create() {
    this.add.text(400, 300, 'Game Over', { fontSize: '32px', color: '#000' }).setOrigin(0.5);
    this.input.on('pointerdown', () => this.scene.start('MainMenu'));
  }
}

// Then define the config and create the game
let player, enemies, platforms, bike, cursors, camera, keysCollected = 0, hasKey = false, isOnBike = false;

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 },
      debug: false
    }
  },
  scene: [MainMenu, LevelSelect, ForestLevel, DungeonLevel, CityLevel, GameOver]
};

const game = new Phaser.Game(config);
