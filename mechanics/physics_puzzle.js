// MECHANIC: physics_puzzle — drag-aim projectile, gravity + collision, destroy targets in shot budget
let projectile,slingshot,targets,shots=5,scoreText,shotText,score=0,best=0,gameOver=false,aiming=false,startPt={x:0,y:0};
const GAME_CONFIG={type:Phaser.AUTO,parent:'game',
  scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH},
  backgroundColor:'{{BG_HEX}}',
  physics:{default:'arcade',arcade:{gravity:{y:800}}},
  scene:{preload,create,update}};
function preload(){
  const g=this.add.graphics();
  g.fillStyle(parseInt('{{ACCENT_HEX}}'.slice(1),16)); g.fillCircle(15,15,14); g.generateTexture('proj',30,30); g.clear();
  g.fillStyle(0xff3355); g.fillRect(0,0,40,40); g.lineStyle(2,0x000000); g.strokeRect(0,0,40,40); g.generateTexture('target',40,40); g.clear();
  g.fillStyle(0x654321); g.fillRect(0,0,20,60); g.generateTexture('sling',20,60); g.destroy();
}
function create(){
  const W=this.scale.width,H=this.scale.height;
  slingshot={x:120,y:H-100}; this.add.image(slingshot.x,slingshot.y+20,'sling');
  targets=this.physics.add.group();
  for(let i=0;i<8;i++){ const t=targets.create(W-200+Phaser.Math.Between(-100,100), H-100-i*45, 'target'); t.setImmovable(false); t.body.setBounce(0.5); }
  spawnProjectile.call(this);
  scoreText=this.add.text(W/2,20,'Score: 0',{fontSize:'24px',color:'#fff',stroke:'#000',strokeThickness:3}).setOrigin(0.5,0);
  shotText=this.add.text(W/2,55,`Shots: ${shots}`,{fontSize:'20px',color:'#fff',stroke:'#000',strokeThickness:3}).setOrigin(0.5,0);
  this.trajectory=this.add.graphics();
  this.input.on('pointerdown',p=>{ if(gameOver){restart.call(this);return;} if(!projectile.body.moves){ aiming=true; startPt={x:p.x,y:p.y}; } });
  this.input.on('pointermove',p=>{ if(aiming) drawTrajectory.call(this, p); });
  this.input.on('pointerup',p=>{ if(aiming){ aiming=false; fire.call(this,p); this.trajectory.clear(); } });
  this.physics.add.collider(projectile, targets, (proj,t)=>{ t.destroy(); score+=10; window.__score=score; scoreText.setText(`Score: ${score}`); if(targets.countActive(true)===0) win.call(this); });
  Platform.load('physics_best').then(v=>{best=parseInt(v)||0});
  Platform.gameplayStart();
}
function update(){
  if(projectile && projectile.body.moves && (projectile.x<-50 || projectile.x>this.scale.width+50 || projectile.y>this.scale.height+50)){
    projectile.destroy();
    if(shots<=0 && targets.countActive(true)>0) die.call(this);
    else spawnProjectile.call(this);
  }
}
function spawnProjectile(){
  projectile=this.physics.add.image(slingshot.x, slingshot.y, 'proj');
  projectile.body.setCircle(14); projectile.body.moves=false; projectile.body.allowGravity=false;
}
function drawTrajectory(p){
  this.trajectory.clear();
  this.trajectory.lineStyle(2,0xffffff,0.5);
  this.trajectory.beginPath();
  this.trajectory.moveTo(slingshot.x, slingshot.y);
  const vx=(startPt.x-p.x)*3, vy=(startPt.y-p.y)*3;
  for(let t=0;t<1.5;t+=0.05){
    const x=slingshot.x+vx*t, y=slingshot.y+vy*t+0.5*800*t*t;
    this.trajectory.lineTo(x,y);
  }
  this.trajectory.strokePath();
}
function fire(p){
  shots--; shotText.setText(`Shots: ${shots}`);
  projectile.body.moves=true; projectile.body.allowGravity=true;
  projectile.setVelocity((startPt.x-p.x)*3, (startPt.y-p.y)*3);
}
async function win(){ score+=shots*20; scoreText.setText(`Score: ${score}`); if(score>best){best=score; await Platform.save('physics_best',String(best)); await Platform.submitScore(score);} scoreText.setText(`LEVEL CLEAR!\nScore: ${score}\nTap to continue`); await Platform.interstitial(); gameOver=true; }
async function die(){ gameOver=true; Platform.gameplayStop(); if(score>best){best=score; await Platform.save('physics_best',String(best));} scoreText.setText(`Out of shots\nScore: ${score}\nBest: ${best}\nTap to retry`); scoreText.setFontSize(20); await Platform.interstitial(); }
function restart(){
  gameOver=false; score=0; shots=5;
  scoreText.setText('Score: 0'); scoreText.setFontSize(24); shotText.setText('Shots: 5');
  targets.clear(true,true);
  const W=this.scale.width,H=this.scale.height;
  for(let i=0;i<8;i++){ const t=targets.create(W-200+Phaser.Math.Between(-100,100), H-100-i*45, 'target'); t.setImmovable(false); t.body.setBounce(0.5); }
  if(projectile) projectile.destroy();
  spawnProjectile.call(this);
  Platform.gameplayStart();
}
