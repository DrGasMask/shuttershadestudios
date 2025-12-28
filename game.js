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

// --- LOAD SPRITES ---
const idleFrames = [];
const runFrames = [];
const jumpFrames = [];

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

const idleSpeed = 30;
const runSpeedBase = 8;
const jumpSpeedBase = 20;

let keys = {};

let platforms = [];
let movingPlatforms = [];
let hazards = [];
let enemies = [];
let finishBlock = null;

const bgThemes = [
    "#87CEEB",
    "#FFA07A",
    "#98FB98",
    "#D8BFD8",
    "#FFD700"
];

// --- LEVEL GENERATOR ---
function generateLevel() {
    platforms = [];
    movingPlatforms = [];
    hazards = [];
    enemies = [];

    document.body.style.background =
        bgThemes[levelNumber % bgThemes.length] || "#87CEEB";

    platforms.push({
        x: 0,
        y: 400,
        width: logicalWidth,
        height: 20
    });

    let x = 120;
    let lastY = 330;
    const finishX = 700;
    const difficulty = Math.min(levelNumber * 0.1, 1);

    while (x < finishX - 120) {
        const width = Math.max(40, 100 - difficulty * 40);
        const deltaY =
            (Math.random() - 0.5) * (100 + difficulty * 50);
        const newY = Math.min(
            Math.max(lastY + deltaY, 200),
            380
        );

        const platform = {
            x: x,
            y: newY,
            width: width,
            height: 15
        };

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
    }

    // --- HAZARDS ---
    let spikeCount = 0;
    while (spikeCount < 3) {
        let idx =
            Math.floor(Math.random() * (platforms.length - 1)) + 1;
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

    if (Math.random() < 0.6) {
        let idx =
            Math.floor(Math.random() * (platforms.length - 1)) + 1;
        let p = platforms[idx];

        if (p) {
            hazards.push({
                x: p.x + Math.random() * Math.max(0, p.width - 20),
                y: p.y - 10,
                width: 20,
                height: 10
            });
        }
    }

    // --- ENEMY ---
    let enemyPlaced = false;
    while (!enemyPlaced) {
        let idx =
            Math.floor(Math.random() * (platforms.length - 1)) + 1;
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

// --- INPUT ---
document.addEventListener("keydown", e => {
    keys[e.code] = true;
});

document.addEventListener("keyup", e => {
    keys[e.code] = false;
});
