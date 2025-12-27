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

const WIDTH = logicalWidth;
const HEIGHT = logicalHeight;

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
    facingRight: true
};

let jumpCount = 0;
const MAX_JUMPS = 2;

// --- SPRITES ---
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

const idleSpeed = 30;
const runSpeedBase =
