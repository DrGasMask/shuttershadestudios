// --- GLOBAL GAME STATE ---
// ================== GLOBAL STATE ==================
let gameStarted = false;
let levelNumber = 0;
let score = 0;

// --- CANVAS SETUP ---
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
const WIDTH = 800;
const HEIGHT = 450;

ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = "high";
canvas.width = WIDTH * dpr;
canvas.height = HEIGHT * dpr;
canvas.style.width = WIDTH + "px";
canvas.style.height = HEIGHT + "px";
ctx.scale(dpr, dpr);

// --- PLAYER SETUP ---
// ================== PLAYER ==================
const player = {
    x: 50,
    y: 350,
    width: 48,
    height: 48,
    velX: 0,
    velY: 0,
    baseSpeed: 3,
    speed: 3,
    jumpStrength: 10,
    gravity: 0.4,
    onGround: false,
@@ -36,176 +32,151 @@ const player = {
};

let jumpCount = 0;
const maxJumps = 2;
const MAX_JUMPS = 2;

// Load sprites
// ================== SPRITES ==================
const idleFrames = [], runFrames = [], jumpFrames = [];

for (let i = 0; i < 2; i++) {
    const img = new Image();
    let img = new Image();
    img.src = `images/player_idle${i}.png`;
    idleFrames.push(img);
}
for (let i = 0; i < 5; i++) {
    const img = new Image();
    let img = new Image();
    img.src = `images/player_run${i}.png`;
    runFrames.push(img);
}
for (let i = 0; i < 2; i++) {
    const img = new Image();
    let img = new Image();
    img.src = `images/player_jump${i}.png`;
    jumpFrames.push(img);
}

let idleIndex = 0, idleTimer = 0;
let runIndex = 0, runTimer = 0;
let jumpIndex = 0, jumpTimer = 0;
const idleSpeed = 30, runSpeedBase = 8, jumpSpeedBase = 20;
let idleIndex = 0, runIndex = 0, jumpIndex = 0;
let idleTimer = 0, runTimer = 0, jumpTimer = 0;

let keys = {};
const idleSpeed = 30;
const runSpeedBase = 8;
const jumpSpeedBase = 20;

// ================== INPUT ==================
const keys = {};
document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);

// ================== LEVEL DATA ==================
let platforms = [];
let movingPlatforms = [];
let hazards = [];
let walls = [];
let spikes = [];
let enemies = [];
let finishBlock = null;

const bgThemes = ["#87CEEB", "#FFA07A", "#98FB98", "#D8BFD8", "#FFD700"];

// --- LEVEL GENERATOR ---
// ================== LEVEL GENERATION ==================
function generateLevel() {
    platforms = [];
    movingPlatforms = [];
    hazards = [];
    walls = [];
    spikes = [];
    enemies = [];

    document.body.style.background = bgThemes[levelNumber % bgThemes.length] || "#87CEEB";
    levelNumber++;

    platforms.push({ x: 0, y: 400, width: logicalWidth, height: 20 });
    // --- Ground ---
    platforms.push({ x: 0, y: 400, width: WIDTH, height: 20 });

    // --- Platforms ---
    let x = 120;
    let lastY = 330;
    const finishX = 700;
    const difficulty = Math.min(levelNumber * 0.1, 1);

    while (x < finishX - 120) {
        const width = Math.max(40, 100 - difficulty * 40);
        const deltaY = (Math.random() - 0.5) * (100 + difficulty * 50);
        const newY = Math.min(Math.max(lastY + deltaY, 200), 380);

        const platform = { x: x, y: newY, width: width, height: 15 };

        if (Math.random() < 0.2 + difficulty * 0.1) {
            platform.isMoving = true;
            platform.dir = Math.random() < 0.5 ? 1 : -1;
            platform.speed = 1.5 + difficulty * 0.5;
            movingPlatforms.push(platform);
        } else {
            platforms.push(platform);
        }

        lastY = newY;
        x += width + (40 + Math.random() * (70 + difficulty * 50));
    while (x < 600) {
        let y = Math.max(200, Math.min(360, lastY + (Math.random() - 0.5) * 120));
        platforms.push({ x, y, width: 100, height: 15 });
        lastY = y;
        x += 140;
    }

    // place guaranteed spikes (hazards)
    let spikeCount = 0;
    while (spikeCount < 3) {
        let idx = Math.floor(Math.random() * (platforms.length - 1)) + 1;
        let p = platforms[idx];
        if (p) {
            hazards.push({
                x: p.x + Math.random() * Math.max(0, p.width - 20),
                y: p.y - 10,
                width: 20,
                height: 10
            });
            spikeCount++;
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
    if (Math.random() < 0.6) {
        let idx = Math.floor(Math.random() * (platforms.length - 1)) + 1;
        let p = platforms[idx];
        if (p) hazards.push({
            x: p.x + Math.random() * Math.max(0, p.width - 20),

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

    // guaranteed enemy
    let enemyPlaced = false;
    while (!enemyPlaced) {
        let idx = Math.floor(Math.random() * (platforms.length - 1)) + 1;
        let p = platforms[idx];
        if (p) {
            enemies.push({
                x: p.x + 10 + Math.random() * Math.max(0, p.width - 40),
                y: p.y - 30,
                width: 30,
                height: 30,
                dir: Math.random() < 0.5 ? -1 : 1,
                speed: 1 + difficulty
            });
            enemyPlaced = true;
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
        x: finishX,
        y: lastY - player.height - 10,
        x: 700,
        y: Math.max(220, Math.min(360, lastY - 40 + (Math.random() - 0.5) * 40)),
        width: 50,
        height: 50
    };

    respawnPlayer();
    levelNumber++;
    respawn();
}

function respawnPlayer() {
// ================== RESPAWN ==================
function respawn() {
    player.x = 50;
    player.y = 350;
    player.velX = 0;
    player.velY = 0;
    player.onGround = false;
    player.height = 48;
    player.isCrouching = false;
    jumpCount = 0;
    player.height = 48;
}

// --- INPUT HANDLING ---
document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);

// --- GAME LOOP ---
// ================== UPDATE ==================
function update() {
    if (!gameStarted) return;

    // crouch correctly (adjust hitbox without falling through platforms)
    // --- Crouch ---
    if (keys["KeyC"] && player.onGround) {
        if (!player.isCrouching) player.y += (player.height - 30);
        if (!player.isCrouching) player.y += 18;
        player.height = 30;
        player.isCrouching = true;
    } else if (player.isCrouching) {
        player.y -= (48 - player.height);
        player.y -= 18;
        player.height = 48;
        player.isCrouching = false;
    }

    const isSlow = keys["KeyS"];
    const speedMultiplier = isSlow ? 0.5 : 1;

    if (keys["KeyA"]) {
        player.velX = -player.baseSpeed * speedMultiplier;
        player.facingRight = false;
    } else if (keys["KeyD"]) {
        player.velX = player.baseSpeed * speedMultiplier;
        player.facingRight = true;
    } else {
        player.velX = 0;
    }
    // --- Movement ---
    let slow = keys["KeyS"] ? 0.5 : 1;

    if (keys["KeyA"]) player.velX = -player.speed * slow;
    else if (keys["KeyD"]) player.velX = player.speed * slow;
    else player.velX = 0;

    if (keys["Space"] && jumpCount < maxJumps) {
    if (keys["Space"] && jumpCount < MAX_JUMPS) {
        player.velY = -player.jumpStrength;
        jumpCount++;
        keys["Space"] = false;
@@ -216,124 +187,94 @@ function update() {
    player.y += player.velY;
    player.onGround = false;

    [...platforms, ...movingPlatforms].forEach(p => {
    // --- Platform collision ---
    platforms.forEach(p => {
        if (
            player.x < p.x + p.width &&
            player.x + player.width > p.x &&
            player.y + player.height < p.y + 10 &&
            player.y + player.height <= p.y + 10 &&
            player.y + player.height + player.velY >= p.y
        ) {
            player.y = p.y - player.height;
            player.velY = 0;
            player.onGround = true;
            jumpCount = 0;
            if (p.isMoving) player.x += p.dir * p.speed;
        }
    });

    movingPlatforms.forEach(mp => {
        mp.x += mp.dir * mp.speed;
        if (mp.x < 0 || mp.x + mp.width > logicalWidth) mp.dir *= -1;
    });

    hazards.forEach(hz => {
    // --- Walls ---
    walls.forEach(w => {
        if (
            player.x < hz.x + hz.width &&
            player.x + player.width > hz.x &&
            player.y < hz.y + hz.height &&
            player.y + player.height > hz.y
        ) respawnPlayer();
            player.x < w.x + w.width &&
            player.x + player.width > w.x &&
            player.y < w.y + w.height &&
            player.y + player.height > w.y
        ) {
            player.x -= player.velX;
        }
    });

    enemies.forEach(en => {
        en.x += en.speed * en.dir;
        if (en.x < 0 || en.x + en.width > logicalWidth) en.dir *= -1;
    // --- Spikes ---
    spikes.forEach(s => {
        if (collide(player, s)) respawn();
    });

        if (
            player.x < en.x + en.width &&
            player.x + player.width > en.x &&
            player.y < en.y + en.height &&
            player.y + player.height > en.y
        ) respawnPlayer();
    // --- Enemies ---
    enemies.forEach(e => {
        e.x += e.speed * e.dir;
        if (e.x < 0 || e.x + e.width > WIDTH) e.dir *= -1;
        if (collide(player, e)) respawn();
    });

    if (
        player.x < finishBlock.x + finishBlock.width &&
        player.x + player.width > finishBlock.x &&
        player.y < finishBlock.y + finishBlock.height &&
        player.y + player.height > finishBlock.y
    ) {
        score++;
        generateLevel(); // endless next level
    }
    // --- Finish ---
    if (collide(player, finishBlock)) generateLevel();

    draw();
    requestAnimationFrame(update);
}

// --- DRAWING & UI ---
function drawPlayer() {
    let currentSprite;
    const runSpeed = runSpeedBase * (keys["KeyS"] ? 2 : 1);
    const jumpSpeed = jumpSpeedBase * (keys["KeyS"] ? 2 : 1);

    if (!player.onGround) {
        jumpTimer++;
        if (jumpTimer >= jumpSpeed) jumpTimer = 0, jumpIndex = (jumpIndex + 1) % jumpFrames.length;
        currentSprite = jumpFrames[jumpIndex];
    } else if (player.velX !== 0) {
        runTimer++;
        if (runTimer >= runSpeed) runTimer = 0, runIndex = (runIndex + 1) % runFrames.length;
        currentSprite = runFrames[runIndex];
    } else {
        idleTimer++;
        if (idleTimer >= idleSpeed) idleTimer = 0, idleIndex = (idleIndex + 1) % idleFrames.length;
        currentSprite = idleFrames[idleIndex];
    }

    if (currentSprite.complete) {
        ctx.save();
        if (!player.facingRight) {
            ctx.translate(player.x + player.width, player.y);
            ctx.scale(-1, 1);
            ctx.drawImage(currentSprite, 0, 0, player.width, player.height);
        } else {
            ctx.drawImage(currentSprite, player.x, player.y, player.width, player.height);
        }
        ctx.restore();
    }
}

function drawUI() {
    ctx.fillStyle = "#000";
    ctx.font = "20px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`Score: ${score}`, 20, 30);
    ctx.fillText(`Level: ${levelNumber}`, 20, 60);
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
    ctx.clearRect(0, 0, logicalWidth, logicalHeight);
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = "#2e8b57"; // platforms
    ctx.fillStyle = "#2e8b57";
    platforms.forEach(p => ctx.fillRect(p.x, p.y, p.width, p.height));

    ctx.fillStyle = "#8A2BE2"; // moving platforms
    movingPlatforms.forEach(mp => ctx.fillRect(mp.x, mp.y, mp.width, mp.height));
    ctx.fillStyle = "#555";
    walls.forEach(w => ctx.fillRect(w.x, w.y, w.width, w.height));

    ctx.fillStyle = "#FF8C00"; // spikes
    hazards.forEach(hz => ctx.fillRect(hz.x, hz.y, hz.width, hz.height));
    ctx.fillStyle = "#ff8800";
    spikes.forEach(s => ctx.fillRect(s.x, s.y, s.width, s.height));

    ctx.fillStyle = "#FF0000"; // enemies
    enemies.forEach(en => ctx.fillRect(en.x, en.y, en.width, en.height));
    ctx.fillStyle = "#ff0000";
    enemies.forEach(e => ctx.fillRect(e.x, e.y, e.width, e.height));

    ctx.fillStyle = "#000"; // finish block
    ctx.fillStyle = "#000";
    ctx.fillRect(finishBlock.x, finishBlock.y, finishBlock.width, finishBlock.height);

    drawPlayer();
    drawUI();
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
@@ -342,6 +283,6 @@ function startGame() {

document.getElementById("playButton").addEventListener("click", () => {
    document.getElementById("introScreen").style.display = "none";
    document.getElementById("gameCanvas").style.display = "block";
    canvas.style.display = "block";
    startGame();
});
