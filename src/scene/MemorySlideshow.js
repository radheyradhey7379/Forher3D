import * as THREE from 'three';
import { gsap } from 'gsap';

export class MemorySlideshow {
    constructor(app, onReady) {
        this.app = app;
        this.scene = app.scene;
        this.camera = app.camera;
        this.renderer = app.renderer;
        
        this.group = new THREE.Group();
        this.scene.add(this.group);
        
        // Slideshow Config
        this.memoryCount = 6;
        this.polaroids = [];
        this.currentIndex = -1;
        
        // Memory data
        this.memoriesData = [
            { text: "Cozy coffee talks", file: "/textures/memory_1.png" },
            { text: "Under starry skies", file: "/textures/memory_2.png" },
            { text: "Laughing in the rain", file: "/textures/memory_3.png" },
            { text: "Golden hour shoreline", file: "/textures/memory_4.png" },
            { text: "Scenic long roads", file: "/textures/memory_5.png" },
            { text: "Warm winter nights", file: "/textures/memory_6.png" }
        ];
        
        // Load textures and build Polaroids
        this.textureLoader = new THREE.TextureLoader();
        this.loadMemories(onReady);
        
        this.app.registerUpdatable(this);
    }
    
    loadMemories(onReady) {
        let loadedCount = 0;
        
        this.memoriesData.forEach((data, index) => {
            this.textureLoader.load(
                data.file,
                (texture) => {
                    const polaroid = this.createPolaroidMesh(texture, data.text);
                    
                    // Put all polaroids far in the background and scale 0 initially
                    polaroid.position.set(0, 0.4, -20);
                    polaroid.scale.set(0, 0, 0);
                    polaroid.material.opacity = 0;
                    
                    // Store starting values for floating animation
                    polaroid.userData = {
                        index: index,
                        targetY: 0.4,
                        phase: Math.random() * Math.PI * 2,
                        isFocused: false
                    };
                    
                    this.group.add(polaroid);
                    this.polaroids.push(polaroid);
                    
                    loadedCount++;
                    if (loadedCount === this.memoryCount && typeof onReady === 'function') {
                        // Sort by index to maintain correct order
                        this.polaroids.sort((a, b) => a.userData.index - b.userData.index);
                        onReady();
                    }
                },
                undefined,
                (err) => {
                    console.error("Failed to load memory texture", data.file, err);
                }
            );
        });
    }
    
    createPolaroidMesh(photoTexture, captionText) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 640;
        const ctx = canvas.getContext('2d');
        
        // 1. Off-white background
        ctx.fillStyle = '#fbf9f4';
        ctx.fillRect(0, 0, 512, 640);
        
        // 2. Photo frame shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
        ctx.fillRect(28, 28, 456, 456);
        
        // 3. Draw photo
        if (photoTexture.image) {
            ctx.drawImage(photoTexture.image, 32, 32, 448, 448);
        } else {
            ctx.fillStyle = '#ffc8dd';
            ctx.fillRect(32, 32, 448, 448);
        }
        
        // 4. Caption
        ctx.fillStyle = '#1c1c1c';
        ctx.textAlign = 'center';
        ctx.font = 'italic 25px "Cormorant Garamond", Georgia, serif';
        ctx.fillText(captionText, 256, 552);
        
        const canvasTexture = new THREE.CanvasTexture(canvas);
        canvasTexture.colorSpace = THREE.SRGBColorSpace;
        
        const geometry = new THREE.PlaneGeometry(3.6, 4.5);
        const material = new THREE.MeshBasicMaterial({
            map: canvasTexture,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        return mesh;
    }
    
    showSlide(index) {
        if (index < 0 || index >= this.memoryCount) return;
        
        const oldIndex = this.currentIndex;
        this.currentIndex = index;
        
        // 1. Anim out old slide
        if (oldIndex >= 0 && oldIndex < this.memoryCount) {
            const oldPolaroid = this.polaroids[oldIndex];
            oldPolaroid.userData.isFocused = false;
            
            // Fly current slide past the camera (zoom in/scale up and fade out)
            gsap.to(oldPolaroid.position, {
                z: 11.0, // flies past camera at z = 8.5
                y: 1.0,
                duration: 1.0,
                ease: 'power2.in'
            });
            gsap.to(oldPolaroid.scale, {
                x: 1.6,
                y: 1.6,
                z: 1.6,
                duration: 1.0,
                ease: 'power2.in'
            });
            gsap.to(oldPolaroid.material, {
                opacity: 0,
                duration: 0.9,
                ease: 'power2.in',
                onComplete: () => {
                    // Reset to background stack once completely faded
                    oldPolaroid.position.set(0, 0.4, -20);
                    oldPolaroid.scale.set(0, 0, 0);
                }
            });
        }
        
        // 2. Anim in new slide
        const newPolaroid = this.polaroids[index];
        newPolaroid.position.set(0, 0.2, -18); // start deep in background
        newPolaroid.scale.set(0.1, 0.1, 0.1);
        newPolaroid.material.opacity = 0;
        
        // Fly in from background and stop at focus z = 3.5 (camera is at z = 8.5)
        gsap.to(newPolaroid.position, {
            z: 3.5,
            y: 0.4,
            duration: 1.4,
            ease: 'back.out(1.2)',
            onComplete: () => {
                newPolaroid.userData.isFocused = true;
            }
        });
        
        gsap.to(newPolaroid.scale, {
            x: 1.0,
            y: 1.0,
            z: 1.0,
            duration: 1.4,
            ease: 'back.out(1.2)'
        });
        
        gsap.to(newPolaroid.material, {
            opacity: 1,
            duration: 1.0,
            ease: 'power2.out'
        });
    }
    
    update(delta, elapsed) {
        // 1. Slow, subtle rotation for the whole group to look dynamic
        this.group.rotation.y = Math.sin(elapsed * 0.2) * 0.05;
        this.group.rotation.x = Math.cos(elapsed * 0.15) * 0.03;
        
        // 2. Bobbing animation for the focused slide
        this.polaroids.forEach((polaroid) => {
            if (polaroid.userData.isFocused) {
                const ud = polaroid.userData;
                // Soft hover float
                polaroid.position.y = ud.targetY + Math.sin(elapsed * 1.5 + ud.phase) * 0.08;
                polaroid.rotation.z = Math.sin(elapsed * 0.7 + ud.phase) * 0.015;
            }
        });
    }
    
    fadeOutAll(duration = 1.5) {
        this.polaroids.forEach((p) => {
            gsap.to(p.scale, {
                x: 0,
                y: 0,
                z: 0,
                duration: duration,
                ease: 'power2.inOut'
            });
            gsap.to(p.material, {
                opacity: 0,
                duration: duration,
                ease: 'power2.inOut'
            });
        });
    }
    
    destroy() {
        this.app.unregisterUpdatable(this);
        this.polaroids.forEach((p) => {
            p.geometry.dispose();
            p.material.map.dispose();
            p.material.dispose();
        });
        this.scene.remove(this.group);
    }
}
