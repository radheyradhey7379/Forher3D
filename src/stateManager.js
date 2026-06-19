import { gsap } from 'gsap';
import { ParticleGalaxy } from './scene/ParticleGalaxy.js';
import { MemorySlideshow } from './scene/MemorySlideshow.js';
import { ApologyAura } from './scene/ApologyAura.js';
import { FinalResolution } from './scene/FinalResolution.js';

export class StateManager {
    constructor() {
        this.app = null;
        this.ui = null;
        
        // Scenes
        this.galaxy = null;
        this.slideshow = null;
        this.aura = null;
        this.final = null;
        
        // Slideshow state tracking
        this.currentSlideIndex = 0;
        this.totalSlides = 6;
        
        // FSM states
        this.states = {
            PASSCODE: 'PASSCODE',
            MEMORIES: 'MEMORIES',
            PARAGRAPH: 'PARAGRAPH',
            FINAL: 'FINAL',
            RESOLVED: 'RESOLVED'
        };
        this.currentState = this.states.PASSCODE;
    }
    
    init(app) {
        this.app = app;
        
        // Initialize State 1 Background: Galaxy
        this.galaxy = new ParticleGalaxy(this.app);
    }
    
    setUiController(ui) {
        this.ui = ui;
    }
    
    transitionToMemories() {
        if (this.currentState !== this.states.PASSCODE) return;
        this.currentState = this.states.MEMORIES;
        
        const uiPasscode = document.getElementById('ui-passcode');
        const uiMemories = document.getElementById('ui-memories');
        const canvas = document.getElementById('webgl-canvas');
        
        // 1. Unblur WebGL canvas
        canvas.classList.remove('blur-active');
        
        // 2. Fade out Passcode UI
        uiPasscode.classList.remove('active');
        
        // 3. Initialize Memory Slideshow in background (loads textures)
        this.slideshow = new MemorySlideshow(this.app, () => {
            // 4. Zoom camera slightly forward to focus position
            gsap.to(this.app.camera.position, {
                x: 0,
                y: 0.5,
                z: 8.5, // Slide camera slightly closer
                duration: 2.2,
                ease: 'power2.inOut',
                onComplete: () => {
                    // 5. Reveal slide 0
                    this.currentSlideIndex = 0;
                    this.slideshow.showSlide(0);
                    
                    // 6. Update UI Counter
                    this.ui.updateSlideshowUI(0);
                    
                    // 7. Fade in Memories UI overlay
                    uiMemories.classList.add('active');
                }
            });
        });
    }
    
    nextMemorySlide() {
        if (this.currentState !== this.states.MEMORIES) return;
        
        if (this.currentSlideIndex < this.totalSlides - 1) {
            // Go to next slide
            this.currentSlideIndex++;
            this.slideshow.showSlide(this.currentSlideIndex);
            this.ui.updateSlideshowUI(this.currentSlideIndex);
        } else {
            // All slides viewed, transition to paragraph page
            this.transitionToParagraph();
        }
    }
    
    transitionToParagraph() {
        if (this.currentState !== this.states.MEMORIES) return;
        this.currentState = this.states.PARAGRAPH;
        
        const uiMemories = document.getElementById('ui-memories');
        const uiParagraph = document.getElementById('ui-paragraph');
        
        // 1. Fade out Memories UI
        uiMemories.classList.remove('active');
        
        // 2. Fade out slideshow elements
        this.slideshow.fadeOutAll(1.8);
        
        // 3. Animate camera upwards into the void
        gsap.to(this.app.camera.position, {
            x: 0,
            y: 18,
            z: 5,
            duration: 2.5,
            ease: 'power2.inOut'
        });
        
        gsap.to(this.app.camera.rotation, {
            x: -Math.PI / 10,
            y: 0,
            z: 0,
            duration: 2.5,
            ease: 'power2.inOut'
        });
        
        // 4. Fade out galaxy
        gsap.to(this.galaxy.points.scale, {
            x: 0,
            y: 0,
            z: 0,
            duration: 2.0,
            onComplete: () => {
                this.galaxy.destroy();
                this.slideshow.destroy();
            }
        });
        
        // 5. Initialize Apology Aura
        this.aura = new ApologyAura(this.app);
        this.aura.fadeIn(2.5);
        
        // 6. Show Paragraph UI & Start Text Reveal
        setTimeout(() => {
            uiParagraph.classList.add('active');
            this.ui.startApologyTextAnimation();
        }, 2200);
    }
    
    transitionToFinal() {
        if (this.currentState !== this.states.PARAGRAPH) return;
        this.currentState = this.states.FINAL;
        
        const uiParagraph = document.getElementById('ui-paragraph');
        const uiFinal = document.getElementById('ui-final');
        
        // 1. Fade out Paragraph UI
        uiParagraph.classList.remove('active');
        
        // 2. Fade out Apology Aura
        this.aura.fadeOut(2.0);
        
        // 3. Reset camera back to center
        gsap.to(this.app.camera.position, {
            x: 0,
            y: 0.5,
            z: 8.5,
            duration: 2.2,
            ease: 'power2.inOut'
        });
        
        gsap.to(this.app.camera.rotation, {
            x: 0,
            y: 0,
            z: 0,
            duration: 2.2,
            ease: 'power2.inOut'
        });
        
        // 4. Initialize glowing heart/sphere
        this.final = new FinalResolution(this.app);
        this.final.fadeIn(2.5);
        
        // 5. Show Final UI
        setTimeout(() => {
            uiFinal.classList.add('active');
            gsap.to(this.ui.customCursor, { width: 10, height: 10, duration: 0.2 });
        }, 2200);
    }
    
    triggerResolution() {
        if (this.currentState !== this.states.FINAL) return;
        this.currentState = this.states.RESOLVED;
        
        const uiFinal = document.getElementById('ui-final');
        const uiThankyou = document.getElementById('ui-thankyou');
        
        // 1. Hide Choice UI
        uiFinal.classList.remove('active');
        
        // 2. Trigger Fireworks particle explosion
        this.final.explode();
        
        // 3. Fade entire viewport to pure white
        setTimeout(() => {
            uiThankyou.classList.add('active');
            this.ui.startHeartShower();
            
            // 4. Stagger reveal "Thank you" and "Let's build a new story..."
            const tl = gsap.timeline();
            tl.to('.thankyou-title', {
                opacity: 1,
                scale: 1,
                duration: 1.5,
                ease: 'power3.out'
            })
            .to('.thankyou-subtitle', {
                opacity: 0.8,
                y: 0,
                duration: 1.2,
                ease: 'power2.out'
            }, '-=0.5')
            .to('.thankyou-message', {
                opacity: 0.95,
                y: 0,
                duration: 1.2,
                ease: 'power2.out'
            }, '-=0.5')
            .to('.heart-icon-end', {
                opacity: 1,
                scale: 1.2,
                duration: 1.0,
                ease: 'back.out(2)'
            }, '-=0.2')
            .to('.heart-icon-end', {
                scale: 1.0,
                duration: 0.6,
                yoyo: true,
                repeat: -1,
                ease: 'power1.inOut'
            });
            
            // Clean up 3D elements once background is fully white
            setTimeout(() => {
                this.final.destroy();
                if (this.aura) this.aura.destroy();
            }, 1000);
            
        }, 1500);
    }
}
