// MECHANIC: one_tap_flapper
// Core loop: gravity + one-button flap through obstacle gaps. Score = gaps passed.
// Uses Phaser 3, no external assets (procedural shapes so build stays tiny).

const GAME_CONFIG = {
  type: Phaser.AUTO,
  parent: 'game',
  scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
  backgroundColor: '{{BG_HEX}}',
  physics: { default: 'arcade', arcade: { gravity: { y: 900 } } },
  scene: { preload, create, update }
};

let bird, pipes, scoreText, gameOver = false, score = 0, spawnTimer, best = 0;
const PIPE_GAP = 180;
const PIPE_SPEED = -220;

function preload(){
  // Procedural bird (colored circle) — no image needed
  const g = this.add.graphics();
  g.fillStyle(parseInt('{{ACCENT_HEX}}'.slice(1), 16));
  g.fillCircle(16, 16, 14);
  g.lineStyle(2, 0x000000, 0.3);
  g.strokeCircle(16, 16, 14);
  g.generateTexture('bird', 32, 32);
  g.clear();

  // Procedural pipe
  g.fillStyle(0x2e8b57);
  g.fillRect(0, 0, 60, 800);
  g.lineStyle(2, 0x1a5533);
  g.strokeRect(0, 0, 60, 800);
  g.generateTexture('pipe', 60, 800);
  g.destroy();
}

function create(){
  const W = this.scale.width, H = this.scale.height;

  bird = this.physics.add.sprite(W * 0.3, H * 0.5, 'bird');
  bird.setCollideWorldBounds(true);
  bird.body.setCircle(14);

  pipes = this.physics.add.group({ allowGravity: false, immovable: true });

  scoreText = this.add.text(W/2, 60, '0', {
    fontSize: '48px', color: '#fff', fontStyle: 'bold',
    stroke: '#000', strokeThickness: 4
  }).setOrigin(0.5);

  this.physics.add.collider(bird, pipes, hitPipe, null, this);

  this.input.on('pointerdown', () => {
    if (gameOver){ restart.call(this); return; }
    bird.setVelocityY(-330);
  });
  this.input.keyboard.on('keydown-SPACE', () => {
    if (gameOver){ restart.call(this); return; }
    bird.setVelocityY(-330);
  });

  spawnTimer = this.time.addEvent({ delay: 1500, callback: spawnPipe, callbackScope: this, loop: true });
  Platform.gameplayStart();

  // Load best score
  Platform.load('best').then(v => { best = parseInt(v) || 0; });
}

function update(){
  if (gameOver) return;
  if (bird.y >= this.scale.height - 20) hitPipe.call(this);
  bird.setRotation(Phaser.Math.Clamp(bird.body.velocity.y / 500, -0.5, 1.2));

  // Score when passing pipe
  pipes.children.iterate(p => {
    if (p && !p.scored && p.x + 30 < bird.x){
      p.scored = true;
      if (p.isTop){ score++; scoreText.setText(score); window.__score = score; }
    }
    if (p && p.x < -100) p.destroy();
  });
}

function spawnPipe(){
  const H = this.scale.height, W = this.scale.width;
  const gapY = Phaser.Math.Between(150, H - 150 - PIPE_GAP);

  const top = pipes.create(W + 60, gapY - 400, 'pipe').setOrigin(0, 1);
  top.setVelocityX(PIPE_SPEED);
  top.isTop = true;

  const bot = pipes.create(W + 60, gapY + PIPE_GAP, 'pipe').setOrigin(0, 0);
  bot.setVelocityX(PIPE_SPEED);
}

async function hitPipe(){
  if (gameOver) return;
  gameOver = true;
  Platform.gameplayStop();
  bird.setTint(0xff0000);
  this.physics.pause();
  spawnTimer.remove();

  if (score > best){
    best = score;
    await Platform.save('best', String(best));
    await Platform.submitScore(score);
  }

  scoreText.setText(`Game Over\nScore: ${score}\nBest: ${best}\n\nTap to retry`);
  scoreText.setFontSize(28);
  scoreText.setPosition(this.scale.width/2, this.scale.height/2);

  // Ad on game over — natural break
  await Platform.interstitial();
}

function restart(){
  gameOver = false;
  score = 0;
  scoreText.setText('0');
  scoreText.setFontSize(48);
  scoreText.setPosition(this.scale.width/2, 60);
  bird.clearTint();
  bird.setPosition(this.scale.width * 0.3, this.scale.height * 0.5);
  bird.setVelocity(0);
  this.physics.resume();
  pipes.clear(true, true);
  spawnTimer = this.time.addEvent({ delay: 1500, callback: spawnPipe, callbackScope: this, loop: true });
  Platform.gameplayStart();
}
