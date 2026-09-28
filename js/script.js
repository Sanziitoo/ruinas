const enigmas = [
    { question: "Quem criou o Mundo?", answer: "limbo" },
    { question: "Quem matou Limbo?", answer: "babel" },
    { question: "Quem condenou o Mundo Espiritual?", answer: "aziel" },
    { question: "O Nosso mundo sofre por conta dos Humanos, Malditos Humanos...<br>Você deseja a morte deles?", answer: "sim", forceSim: true }
];

let currentNode = 0;

const bgMusic = document.getElementById('bg-music');
const finalAudio = document.getElementById('final-audio');
const startBtn = document.getElementById('start-btn');
const startScreen = document.getElementById('start-screen');
const enigmaContainer = document.getElementById('enigma-container');
const tree = document.getElementById('tree');
const customPlayer = document.getElementById('custom-player');

function normalizeString(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function fadeOutAudio(audio) {
    let vol = audio.volume;
    const fade = setInterval(() => {
        if (vol > 0.05) {
            vol -= 0.05;
            audio.volume = vol;
        } else {
            audio.pause();
            clearInterval(fade);
        }
    }, 250);
}

startBtn.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    enigmaContainer.classList.remove('hidden');
    
    bgMusic.volume = 0.4;
    bgMusic.play().catch(() => console.log("O áudio requer interação prévia."));
    
    setTimeout(() => { renderNode(0); }, 500);
});

function setupNodeInput(index, input) {
    const error = document.getElementById(`error-${index}`);

    if (enigmas[index].forceSim) {
        let typedCount = 0;
        const word = "Sim";
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { checkAnswer(index, input, error); return; }
            if (e.ctrlKey || e.altKey || e.metaKey || (e.key.length > 1 && e.key !== 'Backspace')) return;

            if (e.key === 'Backspace') {
                e.preventDefault();
                if (typedCount > 0) {
                    typedCount--;
                    input.value = word.substring(0, typedCount);
                }
                return;
            }

            if (e.key.length === 1) {
                e.preventDefault();
                if (typedCount < word.length) {
                    input.value += word[typedCount];
                    typedCount++;
                }
            }
        });

        input.addEventListener('paste', (e) => {
            e.preventDefault();
            input.value = "Sim";
            typedCount = 3;
        });
    } else {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkAnswer(index, input, error);
        });
    }
}

function renderNode(index) {
    const nodeDiv = document.createElement('div');
    nodeDiv.className = 'node';
    nodeDiv.id = `node-${index}`;

    nodeDiv.innerHTML = `
        <div class="question-text">${enigmas[index].question}</div>
        <input type="text" id="input-${index}" placeholder="..." autocomplete="off">
        <div class="hint-text">Pressione Enter</div>
        <div class="error-msg" id="error-${index}">A resposta perde-se na escuridão...</div>
    `;

    tree.appendChild(nodeDiv);

    setTimeout(() => {
        nodeDiv.classList.add('visible');
    }, 100);

    const input = document.getElementById(`input-${index}`);
    setupNodeInput(index, input);
    input.focus();
}

function checkAnswer(index, inputEl, errorEl) {
    const userAnswer = normalizeString(inputEl.value);
    const correctAnswer = normalizeString(enigmas[index].answer);

    if (userAnswer === correctAnswer) {
        inputEl.disabled = true;
        errorEl.style.opacity = '0';
        
        currentNode++;
        
        if (currentNode < enigmas.length) {
            animateRootAndCamera(currentNode);
        } else {
            finishEnigma();
        }
    } else {
        errorEl.style.opacity = '1';
        inputEl.style.animation = 'shake 0.4s';
        setTimeout(() => { inputEl.style.animation = ''; }, 400);
    }
}

function animateRootAndCamera(nextIndex) {
    const svgContainer = document.createElement('div');
    svgContainer.className = 'root-container';
    
    const curve = Math.random() > 0.5 
        ? 'C 50,50 15,120 50,200' 
        : 'C 50,50 85,120 50,200';
    
    svgContainer.innerHTML = `
        <svg width="100%" height="100%" viewBox="0 0 100 200" preserveAspectRatio="none">
            <path class="root-path" d="M 50,0 ${curve}" />
        </svg>
    `;
    
    tree.appendChild(svgContainer);
    const path = svgContainer.querySelector('.root-path');
    
    void path.offsetWidth;
    
    const nodeDiv = document.createElement('div');
    nodeDiv.className = 'node';
    nodeDiv.id = `node-${nextIndex}`;
    nodeDiv.innerHTML = `
        <div class="question-text">${enigmas[nextIndex].question}</div>
        <input type="text" id="input-${nextIndex}" placeholder="..." autocomplete="off">
        <div class="hint-text">Pressione Enter</div>
        <div class="error-msg" id="error-${nextIndex}">A resposta perde-se na escuridão...</div>
    `;
    tree.appendChild(nodeDiv);

    const animDuration = 2600;
    path.style.transition = `stroke-dashoffset ${animDuration}ms ease-in-out`;
    path.style.strokeDashoffset = '0'; 
    
    const startScroll = window.scrollY;
    const targetScroll = nodeDiv.offsetTop + (nodeDiv.offsetHeight / 2) - (window.innerHeight / 2);
    const startTime = performance.now();

    function scrollCamera(currentTime) {
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / animDuration, 1);
        
        const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        window.scrollTo(0, startScroll + (targetScroll - startScroll) * ease);
        
        if (progress < 1) {
            requestAnimationFrame(scrollCamera);
        } else {
            nodeDiv.classList.add('visible');
            const input = document.getElementById(`input-${nextIndex}`);
            setupNodeInput(nextIndex, input);
            input.focus();
        }
    }
    requestAnimationFrame(scrollCamera);
}

function finishEnigma() {
    fadeOutAudio(bgMusic);
    
    customPlayer.classList.remove('hidden');
    
    setTimeout(() => {
        customPlayer.classList.add('visible');
        
        const endScroll = document.body.scrollHeight;
        window.scrollTo({ top: endScroll, behavior: 'smooth' });
        
        finalAudio.volume = document.getElementById('volume-bar').value;
        finalAudio.play();
        updatePlayPauseButton(true);
    }, 1500);
}

// --- Controles do Player ---
const playBtn = document.getElementById('play-pause-btn');
const iconPlay = playBtn.querySelector('.icon-play');
const iconPause = playBtn.querySelector('.icon-pause');
const seekBar = document.getElementById('seek-bar');
const volumeBar = document.getElementById('volume-bar');
const currentTimeDisplay = document.getElementById('current-time');
const durationTimeDisplay = document.getElementById('duration-time');

function updatePlayPauseButton(isPlaying) {
    if (isPlaying) {
        iconPlay.classList.add('hidden');
        iconPause.classList.remove('hidden');
    } else {
        iconPlay.classList.remove('hidden');
        iconPause.classList.add('hidden');
    }
}

playBtn.addEventListener('click', () => {
    if (finalAudio.paused) {
        finalAudio.play();
        updatePlayPauseButton(true);
    } else {
        finalAudio.pause();
        updatePlayPauseButton(false);
    }
});

finalAudio.addEventListener('timeupdate', () => {
    const current = finalAudio.currentTime;
    const dur = finalAudio.duration;
    if (!isNaN(dur)) {
        seekBar.value = (current / dur) * 100;
        let cMins = Math.floor(current / 60), cSecs = Math.floor(current % 60);
        let dMins = Math.floor(dur / 60), dSecs = Math.floor(dur % 60);
        currentTimeDisplay.textContent = `${cMins}:${cSecs < 10 ? '0'+cSecs : cSecs}`;
        durationTimeDisplay.textContent = `${dMins}:${dSecs < 10 ? '0'+dSecs : dSecs}`;
    }
});

seekBar.addEventListener('input', () => {
    const dur = finalAudio.duration;
    if (!isNaN(dur)) finalAudio.currentTime = (seekBar.value / 100) * dur;
});

volumeBar.addEventListener('input', () => {
    finalAudio.volume = volumeBar.value;
});