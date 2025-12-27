// ================== GLOBAL STATE ==================
let gameStarted = false;
let levelNumber = 0;

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const dpr = window.devicePixelRatio || 1;

const WIDTH = 800;
const HEIGHT = 450;

canvas.width = WIDTH * dpr;
canvas.height = HEIGHT * dpr;
canvas.style.width = WIDTH + "px";
canvas.style.height = HEIGHT + "px";
ctx.scale(dpr, dpr);

// ================== PLAYER ==================
const player = {
    x: 50,
    y: 350,
    width: 48,
    height: 48,
    velX: 0,
    velY: 0,
    speed: 3,
    jumpStrength: 10,
    gravity: 0.4,
    onGround: false,
    facingRight: true,
    isCrouching: false
};

let jumpCount = 0;
const MAX_JUMPS = 2;

// ================== SPRITES ==================
const idleFrames = [], runFrames = [], jumpFrames = [];

for (let i = 0; i < 2; i++) {
    let img = new Image();
    img.src = `images/player_idle${i}.png`;
    idleFrames.push(img);
}
for (let i = 0; i < 5; i++) {
    let img = new Image();
    img.src = `images/player_run${i}.png`;
    runFrames.push(img);
}
for (let i = 0; i < 2; i++) {
    let img = new Image();
    img.src = `images/player_jump${i}.png`;
    jumpFrames.push(img);
}

let idleIndex = 0, runIndex = 0, jumpIndex = 0;
let idleTimer = 0, runTimer = 0, jumpTimer = 0;

const idleSpeed = 30;
const runSpeedBase = 8;
const jumpSpeedBase = 20;

// ================== INPUT ==================
const keys = {};
document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);

// ================== LEVEL DATA ==================
let platforms = [];
let walls = [];
let spikes = [];
let enemies = [];
let finishBlock = null;

// ================== LEVEL GENERATION ==================
function generateLevel() {
    platforms = [];
    walls = [];
    spikes = [];
    enemies = [];

    levelNumber++;

    // --- Ground ---
    platforms.push({ x: 0, y: 400, width: WIDTH, height: 20 });

    // --- Platforms ---
    let x = 120;
    let lastY = 330;

    while (x < 600) {
        let y = Math.max(200, Math.min(360, lastY + (Math.random() - 0.5) * 120));
        platforms.push({ x, y, width: 100, height: 15 });
        lastY = y;
        x += 140;
    }

    // --- Walls (1–2) ---
    const wallCount = Math.random() < 0.5 ? 1 : 2;
    for (let i = 0; i < wallCount; i++) {
        let base = platforms[Math.floor(Math.random() * platforms.length)];
        walls.push({
            x: base.x + base.width - 10,
            y: base.y - 80,
            width: 20,
            height: 80
        });
    }

    // --- Spikes (5–7) ---
    const spikeCount = 5 + Math.floor(Math.random() * 3);
    for (let i = 0; i < spikeCount; i++) {
        let p = platforms[Math.floor(Math.random() * platforms.length)];
        spikes.push({
            x: p.x + Math.random() * (p.width - 20),
            y: p.y - 10,
            width: 20,
            height: 10
        });
    }

    // --- Enemies (EXACTLY 3) ---
    while (enemies.length < 3) {
        let p = platforms[Math.floor(Math.random() * platforms.length)];
        enemies.push({
            x: p.x + 10,
            y: p.y - 30,
            width: 30,
            height: 30,
            dir: Math.random() < 0.5 ? -1 : 1,
            speed: 1.2
        });
    }

    // --- Finish Block ---
    finishBlock = {
        x: 700,
        y: Math.max(220, Math.min(360, lastY - 40 + (Math.random() - 0.5) * 40)),
        width: 50,
        height: 50
    };

    respawn();
}

// ================== RESPAWN ==================
function respawn() {
    player.x = 50;
    player.y = 350;
    player.velX = 0;
    player.velY = 0;
    player.height = 48;
    player.isCrouching = false;
    jumpCount = 0;
}

// ================== UPDATE ==================
function update() {
    if (!gameStarted) return;

    // --- Crouch ---
    if (keys["KeyC"] && player.onGround) {
        if (!player.isCrouching) player.y += 18;
        player.height = 30;
        player.isCrouching = true;
    } else if (player.isCrouching) {
        player.y -= 18;
        player.height = 48;
        player.isCrouching = false;
    }

    // --- Movement ---
    let slow = keys["KeyS"] ? 0.5 : 1;

    if (keys["KeyA"]) player.velX = -player.speed * slow;
    else if (keys["KeyD"]) player.velX = player.speed * slow;
    else player.velX = 0;

    if (keys["Space"] && jumpCount < MAX_JUMPS) {
        player.velY = -player.jumpStrength;
        jumpCount++;
        keys["Space"] = false;
    }

    player.velY += player.gravity;
    player.x += player.velX;
    player.y += player.velY;
    player.onGround = false;

    // --- Platform collision ---
    platforms.forEach(p => {
        if (
            player.x < p.x + p.width &&
            player.x + player.width > p.x &&
            player.y + player.height <= p.y + 10 &&
            player.y + player.height + player.velY >= p.y
        ) {
            player.y = p.y - player.height;
            player.velY = 0;
            player.onGround = true;
            jumpCount = 0;
        }
    });

    // --- Walls ---
    walls.forEach(w => {
        if (
            player.x < w.x + w.width &&
            player.x + player.width > w.x &&
            player.y < w.y + w.height &&
            player.y + player.height > w.y
        ) {
            player.x -= player.velX;
        }
    });

    // --- Spikes ---
    spikes.forEach(s => {
        if (collide(player, s)) respawn();
    });

    // --- Enemies ---
    enemies.forEach(e => {
        e.x += e.speed * e.dir;
        if (e.x < 0 || e.x + e.width > WIDTH) e.dir *= -1;
        if (collide(player, e)) respawn();
    });

    // --- Finish ---
    if (collide(player, finishBlock)) generateLevel();

    draw();
    requestAnimationFrame(update);
}

// ================== COLLISION ==================
function collide(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

// ================== DRAW ==================
function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = "#2e8b57";
    platforms.forEach(p => ctx.fillRect(p.x, p.y, p.width, p.height));

    ctx.fillStyle = "#555";
    walls.forEach(w => ctx.fillRect(w.x, w.y, w.width, w.height));

    ctx.fillStyle = "#ff8800";
    spikes.forEach(s => ctx.fillRect(s.x, s.y, s.width, s.height));

    ctx.fillStyle = "#ff0000";
    enemies.forEach(e => ctx.fillRect(e.x, e.y, e.width, e.height));

    ctx.fillStyle = "#000";
    ctx.fillRect(finishBlock.x, finishBlock.y, finishBlock.width, finishBlock.height);

    drawPlayer();
}

// ================== PLAYER DRAW ==================
function drawPlayer() {
    let sprite = idleFrames[0];
    if (!player.onGround) sprite = jumpFrames[jumpIndex];
    else if (player.velX !== 0) sprite = runFrames[runIndex];

    ctx.drawImage(sprite, player.x, player.y, player.width, player.height);
}

// ================== START ==================
function startGame() {
    generateLevel();
    gameStarted = true;
    update();
}

document.getElementById("playButton").addEventListener("click", () => {
    document.getElementById("introScreen").style.display = "none";
    canvas.style.display = "block";
    startGame();
});
