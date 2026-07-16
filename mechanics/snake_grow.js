// MECHANIC: snake_grow — grid snake, swipe controls, procedural food
const GRID = 20, CELL = 20;
let snake=[], food=null, dir={x:1,y:0}, nextDir=null, gameOver=false, score=0, best=0, moveTimer;
const GAME_CONFIG = {
  type: Phaser.AUTO, parent:'game',
  scale:{mode:Phaser.Scale.RESIZE, autoCenter:Phaser.Scale.CENTER_BOTH},
  backgroundColor:'{{BG_HEX}}', scene:{preload,create,update}
};
function preload(){
  const g=this.add.graphics();
  g.fillStyle(parseInt('{{ACCENT_HEX}}'.slice(1),16)); g.fillRect(0,0,CELL-2,CELL-2); g.generateTexture('seg',CELL-2,CELL-2); g.clear();
  g.fillStyle(0xff3355); g.fillRect(0,0,CELL-2,CELL-2); g.generateTexture('food',CELL-2,CELL-2); g.destroy();
}
function create(){
  const W=this.scale.width, H=this.scale.height;
  const cols=Math.floor(W/CELL), rows=Math.floor(H/CELL);
  this.cols=cols; this.rows=rows;
  snake=[{x:Math.floor(cols/2),y:Math.floor(rows/2)}];
  for(let i=1;i<4;i++) snake.push({x:snake[0].x-i,y:snake[0].y});
  spawnFood.call(this);
  this.segs=[]; drawSnake.call(this);
  this.foodSprite=this.add.image(food.x*CELL+CELL/2, food.y*CELL+CELL/2,'food');
  this.scoreText=this.add.text(W/2,20,'0',{fontSize:'32px',color:'#fff',stroke:'#000',strokeThickness:4}).setOrigin(0.5,0);
  Platform.load('snake_best').then(v=>{best=parseInt(v)||0});
  Platform.gameplayStart();
  // Swipe input
  let startX=0,startY=0;
  this.input.on('pointerdown',(p)=>{ if(gameOver){restart.call(this);return;} startX=p.x;startY=p.y; });
  this.input.on('pointerup',(p)=>{ if(gameOver) return; const dx=p.x-startX,dy=p.y-startY;
    if(Math.abs(dx)<20&&Math.abs(dy)<20) return;
    if(Math.abs(dx)>Math.abs(dy)) nextDir={x:dx>0?1:-1,y:0}; else nextDir={x:0,y:dy>0?1:-1};
  });
  this.input.keyboard.on('keydown',e=>{ if(gameOver){restart.call(this);return;}
    if(e.code==='ArrowUp') nextDir={x:0,y:-1}; if(e.code==='ArrowDown') nextDir={x:0,y:1};
    if(e.code==='ArrowLeft') nextDir={x:-1,y:0}; if(e.code==='ArrowRight') nextDir={x:1,y:0};
  });
  moveTimer=this.time.addEvent({delay:120,callback:tick,callbackScope:this,loop:true});
}
function update(){}
function tick(){
  if(gameOver) return;
  if(nextDir && !(nextDir.x===-dir.x && nextDir.y===-dir.y)) dir=nextDir;
  const head={x:snake[0].x+dir.x, y:snake[0].y+dir.y};
  if(head.x<0||head.x>=this.cols||head.y<0||head.y>=this.rows||snake.some(s=>s.x===head.x&&s.y===head.y)){ die.call(this); return; }
  snake.unshift(head);
  if(head.x===food.x && head.y===food.y){ score++; window.__score=score; this.scoreText.setText(score); spawnFood.call(this); this.foodSprite.setPosition(food.x*CELL+CELL/2,food.y*CELL+CELL/2); }
  else snake.pop();
  drawSnake.call(this);
}
function drawSnake(){ this.segs.forEach(s=>s.destroy()); this.segs=snake.map(s=>this.add.image(s.x*CELL+CELL/2,s.y*CELL+CELL/2,'seg')); }
function spawnFood(){ do{ food={x:Phaser.Math.Between(0,this.cols-1),y:Phaser.Math.Between(0,this.rows-1)}; } while(snake.some(s=>s.x===food.x&&s.y===food.y)); }
async function die(){
  gameOver=true; Platform.gameplayStop(); moveTimer.remove();
  if(score>best){ best=score; await Platform.save('snake_best',String(best)); await Platform.submitScore(score); }
  this.scoreText.setText(`Game Over\nScore: ${score}\nBest: ${best}\nTap to retry`); this.scoreText.setFontSize(22);
  await Platform.interstitial();
}
function restart(){ gameOver=false;score=0;this.scoreText.setText('0');this.scoreText.setFontSize(32); snake=[{x:Math.floor(this.cols/2),y:Math.floor(this.rows/2)}];
  for(let i=1;i<4;i++) snake.push({x:snake[0].x-i,y:snake[0].y}); dir={x:1,y:0};nextDir=null; spawnFood.call(this); this.foodSprite.setPosition(food.x*CELL+CELL/2,food.y*CELL+CELL/2); drawSnake.call(this);
  moveTimer=this.time.addEvent({delay:120,callback:tick,callbackScope:this,loop:true}); Platform.gameplayStart();
}
