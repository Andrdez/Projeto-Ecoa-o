const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const carryingEl = document.getElementById("carrying");
const remainingEl = document.getElementById("remaining");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayText = document.getElementById("overlay-text");
const startBtn = document.getElementById("start-btn");

const W = canvas.width, H = canvas.height;
const TYPES = {
  papel: { color: "#2879d0", label: "Papel", bin: "#2879d0", emoji: "📄" },
  plastico: { color: "#d94d4d", label: "Plástico", bin: "#d94d4d", emoji: "🧴" },
  vidro: { color: "#269b61", label: "Vidro", bin: "#269b61", emoji: "🍾" },
  metal: { color: "#e8b72e", label: "Metal", bin: "#e8b72e", emoji: "🥫" }
};
const trashSpots = [
  [115,125,"papel"], [235,180,"plastico"], [375,105,"vidro"], [535,145,"metal"],
  [760,115,"papel"], [155,330,"metal"], [330,405,"plastico"], [490,330,"vidro"],
  [710,390,"metal"], [820,500,"plastico"], [390,520,"papel"], [80,510,"vidro"]
];
const binSpots = [
  {x:80,y:245,type:"papel"}, {x:820,y:245,type:"plastico"},
  {x:80,y:430,type:"vidro"}, {x:820,y:430,type:"metal"}
];

let player, vulture, trash, score, lives, carrying, running, won, lastTime;
const keys = {};
let invulnerable = 0;
let message = "";
let messageTimer = 0;

function resetGame() {
  player = { x: 450, y: 300, r: 15, speed: 190, face: 1 };
  vulture = { x: 830, y: 70, r: 18, speed: 103 };
  trash = trashSpots.map(([x,y,type], i) => ({ x, y, type, id:i, taken:false }));
  score = 0; lives = 3; carrying = null; running = true; won = false;
  invulnerable = 0; message = "Encontre um lixo e leve até a lixeira correta!"; messageTimer = 3;
  updateHud();
}
function updateHud() {
  scoreEl.textContent = score;
  livesEl.textContent = "❤️".repeat(lives) || "0";
  carryingEl.textContent = carrying ? TYPES[carrying].label : "Nada";
  remainingEl.textContent = trash.filter(t => !t.taken).length;
}
function say(text) { message = text; messageTimer = 2.2; }

function roundedRect(x,y,w,h,r,color) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x,y,w,h,r); ctx.fill();
}
function drawTown() {
  ctx.fillStyle = "#9fca7c"; ctx.fillRect(0,0,W,H);
  // gramado em pequenos blocos
  ctx.fillStyle = "#8fbd70";
  for (let y=8;y<H;y+=34) for(let x=8;x<W;x+=42) {
    if ((x+y)%3===0) ctx.fillRect(x,y,8,4);
  }
  // ruas
  ctx.fillStyle = "#c9b995"; ctx.fillRect(0,255,W,92); ctx.fillRect(405,0,90,H);
  ctx.fillStyle = "#e6d7b5";
  for(let x=10;x<W;x+=55) ctx.fillRect(x,299,28,4);
  for(let y=10;y<H;y+=55) ctx.fillRect(450,y,4,28);
  // calçadas
  ctx.fillStyle = "#e5d8bd"; ctx.fillRect(0,247,W,8); ctx.fillRect(0,347,W,8);
  ctx.fillRect(397,0,8,H); ctx.fillRect(495,0,8,H);
  // casas e telhados
  const houses = [
    [25,25,125,85,"#e9a36f","#a84d42"], [210,25,135,85,"#e9d18b","#b65b48"],
    [545,25,130,85,"#e9a36f","#9e5947"], [735,25,135,85,"#d7b1e0","#8c5c9d"],
    [25,390,130,90,"#e7d18d","#b85b48"], [205,390,130,90,"#b8d5e9","#527c9a"],
    [545,390,130,90,"#e8b5a0","#a65b4b"], [735,390,140,90,"#d7d99a","#71854b"]
  ];
  for(const [x,y,w,h,wall,roof] of houses) {
    roundedRect(x+5,y+8,w,h,8,"#6f965b");
    roundedRect(x,y,w,h,7,wall);
    ctx.fillStyle=roof; ctx.beginPath(); ctx.moveTo(x-5,y+18); ctx.lineTo(x+w/2,y-9); ctx.lineTo(x+w+5,y+18); ctx.closePath(); ctx.fill();
    ctx.fillStyle="#fff1c9"; ctx.fillRect(x+18,y+35,24,22); ctx.fillRect(x+w-42,y+35,24,22);
    ctx.fillStyle="#7b5942"; ctx.fillRect(x+w/2-10,y+h-35,20,35);
  }
  // árvores e arbustos
  const trees = [[180,145],[300,135],[600,175],[700,300],[270,500],[600,525],[860,330],[35,175]];
  for(const [x,y] of trees) {
    ctx.fillStyle="#795338"; ctx.fillRect(x-5,y+5,10,18);
    ctx.fillStyle="#397d4c"; ctx.beginPath(); ctx.arc(x,y,19,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#5c9a55"; ctx.beginPath(); ctx.arc(x-7,y-7,9,0,Math.PI*2); ctx.fill();
  }
  // praça central
  ctx.fillStyle="#c7d9a0"; ctx.beginPath(); ctx.arc(450,300,37,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#8eb66c"; ctx.beginPath(); ctx.arc(450,300,25,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#e7d9b9"; ctx.fillRect(445,267,10,66);
  ctx.fillRect(417,295,66,10);
}
function drawBins() {
  for(const b of binSpots) {
    ctx.save(); ctx.translate(b.x,b.y);
    ctx.fillStyle="#00000022"; ctx.fillRect(-16,18,34,5);
    ctx.fillStyle=TYPES[b.type].bin; ctx.fillRect(-14,-10,28,28);
    ctx.fillStyle="#f6f2dd"; ctx.fillRect(-17,-14,34,6);
    ctx.fillStyle="#ffffff"; ctx.font="bold 11px Arial"; ctx.textAlign="center";
    ctx.fillText(b.type==="papel"?"P":b.type==="plastico"?"P":b.type==="vidro"?"V":"M",0,8);
    ctx.restore();
  }
}
function drawTrash() {
  for(const t of trash) if(!t.taken) {
    ctx.save(); ctx.translate(t.x,t.y);
    ctx.fillStyle="#00000025"; ctx.beginPath(); ctx.ellipse(0,9,11,5,0,0,Math.PI*2); ctx.fill();
    ctx.font="20px Arial"; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText(TYPES[t.type].emoji,0,0); ctx.restore();
  }
}
function drawPlayer() {
  ctx.save(); ctx.translate(player.x,player.y);
  if(invulnerable>0 && Math.floor(invulnerable*10)%2===0) ctx.globalAlpha=.45;
  // sombra e corpo
  ctx.fillStyle="#0000002a"; ctx.beginPath(); ctx.ellipse(0,13,15,7,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#a9a9a9"; ctx.beginPath(); ctx.ellipse(0,1,13,15,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#d9d9d9"; ctx.beginPath(); ctx.arc(0,-8,12,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#e9a3b0"; ctx.beginPath(); ctx.arc(-9,-17,6,0,Math.PI*2); ctx.arc(9,-17,6,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#262626"; ctx.beginPath(); ctx.arc(-4,-9,1.8,0,Math.PI*2); ctx.arc(4,-9,1.8,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#d77b8c"; ctx.beginPath(); ctx.arc(0,-3,3,0,Math.PI*2); ctx.fill();
  if(carrying) { ctx.font="17px Arial"; ctx.textAlign="center"; ctx.fillText(TYPES[carrying].emoji,18,-20); }
  ctx.restore();
}
function drawVulture() {
  ctx.save(); ctx.translate(vulture.x,vulture.y);
  ctx.fillStyle="#0000002b"; ctx.beginPath(); ctx.ellipse(0,15,20,7,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#393d3b"; ctx.beginPath(); ctx.ellipse(0,0,15,19,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#555b57"; ctx.beginPath(); ctx.ellipse(-14,-3,12,7,-.4,0,Math.PI*2); ctx.ellipse(14,-3,12,7,.4,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#bd7770"; ctx.beginPath(); ctx.arc(0,-15,10,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#f4d65a"; ctx.beginPath(); ctx.arc(-4,-17,2,0,Math.PI*2); ctx.arc(4,-17,2,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#e5b83d"; ctx.beginPath(); ctx.moveTo(-4,-10); ctx.lineTo(4,-10); ctx.lineTo(0,-3); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function draw() {
  drawTown(); drawBins(); drawTrash(); drawVulture(); drawPlayer();
  if(messageTimer>0) {
    roundedRect(205,12,490,34,10,"#173b35dd");
    ctx.fillStyle="#fff8e8"; ctx.font="bold 15px Arial"; ctx.textAlign="center";
    ctx.fillText(message,450,34);
  }
}
function distance(a,b) { return Math.hypot(a.x-b.x,a.y-b.y); }
function movePlayer(dt) {
  let dx=0,dy=0;
  if(keys.ArrowLeft||keys.a||keys.A) dx--;
  if(keys.ArrowRight||keys.d||keys.D) dx++;
  if(keys.ArrowUp||keys.w||keys.W) dy--;
  if(keys.ArrowDown||keys.s||keys.S) dy++;
  const len=Math.hypot(dx,dy)||1;
  const speed=carrying ? player.speed*.82 : player.speed;
  player.x += dx/len*speed*dt; player.y += dy/len*speed*dt;
  player.x=Math.max(18,Math.min(W-18,player.x));
  player.y=Math.max(18,Math.min(H-18,player.y));
}
function moveVulture(dt) {
  const dx=player.x-vulture.x, dy=player.y-vulture.y;
  const len=Math.hypot(dx,dy)||1;
  vulture.x += dx/len*vulture.speed*dt;
  vulture.y += dy/len*vulture.speed*dt;
}
function interact() {
  if(!running) return;
  if(!carrying) {
    const nearest=trash.filter(t=>!t.taken).sort((a,b)=>distance(player,a)-distance(player,b))[0];
    if(nearest && distance(player,nearest)<34) {
      nearest.taken=true; carrying=nearest.type; say("Você pegou: "+TYPES[carrying].label+"!");
    } else say("Chegue pertinho de um lixo para recolher.");
  } else {
    const bin=binSpots.find(b=>b.type===carrying && distance(player,b)<43);
    if(bin) {
      score+=100; carrying=null; say("Muito bem! Descarte correto: +100 pontos!");
      updateHud();
      if(trash.every(t=>t.taken)) finish(true);
    } else if(binSpots.some(b=>distance(player,b)<43)) {
      say("Essa não é a lixeira correta!");
    } else say("Leve o lixo até a lixeira da cor correspondente.");
  }
  updateHud();
}
function finish(win) {
  running=false; won=win; overlay.classList.remove("hidden");
  overlayTitle.textContent=win?"Cidade limpa! Você venceu!":"Fim de jogo!";
  overlayText.textContent=win?"Parabéns! Você reciclou todos os resíduos e salvou a cidade.":"O urubu conseguiu alcançar você. Tente novamente e deixe a cidade limpinha!";
  startBtn.textContent="Jogar novamente";
}
function update(dt) {
  if(!running) return;
  movePlayer(dt); moveVulture(dt);
  if(invulnerable>0) invulnerable-=dt;
  if(messageTimer>0) messageTimer-=dt;
  if(distance(player,vulture)<player.r+vulture.r && invulnerable<=0) {
    lives--; invulnerable=2;
    // afasta o urubu para dar chance de escapar
    const dx=vulture.x-player.x,dy=vulture.y-player.y,len=Math.hypot(dx,dy)||1;
    vulture.x=Math.max(20,Math.min(W-20,player.x+dx/len*115));
    vulture.y=Math.max(20,Math.min(H-20,player.y+dy/len*115));
    say("Cuidado com o urubu! Você perdeu uma vida.");
    updateHud();
    if(lives<=0) finish(false);
  }
}
function loop(timestamp) {
  const dt=Math.min((timestamp-lastTime)/1000||0,0.04); lastTime=timestamp;
  update(dt); draw(); requestAnimationFrame(loop);
}
document.addEventListener("keydown",e=>{
  if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)) e.preventDefault();
  keys[e.key]=true;
  if(e.key===" " && !e.repeat) interact();
});
document.addEventListener("keyup",e=>keys[e.key]=false);
startBtn.addEventListener("click",()=>{
  resetGame(); overlay.classList.add("hidden");
});
resetGame(); running=false;
requestAnimationFrame(t=>{lastTime=t; loop(t);});
