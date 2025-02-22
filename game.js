// Improved game.js

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

// Shared helper for player movement
function moveEntity(entity, cursors, jumpVelocity = -330, speed = 160) {
  if (cursors.left.isDown) {
    entity.setVelocityX(-speed);
  } else if (cursors.right.isDown) {
    entity.setVelocityX(speed);
  } else {
    entity.setVelocityX(0);
  }
  // Use blocked.down to check if the entity is on the ground
  if (cursors.up.isDown && entity.body.blocked.down) {
    entity.setVelocityY(jumpVelocity);
  }
}

// Boot Scene: Preload assets
class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }
  preload() {
    const assets = [
      { key: 'player', path: 'assets/player.png' },
      { key: 'enemy', path: 'assets/enemy.png' },
      { key: 'platform', path: 'assets/platform.png' },
      { key: 'door', path: 'assets/door.png' },
      { key: 'key', path: 'assets/key.png' },
      { key: 'boss', path: 'assets/boss.png' },
      { key: 'bike', path: 'assets/bike.png' }
    ];
    assets.forEach(asset => {
      this.load.image(asset.key, asset.path);
    });
  }
  create() {
    this.scene.start('MainMenu');
  }
}

// Main Menu Scene
class MainMenu extends Phaser.Scene {
  constructor() {
    super('MainMenu');
  }
  create() {
    this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH * 2, GAME_HEIGHT, 0x000000);
    this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2, 'Start Game', { fontSize: '32px', color: '#fff' }).setOrigin(0.5);
    this.input.on('pointerdown', () => this.scene.start('LevelSelect'));
  }
}

// Level Select Scene
class LevelSelect extends Phaser.Scene {
  constructor() {
    super('LevelSelect');
  }
  create() {
    this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH * 2, GAME_HEIGHT, 0x999999);
    this.add.text(GAME_WIDTH/2, 150, 'Level 1: Forest', { fontSize: '24px', color: '#000' }).setOrigin(0.5);
    this.add.text(GAME_WIDTH/2, 250, 'Level 2: Dungeon', { fontSize: '24px', color: '#000' }).setOrigin(0.5);
    this.add.text(GAME_WIDTH/2, 350, 'Level 3: City', { fontSize: '24px', color: '#000' }).setOrigin(0.5);
    this.input.on('pointerdown', (pointer) => {
      if (pointer.y < 200) this.scene.start('ForestLevel');
      else if (pointer.y < 300) this.scene.start('DungeonLevel');
      else this.scene.start('CityLevel');
    });
  }
}

// Forest Level Scene
class ForestLevel extends Phaser.Scene {
  constructor() {
    super('ForestLevel');
  }
  create() {
    // Reset scene-specific variables
    this.gameOverTriggered = false;
    this.nextLevelTriggered = false;

    // Background
    this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH * 2, GAME_HEIGHT, 0x228B22);

    // Platforms
    this.platforms = this.physics.add.staticGroup();
    this.platforms.create(GAME_WIDTH/2, 568, 'platform').setScale(2).refreshBody();
    this.platforms.create(600, 400, 'platform');
    this.platforms.create(50, 250, 'platform');

    // Player
    this.player = this.physics.add.sprite(100, 450, 'player');
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.platforms);

    // Enemies
    this.enemies = this.physics.add.group();
    let enemy = this.enemies.create(200, 500, 'enemy');
    enemy.setVelocityX(100);
    enemy.setBounce(1);
    enemy.setCollideWorldBounds(true);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, null, this);

    // Camera
    this.cameras.main.setBounds(0, 0, GAME_WIDTH * 2, GAME_HEIGHT);
    this.cameras.main.startFollow(this.player);

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();

    // Exit door
    let exit = this.physics.add.sprite(1500, 500, 'door');
    this.physics.add.overlap(this.player, exit, this.nextLevel, null, this);
  }
  update() {
    moveEntity(this.player, this.cursors);
  }
  hitEnemy(player, enemy) {
    // If player is falling (positive y velocity) and above the enemy, kill the enemy
    if (player.body.velocity.y > 0 && player.y < enemy.y) {
      enemy.disableBody(true, true);
      // Optionally, bounce the player upward slightly after killing the enemy
      player.setVelocityY(-200);
    } else if (!this.gameOverTriggered) {
      this.gameOverTriggered = true;
      this.scene.start('GameOver');
    }
  }
  nextLevel() {
    if (!this.nextLevelTriggered) {
      this.nextLevelTriggered = true;
      this.scene.start('DungeonLevel');
    }
  }
}

// Dungeon Level Scene
class DungeonLevel extends Phaser.Scene {
  constructor() {
    super('DungeonLevel');
  }
  create() {
    this.nextLevelTriggered = false;
    // Background
    this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH * 2, GAME_HEIGHT, 0x4B0082);

    // Platforms
    this.platforms = this.physics.add.staticGroup();
    this.platforms.create(GAME_WIDTH/2, 568, 'platform').setScale(2).refreshBody();
    this.platforms.create(200, 400, 'platform');
    this.platforms.create(600, 300, 'platform');

    // Player
    this.player = this.physics.add.sprite(100, 450, 'player');
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.platforms);

    // Key
    this.hasKey = false;
    let dungeonKey = this.physics.add.sprite(500, 250, 'key');
    this.physics.add.overlap(this.player, dungeonKey, () => {
      dungeonKey.disableBody(true, true);
      this.hasKey = true;
    }, null, this);

    // Door
    let door = this.physics.add.sprite(1500, 500, 'door');
    door.setImmovable(true);
    this.physics.add.collider(this.player, door, () => {
      if (this.hasKey && !this.nextLevelTriggered) {
        this.nextLevelTriggered = true;
        door.disableBody(true, true);
        this.scene.start('CityLevel');
      }
    }, null, this);

    // Camera and input
    this.cameras.main.setBounds(0, 0, GAME_WIDTH * 2, GAME_HEIGHT);
    this.cameras.main.startFollow(this.player);
    this.cursors = this.input.keyboard.createCursorKeys();
  }
  update() {
    moveEntity(this.player, this.cursors);
  }
}

// City Level Scene
class CityLevel extends Phaser.Scene {
  constructor() {
    super('CityLevel');
  }
  create() {
    // Background
    this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH * 2, GAME_HEIGHT, 0x808080);

    // Platforms
    this.platforms = this.physics.add.staticGroup();
    this.platforms.create(GAME_WIDTH/2, 568, 'platform').setScale(2).refreshBody();
    this.platforms.create(800, 400, 'platform');
    this.platforms.create(1200, 300, 'platform');

    // Player
    this.player = this.physics.add.sprite(100, 450, 'player');
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.platforms);

    // Boss
    let boss = this.physics.add.sprite(1400, 500, 'boss');
    boss.setImmovable(true);
    this.physics.add.overlap(this.player, boss, () => {
      if (!this.bossDefeated) {
        this.bossDefeated = true;
        boss.disableBody(true, true);
        this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2, 'You Win!', { fontSize: '48px', color: '#000' }).setOrigin(0.5);
        this.time.delayedCall(2000, () => this.scene.start('MainMenu'));
      }
    }, null, this);

    // Bike setup
    this.bike = this.physics.add.sprite(1000, 500, 'bike');
    this.bike.setVisible(false);
    this.physics.add.collider(this.bike, this.platforms);

    // Camera and input
    this.cameras.main.setBounds(0, 0, GAME_WIDTH * 2, GAME_HEIGHT);
    this.cameras.main.startFollow(this.player);
    this.cursors = this.input.keyboard.createCursorKeys();
    this.isOnBike = false;
  }
  update() {
    if (this.isOnBike) {
      if (this.cursors.left.isDown) {
        this.bike.setVelocityX(-300);
      } else if (this.cursors.right.isDown) {
        this.bike.setVelocityX(300);
      } else {
        this.bike.setVelocityX(0);
      }
      if (this.cursors.up.isDown && this.bike.body.blocked.down) {
        this.bike.setVelocityY(-400);
      }
      this.cameras.main.startFollow(this.bike);
    } else {
      moveEntity(this.player, this.cursors);
    }
    // When near the bike, disable the player's body to prevent glitching and mount the bike
    if (!this.isOnBike && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.bike.x, this.bike.y) < 50) {
      this.isOnBike = true;
      this.player.disableBody(true, true);
      this.bike.setVisible(true);
      this.bike.setPosition(this.player.x, this.player.y);
      this.cameras.main.startFollow(this.bike);
    }
  }
}

// Game Over Scene
class GameOver extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }
  create() {
    this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH * 2, GAME_HEIGHT, 0x000000);
    this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2, 'Game Over', { fontSize: '32px', color: '#fff' }).setOrigin(0.5);
    this.input.on('pointerdown', () => this.scene.start('MainMenu'));
  }
}

// Game config and initialization
const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 },
      debug: false
    }
  },
  scene: [Boot, MainMenu, LevelSelect, ForestLevel, DungeonLevel, CityLevel, GameOver]
};

const game = new Phaser.Game(config);
