// MECHANIC: bubble_shooter — aim + shoot bubble to match 3+ same color, clear board
const BS=32,ROWS=8,COLS=10;
const COLORS=[0xff5252,0x42a5f5,0xffee58,0x66bb6a,0xab47bc];
let grid=[],shooter,currentBubble,scoreText,score=0,best=0,gameOver=false;
const GAME_CONFIG={type:Phaser.AUTO,parent:'game',
  scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH},
  backgroundColor:'{{BG_HEX}}',
  physics:{default:'arcade',arcade:{gravity:{y:0}}},
  scene:{preload,create,update}};
function preload(){
  const g=this.add.graphics();
  COLORS.forEach((c,i)=>{ g.fillStyle(c); g.fillCircle(BS/2,BS/2,BS/2-2); g.lineStyle(2,0x000000,0.3); g.strokeCircle(BS/2,BS/2,BS/2-2); g.generateTexture('b'+i,BS,BS); g.clear(); });
  g.destroy();
}
function create(){
  const W=this.scale.width,H=this.scale.height;
  this.offsetX=(W-COLS*BS)/2; this.offsetY=60;
  grid=Array(ROWS).fill().map(()=>Array(COLS).fill(-1));
  for(let r=0;r<4;r++) for(let c=0;c<COLS;c++) grid[r][c]=Phaser.Math.Between(0,COLORS.length-1);
  redraw.call(this);
  shooter={x:W/2,y:H-40};
  spawnBubble.call(this);
  scoreText=this.add.text(W/2,20,'0',{fontSize:'24px',color:'#fff',stroke:'#000',strokeThickness:3}).setOrigin(0.5,0);
  this.aimLine=this.add.graphics();
  this.input.on('pointermove',p=>{ if(gameOver||!currentBubble) return; drawAim.call(this,p); });
  this.input.on('pointerdown',p=>{ if(gameOver){restart.call(this);return;} if(currentBubble && p.y<shooter.y-20) fireBubble.call(this,p); });
  Platform.load('bubble_best').then(v=>{best=parseInt(v)||0});
  Platform.gameplayStart();
}
function update(){}
function redraw(){
  if(this.gridSprites) this.gridSprites.forEach(s=>s.destroy());
  this.gridSprites=[];
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) if(grid[r][c]>=0){
    const x=this.offsetX+c*BS+BS/2, y=this.offsetY+r*BS+BS/2;
    this.gridSprites.push(this.add.image(x,y,'b'+grid[r][c]));
  }
}
function spawnBubble(){
  const color=Phaser.Math.Between(0,COLORS.length-1);
  currentBubble=this.physics.add.image(shooter.x,shooter.y,'b'+color);
  currentBubble.colorIdx=color; currentBubble.body.setCircle(BS/2-2);
  currentBubble.setCollideWorldBounds(true); currentBubble.setBounce(1,0);
}
function drawAim(p){
  this.aimLine.clear();
  this.aimLine.lineStyle(2,0xffffff,0.3);
  this.aimLine.beginPath(); this.aimLine.moveTo(shooter.x,shooter.y); this.aimLine.lineTo(p.x,p.y); this.aimLine.strokePath();
}
function fireBubble(p){
  const dx=p.x-shooter.x, dy=p.y-shooter.y; const mag=Math.hypot(dx,dy);
  currentBubble.setVelocity(dx/mag*600, dy/mag*600);
  const b=currentBubble; currentBubble=null;
  const check=this.time.addEvent({delay:50,loop:true,callback:()=>{
    const gc=Math.round((b.x-this.offsetX-BS/2)/BS), gr=Math.round((b.y-this.offsetY-BS/2)/BS);
    if(gr<0 || (gr<ROWS && gc>=0 && gc<COLS && grid[gr][gc]===-1 && (b.y-shooter.y<-10 || anyNeighbor.call(this,gr,gc)))){
      grid[Math.max(0,gr)][Math.max(0,Math.min(COLS-1,gc))]=b.colorIdx; b.destroy(); check.remove();
      const matched=findMatches.call(this,Math.max(0,gr),Math.max(0,Math.min(COLS-1,gc)),b.colorIdx);
      if(matched.length>=3){ matched.forEach(([r,c])=>grid[r][c]=-1); score+=matched.length*10; window.__score=score; scoreText.setText(score); }
      redraw.call(this);
      if(isCleared()) win.call(this);
      else spawnBubble.call(this);
    }
    if(b.y > this.scale.height+50){ b.destroy(); check.remove(); spawnBubble.call(this); }
  }});
}
function anyNeighbor(r,c){ const dirs=[[-1,0],[1,0],[0,-1],[0,1]]; return dirs.some(([dr,dc])=> r+dr>=0 && r+dr<ROWS && c+dc>=0 && c+dc<COLS && grid[r+dr][c+dc]>=0); }
function findMatches(r,c,color,seen=new Set()){
  const key=r+','+c; if(seen.has(key) || r<0||r>=ROWS||c<0||c>=COLS || grid[r][c]!==color) return [];
  seen.add(key); return [[r,c], ...findMatches(r-1,c,color,seen), ...findMatches(r+1,c,color,seen), ...findMatches(r,c-1,color,seen), ...findMatches(r,c+1,color,seen)];
}
function isCleared(){ return grid.every(row=>row.every(v=>v===-1)); }
async function win(){ score+=100; scoreText.setText(score); if(score>best){best=score; await Platform.save('bubble_best',String(best)); await Platform.submitScore(score);} scoreText.setText(`CLEARED!\nScore: ${score}\nTap next`); await Platform.interstitial(); gameOver=true; }
async function die(){ gameOver=true; Platform.gameplayStop(); if(score>best){best=score; await Platform.save('bubble_best',String(best));} await Platform.interstitial(); }
function restart(){
  gameOver=false; score=0; scoreText.setText('0');
  grid=Array(ROWS).fill().map(()=>Array(COLS).fill(-1));
  for(let r=0;r<4;r++) for(let c=0;c<COLS;c++) grid[r][c]=Phaser.Math.Between(0,COLORS.length-1);
  redraw.call(this); spawnBubble.call(this); Platform.gameplayStart();
}
