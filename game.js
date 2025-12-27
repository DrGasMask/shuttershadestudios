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

// Double jump state
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

// --- LEVEL GENERATOR ---
function generateLevel() {
    platforms = [];
    movingPlatforms = [];
    hazards = [];
    enemies = [];

    document.body.style.background = bgThemes[levelNumber % bgThemes.length] || "#87CEEB";

    platforms.push({ x: 0, y: 400, width: logicalWidth, height: 20 });

    let x = 120;
    let lastY = 330;
    const finishX = 700;
    const difficulty = Math.min(levelNumber * 0.1, 1);

    while (x < finishX - 120) {
        const width = Math.max(40, 100 - difficulty * 40);
        const newY = Math.min(Math.max(lastY + (Math.random() - 0.5) * (100 + difficulty * 50), 200), 380);

        const platform = { x: x, y: newY, width: width, height: 15 };
        if (Math.random() < 0.2 + difficulty * 0.1) {
            platform.isMoving = true;
            platform.dir = Math.random() < 0.5 ? 1 : -1;
            platform.speed = 1.5 + difficulty * 0.5;
            movingPlatforms.push(platform);
        } else {
            platforms.push(platform);
        }

        if (Math.random() < 0.2 + difficulty * 0.1) {
            hazards.push({ x: x + width / 2, y: newY - 10, width: 20, height: 10 });
        }
        if (Math.random() < 0.15 + difficulty * 0.15) {
            enemies.push({
                x: x + 10,
                y: newY - 30,
                width: 30,
                height: 30,
                dir: Math.random() < 0.5 ? -1 : 1,
                speed: 1 + difficulty
            });
        }

        lastY = newY;
        x += width + (40 + Math.random() * (70 + difficulty * 50));
    }

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

// --- INPUT HANDLING ---
document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);

// --- GAME LOOP ---
function update() {
    if (!gameStarted) return;

    // Crouch handling (C key)
    if (keys["KeyC"] && player.onGround) {
        if (!player.isCrouching) {
            // adjust Y so feet stay on ground when shrinking
            player.y += (player.height - 30);
        }
        player.height = 30;
        player.isCrouching = true;
    } else if (player.isCrouching) {
        // stand back up, adjust Y so feet stay on ground
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

    // Double jump
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
}

function draw() {
    ctx.clearRect(0, 0, logicalWidth, logicalHeight);

    ctx.fillStyle = "#2e8b57";
    platforms.forEach(p => ctx.fillRect(p.x, p.y, p.width, p.height));

    ctx.fillStyle = "#8A2BE2";
    movingPlatforms.forEach(mp => ctx.fillRect(mp.x, mp.y, mp.width, mp.height));

    ctx.fillStyle = "#FF8C00";
    hazards.forEach(hz => ctx.fillRect(hz.x, hz.y, hz.width, hz.height));

    ctx.fillStyle = "#FF0000";
    enemies.forEach(en => ctx.fillRect(en.x, en.y, en.width, en.height));

    ctx.fillStyle = "#000";
    ctx.fillRect(finishBlock.x, finishBlock.y, finishBlock.width, finishBlock.height);

    drawPlayer();
    drawUI();
}

// --- START GAME ---
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
