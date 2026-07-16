// MECHANIC: stacker_tower — moving block, tap to drop, misalignment shrinks next block
let blocks=[],currentBlock=null,dir=1,speed=3,gameOver=false,score=0,best=0,scoreText;
const GAME_CONFIG={type:Phaser.AUTO,parent:'game',
  scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH},
  backgroundColor:'{{BG_HEX}}',scene:{preload,create,update}};
function preload(){
  const g=this.add.graphics();
  g.fillStyle(parseInt('{{ACCENT_HEX}}'.slice(1),16)); g.fillRoundedRect(0,0,200,40,4); g.generateTexture('block',200,40); g.destroy();
}
function create(){
  const W=this.scale.width,H=this.scale.height;
  const base=this.add.image(W/2,H-40,'block'); base.setDisplaySize(200,40); base.width=200;
  blocks.push({sprite:base,w:200,x:W/2});
  spawnBlock.call(this);
  scoreText=this.add.text(W/2,20,'0',{fontSize:'40px',color:'#fff',stroke:'#000',strokeThickness:4}).setOrigin(0.5,0);
  this.input.on('pointerdown',()=>{ if(gameOver){restart.call(this);return;} dropBlock.call(this); });
  this.input.keyboard.on('keydown-SPACE',()=>{ if(gameOver){restart.call(this);return;} dropBlock.call(this); });
  Platform.load('stack_best').then(v=>{best=parseInt(v)||0});
  Platform.gameplayStart();
}
function update(){
  if(gameOver||!currentBlock) return;
  const W=this.scale.width;
  currentBlock.sprite.x += speed*dir;
  if(currentBlock.sprite.x - currentBlock.w/2 < 0){ currentBlock.sprite.x=currentBlock.w/2; dir=1; }
  if(currentBlock.sprite.x + currentBlock.w/2 > W){ currentBlock.sprite.x=W-currentBlock.w/2; dir=-1; }
}
function spawnBlock(){
  const W=this.scale.width,H=this.scale.height;
  const prev=blocks[blocks.length-1];
  const y=H-40-blocks.length*40;
  if(y<80){ win.call(this); return; }
  const sprite=this.add.image(W/2,y,'block'); sprite.setDisplaySize(prev.w,40);
  currentBlock={sprite,w:prev.w,prevX:prev.x};
  speed=3+blocks.length*0.15;
}
async function dropBlock(){
  const prev=blocks[blocks.length-1];
  const overlap=Math.min(prev.x+prev.w/2, currentBlock.sprite.x+currentBlock.w/2) - Math.max(prev.x-prev.w/2, currentBlock.sprite.x-currentBlock.w/2);
  if(overlap<=0){ die.call(this); return; }
  const newX=(Math.min(prev.x+prev.w/2,currentBlock.sprite.x+currentBlock.w/2)+Math.max(prev.x-prev.w/2,currentBlock.sprite.x-currentBlock.w/2))/2;
  currentBlock.sprite.x=newX; currentBlock.sprite.setDisplaySize(overlap,40);
  currentBlock.w=overlap; currentBlock.x=newX;
  blocks.push(currentBlock);
  score++; window.__score=score; scoreText.setText(score);
  currentBlock=null;
  spawnBlock.call(this);
}
async function die(){
  gameOver=true; Platform.gameplayStop();
  if(score>best){ best=score; await Platform.save('stack_best',String(best)); await Platform.submitScore(score); }
  scoreText.setText(`Game Over\nHeight: ${score}\nBest: ${best}\nTap to retry`); scoreText.setFontSize(24);
  await Platform.interstitial();
}
async function win(){ gameOver=true; Platform.gameplayStop(); scoreText.setText(`YOU WIN!\nTap for new tower`); await Platform.interstitial(); }
function restart(){
  gameOver=false; score=0; scoreText.setText('0'); scoreText.setFontSize(40);
  blocks.forEach(b=>b.sprite.destroy()); blocks=[]; currentBlock=null;
  const W=this.scale.width,H=this.scale.height;
  const base=this.add.image(W/2,H-40,'block'); base.setDisplaySize(200,40); blocks.push({sprite:base,w:200,x:W/2});
  spawnBlock.call(this); Platform.gameplayStart();
}
