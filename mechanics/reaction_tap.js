// MECHANIC: reaction_tap — 4 colored buttons, tap matching color before miss
const COLORS=[0xff5252,0x42a5f5,0xffee58,0x66bb6a]; const NAMES=['R','B','Y','G'];
let buttons=[],targets=[],score=0,best=0,gameOver=false,spawnTimer,speed=180,scoreText;
const GAME_CONFIG={type:Phaser.AUTO,parent:'game',
  scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH},
  backgroundColor:'{{BG_HEX}}',physics:{default:'arcade',arcade:{gravity:{y:0}}},
  scene:{preload,create,update}};
function preload(){
  const g=this.add.graphics();
  COLORS.forEach((c,i)=>{ g.fillStyle(c); g.fillRoundedRect(0,0,80,80,8); g.generateTexture('t'+i,80,80); g.clear(); });
  g.destroy();
}
function create(){
  const W=this.scale.width,H=this.scale.height;
  const btnW=W/4, btnY=H-60;
  COLORS.forEach((c,i)=>{
    const rect=this.add.rectangle(btnW*i+btnW/2, btnY, btnW-8, 100, c, 0.6).setInteractive();
    this.add.text(btnW*i+btnW/2, btnY, NAMES[i], {fontSize:'32px',color:'#fff',stroke:'#000',strokeThickness:4}).setOrigin(0.5);
    rect.colorIdx=i;
    rect.on('pointerdown',()=>{ if(!gameOver) tapButton.call(this,i); });
    buttons.push(rect);
  });
  scoreText=this.add.text(W/2,20,'0',{fontSize:'40px',color:'#fff',stroke:'#000',strokeThickness:4}).setOrigin(0.5,0);
  this.laneX=[btnW/2, btnW+btnW/2, btnW*2+btnW/2, btnW*3+btnW/2];
  spawnTimer=this.time.addEvent({delay:900,callback:spawnTarget,callbackScope:this,loop:true});
  Platform.load('react_best').then(v=>{best=parseInt(v)||0});
  Platform.gameplayStart();
}
function update(){
  if(gameOver) return;
  const H=this.scale.height;
  targets.forEach(t=>{ if(t.active){ t.y += speed*this.game.loop.delta/1000; if(t.y > H-100){ die.call(this); } } });
}
function spawnTarget(){
  const idx=Phaser.Math.Between(0,3);
  const t=this.add.image(this.laneX[idx], -40, 't'+idx);
  t.colorIdx=idx;
  targets.push(t);
}
function tapButton(idx){
  const t=targets.find(x=>x.active && x.colorIdx===idx && x.y>this.scale.height*0.4);
  if(t){ t.destroy(); score++; window.__score=score; scoreText.setText(score); speed=Math.min(speed+3,450); }
  else { die.call(this); }
}
async function die(){
  gameOver=true; Platform.gameplayStop(); spawnTimer.remove();
  if(score>best){ best=score; await Platform.save('react_best',String(best)); await Platform.submitScore(score); }
  scoreText.setText(`Game Over\nScore: ${score}\nBest: ${best}\nTap to retry`); scoreText.setFontSize(24);
  this.input.once('pointerdown',()=>restart.call(this));
  await Platform.interstitial();
}
function restart(){
  gameOver=false;score=0;speed=180;scoreText.setText('0');scoreText.setFontSize(40);
  targets.forEach(t=>t.destroy?.()); targets=[];
  spawnTimer=this.time.addEvent({delay:900,callback:spawnTarget,callbackScope:this,loop:true});
  Platform.gameplayStart();
}
