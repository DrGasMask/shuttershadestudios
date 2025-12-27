// --- GLOBAL GAME STATE ---
let gameStarted = false;
let keys = {};
let cameraX = 0;
let levelWidth = 2000; // Longer levels
let playerStart = { x: 50, y: 350 };

// --- 1. High-DPI Canvas Setup ---
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const dpr = window.devicePixelRatio || 1;
const logicalWidth = 800;
const logicalHeight = 450;

canvas.width = logicalWidth * dpr;
canvas.height = logicalHeight * dpr;
canvas.style.width = `${logicalWidth}px`;
canvas.style.height = `${logicalHeight}px`;
ctx.scale(dpr, dpr);
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = "high";

// --- 2. Player Setup ---
const player = {
    x: playerStart.x,
    y: playerStart.y,
    width: 48,
    height: 48,
    velX: 0,
    velY: 0,
    speed: 3,
    jumpStrength: 10,
    gravity: 0.4,
    onGround: false,
    facingRight: true,
    canDoubleJump: true,
    isCrouching: false,
};

// --- Sprites ---
const idleFrames = [], runFrames = [], jumpFrames = [], crouchFrames = [];
for (let i = 0; i < 2; i++) { let img = new Image(); img.src = `images/player_idle${i}.png`; idleFrames.push(img); }
for (let i = 0; i < 5; i++) { let img = new Image(); img.src = `images/player_run${i}.png`; runFrames.push(img); }
for (let i = 0; i < 2; i++) { let img = new Image(); img.src = `images/player_jump${i}.png`; jumpFrames.push(img); }
for (let i = 0; i < 1; i++) { let img = new Image(); img.src = `images/player_crouch${i}.png`; crouchFrames.push(img); }

let idleIndex=0, idleTimer=0, runIndex=0, runTimer=0, jumpIndex=0, jumpTimer=0;

// --- Level Generation ---
let platforms = [];
let spikes = [];
let enemies = [];
let walls = [];
let finishBlock = { x: levelWidth - 100, y: 200, width: 50, height: 50, baseY: 200 };

function generateLevel() {
    platforms = [
        { x: 0, y: 400, width: levelWidth, height: 20 },
    ];

    spikes = [];
    enemies = [];
    walls = [];

    // Random spikes
    for (let i = 0; i < 4; i++) {
        let x = 200 + Math.random() * (levelWidth - 400);
        spikes.push({ x, y: 380, width: 20, height: 20 });
    }

    // Enemies
    for (let i = 0; i < 3; i++) {
        let x = 200 + Math.random() * (levelWidth - 400);
        let y = 350;
        let dir = Math.random() < 0.5 ? 1 : -1;
        enemies.push({ x, y, width: 40, height: 40, speed: 1.5, dir });
    }

    // Walls
    for (let i = 0; i < 2; i++) {
        let x = 300 + Math.random() * (levelWidth - 600);
        walls.push({ x, y: 300, width: 20, height: 100 });
    }

    // Finish block
    finishBlock.baseY = 200 + Math.random() * 50;
    finishBlock.y = finishBlock.baseY;

    // Reset player
    player.x = playerStart.x;
    player.y = playerStart.y;
    player.velX = 0;
    player.velY = 0;
    player.onGround = false;
    player.canDoubleJump = true;
    cameraX = 0;
}

// --- Input Handling ---
document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);

// --- Game Loop & Physics ---
function update() {
    if (!gameStarted) return;

    // --- Player Movement ---
    player.isCrouching = keys["KeyC"];
    const isSlow = keys["KeyS"];
    const speedMult = isSlow ? 0.5 : 1;

    if (keys["KeyA"]) { player.velX = -player.speed * speedMult; player.facingRight=false; }
    else if (keys["KeyD"]) { player.velX = player.speed * speedMult; player.facingRight=true; }
    else player.velX = 0;

    // Jumping
    if (keys["Space"]) {
        if (player.onGround) {
            player.velY = -player.jumpStrength;
            player.onGround = false;
            player.canDoubleJump = true;
        } else if (player.canDoubleJump) {
            player.velY = -player.jumpStrength;
            player.canDoubleJump = false;
        }
    }

    // Gravity
    player.velY += player.gravity;
    player.x += player.velX;
    player.y += player.velY;

    // Platform collision
    player.onGround = false;
    platforms.forEach(p => {
        if (player.x < p.x + p.width && player.x + player.width > p.x &&
            player.y + player.height <= p.y + 10 && player.y + player.height + player.velY >= p.y) {
            player.y = p.y - player.height;
            player.velY = 0;
            player.onGround = true;
        }
    });

    // Spikes/Enemies collision (reset player)
    const resetPlayer = obj => {
        if (player.x < obj.x + obj.width &&
            player.x + player.width > obj.x &&
            player.y < obj.y + obj.height &&
            player.y + player.height > obj.y) {
            player.x = playerStart.x;
            player.y = playerStart.y;
            player.velX = 0;
            player.velY = 0;
            player.onGround = false;
            player.canDoubleJump = true;
        }
    };

    spikes.forEach(resetPlayer);
    enemies.forEach(resetPlayer);
    walls.forEach(resetPlayer);

    // Enemy movement (patrolling)
    enemies.forEach(e => {
        e.x += e.speed * e.dir;
        if (e.x < 200 || e.x > levelWidth - 200) e.dir *= -1;
    });

    // Finish collision
    if (player.x < finishBlock.x + finishBlock.width &&
        player.x + player.width > finishBlock.x &&
        player.y < finishBlock.y + finishBlock.height &&
        player.y + player.height > finishBlock.y) {
        generateLevel();
    }

    // Camera follows player
    cameraX = Math.max(0, Math.min(player.x - 200, levelWidth - logicalWidth));

    draw();
    requestAnimationFrame(update);
}

// --- Drawing ---
function drawPlayer() {
    let currentSprite;
    const runSpeed = 8, jumpSpeed = 20;

    if (player.isCrouching) currentSprite = crouchFrames[0];
    else if (!player.onGround) {
        jumpTimer++;
        if (jumpTimer >= jumpSpeed) { jumpTimer=0; jumpIndex=(jumpIndex+1)%jumpFrames.length; }
        currentSprite = jumpFrames[jumpIndex];
    } else if (player.velX !==0) {
        runTimer++;
        if (runTimer >= runSpeed) { runTimer=0; runIndex=(runIndex+1)%runFrames.length; }
        currentSprite = runFrames[runIndex];
    } else {
        idleTimer++;
        if (idleTimer >= 30) { idleTimer=0; idleIndex=(idleIndex+1)%idleFrames.length; }
        currentSprite = idleFrames[idleIndex];
    }

    if (!currentSprite.complete) return;

    ctx.save();
    const drawX = player.x - cameraX;
    const drawY = player.y;

    if (!player.facingRight) {
        ctx.translate(drawX + player.width, drawY);
        ctx.scale(-1,1);
        ctx.drawImage(currentSprite,0,0,player.width,player.height);
    } else ctx.drawImage(currentSprite, drawX, drawY, player.width, player.height);

    ctx.restore();
}

function draw() {
    ctx.clearRect(0,0,logicalWidth,logicalHeight);

    // Platforms
    ctx.fillStyle = "#2e8b57";
    platforms.forEach(p => ctx.fillRect(p.x - cameraX, p.y, p.width, p.height));

    // Spikes
    ctx.fillStyle = "red";
    spikes.forEach(s => ctx.fillRect(s.x - cameraX, s.y, s.width, s.height));

    // Walls
    ctx.fillStyle = "gray";
    walls.forEach(w => ctx.fillRect(w.x - cameraX, w.y, w.width, w.height));

    // Enemies
    ctx.fillStyle = "red";
    enemies.forEach(e => ctx.fillRect(e.x - cameraX, e.y, e.width, e.height));

    // Finish block
    ctx.fillStyle = "black";
    finishBlock.y = finishBlock.baseY + Math.sin(Date.now()/300)*10; // slight vertical movement
    ctx.fillRect(finishBlock.x - cameraX, finishBlock.y, finishBlock.width, finishBlock.height);

    drawPlayer();
}

// --- START ---
function startGame() {
    generateLevel();
    gameStarted = true;
    update();
}

document.getElementById("playButton").addEventListener("click", () => {
    document.getElementById("introScreen").style.display = "none";
    document.getElementById("gameCanvas").style.display = "block";
    startGame();
});
