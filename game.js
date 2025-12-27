// --- GLOBAL GAME STATE ---
let gameStarted = false;
let gameFinished = false;

// --- 1. High‑DPI Canvas Setup ---
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const dpr = window.devicePixelRatio || 1;
const logicalWidth = 800;
const logicalHeight = 450;

// Set canvas size
canvas.width = logicalWidth * dpr;
canvas.height = logicalHeight * dpr;
canvas.style.width = `${logicalWidth}px`;
canvas.style.height = `${logicalHeight}px`;
ctx.scale(dpr, dpr);

// Smooth scaling for high-res sprites
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = "high";

// --- 2. Player & Sprite Setup ---
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
    facingRight: true
};

// Load sprites
const idleFrames = [];
for (let i = 0; i < 2; i++) {
    const img = new Image();
    img.src = `images/player_idle${i}.png`;
    idleFrames.push(img);
}

const runFrames = [];
for (let i = 0; i < 5; i++) {
    const img = new Image();
    img.src = `images/player_run${i}.png`;
    runFrames.push(img);
}

const jumpFrames = [];
for (let i = 0; i < 2; i++) {
    const img = new Image();
    img.src = `images/player_jump${i}.png`;
    jumpFrames.push(img);
}

// Animation state
let idleIndex = 0, idleTimer = 0;
let runIndex = 0, runTimer = 0;
let jumpIndex = 0, jumpTimer = 0;

// Base animation speeds
const idleSpeed = 30;
const runSpeedBase = 8;
const jumpSpeedBase = 20;

let keys = {};

const platforms = [
    { x: 0, y: 400, width: 800, height: 20 },
    { x: 150, y: 330, width: 100, height: 15 },
    { x: 350, y: 260, width: 100, height: 15 },
    { x: 550, y: 190, width: 100, height: 15 }
];

// --- FINISH BLOCK SETUP ---
const finishBlock = {
    x: 700,
    y: 140,
    width: 50,
    height: 50
};

// --- 3. Input Handling ---
document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);

// --- 4. Game Loop & Physics ---
function update() {
    // Don’t update physics if game not started or after finish
    if (!gameStarted || gameFinished) return;

    const isSlow = keys["KeyC"];
    const speedMultiplier = isSlow ? 0.5 : 1;

    // Movement
    if (keys["KeyA"]) {
        player.velX = -player.speed * speedMultiplier;
        player.facingRight = false;
    } else if (keys["KeyD"]) {
        player.velX = player.speed * speedMultiplier;
        player.facingRight = true;
    } else {
        player.velX = 0;
    }

    // Jump
    if (keys["Space"] && player.onGround) {
        player.velY = -player.jumpStrength;
        player.onGround = false;
    }

    player.velY += player.gravity;
    player.x += player.velX;
    player.y += player.velY;

    // Platform collision
    player.onGround = false;
    platforms.forEach(p => {
        if (
            player.x < p.x + p.width &&
            player.x + player.width > p.x &&
            player.y + player.height < p.y + 10 &&
            player.y + player.height + player.velY >= p.y
        ) {
            player.y = p.y - player.height;
            player.velY = 0;
            player.onGround = true;
        }
    });

    // Finish collision
    if (
        player.x < finishBlock.x + finishBlock.width &&
        player.x + player.width > finishBlock.x &&
        player.y < finishBlock.y + finishBlock.height &&
        player.y + player.height > finishBlock.y
    ) {
        gameFinished = true;
    }

    draw();
    requestAnimationFrame(update);
}

// --- 5. Drawing & Animation ---
function drawPlayer() {
    let currentSprite;
    const runSpeed = runSpeedBase * (keys["KeyC"] ? 2 : 1);
    const jumpSpeed = jumpSpeedBase * (keys["KeyC"] ? 2 : 1);

    if (!player.onGround) {
        jumpTimer++;
        if (jumpTimer >= jumpSpeed) {
            jumpTimer = 0;
            jumpIndex = (jumpIndex + 1) % jumpFrames.length;
        }
        currentSprite = jumpFrames[jumpIndex];
    } else if (player.velX !== 0) {
        runTimer++;
        if (runTimer >= runSpeed) {
            runTimer = 0;
            runIndex = (runIndex + 1) % runFrames.length;
        }
        currentSprite = runFrames[runIndex];
    } else {
        idleTimer++;
        if (idleTimer >= idleSpeed) {
            idleTimer = 0;
            idleIndex = (idleIndex + 1) % idleFrames.length;
        }
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

function draw() {
    // If finished: black screen + text
    if (gameFinished) {
        ctx.fillStyle = "#000";               // black background
        ctx.fillRect(0, 0, logicalWidth, logicalHeight);

        ctx.fillStyle = "#fff";               // white text
        ctx.font = "26px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
            "You finished the game! (yes that's the whole game)",
            logicalWidth / 2,
            logicalHeight / 2
        );
        return;
    }

    ctx.clearRect(0, 0, logicalWidth, logicalHeight);

    // Draw platforms
    ctx.fillStyle = "#2e8b57";
    platforms.forEach(p => ctx.fillRect(p.x, p.y, p.width, p.height));

    // Draw finish block
    ctx.fillStyle = "#000";
    ctx.fillRect(finishBlock.x, finishBlock.y, finishBlock.width, finishBlock.height);

    drawPlayer();
}

// --- START HANDLER ---
function startGame() {
    gameStarted = true;
    update();
}

document.getElementById("playButton").addEventListener("click", () => {
    document.getElementById("introScreen").style.display = "none";
    document.getElementById("gameCanvas").style.display = "block";
    startGame();
});

