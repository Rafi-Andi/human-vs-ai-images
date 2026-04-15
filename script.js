// State Management
let currentStreak = 0;
let globalAvailableQuestions = [];
let timer;
let timeLeft = 5;
const winTarget = 8;
const questionCount = 57;

// Current Question Data
let currentCorrectSide = 'left'; // 'left' or 'right'
let isInteractionLocked = false; // Prevent double clicking

// DOM Elements
const screens = {
    start: document.getElementById('start-screen'),
    play: document.getElementById('play-screen'),
    gameOver: document.getElementById('game-over-screen'),
    victory: document.getElementById('victory-screen')
};

const ui = {
    streakText: document.getElementById('streak-text'),
    timerBar: document.getElementById('timer-bar'),
    imgLeft: document.getElementById('img-left'),
    imgRight: document.getElementById('img-right'),
    cardLeft: document.getElementById('card-left'),
    cardRight: document.getElementById('card-right'),
    lossReason: document.getElementById('loss-reason'),
    finalStreak: document.getElementById('final-streak'),
    debugCount: document.getElementById('debug-count'),
    debugTotal: document.getElementById('debug-total')
};

const buttons = {
    start: document.getElementById('btn-start'),
    retry: document.getElementById('btn-retry'),
    playAgain: document.getElementById('btn-play-again')
};

const audio = {
    correct: document.getElementById('sfx-correct'),
    wrong: document.getElementById('sfx-wrong')
};

// Initialize Questions Only Once (Global Memory)
function initGlobalQuestions() {
    let questions = [];
    for (let i = 1; i <= questionCount; i++) {
        questions.push(i);
    }
    // Fisher-Yates Shuffle
    for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
    }
    globalAvailableQuestions = questions;
}

// Function to update the test tracker
function updateDebugUI() {
    if (ui.debugCount && ui.debugTotal) {
        ui.debugTotal.textContent = questionCount;
        ui.debugCount.textContent = questionCount - globalAvailableQuestions.length;
    }
}

// Call on startup
initGlobalQuestions();
updateDebugUI();

// Preload next images (optional but good practice)
function preloadImage(url) {
    const img = new Image();
    img.src = url;
}

// Audio Placeholder Function
function playSFX(type) {
    // In a real app with valid src, we would do:
    // audio[type].currentTime = 0;
    // audio[type].play().catch(e => console.log('Audio placeholder:', type));
    console.log(`[SFX PLAYED]: ${type}`);
}

// Screen Navigation
function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    screens[screenName].classList.add('active');
}

// Start Game
function startGame() {
    currentStreak = 0;
    updateStreakUI();
    showScreen('play');
    loadNextQuestion();
}

// Update Streak
function updateStreakUI() {
    ui.streakText.textContent = `${currentStreak} / ${winTarget}`;
}

// Load Question
function loadNextQuestion() {
    if (currentStreak >= winTarget) {
        triggerVictory();
        return;
    }

    if (globalAvailableQuestions.length === 0) {
        // Runs out of questions
        alert("Semua soal telah dimainkan! Untuk mencegah duplikasi, halaman akan disegarkan untuk me-reset foto.");
        window.location.reload();
        return;
    }

    isInteractionLocked = false;
    // Pop a question from the global pool so it's removed and never repeated
    const questionId = globalAvailableQuestions.pop();
    updateDebugUI();

    // Randomize sides (0 = left is human, 1 = right is human)
    const isLeftHuman = Math.random() < 0.5;
    currentCorrectSide = isLeftHuman ? 'left' : 'right';

    // Set Image Sources
    const humanImgUrl = `images/${questionId}_1.png`;
    const aiImgUrl = `images/${questionId}_0.png`;

    ui.imgLeft.src = isLeftHuman ? humanImgUrl : aiImgUrl;
    ui.imgRight.src = (!isLeftHuman) ? humanImgUrl : aiImgUrl;

    // Reset Classes & Overlays
    ui.cardLeft.classList.remove('correct', 'card-animate');
    ui.cardRight.classList.remove('correct', 'card-animate');
    
    // Trigger Reflow for animation
    void ui.cardLeft.offsetWidth; 
    
    ui.cardLeft.classList.add('card-animate');
    ui.cardRight.classList.add('card-animate');

    // Preload next if possible
    if (globalAvailableQuestions.length > 0) {
        let nextId = globalAvailableQuestions[globalAvailableQuestions.length - 1];
        preloadImage(`images/${nextId}_1.png`);
        preloadImage(`images/${nextId}_0.png`);
    }

    startTimer();
}

// Timer Logic
function startTimer() {
    clearInterval(timer);
    timeLeft = 5000; // in milliseconds for smooth bar
    
    // Reset bar style
    ui.timerBar.style.transition = 'none';
    ui.timerBar.style.width = '100%';
    ui.timerBar.style.backgroundColor = 'var(--clr-secondary)';
    
    // Trigger reflow
    void ui.timerBar.offsetWidth;

    ui.timerBar.style.transition = 'width 10ms linear, background-color 0.3s';

    const startTime = Date.now();

    timer = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        timeLeft = 5000 - elapsedTime;

        let percentage = (timeLeft / 5000) * 100;
        ui.timerBar.style.width = `${Math.max(0, percentage)}%`;

        if (percentage < 30) {
            ui.timerBar.style.backgroundColor = 'var(--clr-danger)';
        } else if (percentage < 60) {
            ui.timerBar.style.backgroundColor = '#FF9F1C'; // Orange
        }

        if (timeLeft <= 0) {
            clearInterval(timer);
            ui.timerBar.style.width = '0%';
            handleGameOver('Waktu Habis!');
        }
    }, 10);
}

// Handle Card Selection
function selectCard(side) {
    if (isInteractionLocked) return;
    isInteractionLocked = true;
    clearInterval(timer); // Stop Timer

    if (side === currentCorrectSide) {
        handleCorrectAnswer(side);
    } else {
        handleGameOver('Anda memilih gambar AI!');
    }
}

function handleCorrectAnswer(side) {
    playSFX('correct');
    
    // Show Checkmark
    if (side === 'left') ui.cardLeft.classList.add('correct');
    else ui.cardRight.classList.add('correct');

    currentStreak++;
    updateStreakUI();

    // Trigger Confetti
    if (typeof confetti !== 'undefined') {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#06D6A0', '#FFD166', '#4F86F7']
        });
    }

    // Wait and load next
    setTimeout(() => {
        loadNextQuestion();
    }, 1200);
}

function handleGameOver(reason) {
    playSFX('wrong');
    isInteractionLocked = true;

    // Shake Effect on Body
    document.body.classList.add('shake-danger');
    
    setTimeout(() => {
        document.body.classList.remove('shake-danger');
        ui.lossReason.textContent = reason;
        ui.finalStreak.textContent = currentStreak;
        showScreen('gameOver');
    }, 600);
}

function triggerVictory() {
    playSFX('correct');
    
    if (typeof confetti !== 'undefined') {
        let duration = 3 * 1000;
        let end = Date.now() + duration;

        (function frame() {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#06D6A0']
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#06D6A0']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    }

    showScreen('victory');
}

// Event Listeners
buttons.start.addEventListener('click', startGame);
buttons.retry.addEventListener('click', startGame);
buttons.playAgain.addEventListener('click', startGame);

ui.cardLeft.addEventListener('click', () => selectCard('left'));
ui.cardRight.addEventListener('click', () => selectCard('right'));

// Keyboard Accessibility
ui.cardLeft.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') selectCard('left');
});
ui.cardRight.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') selectCard('right');
});
