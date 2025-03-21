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
  if (cursors.up.isDown && entity.body.blocked.down) {
    entity.setVelocityY(jumpVelocity);
  }
}

// Helper to add mobile controls with dynamic positioning
function addMobileControls(scene) {
  scene.mobileControls = { left: false, right: false, jump: false };
  // Group to hold the buttons (for easy repositioning on resize)
  scene.mobileControlsGroup = scene.add.group();

  // Calculate button size and margin based on current canvas size
  let buttonSize = Math.min(scene.scale.width, scene.scale.height) * 0.15;
  let margin = buttonSize * 0.2;

  // Left button
  let leftButton = scene.add.rectangle(
    margin + buttonSize / 2,
    scene.scale.height - margin - buttonSize / 2,
    buttonSize,
    buttonSize,
    0x0000ff,
    0.5
  )
    .setScrollFactor(0)
    .setInteractive();
  leftButton.on('pointerdown', () => { scene.mobileControls.left = true; });
  leftButton.on('pointerup', () => { scene.mobileControls.left = false; });
  leftButton.on('pointerout', () => { scene.mobileControls.left = false; });
  scene.mobileControlsGroup.add(leftButton);

  // Right button
  let rightButton = scene.add.rectangle(
    margin * 2 + buttonSize * 1.5,
    scene.scale.height - margin - buttonSize / 2,
    buttonSize,
    buttonSize,
    0x00ff00,
    0.5
  )
    .setScrollFactor(0)
    .setInteractive();
  rightButton.on('pointerdown', () => { scene.mobileControls.right = true; });
  rightButton.on('pointerup', () => { scene.mobileControls.right = false; });
  rightButton.on('pointerout', () => { scene.mobileControls.right = false; });
  scene.mobileControlsGroup.add(rightButton);

  // Jump button
  let jumpButton = scene.add.rectangle(
    scene.scale.width - margin - buttonSize / 2,
    scene.scale.height - margin - buttonSize / 2,
    buttonSize,
    buttonSize,
    0xff0000,
    0.5
  )
    .setScrollFactor(0)
    .setInteractive();
  jumpButton.on('pointerdown', () => { scene.mobileControls.jump = true; });
  jumpButton.on('pointerup', () => { scene.mobileControls.jump = false; });
  jumpButton.on('pointerout', () => { scene.mobileControls.jump = false; });
  scene.mobileControlsGroup.add(jumpButton);
}

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
    assets.forEach(asset => this.load.image(asset.key, asset.path));
  }
  create() {
    this.scene.start('MainMenu');
  }
}

class MainMenu extends Phaser.Scene {
  constructor() {
    super('MainMenu');
  }
  create() {
    // Request fullscreen on first touch
    this.input.once('pointerdown', () => {
      if (!this.scale.isFullscreen) {
        this.scale.startFullscreen();
      }
    });

    this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x000000);
    let startText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'Start Game', { fontSize: '32px', color: '#fff' })
      .setOrigin(0.5);
    this.tweens.add({
      targets: startText,
      scale: { from: 1, to: 1.1 },
      yoyo: true,
      repeat: -1,
      duration: 800
    });
    this.input.on('pointerdown', () => this.scene.start('LevelSelect'));
  }
}

class LevelSelect extends Phaser.Scene {
  constructor() {
    super('LevelSelect');
  }
  create() {
    this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x999999);
    this.add.text(this.scale.width / 2, this.scale.height * 0.2, 'Level 1: Forest', { fontSize: '24px', color: '#000' }).setOrigin(0.5);
    this.add.text(this.scale.width / 2, this.scale.height * 0.35, 'Level 2: Dungeon', { fontSize: '24px', color: '#000' }).setOrigin(0.5);
    this.add.text(this.scale.width / 2, this.scale.height * 0.5, 'Level 3: City', { fontSize: '24px', color: '#000' }).setOrigin(0.5);
    this.input.on('pointerdown', (pointer) => {
      if (pointer.y < this.scale.height * 0.3) this.scene.start('ForestLevel');
      else if (pointer.y < this.scale.height * 0.4) this.scene.start('DungeonLevel');
      else this.scene.start('CityLevel');
    });
  }
}

class ForestLevel extends Phaser.Scene {
  constructor() {
    super('ForestLevel');
  }
  create() {
    this.gameOverTriggered = false;
    this.nextLevelTriggered = false;

    this.physics.world.setBounds(0, 0, GAME_WIDTH * 2, GAME_HEIGHT);
    this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x228B22);

    this.platforms = this.physics.add.staticGroup();
    let p1 = this.platforms.create(400, 568, 'platform');
    p1.refreshBody();
    let p2 = this.platforms.create(1200, 568, 'platform');
    p2.refreshBody();
    this.platforms.create(600, 400, 'platform');
    this.platforms.create(50, 250, 'platform');

    this.player = this.physics.add.sprite(100, 450, 'player');
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.platforms);

    this.enemies = this.physics.add.group();
    let enemy = this.enemies.create(400, 500, 'enemy');
    enemy.setVelocityX(100);
    enemy.setBounce(1);
    enemy.setCollideWorldBounds(true);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, null, this);

    let exit = this.physics.add.sprite(1500, 550, 'door');
    exit.setImmovable(true);
    exit.body.allowGravity = false;
    this.physics.add.collider(exit, this.platforms);
    this.physics.add.overlap(this.player, exit, this.nextLevel, null, this);

    this.cameras.main.setBounds(0, 0, GAME_WIDTH * 2, GAME_HEIGHT);
    this.cameras.main.startFollow(this.player);
    this.cursors = this.input.keyboard.createCursorKeys();

    if (this.sys.game.device.os.iOS || this.sys.game.device.os.android) {
      addMobileControls(this);
      this.scale.on('resize', () => {
        if (this.mobileControlsGroup) { this.mobileControlsGroup.clear(true, true); }
        addMobileControls(this);
      });
    }
  }
  update() {
    if (this.mobileControls) {
      if (this.mobileControls.left) {
        this.player.setVelocityX(-160);
      } else if (this.mobileControls.right) {
        this.player.setVelocityX(160);
      } else {
        this.player.setVelocityX(0);
      }
      if (this.mobileControls.jump && this.player.body.blocked.down) {
        this.player.setVelocityY(-330);
        this.mobileControls.jump = false;
      }
    } else {
      moveEntity(this.player, this.cursors);
    }
  }
  hitEnemy(player, enemy) {
    if (player.body.velocity.y > 0 && player.y < enemy.y) {
      enemy.disableBody(true, true);
      player.setVelocityY(-200);
      if (navigator.vibrate) navigator.vibrate(50);
    } else if (!this.gameOverTriggered) {
      this.gameOverTriggered = true;
      if (navigator.vibrate) navigator.vibrate(100);
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

class DungeonLevel extends Phaser.Scene {
  constructor() {
    super('DungeonLevel');
  }
  create() {
    this.nextLevelTriggered = false;
    this.gameOverTriggered = false;

    this.physics.world.setBounds(0, 0, GAME_WIDTH * 2, GAME_HEIGHT);
    this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x4B0082);

    this.platforms = this.physics.add.staticGroup();
    let p1 = this.platforms.create(400, 568, 'platform');
    p1.refreshBody();
    let p2 = this.platforms.create(1200, 568, 'platform');
    p2.refreshBody();
    this.platforms.create(200, 400, 'platform');
    this.platforms.create(600, 300, 'platform');
    this.platforms.create(400, 275, 'platform');

    this.player = this.physics.add.sprite(100, 450, 'player');
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.platforms);

    this.hasKey = false;
    let dungeonKey = this.physics.add.sprite(500, 200, 'key');
    dungeonKey.body.allowGravity = false;
    this.physics.add.collider(dungeonKey, this.platforms);
    this.physics.add.overlap(this.player, dungeonKey, () => {
      dungeonKey.disableBody(true, true);
      this.hasKey = true;
    }, null, this);

    this.enemies = this.physics.add.group();
    let enemy = this.enemies.create(300, 500, 'enemy');
    enemy.setVelocityX(100);
    enemy.setBounce(1);
    enemy.setCollideWorldBounds(true);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.overlap(this.player, enemy, this.hitEnemy, null, this);

    let door = this.physics.add.sprite(1500, 550, 'door');
    door.setImmovable(true);
    door.body.allowGravity = false;
    this.physics.add.collider(door, this.platforms);
    this.physics.add.collider(this.player, door, () => {
      if (this.hasKey && !this.nextLevelTriggered) {
        this.nextLevelTriggered = true;
        door.disableBody(true, true);
        this.scene.start('CityLevel');
      }
    }, null, this);

    this.cameras.main.setBounds(0, 0, GAME_WIDTH * 2, GAME_HEIGHT);
    this.cameras.main.startFollow(this.player);
    this.cursors = this.input.keyboard.createCursorKeys();

    if (this.sys.game.device.os.iOS || this.sys.game.device.os.android) {
      addMobileControls(this);
      this.scale.on('resize', () => {
        if (this.mobileControlsGroup) { this.mobileControlsGroup.clear(true, true); }
        addMobileControls(this);
      });
    }
  }
  update() {
    if (this.mobileControls) {
      if (this.mobileControls.left) {
        this.player.setVelocityX(-160);
      } else if (this.mobileControls.right) {
        this.player.setVelocityX(160);
      } else {
        this.player.setVelocityX(0);
      }
      if (this.mobileControls.jump && this.player.body.blocked.down) {
        this.player.setVelocityY(-330);
        this.mobileControls.jump = false;
      }
    } else {
      moveEntity(this.player, this.cursors);
    }
  }
  hitEnemy(player, enemy) {
    if (player.body.velocity.y > 0 && player.y < enemy.y) {
      enemy.disableBody(true, true);
      player.setVelocityY(-200);
      if (navigator.vibrate) navigator.vibrate(50);
    } else if (!this.gameOverTriggered) {
      this.gameOverTriggered = true;
      if (navigator.vibrate) navigator.vibrate(100);
      this.scene.start('GameOver');
    }
  }
}

class CityLevel extends Phaser.Scene {
  constructor() {
    super('CityLevel');
  }
  create() {
    this.physics.world.setBounds(0, 0, GAME_WIDTH * 2, GAME_HEIGHT);
    this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x808080);

    this.platforms = this.physics.add.staticGroup();
    let plat1 = this.platforms.create(400, 568, 'platform');
    plat1.refreshBody();
    let plat2 = this.platforms.create(1200, 568, 'platform');
    plat2.refreshBody();
    this.platforms.create(800, 400, 'platform');
    this.platforms.create(1200, 300, 'platform');

    this.player = this.physics.add.sprite(100, 450, 'player');
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.platforms);

    let boss = this.physics.add.sprite(1400, 550, 'boss');
    boss.setImmovable(true);
    boss.body.allowGravity = false;
    this.physics.add.collider(boss, this.platforms);
    this.physics.add.overlap(this.player, boss, () => {
      if (!this.bossDefeated) {
        this.bossDefeated = true;
        boss.disableBody(true, true);
        if (navigator.vibrate) navigator.vibrate(100);
        this.add.text(this.scale.width / 2, this.scale.height / 2, 'You Win!', { fontSize: '48px', color: '#000' }).setOrigin(0.5);
        this.time.delayedCall(2000, () => this.scene.start('MainMenu'));
      }
    }, null, this);

    this.bike = this.physics.add.sprite(250, 450, 'bike');
    this.bike.body.setSize(this.bike.width, this.bike.height);
    this.bike.setCollideWorldBounds(true);
    this.physics.add.collider(this.bike, this.platforms);

    this.cameras.main.setBounds(0, 0, GAME_WIDTH * 2, GAME_HEIGHT);
    this.cameras.main.startFollow(this.player);
    this.cursors = this.input.keyboard.createCursorKeys();
    this.isOnBike = false;

    if (this.sys.game.device.os.iOS || this.sys.game.device.os.android) {
      addMobileControls(this);
      this.scale.on('resize', () => {
        if (this.mobileControlsGroup) { this.mobileControlsGroup.clear(true, true); }
        addMobileControls(this);
      });
    }
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
      if (this.mobileControls) {
        if (this.mobileControls.left) {
          this.player.setVelocityX(-160);
        } else if (this.mobileControls.right) {
          this.player.setVelocityX(160);
        } else {
          this.player.setVelocityX(0);
        }
        if (this.mobileControls.jump && this.player.body.blocked.down) {
          this.player.setVelocityY(-330);
          this.mobileControls.jump = false;
        }
      } else {
        moveEntity(this.player, this.cursors);
      }
    }
    if (!this.isOnBike && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.bike.x, this.bike.y) < 50) {
      this.isOnBike = true;
      this.player.disableBody(true, true);
      this.cameras.main.startFollow(this.bike);
    }
  }
}

class GameOver extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }
  create() {
    this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x000000);
    this.add.text(this.scale.width / 2, this.scale.height / 2, 'Game Over', { fontSize: '32px', color: '#fff' }).setOrigin(0.5);
    this.input.on('pointerdown', () => this.scene.start('MainMenu'));
  }
}

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 300 }, debug: false }
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [Boot, MainMenu, LevelSelect, ForestLevel, DungeonLevel, CityLevel, GameOver]
};

const game = new Phaser.Game(config);
