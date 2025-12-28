const cells = document.querySelectorAll('.cell');
const message = document.getElementById('message');
const restartBtn = document.getElementById('restart');
const playAIBtn = document.getElementById('playAI');

let board = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "X";
let gameActive = true;
let vsAI = false; // track PvE mode

const winConditions = [
  [0,1,2], [3,4,5], [6,7,8], 
  [0,3,6], [1,4,7], [2,5,8], 
  [0,4,8], [2,4,6]           
];

function handleCellClick(e) {
  const index = e.target.dataset.index;
  if (board[index] !== "" || !gameActive) return;

  board[index] = currentPlayer;
  e.target.textContent = currentPlayer;

  checkResult();

  if (vsAI && gameActive && currentPlayer === "O") {
    aiMove();
  }
}

function aiMove() {
  // simple AI: pick first empty cell
  const emptyIndices = board.map((v,i) => v === "" ? i : null).filter(i => i !== null);
  if (emptyIndices.length === 0) return;

  const move = emptyIndices[0]; // AI picks first available cell
  board[move] = currentPlayer;
  cells[move].textContent = currentPlayer;

  checkResult();
}

function checkResult() {
  let roundWon = false;

  for (let condition of winConditions) {
    const [a,b,c] = condition;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      roundWon = true;
      break;
    }
  }

  if (roundWon) {
    message.textContent = `Player ${currentPlayer} wins!`;
    gameActive = false;
    return;
  }

  if (!board.includes("")) {
    message.textContent = "It's a draw!";
    gameActive = false;
    return;
  }

  currentPlayer = currentPlayer === "X" ? "O" : "X";
  message.textContent = `Player ${currentPlayer}'s turn`;
}

function restartGame() {
  board = ["", "", "", "", "", "", "", "", ""];
  gameActive = true;
  currentPlayer = "X";
  message.textContent = `Player ${currentPlayer}'s turn`;
  cells.forEach(cell => cell.textContent = "");

  if (vsAI) {
    currentPlayer = "O"; // AI goes first
    aiMove();
  }
}

function startAI() {
  vsAI = true;
  restartGame(); // AI will make first move automatically
}

cells.forEach(cell => cell.addEventListener('click', handleCellClick));
restartBtn.addEventListener('click', () => {
  vsAI = false; // normal PvE restart
  restartGame();
});
playAIBtn.addEventListener('click', startAI);

message.textContent = `Player ${currentPlayer}'s turn`;
