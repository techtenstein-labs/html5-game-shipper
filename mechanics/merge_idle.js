// MECHANIC: merge_idle — 2048-style, drag identical to merge, higher tier = score
const SIZE=4, CELL=80;
let grid=[],score=0,best=0,scoreText,gameOver=false;
const GAME_CONFIG={type:Phaser.AUTO,parent:'game',
  scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH},
  backgroundColor:'{{BG_HEX}}',scene:{preload,create,update}};
function preload(){
  const g=this.add.graphics();
  const colors=[0x333,0xffa726,0xff5252,0xab47bc,0x42a5f5,0x66bb6a,0xffee58,0xff9800,0xd32f2f,0x7b1fa2,0x1976d2,0x388e3c];
  colors.forEach((c,i)=>{ g.fillStyle(c); g.fillRoundedRect(0,0,CELL-6,CELL-6,8); g.generateTexture('t'+i,CELL-6,CELL-6); g.clear(); });
  g.destroy();
}
function create(){
  const W=this.scale.width,H=this.scale.height;
  this.offsetX=(W-SIZE*CELL)/2; this.offsetY=(H-SIZE*CELL)/2+20;
  grid=Array(SIZE).fill().map(()=>Array(SIZE).fill(0));
  // Draw board bg
  const bg=this.add.rectangle(W/2, this.offsetY+SIZE*CELL/2, SIZE*CELL+16, SIZE*CELL+16, 0x000000, 0.3);
  addTile.call(this); addTile.call(this); redraw.call(this);
  scoreText=this.add.text(W/2,30,'0',{fontSize:'32px',color:'#fff',stroke:'#000',strokeThickness:4}).setOrigin(0.5,0);
  // Swipe
  let sx=0,sy=0;
  this.input.on('pointerdown',p=>{ if(gameOver){restart.call(this);return;} sx=p.x;sy=p.y; });
  this.input.on('pointerup',p=>{ if(gameOver) return; const dx=p.x-sx,dy=p.y-sy; if(Math.abs(dx)<20&&Math.abs(dy)<20) return;
    if(Math.abs(dx)>Math.abs(dy)) move.call(this, dx>0?'right':'left'); else move.call(this, dy>0?'down':'up');
  });
  this.input.keyboard.on('keydown',e=>{ if(gameOver){restart.call(this);return;}
    if(e.code==='ArrowLeft') move.call(this,'left'); if(e.code==='ArrowRight') move.call(this,'right');
    if(e.code==='ArrowUp') move.call(this,'up'); if(e.code==='ArrowDown') move.call(this,'down');
  });
  Platform.load('merge_best').then(v=>{best=parseInt(v)||0});
  Platform.gameplayStart();
}
function update(){}
function addTile(){
  const empty=[];
  for(let r=0;r<SIZE;r++) for(let c=0;c<SIZE;c++) if(grid[r][c]===0) empty.push([r,c]);
  if(empty.length===0) return;
  const [r,c]=empty[Math.floor(Math.random()*empty.length)];
  grid[r][c]=Math.random()<0.9?1:2;
}
function redraw(){
  if(this.tiles) this.tiles.forEach(t=>t.destroy());
  this.tiles=[];
  for(let r=0;r<SIZE;r++) for(let c=0;c<SIZE;c++){
    if(grid[r][c]>0){
      const x=this.offsetX+c*CELL+CELL/2, y=this.offsetY+r*CELL+CELL/2;
      const spr=this.add.image(x,y,'t'+Math.min(grid[r][c],11));
      const val=Math.pow(2,grid[r][c]);
      const txt=this.add.text(x,y,val,{fontSize:'20px',color:'#fff',stroke:'#000',strokeThickness:3}).setOrigin(0.5);
      this.tiles.push(spr); this.tiles.push(txt);
    }
  }
}
function move(dir){
  let moved=false;
  const rotate=arr=>arr[0].map((_,i)=>arr.map(r=>r[i]));
  const reverse=arr=>arr.map(r=>[...r].reverse());
  let g=grid.map(r=>[...r]);
  if(dir==='up'){ g=rotate(g); }
  if(dir==='down'){ g=rotate(reverse(g)); }
  if(dir==='right'){ g=reverse(g); }
  for(let r=0;r<SIZE;r++){
    const line=g[r].filter(v=>v);
    for(let i=0;i<line.length-1;i++) if(line[i]===line[i+1]){ line[i]++; score+=Math.pow(2,line[i]); line.splice(i+1,1); }
    while(line.length<SIZE) line.push(0);
    if(g[r].join(',')!==line.join(',')) moved=true;
    g[r]=line;
  }
  if(dir==='right') g=reverse(g);
  if(dir==='down') g=reverse(rotate(g).reverse().map(r=>r.reverse())); // simplified
  if(dir==='up'){ g=rotate(g); g=rotate(rotate(g).reverse().map(r=>[...r].reverse())); }
  // Simpler: just rotate back
  if(dir==='up'||dir==='down'){ g=rotate(rotate(rotate(g))); if(dir==='down') g=g.reverse().map(r=>[...r].reverse()); }
  grid=g;
  if(moved){ addTile.call(this); window.__score=score; scoreText.setText(score); redraw.call(this); if(isGameOver()) die.call(this); }
}
function isGameOver(){
  for(let r=0;r<SIZE;r++) for(let c=0;c<SIZE;c++){
    if(grid[r][c]===0) return false;
    if(c<SIZE-1 && grid[r][c]===grid[r][c+1]) return false;
    if(r<SIZE-1 && grid[r][c]===grid[r+1][c]) return false;
  }
  return true;
}
async function die(){
  gameOver=true; Platform.gameplayStop();
  if(score>best){ best=score; await Platform.save('merge_best',String(best)); await Platform.submitScore(score); }
  scoreText.setText(`Game Over\nScore: ${score}\nBest: ${best}\nTap to retry`); scoreText.setFontSize(22);
  await Platform.interstitial();
}
function restart(){
  gameOver=false;score=0;scoreText.setText('0');scoreText.setFontSize(32);
  grid=Array(SIZE).fill().map(()=>Array(SIZE).fill(0));
  addTile.call(this); addTile.call(this); redraw.call(this);
  Platform.gameplayStart();
}
