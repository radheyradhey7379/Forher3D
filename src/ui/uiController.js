import { gsap } from 'gsap';

class ProceduralAudio {
    constructor() {
        this.ctx = null;
        this.isPlaying = false;
        this.intervalId = null;
        
        // Ambient chord progressions: Am7 -> Fmaj7 -> Cmaj7 -> G6
        this.chords = [
            [110.00, 220.00, 261.63, 329.63, 392.00], // Am7 (A2, A3, C4, E4, G4)
            [87.31, 174.61, 220.00, 261.63, 329.63],  // Fmaj7 (F2, F3, A3, C4, E4)
            [130.81, 261.63, 329.63, 392.00, 523.25], // Cmaj7 (C3, C4, E4, G4, C5)
            [98.00, 196.00, 246.94, 293.66, 392.00]   // G6 (G2, G3, B3, D4, G4)
        ];
        
        this.chordIndex = 0;
        this.notePattern = [0, 2, 1, 3, 2, 4, 3, 1]; // Arpeggio pattern
        this.patternIndex = 0;
    }
    
    init() {
        if (this.ctx) return;
        
        // Create audio context
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create master volume
        this.masterVolume = this.ctx.createGain();
        this.masterVolume.gain.value = 0.15; // Soft volume
        
        // Create delay effect for deep ambient space
        this.delayNode = this.ctx.createDelay(1.0);
        this.delayNode.delayTime.value = 0.5; // 500ms echo
        
        this.delayFeedback = this.ctx.createGain();
        this.delayFeedback.gain.value = 0.45; // Generous echo feedback
        
        // Connect delay feedback loop
        this.delayNode.connect(this.delayFeedback);
        this.delayFeedback.connect(this.delayNode);
        
        // Connect components to output
        this.masterVolume.connect(this.ctx.destination);
        this.delayNode.connect(this.masterVolume);
    }
    
    start() {
        this.init();
        if (this.isPlaying) return;
        
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        
        this.isPlaying = true;
        this.playNextNote();
        
        // Play notes every 0.8 seconds (slow arpeggio)
        this.intervalId = setInterval(() => {
            this.playNextNote();
        }, 800);
    }
    
    stop() {
        if (!this.isPlaying) return;
        this.isPlaying = false;
        clearInterval(this.intervalId);
    }
    
    playNextNote() {
        if (!this.ctx || !this.isPlaying) return;
        
        const currentChord = this.chords[this.chordIndex];
        const noteIndex = this.notePattern[this.patternIndex];
        const freq = currentChord[noteIndex];
        
        this.synthNote(freq);
        
        this.patternIndex++;
        if (this.patternIndex >= this.notePattern.length) {
            this.patternIndex = 0;
            this.chordIndex = (this.chordIndex + 1) % this.chords.length;
        }
    }
    
    synthNote(freq) {
        if (!this.ctx) return;
        
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        
        osc.type = 'triangle'; // Soft tone
        osc.frequency.value = freq;
        
        filter.type = 'lowpass';
        filter.frequency.value = 650; 
        filter.Q.value = 1.0;
        
        const now = this.ctx.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.35, now + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.08, now + 1.2);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 3.0);
        
        osc.connect(filter);
        filter.connect(gainNode);
        
        gainNode.connect(this.masterVolume);
        gainNode.connect(this.delayNode);
        
        osc.start(now);
        osc.stop(now + 3.2);
    }
}

export class UiController {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.audio = new ProceduralAudio();
        
        // DOM Cache
        this.passcodeInput = document.getElementById('pass-input');
        this.btnUnlock = document.getElementById('btn-unlock');
        this.passcodeCard = document.querySelector('.passcode-card');
        this.passcodeError = document.getElementById('pass-error');
        
        this.btnNextMoment = document.getElementById('btn-next-moment');
        this.btnFinal = document.getElementById('btn-final');
        
        this.btnYes = document.getElementById('btn-yes');
        this.btnNo = document.getElementById('btn-no');
        
        this.musicToggle = document.getElementById('music-toggle');
        this.customCursor = document.getElementById('custom-cursor');
        
        // Initialize UI Events
        this.initEvents();
        this.initCursor();
    }
    
    initEvents() {
        // Passcode unlock
        this.btnUnlock.addEventListener('click', () => this.validatePasscode());
        this.passcodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.validatePasscode();
        });
        
        // Slideshow controls
        this.btnNextMoment.addEventListener('click', () => {
            this.stateManager.nextMemorySlide();
        });
        
        // State transitions
        this.btnFinal.addEventListener('click', () => {
            this.stateManager.transitionToFinal();
        });
        
        // Choice handlers
        this.btnYes.addEventListener('click', () => {
            this.stateManager.triggerResolution();
        });
        
        // No button dodging
        this.btnNo.addEventListener('mouseover', () => this.dodgeNoButton());
        this.btnNo.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.dodgeNoButton();
        });
        
        // Music Player Toggle
        this.musicToggle.addEventListener('click', () => this.toggleMusic());
    }
    
    initCursor() {
        window.addEventListener('mousemove', (e) => {
            gsap.to(this.customCursor, {
                x: e.clientX,
                y: e.clientY,
                duration: 0.1,
                ease: 'power2.out'
            });
        });
        
        const hoverables = document.querySelectorAll('button, input, a');
        hoverables.forEach((el) => {
            el.addEventListener('mouseenter', () => {
                gsap.to(this.customCursor, {
                    width: 25,
                    height: 25,
                    backgroundColor: 'rgba(255, 255, 255, 0.4)',
                    duration: 0.2
                });
            });
            el.addEventListener('mouseleave', () => {
                gsap.to(this.customCursor, {
                    width: 10,
                    height: 10,
                    backgroundColor: 'white',
                    duration: 0.2
                });
            });
        });
    }
    
    toggleMusic() {
        if (this.audio.isPlaying) {
            this.audio.stop();
            this.musicToggle.classList.remove('playing');
            this.musicToggle.querySelector('.music-text').textContent = 'PLAY AMBIENT';
        } else {
            this.audio.start();
            this.musicToggle.classList.add('playing');
            this.musicToggle.querySelector('.music-text').textContent = 'MUTE MUSIC';
            gsap.to(this.musicToggle, { borderColor: 'rgba(255, 51, 102, 0.4)', duration: 0.5 });
        }
    }
    
    validatePasscode() {
        const inputVal = this.passcodeInput.value.trim().toUpperCase();
        
        if (inputVal === 'LOVE' || inputVal === '1208') {
            this.passcodeError.classList.remove('visible');
            
            if (!this.audio.isPlaying) {
                this.toggleMusic();
            }
            
            this.stateManager.transitionToMemories();
        } else {
            this.passcodeCard.classList.remove('shake');
            void this.passcodeCard.offsetWidth;
            this.passcodeCard.classList.add('shake');
            this.passcodeError.classList.add('visible');
            
            this.passcodeInput.value = '';
            this.passcodeInput.focus();
            
            setTimeout(() => {
                this.passcodeCard.classList.remove('shake');
            }, 500);
        }
    }
    
    updateSlideshowUI(index) {
        const counter = document.getElementById('slide-counter');
        if (counter) counter.textContent = `Moment ${index + 1} of 6`;
        
        if (this.btnNextMoment) {
            if (index === 5) {
                this.btnNextMoment.textContent = "Read My Message";
            } else {
                this.btnNextMoment.textContent = "Next Moment";
            }
        }
    }
    
    startApologyTextAnimation() {
        const lines = document.querySelectorAll('.apology-line');
        
        const tl = gsap.timeline({
            onComplete: () => {
                gsap.to(this.btnFinal, {
                    opacity: 1,
                    y: 0,
                    duration: 1.2,
                    ease: 'power2.out',
                    onComplete: () => {
                        this.btnFinal.style.pointerEvents = 'auto';
                    }
                });
            }
        });
        
        tl.to(lines, {
            opacity: 1,
            y: 0,
            duration: 1.8,
            stagger: 3.5,
            ease: 'power2.out'
        });
    }
    
    dodgeNoButton() {
        const maxX = 160;
        const maxY = 100;
        
        let targetX = (Math.random() - 0.5) * maxX * 2;
        let targetY = (Math.random() - 0.5) * maxY * 2;
        
        if (Math.abs(targetX) < 60) targetX += targetX > 0 ? 60 : -60;
        if (Math.abs(targetY) < 40) targetY += targetY > 0 ? 40 : -40;
        
        gsap.to(this.btnNo, {
            x: targetX,
            y: targetY,
            duration: 0.3,
            ease: 'power2.out'
        });
        
        gsap.to(this.customCursor, {
            backgroundColor: '#ff3366',
            width: 14,
            height: 14,
            duration: 0.1,
            onComplete: () => {
                gsap.to(this.customCursor, {
                    backgroundColor: 'white',
                    width: 10,
                    height: 10,
                    delay: 0.3
                });
            }
        });
    }
    
    startHeartShower() {
        const parent = document.getElementById('ui-thankyou');
        if (!parent) return;
        
        const createHeart = () => {
            if (this.stateManager.currentState !== this.stateManager.states.RESOLVED) return;
            
            const heart = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            heart.setAttribute('class', 'falling-heart');
            heart.setAttribute('viewBox', '0 0 24 24');
            
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z');
            heart.appendChild(path);
            
            const startX = Math.random() * window.innerWidth;
            const size = 12 + Math.random() * 20; // 12px to 32px
            const duration = 4.0 + Math.random() * 5.0; // 4s to 9s
            const rotation = (Math.random() - 0.5) * 120;
            const drift = (Math.random() - 0.5) * 150;
            
            heart.style.left = `${startX}px`;
            heart.style.top = `-40px`;
            heart.style.width = `${size}px`;
            heart.style.height = `${size}px`;
            
            const colors = ['#ff4d6d', '#ff758f', '#ff85a1', '#f7aef8', '#ffb703', '#ffc8dd'];
            heart.style.fill = colors[Math.floor(Math.random() * colors.length)];
            
            parent.appendChild(heart);
            
            gsap.set(heart, { opacity: 0 });
            gsap.to(heart, { opacity: 0.85, duration: 0.5 });
            
            gsap.to(heart, {
                y: window.innerHeight + 80,
                x: `+= ${drift}`,
                rotation: rotation,
                duration: duration,
                ease: 'none',
                onComplete: () => {
                    heart.remove();
                }
            });
        };
        
        const spawnInterval = setInterval(createHeart, 250);
        
        setTimeout(() => {
            clearInterval(spawnInterval);
        }, 90000);
    }
}
