// --- GLOBAL GAME STATE ---
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

ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = "high";

// --- PLAYER SETUP ---
const player = {
    x: 50,
    y: 350,
    width: 48,
    height: 48,
    velX: 0,
    velY: 0,
    baseSpeed: 3,
    jumpStrength: 10,
    gravity: 0.4,
    onGround: false,
    facingRight: true,
    isCrouching: false
};

let jumpCount = 0;
const maxJumps = 2;

// Load sprites
const idleFrames = [], runFrames = [], jumpFrames = [];
for (let i = 0; i < 2; i++) {
    const img = new Image();
    img.src = `images/player_idle${i}.png`;
    idleFrames.push(img);
}
for (let i = 0; i < 5; i++) {
    const img = new Image();
    img.src = `images/player_run${i}.png`;
    runFrames.push(img);
}
for (let i = 0; i < 2; i++) {
    const img = new Image();
    img.src = `images/player_jump${i}.png`;
    jumpFrames.push(img);
}

let idleIndex = 0, idleTimer = 0;
let runIndex = 0, runTimer = 0;
let jumpIndex = 0, jumpTimer = 0;
const idleSpeed = 30, runSpeedBase = 8, jumpSpeedBase = 20;

let keys = {};

let platforms = [];
let movingPlatforms = [];
let hazards = [];
let enemies = [];
let finishBlock = null;

const bgThemes = ["#87CEEB", "#FFA07A", "#98FB98", "#D8BFD8", "#FFD700"];

// --- LEVEL GENERATOR WITH HOLES ---
function generateLevel() {
    platforms = [];
    movingPlatforms = [];
    hazards = [];
    enemies = [];

    document.body.style.background = bgThemes[levelNumber % bgThemes.length] || "#87CEEB";

    // generate ground segments with holes
    let groundX = 0;
    const finishX = 1500 + levelNumber * 100;
    const difficulty = Math.min(levelNumber * 0.1, 1);

    while (groundX < finishX) {
        // random chance to skip ground (hole)
        if (Math.random() < 0.15 + difficulty * 0.10) {
            // create a hole (skip)
            groundX += 50 + Math.random() * (50 + difficulty * 50);
            continue;
        }

        // create ground segment
        const groundWidth = 80 + Math.random() * 80;
        platforms.push({ x: groundX, y: 400, width: groundWidth, height: 20 });
        groundX += groundWidth;
    }

    // additional elevated platforms
    let x = 220;
    let lastY = 330;

    while (x < finishX - 200) {
        const width = Math.max(50, 110 - difficulty * 40);
        const deltaY = (Math.random() - 0.5) * (120 + difficulty * 80);
        const newY = Math.min(Math.max(lastY + deltaY, 200), 380);

        const platform = { x: x, y: newY, width: width, height: 15 };

        if (Math.random() < 0.25 + difficulty * 0.15) {
            platform.isMoving = true;
            platform.dir = Math.random() < 0.5 ? 1 : -1;
            platform.speed = 1.5 + difficulty * 0.7;
            movingPlatforms.push(platform);
        } else {
            platforms.push(platform);
        }

        lastY = newY;
        x += width + (80 + Math.random() * (120 + difficulty * 60));
    }

    // hazards (spikes)
    let spikeCount = 0;
    while (spikeCount < 4) {
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
    }

    if (Math.random() < 0.7) {
        let idx = Math.floor(Math.random() * (platforms.length - 1)) + 1;
        let p = platforms[idx];
        if (p) hazards.push({
            x: p.x + Math.random() * Math.max(0, p.width - 20),
            y: p.y - 10,
            width: 20,
            height: 10
        });
    }

    // enemies
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
    }

    // finish
    finishBlock = {
        x: finishX,
        y: lastY - player.height - 10,
        width: 50,
        height: 50
    };

    respawnPlayer();
    levelNumber++;
}

function respawnPlayer() {
    player.x = 50;
    player.y = 350;
    player.velX = 0;
    player.velY = 0;
    player.onGround = false;
    player.isCrouching = false;
    jumpCount = 0;
    player.height = 48;
}

// --- input, update loop, rendering (unchanged) ---
document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);

function update() {
    if (!gameStarted) return;
    if (keys["KeyC"] && player.onGround) {
        if (!player.isCrouching) player.y += (player.height - 30);
        player.height = 30;
        player.isCrouching = true;
    } else if (player.isCrouching) {
        player.y -= (48 - player.height);
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

    if (keys["Space"] && jumpCount < maxJumps) {
        player.velY = -player.jumpStrength;
        jumpCount++;
        keys["Space"] = false;
    }

    player.velY += player.gravity;
    player.x += player.velX;
    player.y += player.velY;
    player.onGround = false;

    [...platforms, ...movingPlatforms].forEach(p => {
        if (
            player.x < p.x + p.width &&
            player.x + player.width > p.x &&
            player.y + player.height < p.y + 10 &&
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
        if (
            player.x < hz.x + hz.width &&
            player.x + player.width > hz.x &&
            player.y < hz.y + hz.height &&
            player.y + player.height > hz.y
        ) respawnPlayer();
    });

    enemies.forEach(en => {
        en.x += en.speed * en.dir;
        if (en.x < 0 || en.x + en.width > logicalWidth) en.dir *= -1;

        if (
            player.x < en.x + en.width &&
            player.x + player.width > en.x &&
            player.y < en.y + en.height &&
            player.y + player.height > en.y
        ) respawnPlayer();
    });

    if (
        player.x < finishBlock.x + finishBlock.width &&
        player.x + player.width > finishBlock.x &&
        player.y < finishBlock.y + finishBlock.height &&
        player.y + player.height > finishBlock.y
    ) {
        score++;
        generateLevel();
    }

    draw();
    requestAnimationFrame(update);
}

// drawPlayer(), drawUI(), draw(), startGame() and playButton listener (unchanged)
