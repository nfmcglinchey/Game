// We'll define our scene classes first, then create the Phaser config.

// Global variables (optional to keep them here)
let player, enemies, platforms, bike, cursors, camera;
let keysCollected = 0, hasKey = false, isOnBike = false;

// Main Menu Scene
class MainMenu extends Phaser.Scene {
  constructor() {
    super('MainMenu');
  }

  create() {
    // Black background
    this.add.rectangle(400, 300, 1600, 600, 0x000000);
    // White text to contrast the background
    this.add.text(400, 300, 'Start Game', { fontSize: '32px', color: '#fff' }).setOrigin(0.5);

    // Click or tap to start
    this.input.on('pointerdown', () => this.scene.start('LevelSelect'));
  }
}

// Level Select Scene
class LevelSelect extends Phaser.Scene {
  constructor() {
    super('LevelSelect');
  }

  create() {
    // Simple gray background
    this.add.rectangle(400, 300, 1600, 600, 0x999999);

    this.add.text(400, 200, 'Level 1: Forest', { fontSize: '24px', color: '#000' }).setOrigin(0.5);
    this.add.text(400, 300, 'Level 2: Dungeon', { fontSize: '24px', color: '#000' }).setOrigin(0.5);
    this.add.text(400, 400, 'Level 3: City', { fontSize: '24px', color: '#000' }).setOrigin(0.5);

    this.input.on('pointerdown', (pointer) => {
      if (pointer.y < 250) {
        this.scene.start('ForestLevel');
      } else if (pointer.y < 350) {
        this.scene.start('DungeonLevel');
      } else {
        this.scene.start('CityLevel');
      }
    });
  }
}

// Forest Level Scene
class ForestLevel extends Phaser.Scene {
  constructor() {
    super('ForestLevel');
  }

  preload() {
    this.load.image('player', 'assets/player.png');
    this.load.image('enemy', 'assets/enemy.png');
    this.load.image('platform', 'assets/platform.png');
    this.load.image('door', 'assets/door.png');
  }

  create() {
    // Background
    this.add.rectangle(400, 300, 1600, 600, 0x228B22); // Forest green

    // Platforms
    platforms = this.physics.add.staticGroup();
    platforms.create(400, 568, 'platform').setScale(2).refreshBody(); // Ground
    platforms.create(600, 400, 'platform');
    platforms.create(50, 250, 'platform');

    // Player
    player = this.physics.add.sprite(100, 450, 'player');
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);
    this.physics.add.collider(player, platforms);

    // Enemies
    enemies = this.physics.add.group();
    let enemy1 = enemies.create(200, 500, 'enemy');
    enemy1.setVelocityX(100);
    enemy1.setBounce(1);
    enemy1.setCollideWorldBounds(true);
    this.physics.add.collider(enemies, platforms);

    // Overlap with a callback that triggers game over
    this.physics.add.overlap(player, enemies, this.hitEnemy, null, this);

    // Camera
    camera = this.cameras.main;
    camera.setBounds(0, 0, 1600, 600);
    camera.startFollow(player);

    // Input
    cursors = this.input.keyboard.createCursorKeys();

    // Door for next level
    let exit = this.physics.add.sprite(1500, 500, 'door');
    this.physics.add.overlap(player, exit, this.nextLevel, null, this);

    // Flag to prevent repeated triggers
    this.gameOverTriggered = false;
    this.nextLevelTriggered = false;
  }

  update() {
    this.movePlayer();
  }

  movePlayer() {
    if (cursors.left.isDown) {
      player.setVelocityX(-160);
    } else if (cursors.right.isDown) {
      player.setVelocityX(160);
    } else {
      player.setVelocityX(0);
    }
    if (cursors.up.isDown && player.body.touching.down) {
      player.setVelocityY(-330);
    }
  }

  hitEnemy(player, enemy) {
    if (player.body.touching.down && enemy.body.touching.up) {
      // Jumped on enemy
      enemy.disableBody(true, true);
    } else {
      // Player got hit from side or top
      if (!this.gameOverTriggered) {
        this.gameOverTriggered = true;
        this.scene.start('GameOver');
      }
    }
  }

  nextLevel() {
    // Only move to the next level once
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

  preload() {
    this.load.image('player', 'assets/player.png');
    this.load.image('platform', 'assets/platform.png');
    this.load.image('key', 'assets/key.png');
    this.load.image('door', 'assets/door.png');
  }

  create() {
    // Background
    this.add.rectangle(400, 300, 1600, 600, 0x4B0082); // Dark purple

    // Platforms
    platforms = this.physics.add.staticGroup();
    platforms.create(400, 568, 'platform').setScale(2).refreshBody();
    platforms.create(200, 400, 'platform');
    platforms.create(600, 300, 'platform');

    // Player
    player = this.physics.add.sprite(100, 450, 'player');
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);
    this.physics.add.collider(player, platforms);

    // Key
    let dungeonKey = this.physics.add.sprite(500, 250, 'key');
    this.physics.add.overlap(player, dungeonKey, this.collectKey, null, this);

    // Locked door
    let door = this.physics.add.sprite(1500, 500, 'door');
    door.setImmovable(true);
    this.physics.add.collider(player, door, this.openDoor, null, this);

    // Camera
    camera = this.cameras.main;
    camera.setBounds(0, 0, 1600, 600);
    camera.startFollow(player);

    // Input
    cursors = this.input.keyboard.createCursorKeys();

    // Flags
    this.nextLevelTriggered = false;
  }

  update() {
    this.movePlayer();
  }

  movePlayer() {
    if (cursors.left.isDown) {
      player.setVelocityX(-160);
    } else if (cursors.right.isDown) {
      player.setVelocityX(160);
    } else {
      player.setVelocityX(0);
    }
    if (cursors.up.isDown && player.body.touching.down) {
      player.setVelocityY(-330);
    }
  }

  collectKey(player, dungeonKey) {
    dungeonKey.disableBody(true, true);
    hasKey = true;
  }

  openDoor(player, door) {
    // Only transition if we have the key and haven't already triggered
    if (hasKey && !this.nextLevelTriggered) {
      this.nextLevelTriggered = true;
      door.disableBody(true, true);
      this.scene.start('CityLevel');
    }
  }
}

// City Level Scene (with Boss and Racing Section)
class CityLevel extends Phaser.Scene {
  constructor() {
    super('CityLevel');
  }

  preload() {
    this.load.image('player', 'assets/player.png');
    this.load.image('platform', 'assets/platform.png');
    this.load.image('boss', 'assets/boss.png');
    this.load.image('bike', 'assets/bike.png');
  }

  create() {
    // Background
    this.add.rectangle(400, 300, 1600, 600, 0x808080); // Gray

    // Platforms
    platforms = this.physics.add.staticGroup();
    platforms.create(400, 568, 'platform').setScale(2).refreshBody();
    platforms.create(800, 400, 'platform');
    platforms.create(1200, 300, 'platform');

    // Player
    player = this.physics.add.sprite(100, 450, 'player');
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);
    this.physics.add.collider(player, platforms);

    // Boss
    let boss = this.physics.add.sprite(1400, 500, 'boss');
    boss.setImmovable(true);
    this.physics.add.overlap(player, boss, this.hitBoss, null, this);

    // Bike
    bike = this.physics.add.sprite(1000, 500, 'bike');
    bike.setVisible(false);
    this.physics.add.collider(bike, platforms);

    // Camera
    camera = this.cameras.main;
    camera.setBounds(0, 0, 1600, 600);
    camera.startFollow(player);

    // Input
    cursors = this.input.keyboard.createCursorKeys();

    // Flags
    this.bossDefeated = false;
  }

  update() {
    if (isOnBike) {
      // Bike controls
      if (cursors.left.isDown) {
        bike.setVelocityX(-300);
      } else if (cursors.right.isDown) {
        bike.setVelocityX(300);
      } else {
        bike.setVelocityX(0);
      }
      if (cursors.up.isDown && bike.body.touching.down) {
        bike.setVelocityY(-400);
      }
      camera.startFollow(bike);
    } else {
      // On foot
      this.movePlayer();
    }

    // Mount bike if close enough
    if (!isOnBike && Phaser.Math.Distance.Between(player.x, player.y, bike.x, bike.y) < 50) {
      isOnBike = true;
      player.setVisible(false);
      bike.setVisible(true);
      bike.setPosition(player.x, player.y);
    }
  }

  movePlayer() {
    if (cursors.left.isDown) {
      player.setVelocityX(-160);
    } else if (cursors.right.isDown) {
      player.setVelocityX(160);
    } else {
      player.setVelocityX(0);
    }
    if (cursors.up.isDown && player.body.touching.down) {
      player.setVelocityY(-330);
    }
  }

  hitBoss(player, boss) {
    // Only defeat the boss once
    if (!this.bossDefeated) {
      this.bossDefeated = true;
      boss.disableBody(true, true);
      this.add.text(400, 300, 'You Win!', { fontSize: '48px', color: '#000' }).setOrigin(0.5);
      this.time.delayedCall(2000, () => this.scene.start('MainMenu'));
    }
  }
}

// Game Over Scene
class GameOver extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }

  create() {
    this.add.rectangle(400, 300, 1600, 600, 0x000000);
    this.add.text(400, 300, 'Game Over', { fontSize: '32px', color: '#fff' }).setOrigin(0.5);

    // Click or tap to return to main menu
    this.input.on('pointerdown', () => this.scene.start('MainMenu'));
  }
}

// Now define the config and create the Phaser game
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
