// ================== GLOBAL STATE ==================
let gameStarted = false;
let levelNumber = 0;

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const dpr = window.devicePixelRatio || 1;

const VIEW_WIDTH = 800;
const VIEW_HEIGHT = 450;
const LEVEL_WIDTH = 1800; // 🔥 LONGER LEVELS

canvas.width = VIEW_WIDTH * dpr;
canvas.height = VIEW_HEIGHT * dpr;
canvas.style.width = VIEW_WIDTH + "px";
canvas.style.height = VIEW_HEIGHT + "px";
ctx.scale(dpr, dpr);

// Camera
let cameraX = 0;

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

// ================== INPUT ==================
const keys = {};
document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);

// ================== LEVEL OBJECTS ==================
let platforms = [];
let spikes = [];
let enemies = [];
let walls = [];
let finishBlock;

// ================== LEVEL GENERATION ==================
function generateLevel() {
    platforms = [];
    spikes = [];
    enemies = [];
    walls = [];

    levelNumber++;

    // Ground
    platforms.push({ x: 0, y: 400, width: LEVEL_WIDTH, height: 20 });

    // Platforms
    let x = 120;
    let lastY = 330;

    while (x < LEVEL_WIDTH - 300) {
        let y = Math.max(180, Math.min(360, lastY + (Math.random() - 0.5) * 140));
        platforms.push({ x, y, width: 120, height: 15 });
        lastY = y;
        x += 160;
    }

    // Thin collision walls (1–2)
    const wallCount = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < wallCount; i++) {
        const px = 400 + Math.random() * (LEVEL_WIDTH - 600);
        walls.push({
            x: px,
            y: 250,
            width: 12,
            height: 150
        });
    }

    // Spikes (5–8)
    const spikeCount = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < spikeCount; i++) {
        let p = platforms[Math.floor(Math.random() * platforms.length)];
        spikes.push({
            x: p.x + Math.random() * (p.width - 20),
            y: p.y - 10,
            width: 20,
            height: 10
        });
    }

    // Enemies (3)
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

    // Finish block (fixed X, small Y variation)
    finishBlock = {
        x: LEVEL_WIDTH - 100,
        y: Math.max(200, Math.min(350, lastY - 40 + (Math.random() - 0.5) * 40)),
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

    // Slow (S)
    const slow = keys["KeyS"] ? 0.5 : 1;

    // Movement
    if (keys["KeyA"]) player.velX = -player.speed * slow;
    else if (keys["KeyD"]) player.velX = player.speed * slow;
    else player.velX = 0;

    // Jump / Double jump
    if (keys["Space"] && jumpCount < MAX_JUMPS) {
        player.velY = -player.jumpStrength;
        jumpCount++;
        keys["Space"] = false;
    }

    // Gravity
    player.velY += player.gravity;
    player.x += player.velX;
    player.y += player.velY;

    player.onGround = false;

    // Platform collision
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

    // Wall collision (thin gray blocks)
    walls.forEach(w => {
        if (collide(player, w)) {
            player.x -= player.velX;
        }
    });

    // Spikes
    spikes.forEach(s => {
        if (collide(player, s)) respawn();
    });

    // Enemies
    enemies.forEach(e => {
        e.x += e.speed * e.dir;
        if (e.x < 0 || e.x + e.width > LEVEL_WIDTH) e.dir *= -1;
        if (collide(player, e)) respawn();
    });

    // Finish → new level
    if (collide(player, finishBlock)) generateLevel();

    // Camera follow
    cameraX = Math.max(0, Math.min(player.x - VIEW_WIDTH / 2, LEVEL_WIDTH - VIEW_WIDTH));

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
    ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

    ctx.save();
    ctx.translate(-cameraX, 0);

    ctx.fillStyle = "#2e8b57";
    platforms.forEach(p => ctx.fillRect(p.x, p.y, p.width, p.height));

    ctx.fillStyle = "#777"; // walls
    walls.forEach(w => ctx.fillRect(w.x, w.y, w.width, w.height));

    ctx.fillStyle = "#ff8800";
    spikes.forEach(s => ctx.fillRect(s.x, s.y, s.width, s.height));

    ctx.fillStyle = "#ff0000";
    enemies.forEach(e => ctx.fillRect(e.x, e.y, e.width, e.height));

    ctx.fillStyle = "#000";
    ctx.fillRect(finishBlock.x, finishBlock.y, finishBlock.width, finishBlock.height);

    ctx.fillStyle = "#0000ff";
    ctx.fillRect(player.x, player.y, player.width, player.height);

    ctx.restore();
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
