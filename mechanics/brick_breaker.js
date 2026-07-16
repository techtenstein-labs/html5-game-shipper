// MECHANIC: brick_breaker — paddle bounces ball, break brick rows, level clear
let paddle,ball,bricks,scoreText,score=0,best=0,gameOver=false,launched=false;
const GAME_CONFIG={
  type:Phaser.AUTO,parent:'game',
  scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH},
  backgroundColor:'{{BG_HEX}}',
  physics:{default:'arcade',arcade:{gravity:{y:0}}},
  scene:{preload,create,update}
};
function preload(){
  const g=this.add.graphics();
  g.fillStyle(parseInt('{{ACCENT_HEX}}'.slice(1),16)); g.fillRoundedRect(0,0,100,16,4); g.generateTexture('paddle',100,16); g.clear();
  g.fillStyle(0xffffff); g.fillCircle(8,8,8); g.generateTexture('ball',16,16); g.clear();
  const colors=[0xff5252,0xffa726,0xffee58,0x66bb6a,0x42a5f5,0xab47bc];
  colors.forEach((c,i)=>{ g.fillStyle(c); g.fillRoundedRect(0,0,54,20,3); g.lineStyle(2,0x000000,0.3); g.strokeRoundedRect(0,0,54,20,3); g.generateTexture('brick'+i,54,20); g.clear(); });
  g.destroy();
}
function create(){
  const W=this.scale.width,H=this.scale.height;
  paddle=this.physics.add.sprite(W/2,H-40,'paddle'); paddle.setImmovable(true); paddle.body.allowGravity=false;
  ball=this.physics.add.sprite(W/2,H-60,'ball'); ball.setCollideWorldBounds(true); ball.setBounce(1);
  ball.body.onWorldBounds=true;
  this.physics.world.on('worldbounds',(body,up,down)=>{ if(down && body.gameObject===ball) die.call(this); });
  bricks=this.physics.add.staticGroup(); buildBricks.call(this);
  this.physics.add.collider(ball,paddle,(b,p)=>{ const d=(b.x-p.x)/50; b.setVelocity(300*d, -Math.abs(b.body.velocity.y)); });
  this.physics.add.collider(ball,bricks,(b,br)=>{ br.destroy(); score+=10;window.__score=score;scoreText.setText(score); if(bricks.countActive(true)===0){ levelClear.call(this); } });
  scoreText=this.add.text(W/2,20,'0',{fontSize:'32px',color:'#fff',stroke:'#000',strokeThickness:4}).setOrigin(0.5,0);
  const hint=this.add.text(W/2,H/2,'Drag paddle • Tap to launch',{fontSize:'20px',color:'#fff'}).setOrigin(0.5);
  this.input.on('pointermove',(p)=>{ if(!gameOver) paddle.x=Phaser.Math.Clamp(p.x,50,W-50); if(!launched){ ball.x=paddle.x; ball.y=paddle.y-16; } });
  this.input.on('pointerdown',()=>{ if(gameOver){restart.call(this);return;} if(!launched){ launched=true; hint.destroy(); ball.setVelocity(200,-350); Platform.gameplayStart(); } });
  Platform.load('brick_best').then(v=>{best=parseInt(v)||0});
}
function update(){ if(!launched && !gameOver){ ball.x=paddle.x; ball.y=paddle.y-16; } }
function buildBricks(){
  const W=this.scale.width; const cols=Math.floor((W-40)/58);
  for(let r=0;r<6;r++) for(let c=0;c<cols;c++){ const x=20+c*58+27, y=60+r*22+10; bricks.create(x,y,'brick'+r); }
}
async function die(){
  gameOver=true; Platform.gameplayStop(); ball.setVelocity(0,0); ball.setVisible(false);
  if(score>best){ best=score; await Platform.save('brick_best',String(best)); await Platform.submitScore(score); }
  scoreText.setText(`Game Over\nScore: ${score}\nBest: ${best}\nTap to retry`); scoreText.setFontSize(22);
  await Platform.interstitial();
}
async function levelClear(){ score+=100; scoreText.setText(score); buildBricks.call(this); ball.setPosition(paddle.x,paddle.y-16); launched=false; await Platform.interstitial(); }
function restart(){ gameOver=false;launched=false;score=0;scoreText.setText('0');scoreText.setFontSize(32); bricks.clear(true,true); buildBricks.call(this); ball.setVisible(true); ball.setPosition(paddle.x,paddle.y-16); Platform.gameplayStart(); }
