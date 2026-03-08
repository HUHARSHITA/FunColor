// --- CONFIGURATION & STATE ---
const COLORS = ['#FF3D00', '#2979FF', '#00E676', '#FFEA00', '#D500F9', '#FF9100', '#00E5FF', '#F5F5F5'];
let secretCode = [], currentGuess = [], attempts = 0;
let isMusicOn = false;

// DOM Elements
const music = document.getElementById('bg-music');
const toggleMusicBtn = document.getElementById('toggle-music');
const guessContainer = document.getElementById('guess-container');
const submitBtn = document.getElementById('submit-guess');
const historyBody = document.getElementById('history-body');
const volumeControl = document.getElementById('volume-control');
const winModal = document.getElementById('win-modal');
const winMessage = document.getElementById('win-message');

// --- AUDIO CONFIG ---
const winSound = new Audio('win.mp3'); 
const checkSound = new Audio('beep.mp3');

// Background music starts at 20% volume
music.volume = 0.2; 

// Combined Volume Listener
volumeControl.addEventListener('input', (e) => {
    const val = e.target.value;
    // Keep background music lower (max 40% of slider) to let SFX stand out
    music.volume = val * 0.4; 
    winSound.volume = 1.0;
    checkSound.volume = 1.0;
});

// Visibility API: Stop music when app is minimized/tab changed
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        music.pause();
    } else {
        if (isMusicOn) {
            music.play().catch(() => {});
        }
    }
});

// --- MUSIC LOGIC ---
function toggleMusic() {
    if (music.paused) {
        music.play().catch(e => console.log("Interaction required for audio"));
        toggleMusicBtn.innerText = "🔊";
        isMusicOn = true;
    } else {
        music.pause();
        toggleMusicBtn.innerText = "🔈";
        isMusicOn = false;
    }
}

toggleMusicBtn.addEventListener('click', toggleMusic);

// --- GAME CORE LOGIC ---
function initGame() {
    // Start music on first interaction if possible
    if (!isMusicOn && music.paused) {
        // We don't call toggleMusic() here directly because it might be blocked
        // Instead, the music usually starts when the user clicks "New Game"
    }

    const count = parseInt(document.getElementById('difficulty').value);
    attempts = 0;
    document.getElementById('attempt-count').textContent = attempts;
    historyBody.innerHTML = '';
    document.getElementById('feedback').textContent = '';
    winModal.style.display = 'none'; // Ensure modal is hidden on restart
    
    // Pick unique secret colors
    const shuffled = [...COLORS].sort(() => 0.5 - Math.random());
    secretCode = shuffled.slice(0, count);
    
    // Starting position is a shuffle of the secret code
    currentGuess = [...secretCode].sort(() => 0.5 - Math.random());
    
    renderTiles();
    submitBtn.disabled = false;
}

function renderTiles() {
    guessContainer.innerHTML = '';
    currentGuess.forEach((color, index) => {
        const tile = document.createElement('div');
        tile.className = 'color-tile';
        tile.style.backgroundColor = color;
        tile.draggable = true;
        tile.dataset.index = index;
        
        tile.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', index);
            tile.style.opacity = "0.5";
        });
        
        tile.addEventListener('dragend', () => tile.style.opacity = "1");
        tile.addEventListener('dragover', (e) => e.preventDefault());
        tile.addEventListener('drop', handleDrop);
        
        guessContainer.appendChild(tile);
    });
}

function handleDrop(e) {
    e.preventDefault();
    const fromIdx = e.dataTransfer.getData('text/plain');
    const toIdx = e.target.dataset.index;
    if (toIdx === undefined) return;
    
    // Swap positions in the array
    [currentGuess[fromIdx], currentGuess[toIdx]] = [currentGuess[toIdx], currentGuess[fromIdx]];
    renderTiles();
}

submitBtn.addEventListener('click', () => {
    // Attempt to play music if it was blocked by browser
    if (isMusicOn && music.paused) music.play().catch(() => {});

    attempts++;
    document.getElementById('attempt-count').textContent = attempts;
    
    let correct = 0;
    currentGuess.forEach((color, i) => { 
        if (color === secretCode[i]) correct++; 
    });

    if (correct === secretCode.length) {
        winSound.play(); 
        
        // Confetti effect (Requires CDN link in HTML)
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: COLORS
            });
        }

        // Display Winning UI
        winMessage.textContent = `You cracked the code in ${attempts} attempts!`;
        winModal.style.display = 'flex';
        submitBtn.disabled = true;
    } else {
        checkSound.play(); 
        document.getElementById('feedback').textContent = `${correct} colors are in the correct spot!`;
        updateHistory(currentGuess, correct);
    }
});

function updateHistory(guess, correct) {
    const row = document.createElement('tr');
    const dots = guess.map(c => `<div style="background:${c}; width:14px; height:14px; border-radius:50%; display:inline-block; margin:0 3px; border:1px solid rgba(255,255,255,0.3);"></div>`).join('');
    row.innerHTML = `<td>${attempts}</td><td>${dots}</td><td><strong>${correct}</strong></td>`;
    historyBody.prepend(row);
}

// --- INITIALIZATION ---
document.getElementById('start-btn').addEventListener('click', () => {
    // Initialize music on first click to bypass browser blocks
    if (!isMusicOn) toggleMusic();
    initGame();
});

document.getElementById('difficulty').addEventListener('change', initGame);

// Load the initial board
initGame();