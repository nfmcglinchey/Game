const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

// Globals for player stats (these get reset on level start)
let playerHealth = 3;
let playerKeys = 0;
let playerPowerUp = null;
let powerUpTimer = null;     // For resetting power-up after a delay
let powerUpDuration = 5000;  // 5 seconds

// Helper to get safe area bottom inset (if available)
function getSafeBottom() {
  const safeArea = parseInt(getComputedStyle(document.documentElement)
    .getPropertyValue('--safe-area-inset-bottom')) || 0;
  return safeArea;
}

// Shared helper for player movement (keyboard fallback)
function moveEntity(entity, cursors, jumpVelocity, speed) {
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
  scene.mobileControlsGroup = scene.add.group();

  let safeBottom = getSafeBottom();
  let buttonSize = Math.min(scene.scale.width, scene.scale.height) * 0.15;
  let margin = buttonSize * 0.2;

  // Left button
  let leftButton = scene.add.rectangle(
    margin + buttonSize / 2,
    scene.scale.height - margin - buttonSize / 2 - safeBottom,
    buttonSize,
    buttonSize,
    0x0000ff,
    0.5
  ).setScrollFactor(0).setInteractive();
  leftButton.on('pointerdown', () => { scene.mobileControls.left = true; leftButton.setScale(0.9); });
  leftButton.on('pointerup', () => { scene.mobileControls.left = false; leftButton.setScale(1); });
  leftButton.on('pointerout', () => { scene.mobileControls.left = false; leftButton.setScale(1); });
  scene.mobileControlsGroup.add(leftButton);

  // Right button
  let rightButton = scene.add.rectangle(
    margin * 2 + buttonSize * 1.5,
    scene.scale.height - margin - buttonSize / 2 - safeBottom,
    buttonSize,
    buttonSize,
    0x00ff00,
    0.5
  ).setScrollFactor(0).setInteractive();
  rightButton.on('pointerdown', () => { scene.mobileControls.right = true; rightButton.setScale(0.9); });
  rightButton.on('pointerup', () => { scene.mobileControls.right = false; rightButton.setScale(1); });
  rightButton.on('pointerout', () => { scene.mobileControls.right = false; rightButton.setScale(1); });
  scene.mobileControlsGroup.add(rightButton);

  // Jump button
  let jumpButton = scene.add.rectangle(
    scene.scale.width - margin - buttonSize / 2,
    scene.scale.height - margin - buttonSize / 2 - safeBottom,
    buttonSize,
    buttonSize,
    0xff0000,
    0.5
  ).setScrollFactor(0).setInteractive();
  jumpButton.on('pointerdown', () => { scene.mobileControls.jump = true; jumpButton.setScale(0.9); });
  jumpButton.on('pointerup', () => { scene.mobileControls.jump = false; jumpButton.setScale(1); });
  jumpButton.on('pointerout', () => { scene.mobileControls.jump = false; jumpButton.setScale(1); });
  scene.mobileControlsGroup.add(jumpButton);
}

// Boot Scene: Preload assets and create a dynamic ground texture.
class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }
  preload() {
    const assets = [
      { key: 'player',   path: 'assets/player.png' },
      { key: 'enemy',    path: 'assets/enemy.png' },
      { key: 'platform', path: 'assets/platform.png' },
      { key: 'door',     path: 'assets/door.png' },
      { key: 'key',      path: 'assets/key.png' },
      { key: 'boss',     path: 'assets/boss.png' },
      { key: 'bike',     path: 'assets/bike.png' },
      { key: 'spike',    path: 'assets/spike.png' },
      { key: 'power',    path: 'assets/power.png' }
    ];
    assets.forEach(asset => this.load.image(asset.key, asset.path));
  }
  create() {
    // Create a dynamic texture for the ground: green with black spots.
    let groundCanvas = this.textures.createCanvas('ground', 200, 50);
    let ctx = groundCanvas.getContext();
    ctx.fillStyle = '#00FF00'; // Green
    ctx.fillRect(0, 0, 200, 50);
    ctx.fillStyle = '#000000'; // Black spots
    for (let i = 0; i < 10; i++) {
      let x = Math.random() * 200;
      let y = Math.random() * 50;
      let r = 3 + Math.random() * 3;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    groundCanvas.refresh();

    this.scene.start('MainMenu');
  }
}

// Main Menu Scene
class MainMenu extends Phaser.Scene {
  constructor() {
    super('MainMenu');
  }
  create() {
    // Use a full-screen background color
    this.cameras.main.setBackgroundColor(0x000000);
    let startText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'Start Game', 
      { fontSize: '32px', color: '#fff' }).setOrigin(0.5);
    this.tweens.add({
      targets: startText,
      scale: { from: 1, to: 1.1 },
      yoyo: true,
      repeat: -1,
      duration: 800
    });
    this.input.on('pointerdown', () => {
      // Reset global stats
      playerHealth = 3;
      playerKeys = 0;
      playerPowerUp = null;
      this.scene.start('LevelSelect');
    });
  }
}

// Level Select Scene
class LevelSelect extends Phaser.Scene {
  constructor() {
    super('LevelSelect');
  }
  create() {
    this.cameras.main.setBackgroundColor(0x999999);
    this.add.text(this.scale.width / 2, this.scale.height * 0.2, 'Level 1: Forest', 
      { fontSize: '24px', color: '#000' }).setOrigin(0.5);
    this.add.text(this.scale.width / 2, this.scale.height * 0.35, 'Level 2: Dungeon',
      { fontSize: '24px', color: '#000' }).setOrigin(0.5);
    this.add.text(this.scale.width / 2, this.scale.height * 0.5, 'Level 3: City', 
      { fontSize: '24px', color: '#000' }).setOrigin(0.5);
    this.input.on('pointerdown', (pointer) => {
      if (pointer.y < this.scale.height * 0.3) this.scene.start('ForestLevel');
      else if (pointer.y < this.scale.height * 0.4) this.scene.start('DungeonLevel');
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
    this.gameOverTriggered = false;
    this.nextLevelTriggered = false;
    // Set a consistent sky-blue background for the level.
    this.cameras.main.setBackgroundColor(0x87ceeb);
    this.physics.world.setBounds(0, 0, GAME_WIDTH * 2, GAME_HEIGHT);

    // Platforms: the main ground uses the dynamic 'ground' texture.
    this.platforms = this.physics.add.staticGroup();
    let ground1 = this.platforms.create(400, 568, 'ground')
      .setScale(2, 1).refreshBody();
    let ground2 = this.platforms.create(1200, 568, 'ground')
      .setScale(2, 1).refreshBody();
    // Floating platform remains with the default platform image tinted brown.
    let floatingPlat = this.platforms.create(600, 400, 'platform');
    floatingPlat.setTint(0x654321);
    floatingPlat.refreshBody();

    // Set player speed slightly slower than enemy (enemy moves at 80, so player = 70).
    this.playerSpeed = 70;
    this.player = this.physics.add.sprite(100, 450, 'player');
    this.player.setBounce(0.3);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.platforms);

    // Enemy (moving at 80)
    this.enemies = this.physics.add.group();
    let enemy = this.enemies.create(500, 500, 'enemy');
    enemy.setTint(0x00ff00);
    enemy.setVelocityX(80);
    enemy.setBounce(1);
    enemy.setCollideWorldBounds(true);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, null, this);

    // Obstacles (spikes)
    this.obstacles = this.physics.add.group();
    let spike1 = this.obstacles.create(700, 535, 'spike');
    spike1.setTint(0xff4500);
    spike1.setImmovable(true);
    spike1.body.allowGravity = false;
    this.physics.add.collider(this.obstacles, this.platforms);
    this.physics.add.overlap(this.player, this.obstacles, this.hitObstacle, null, this);

    // Power-up: a speed boost (blue)
    this.powerUps = this.physics.add.group();
    let speedPower = this.powerUps.create(300, 400, 'power');
    speedPower.setTint(0x0000ff);
    speedPower.body.allowGravity = false;
    this.physics.add.overlap(this.player, speedPower, this.pickupPowerUp, null, this);

    // Key: yellow
    this.keysGroup = this.physics.add.group();
    let forestKey = this.keysGroup.create(600, 350, 'key');
    forestKey.setTint(0xffff00);
    forestKey.body.allowGravity = false;
    this.physics.add.overlap(this.player, forestKey, this.pickupKey, null, this);

    // Door: advances to DungeonLevel (requires a key)
    this.door = this.physics.add.sprite(1500, 550, 'door');
    this.door.setTint(0x8b4513);
    this.door.setImmovable(true);
    this.door.body.allowGravity = false;
    this.physics.add.collider(this.door, this.platforms);
    this.physics.add.overlap(this.player, this.door, this.nextLevel, null, this);

    this.cameras.main.setBounds(0, 0, GAME_WIDTH * 2, GAME_HEIGHT);
    this.cameras.main.startFollow(this.player);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.on('pointerdown', (pointer) => {
      this.touchStartY = pointer.y;
      this.jumpTriggered = false;
    });

    // Mobile controls if on phone
    if (this.sys.game.device.os.iOS || this.sys.game.device.os.android) {
      addMobileControls(this);
      this.scale.on('resize', () => {
        if (this.mobileControlsGroup) { this.mobileControlsGroup.clear(true, true); }
        addMobileControls(this);
      });
    }

    this.healthText = this.add.text(10, 10, '', { fontSize: '20px', fill: '#fff' })
      .setScrollFactor(0);
    this.updateHUD();
  }
  update() {
    let usedMobile = false;
    if (this.mobileControls) {
      if (this.mobileControls.left) {
        this.player.setVelocityX(-this.playerSpeed);
        usedMobile = true;
      } else if (this.mobileControls.right) {
        this.player.setVelocityX(this.playerSpeed);
        usedMobile = true;
      } else {
        this.player.setVelocityX(0);
      }
      if (this.mobileControls.jump && this.player.body.blocked.down) {
        this.player.setVelocityY(-330);
        this.mobileControls.jump = false;
        usedMobile = true;
      }
    }
    if (!usedMobile) {
      if (this.input.activePointer.isDown) {
        let pointer = this.input.activePointer;
        let dx = pointer.worldX - this.player.x;
        let factor = 0.1;
        let vx = Phaser.Math.Clamp(dx * factor, -300, 300);
        this.player.setVelocityX(vx);
        if (!this.jumpTriggered && (this.touchStartY - pointer.y) > 30 && this.player.body.blocked.down) {
          this.player.setVelocityY(-330);
          this.jumpTriggered = true;
        }
      } else {
        let jumpVelocity = (playerPowerUp === 'jump') ? -400 : -330;
        moveEntity(this.player, this.cursors, jumpVelocity, this.playerSpeed);
      }
    }
    this.updateHUD();
  }
  hitEnemy(player, enemy) {
    if (player.body.velocity.y > 0 && player.y < enemy.y) {
      enemy.disableBody(true, true);
      player.setVelocityY(-200);
      if (navigator.vibrate) navigator.vibrate(50);
    } else if (!this.gameOverTriggered) {
      playerHealth--;
      if (playerHealth <= 0) {
        this.gameOverTriggered = true;
        this.scene.start('GameOver');
      } else {
        player.setX(100);
        player.setY(450);
      }
    }
  }
  hitObstacle(player, obstacle) {
    if (!this.gameOverTriggered) {
      playerHealth--;
      if (playerHealth <= 0) {
        this.gameOverTriggered = true;
        this.scene.start('GameOver');
      } else {
        player.setX(100);
        player.setY(450);
      }
    }
  }
  pickupKey(player, keySprite) {
    keySprite.disableBody(true, true);
    playerKeys++;
  }
  pickupPowerUp(player, powerSprite) {
    powerSprite.disableBody(true, true);
    playerPowerUp = 'speed';
    if (powerUpTimer) this.time.removeEvent(powerUpTimer);
    powerUpTimer = this.time.delayedCall(powerUpDuration, () => {
      playerPowerUp = null;
    });
  }
  nextLevel() {
    if (!this.nextLevelTriggered && playerKeys > 0) {
      this.nextLevelTriggered = true;
      playerKeys--;
      this.scene.start('DungeonLevel');
    }
  }
  updateHUD() {
    this.healthText.setText(`Health: ${playerHealth}  Keys: ${playerKeys}`);
  }
}

// Dungeon Level Scene
class DungeonLevel extends Phaser.Scene {
  constructor() {
    super('DungeonLevel');
  }
  create() {
    this.gameOverTriggered = false;
    this.nextLevelTriggered = false;
    this.physics.world.setBounds(0, 0, GAME_WIDTH * 2, GAME_HEIGHT);
    this.cameras.main.setBackgroundColor(0x4b0082);
    // Use the ground texture for the floor platforms.
    this.platforms = this.physics.add.staticGroup();
    let p1 = this.platforms.create(400, 568, 'ground').refreshBody();
    let p2 = this.platforms.create(1200, 568, 'ground').refreshBody();
    // Floating platforms remain with the default platform image tinted brown.
    this.platforms.create(200, 400, 'platform').setTint(0x654321).refreshBody();
    this.platforms.create(600, 300, 'platform').setTint(0x654321).refreshBody();
    this.platforms.create(400, 275, 'platform').setTint(0x654321).refreshBody();

    // In DungeonLevel, enemy moves faster – so set player speed slightly slower than enemy.
    this.playerSpeed = 90;
    this.player = this.physics.add.sprite(100, 450, 'player');
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.platforms);

    // Power-up: jump boost (cyan)
    this.powerUps = this.physics.add.group();
    let jumpPower = this.powerUps.create(250, 250, 'power');
    jumpPower.setTint(0x00ffff);
    jumpPower.body.allowGravity = false;
    this.physics.add.overlap(this.player, jumpPower, this.pickupPowerUp, null, this);

    // Key pickup
    this.hasKey = false;
    let dungeonKey = this.physics.add.sprite(500, 200, 'key');
    dungeonKey.setTint(0xffff00);
    dungeonKey.body.allowGravity = false;
    this.physics.add.collider(dungeonKey, this.platforms);
    this.physics.add.overlap(this.player, dungeonKey, () => {
      dungeonKey.disableBody(true, true);
      this.hasKey = true;
    }, null, this);

    // Enemy group – enemy moves at 100
    this.enemies = this.physics.add.group();
    let enemy = this.enemies.create(300, 500, 'enemy');
    enemy.setTint(0x00ff00);
    enemy.setVelocityX(100);
    enemy.setBounce(1);
    enemy.setCollideWorldBounds(true);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.overlap(this.player, enemy, this.hitEnemy, null, this);

    // Spikes (obstacles)
    this.obstacles = this.physics.add.group();
    let spike1 = this.obstacles.create(350, 535, 'spike');
    spike1.setTint(0xff4500);
    spike1.setImmovable(true);
    spike1.body.allowGravity = false;
    this.physics.add.overlap(this.player, spike1, this.hitObstacle, null, this);

    // Door (requires key) leading to CityLevel
    let door = this.physics.add.sprite(1500, 550, 'door');
    door.setTint(0x8b4513);
    door.setImmovable(true);
    door.body.allowGravity = false;
    this.physics.add.collider(door, this.platforms);
    this.physics.add.overlap(this.player, door, () => {
      if (this.hasKey && !this.nextLevelTriggered) {
        this.nextLevelTriggered = true;
        door.disableBody(true, true);
        this.scene.start('CityLevel');
      }
    }, null, this);

    this.cameras.main.setBounds(0, 0, GAME_WIDTH * 2, GAME_HEIGHT);
    this.cameras.main.startFollow(this.player);
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.on('pointerdown', (pointer) => {
      this.touchStartY = pointer.y;
      this.jumpTriggered = false;
    });
    if (this.sys.game.device.os.iOS || this.sys.game.device.os.android) {
      addMobileControls(this);
      this.scale.on('resize', () => {
        if (this.mobileControlsGroup) { this.mobileControlsGroup.clear(true, true); }
        addMobileControls(this);
      });
    }
    this.healthText = this.add.text(10, 10, '', { fontSize: '20px', fill: '#fff' })
      .setScrollFactor(0);
    this.updateHUD();
  }
  update() {
    let usedMobile = false;
    if (this.mobileControls) {
      if (this.mobileControls.left) {
        this.player.setVelocityX(-this.playerSpeed);
        usedMobile = true;
      } else if (this.mobileControls.right) {
        this.player.setVelocityX(this.playerSpeed);
        usedMobile = true;
      } else {
        this.player.setVelocityX(0);
      }
      if (this.mobileControls.jump && this.player.body.blocked.down) {
        this.player.setVelocityY(-330);
        this.mobileControls.jump = false;
        usedMobile = true;
      }
    }
    if (!usedMobile) {
      if (this.input.activePointer.isDown) {
        let pointer = this.input.activePointer;
        let dx = pointer.worldX - this.player.x;
        let factor = 0.1;
        let vx = Phaser.Math.Clamp(dx * factor, -300, 300);
        this.player.setVelocityX(vx);
        if (!this.jumpTriggered && (this.touchStartY - pointer.y) > 30 && this.player.body.blocked.down) {
          this.player.setVelocityY(-330);
          this.jumpTriggered = true;
        }
      } else {
        let jumpVelocity = (playerPowerUp === 'jump') ? -400 : -330;
        moveEntity(this.player, this.cursors, jumpVelocity, this.playerSpeed);
      }
    }
    this.updateHUD();
  }
  pickupPowerUp(player, powerSprite) {
    powerSprite.disableBody(true, true);
    playerPowerUp = 'jump';
    if (powerUpTimer) this.time.removeEvent(powerUpTimer);
    powerUpTimer = this.time.delayedCall(powerUpDuration, () => {
      playerPowerUp = null;
    });
  }
  hitEnemy(player, enemy) {
    if (player.body.velocity.y > 0 && player.y < enemy.y) {
      enemy.disableBody(true, true);
      player.setVelocityY(-200);
      if (navigator.vibrate) navigator.vibrate(50);
    } else if (!this.gameOverTriggered) {
      playerHealth--;
      if (playerHealth <= 0) {
        this.gameOverTriggered = true;
        this.scene.start('GameOver');
      } else {
        player.setX(100);
        player.setY(450);
      }
    }
  }
  hitObstacle(player, spike) {
    playerHealth--;
    if (playerHealth <= 0) {
      this.scene.start('GameOver');
    } else {
      player.setX(100);
      player.setY(450);
    }
  }
  updateHUD() {
    this.healthText.setText(`Health: ${playerHealth}  Keys: ${playerKeys}`);
  }
}

// City Level Scene
class CityLevel extends Phaser.Scene {
  constructor() {
    super('CityLevel');
  }
  create() {
    this.physics.world.setBounds(0, 0, GAME_WIDTH * 2, GAME_HEIGHT);
    this.cameras.main.setBackgroundColor(0x808080);
    this.platforms = this.physics.add.staticGroup();
    // Use ground texture for the lower platforms.
    let plat1 = this.platforms.create(400, 568, 'ground').refreshBody();
    let plat2 = this.platforms.create(1200, 568, 'ground').refreshBody();
    this.platforms.create(800, 400, 'platform').setTint(0x654321).refreshBody();
    this.platforms.create(1200, 300, 'platform').setTint(0x654321).refreshBody();
    this.playerSpeed = 90;
    this.player = this.physics.add.sprite(100, 450, 'player');
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.platforms);
    // Boss setup
    this.boss = this.physics.add.sprite(1400, 550, 'boss');
    this.boss.setTint(0x800080);
    this.boss.setImmovable(true);
    this.boss.body.allowGravity = false;
    this.physics.add.collider(this.boss, this.platforms);
    this.bossDefeated = false;
    this.physics.add.overlap(this.player, this.boss, () => {
      if (!this.bossDefeated) {
        this.bossDefeated = true;
        this.boss.disableBody(true, true);
        if (navigator.vibrate) navigator.vibrate(100);
        this.add.text(this.scale.width / 2, this.scale.height / 2, 'You Win!', 
          { fontSize: '48px', color: '#000' }).setOrigin(0.5).setScrollFactor(0);
        this.time.delayedCall(2000, () => this.scene.start('MainMenu'));
      }
    }, null, this);
    // Bike bonus (optional)
    this.bike = this.physics.add.sprite(250, 450, 'bike');
    this.bike.body.setSize(this.bike.width, this.bike.height);
    this.bike.setCollideWorldBounds(true);
    this.physics.add.collider(this.bike, this.platforms);
    this.isOnBike = false;
    this.physics.add.overlap(this.bike, this.boss, () => {
      if (this.isOnBike && this.bike) {
        this.bike.disableBody(true, true);
        this.bike = null;
        this.isOnBike = false;
        this.player.enableBody(true, GAME_WIDTH, 450, true, true);
        if (navigator.vibrate) navigator.vibrate(200);
      }
    }, null, this);
    // Obstacles
    this.obstacles = this.physics.add.group();
    let spike1 = this.obstacles.create(600, 535, 'spike');
    spike1.setTint(0xff4500);
    spike1.setImmovable(true);
    spike1.body.allowGravity = false;
    this.physics.add.overlap(this.player, spike1, this.hitObstacle, null, this);
    this.cameras.main.setBounds(0, 0, GAME_WIDTH * 2, GAME_HEIGHT);
    this.cameras.main.startFollow(this.player);
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.on('pointerdown', (pointer) => {
      this.touchStartY = pointer.y;
      this.jumpTriggered = false;
    });
    if (this.sys.game.device.os.iOS || this.sys.game.device.os.android) {
      addMobileControls(this);
      this.scale.on('resize', () => {
        if (this.mobileControlsGroup) { this.mobileControlsGroup.clear(true, true); }
        addMobileControls(this);
      });
    }
    this.healthText = this.add.text(10, 10, '', { fontSize: '20px', fill: '#fff' })
      .setScrollFactor(0);
    this.updateHUD();
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
      let usedMobile = false;
      if (this.mobileControls) {
        if (this.mobileControls.left) {
          this.player.setVelocityX(-this.playerSpeed);
          usedMobile = true;
        } else if (this.mobileControls.right) {
          this.player.setVelocityX(this.playerSpeed);
          usedMobile = true;
        } else {
          this.player.setVelocityX(0);
        }
        if (this.mobileControls.jump && this.player.body.blocked.down) {
          this.player.setVelocityY(-330);
          this.mobileControls.jump = false;
          usedMobile = true;
        }
      }
      if (!usedMobile) {
        if (this.input.activePointer.isDown) {
          let pointer = this.input.activePointer;
          let dx = pointer.worldX - this.player.x;
          let factor = 0.1;
          let vx = Phaser.Math.Clamp(dx * factor, -300, 300);
          this.player.setVelocityX(vx);
          if (!this.jumpTriggered && (this.touchStartY - pointer.y) > 30 && this.player.body.blocked.down) {
            this.player.setVelocityY(-330);
            this.jumpTriggered = true;
          }
        } else {
          let jumpVelocity = (playerPowerUp === 'jump') ? -400 : -330;
          moveEntity(this.player, this.cursors, jumpVelocity, this.playerSpeed);
        }
      }
      if (!this.isOnBike && this.bike && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.bike.x, this.bike.y) < 50) {
        this.isOnBike = true;
        this.player.disableBody(true, true);
        this.cameras.main.startFollow(this.bike);
      }
    }
    this.updateHUD();
  }
  hitObstacle(player, obstacle) {
    playerHealth--;
    if (playerHealth <= 0) {
      this.scene.start('GameOver');
    } else {
      player.setX(100);
      player.setY(450);
    }
  }
  updateHUD() {
    this.healthText.setText(`Health: ${playerHealth}  Keys: ${playerKeys}`);
  }
}

// Game Over Scene
class GameOver extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }
  create() {
    this.cameras.main.setBackgroundColor(0x000000);
    this.add.text(this.scale.width / 2, this.scale.height / 2, 'Game Over', 
      { fontSize: '32px', color: '#fff' }).setOrigin(0.5);
    this.input.on('pointerdown', () => {
      playerHealth = 3;
      playerKeys = 0;
      playerPowerUp = null;
      this.scene.start('MainMenu');
    });
  }
}

// Phaser config
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
    autoCenter: Phaser.Scale.CENTER_BOTH,
    orientation: Phaser.Scale.LANDSCAPE
  },
  scene: [Boot, MainMenu, LevelSelect, ForestLevel, DungeonLevel, CityLevel, GameOver]
};

const game = new Phaser.Game(config);
