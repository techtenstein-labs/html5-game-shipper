// MECHANIC: match3_puzzle — 6x8 grid, swap adjacent, match 3+, move budget
const COLS=6,ROWS=8,GEM=48;
const GEMS=[0xff5252,0x42a5f5,0xffee58,0x66bb6a,0xab47bc,0xff9800];
let grid=[],selected=null,moves=25,score=0,best=0,scoreText,movesText,gameOver=false;
const GAME_CONFIG={type:Phaser.AUTO,parent:'game',
  scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH},
  backgroundColor:'{{BG_HEX}}',scene:{preload,create,update}};
function preload(){
  const g=this.add.graphics();
  GEMS.forEach((c,i)=>{ g.fillStyle(c); g.fillRoundedRect(2,2,GEM-4,GEM-4,6); g.lineStyle(2,0x000000,0.3); g.strokeRoundedRect(2,2,GEM-4,GEM-4,6); g.generateTexture('g'+i,GEM,GEM); g.clear(); });
  g.destroy();
}
function create(){
  const W=this.scale.width,H=this.scale.height;
  this.offsetX=(W-COLS*GEM)/2; this.offsetY=90;
  grid=Array(ROWS).fill().map(()=> Array(COLS).fill(0).map(()=>Phaser.Math.Between(0,GEMS.length-1)));
  removeInitialMatches.call(this);
  redraw.call(this);
  scoreText=this.add.text(W/2,20,'0',{fontSize:'32px',color:'#fff',stroke:'#000',strokeThickness:4}).setOrigin(0.5,0);
  movesText=this.add.text(W/2,55,`Moves: 25`,{fontSize:'20px',color:'#fff',stroke:'#000',strokeThickness:3}).setOrigin(0.5,0);
  Platform.load('match3_best').then(v=>{best=parseInt(v)||0});
  Platform.gameplayStart();
}
function update(){}
function removeInitialMatches(){
  let removed=true; while(removed){ removed=false;
    for(let r=0;r<ROWS;r++) for(let c=0;c<COLS-2;c++) if(grid[r][c]===grid[r][c+1]&&grid[r][c]===grid[r][c+2]){ grid[r][c]=(grid[r][c]+1)%GEMS.length; removed=true; }
    for(let c=0;c<COLS;c++) for(let r=0;r<ROWS-2;r++) if(grid[r][c]===grid[r+1][c]&&grid[r][c]===grid[r+2][c]){ grid[r][c]=(grid[r][c]+1)%GEMS.length; removed=true; }
  }
}
function redraw(){
  if(this.gems) this.gems.forEach(g=>g.destroy());
  this.gems=[];
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) if(grid[r][c]>=0){
    const x=this.offsetX+c*GEM+GEM/2, y=this.offsetY+r*GEM+GEM/2;
    const spr=this.add.image(x,y,'g'+grid[r][c]).setInteractive();
    spr.gridR=r; spr.gridC=c;
    spr.on('pointerdown',()=>{ if(gameOver){ restart.call(this); return; } handleTap.call(this,spr); });
    this.gems.push(spr);
  }
}
function handleTap(spr){
  if(!selected){ selected=spr; spr.setScale(1.15); return; }
  if(selected===spr){ selected.setScale(1); selected=null; return; }
  const isAdj = Math.abs(selected.gridR-spr.gridR)+Math.abs(selected.gridC-spr.gridC)===1;
  if(!isAdj){ selected.setScale(1); selected=spr; spr.setScale(1.15); return; }
  const [r1,c1,r2,c2]=[selected.gridR,selected.gridC,spr.gridR,spr.gridC];
  [grid[r1][c1],grid[r2][c2]]=[grid[r2][c2],grid[r1][c1]];
  const matches=findMatches();
  if(matches.length===0){ [grid[r1][c1],grid[r2][c2]]=[grid[r2][c2],grid[r1][c1]]; selected.setScale(1); selected=null; return; }
  selected.setScale(1); selected=null; moves--; movesText.setText(`Moves: ${moves}`);
  resolve.call(this);
}
function findMatches(){
  const m=[];
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS-2;c++) if(grid[r][c]>=0 && grid[r][c]===grid[r][c+1] && grid[r][c]===grid[r][c+2]) m.push([r,c],[r,c+1],[r,c+2]);
  for(let c=0;c<COLS;c++) for(let r=0;r<ROWS-2;r++) if(grid[r][c]>=0 && grid[r][c]===grid[r+1][c] && grid[r][c]===grid[r+2][c]) m.push([r,c],[r+1,c],[r+2,c]);
  return m;
}
function resolve(){
  let m=findMatches();
  while(m.length){
    m.forEach(([r,c])=>{ grid[r][c]=-1; score+=5; });
    window.__score=score; scoreText.setText(score);
    // Fall
    for(let c=0;c<COLS;c++){ let empty=[]; for(let r=ROWS-1;r>=0;r--){ if(grid[r][c]<0) empty.push(r); else if(empty.length){ grid[empty.shift()][c]=grid[r][c]; grid[r][c]=-1; empty.push(r); } } for(const r of empty) grid[r][c]=Phaser.Math.Between(0,GEMS.length-1); }
    m=findMatches();
  }
  redraw.call(this);
  if(moves<=0) die.call(this);
}
async function die(){
  gameOver=true; Platform.gameplayStop();
  if(score>best){ best=score; await Platform.save('match3_best',String(best)); await Platform.submitScore(score); }
  scoreText.setText(`Game Over\nScore: ${score}\nBest: ${best}\nTap`); scoreText.setFontSize(22);
  await Platform.interstitial();
}
function restart(){ gameOver=false; score=0; moves=25; scoreText.setText('0'); scoreText.setFontSize(32); movesText.setText('Moves: 25');
  grid=Array(ROWS).fill().map(()=> Array(COLS).fill(0).map(()=>Phaser.Math.Between(0,GEMS.length-1)));
  removeInitialMatches.call(this); redraw.call(this); Platform.gameplayStart(); }
