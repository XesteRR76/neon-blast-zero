import { GameEngine } from './game/game';
import { sound } from './game/audio';
import { StatusBar, Style } from '@capacitor/status-bar';

// Initialize Dark Status Bar on mobile
try {
  StatusBar.setStyle({ style: Style.Dark });
  StatusBar.setBackgroundColor({ color: '#050508' });
} catch {
  // Ignored in browser
}

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const scoreVal = document.getElementById('scoreVal') as HTMLElement;
const highScoreVal = document.getElementById('highScoreVal') as HTMLElement;
const streakPill = document.getElementById('streakPill') as HTMLElement;
const modeBtn = document.getElementById('modeBtn') as HTMLButtonElement;
const audioBtn = document.getElementById('audioBtn') as HTMLButtonElement;
const resetBtn = document.getElementById('resetBtn') as HTMLButtonElement;

// Modal elements
const gameOverModal = document.getElementById('gameOverModal') as HTMLElement;
const finalScoreVal = document.getElementById('finalScoreVal') as HTMLElement;
const modalBestVal = document.getElementById('modalBestVal') as HTMLElement;
const newBestBadge = document.getElementById('newBestBadge') as HTMLElement;
const modalRestartBtn = document.getElementById('modalRestartBtn') as HTMLButtonElement;

let isOverdrive = false;

// Audio Icon State
function updateAudioBtn() {
  audioBtn.textContent = sound.isMuted ? '🔇' : '🔊';
}
updateAudioBtn();

audioBtn.addEventListener('click', () => {
  sound.toggleMute();
  updateAudioBtn();
});

// Mode Toggle
modeBtn.addEventListener('click', () => {
  isOverdrive = !isOverdrive;
  modeBtn.classList.toggle('active', isOverdrive);
  modeBtn.querySelector('span')!.textContent = isOverdrive ? '⚡ OVERDRIVE' : 'ZEN';
  engine.setOverdriveMode(isOverdrive);
});

// Game State Update Handler
function onGameStateChanged() {
  scoreVal.textContent = engine.score.toLocaleString();
  highScoreVal.textContent = engine.highScore.toLocaleString();

  // Streak Pill
  if (engine.comboStreak >= 2) {
    streakPill.textContent = `COMBO x${engine.comboStreak} 🔥`;
    streakPill.classList.add('visible');
  } else {
    streakPill.classList.remove('visible');
  }

  // Game Over Modal
  if (engine.isGameOver) {
    finalScoreVal.textContent = engine.score.toLocaleString();
    modalBestVal.textContent = engine.highScore.toLocaleString();
    newBestBadge.style.display = engine.score >= engine.highScore && engine.score > 0 ? 'inline-block' : 'none';
    gameOverModal.classList.add('show');
  } else {
    gameOverModal.classList.remove('show');
  }
}

const engine = new GameEngine(canvas, onGameStateChanged);
onGameStateChanged();

// Restart Handlers
resetBtn.addEventListener('click', () => {
  engine.startNewGame();
});

modalRestartBtn.addEventListener('click', () => {
  engine.startNewGame();
});
