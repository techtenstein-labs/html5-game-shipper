// MECHANIC: endless_runner — auto-run character, tap-jump procedural obstacles, distance = score
let runner,ground,obstacles,scoreText,distance=0,best=0,gameOver=false,speed=4,jumpTimer=0;
const GAME_CONFIG={type:Phaser.AUTO,parent:'game',
  scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH},
  backgroundColor:'{{BG_HEX}}',
  physics:{default:'arcade',arcade:{gravity:{y:1500}}},
  scene:{preload,create,update}};
function preload(){
  const g=this.add.graphics();
  g.fillStyle(parseInt('{{ACCENT_HEX}}'.slice(1),16)); g.fillRoundedRect(0,0,40,50,4); g.generateTexture('runner',40,50); g.clear();
  g.fillStyle(0xff3355); g.fillTriangle(0,50,25,0,50,50); g.generateTexture('obs',50,50); g.clear();
  g.fillStyle(0x333333); g.fillRect(0,0,100,20); g.generateTexture('ground',100,20); g.destroy();
}
function create(){
  const W=this.scale.width,H=this.scale.height;
  const groundY=H-40;
  ground=this.physics.add.staticGroup();
  for(let x=0;x<W+100;x+=100) ground.create(x,groundY,'ground').setOrigin(0,0).refreshBody();
  runner=this.physics.add.sprite(80,groundY-30,'runner'); runner.setCollideWorldBounds(true);
  obstacles=this.physics.add.group({allowGravity:false});
  this.physics.add.collider(runner,ground);
  this.physics.add.overlap(runner,obstacles,()=>die.call(this));
  scoreText=this.add.text(W-20,20,'0m',{fontSize:'28px',color:'#fff',stroke:'#000',strokeThickness:4}).setOrigin(1,0);
  this.input.on('pointerdown',()=>{ if(gameOver){restart.call(this);return;} jump(); });
  this.input.keyboard.on('keydown-SPACE',()=>{ if(gameOver){restart.call(this);return;} jump(); });
  this.spawnTimer=this.time.addEvent({delay:1300,callback:spawnObs,callbackScope:this,loop:true});
  Platform.load('runner_best').then(v=>{best=parseInt(v)||0});
  Platform.gameplayStart();
}
function jump(){ if(runner.body.blocked.down || runner.body.touching.down) runner.setVelocityY(-650); }
function update(){
  if(gameOver) return;
  distance+=speed/60; window.__score=Math.floor(distance);
  scoreText.setText(Math.floor(distance)+'m');
  speed=Math.min(4+distance/200,10);
  obstacles.children.iterate(o=>{ if(o){ o.x-=speed; if(o.x<-60) o.destroy(); } });
}
function spawnObs(){
  const H=this.scale.height,W=this.scale.width;
  const groundY=H-40;
  const o=obstacles.create(W+50, groundY-25,'obs');
  o.body.setSize(40,40).setOffset(5,5);
}
async function die(){
  if(gameOver) return;
  gameOver=true; Platform.gameplayStop();
  this.spawnTimer.remove(); this.physics.pause(); runner.setTint(0xff0000);
  const s=Math.floor(distance);
  if(s>best){ best=s; await Platform.save('runner_best',String(best)); await Platform.submitScore(s); }
  scoreText.setText(`Game Over\n${s}m\nBest: ${best}m\nTap to retry`); scoreText.setFontSize(22); scoreText.setOrigin(0.5,0.5); scoreText.setPosition(this.scale.width/2,this.scale.height/2);
  await Platform.interstitial();
}
function restart(){
  gameOver=false; distance=0; speed=4;
  scoreText.setText('0m'); scoreText.setFontSize(28); scoreText.setOrigin(1,0); scoreText.setPosition(this.scale.width-20,20);
  runner.clearTint(); runner.setPosition(80, this.scale.height-70); runner.setVelocity(0);
  obstacles.clear(true,true);
  this.physics.resume();
  this.spawnTimer=this.time.addEvent({delay:1300,callback:spawnObs,callbackScope:this,loop:true});
  Platform.gameplayStart();
}
