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
        
        // Slideshow Config (5 pics + 1 video = 6 items)
        this.memoryCount = 6;
        this.polaroids = [];
        this.currentIndex = -1;
        
        this.memoriesData = [
            { text: "Cozy coffee talks", file: "textures/memory_1.jpg", isVideo: false },
            { text: "Under starry skies", file: "textures/memory_2.jpg", isVideo: false },
            { text: "Laughing in the rain", file: "textures/memory_3.jpg", isVideo: false },
            { text: "Golden hour shoreline", file: "textures/memory_4.jpg", isVideo: false },
            { text: "Scenic long roads", file: "textures/memory_5.jpg", isVideo: false },
            { text: "A memory in motion", file: "textures/memory_video.mp4", isVideo: true }
        ];
        
        // Load textures and build Polaroids
        this.textureLoader = new THREE.TextureLoader();
        this.loadMemories(onReady);
        
        this.app.registerUpdatable(this);
    }
    
    loadMemories(onReady) {
        let loadedCount = 0;
        
        this.memoriesData.forEach((data, index) => {
            if (data.isVideo) {
                // Setup video element & polaroid directly
                const polaroid = this.createVideoPolaroidMesh(data.file, data.text);
                polaroid.position.set(0, 0.4, -20);
                polaroid.scale.set(0, 0, 0);
                polaroid.children.forEach(c => c.material.opacity = 0);
                
                polaroid.userData = {
                    index: index,
                    targetY: 0.4,
                    phase: Math.random() * Math.PI * 2,
                    isFocused: false,
                    video: polaroid.userData.video
                };
                
                this.group.add(polaroid);
                this.polaroids.push(polaroid);
                
                loadedCount++;
                if (loadedCount === this.memoryCount && typeof onReady === 'function') {
                    this.polaroids.sort((a, b) => a.userData.index - b.userData.index);
                    onReady();
                }
            } else {
                // Load photo
                this.textureLoader.load(
                    data.file,
                    (texture) => {
                        texture.colorSpace = THREE.SRGBColorSpace;
                        const polaroid = this.createPhotoPolaroidMesh(texture, data.text);
                        polaroid.position.set(0, 0.4, -20);
                        polaroid.scale.set(0, 0, 0);
                        polaroid.children.forEach(c => c.material.opacity = 0);
                        
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
                            this.polaroids.sort((a, b) => a.userData.index - b.userData.index);
                            onReady();
                        }
                    },
                    undefined,
                    (err) => {
                        console.error("Failed to load photo texture", data.file, err);
                        
                        // Fallback texture so app never hangs on load failures
                        const dummyCanvas = document.createElement('canvas');
                        dummyCanvas.width = 16;
                        dummyCanvas.height = 16;
                        const dummyCtx = dummyCanvas.getContext('2d');
                        dummyCtx.fillStyle = '#ffc8dd';
                        dummyCtx.fillRect(0, 0, 16, 16);
                        const dummyTexture = new THREE.CanvasTexture(dummyCanvas);
                        
                        const polaroid = this.createPhotoPolaroidMesh(dummyTexture, data.text);
                        polaroid.position.set(0, 0.4, -20);
                        polaroid.scale.set(0, 0, 0);
                        polaroid.children.forEach(c => c.material.opacity = 0);
                        
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
                            this.polaroids.sort((a, b) => a.userData.index - b.userData.index);
                            onReady();
                        }
                    }
                );
            }
        });
    }
    
    createFrameMesh(captionText) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 640;
        const ctx = canvas.getContext('2d');
        
        // 1. Polaroid off-white frame
        ctx.fillStyle = '#fbf9f4';
        ctx.fillRect(0, 0, 512, 640);
        
        // 2. Photo frame shadow outline
        ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
        ctx.fillRect(28, 28, 456, 456);
        
        // 3. Caption
        ctx.fillStyle = '#1c1c1c';
        ctx.textAlign = 'center';
        ctx.font = 'italic 25px "Cormorant Garamond", Georgia, serif';
        ctx.fillText(captionText, 256, 552);
        
        const frameTexture = new THREE.CanvasTexture(canvas);
        frameTexture.colorSpace = THREE.SRGBColorSpace;
        
        const geometry = new THREE.PlaneGeometry(3.6, 4.5);
        const material = new THREE.MeshBasicMaterial({
            map: frameTexture,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide
        });
        
        return new THREE.Mesh(geometry, material);
    }
    
    createPhotoPolaroidMesh(photoTexture, captionText) {
        const group = new THREE.Group();
        
        // 1. Frame mesh
        const frameMesh = this.createFrameMesh(captionText);
        group.add(frameMesh);
        
        // 2. Photo content mesh
        const photoGeo = new THREE.PlaneGeometry(3.15, 3.15);
        const photoMat = new THREE.MeshBasicMaterial({
            map: photoTexture,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide
        });
        
        const photoMesh = new THREE.Mesh(photoGeo, photoMat);
        photoMesh.position.set(0, 0.5, 0.015); // Offset forward to avoid z-fighting
        group.add(photoMesh);
        
        return group;
    }
    
    createVideoPolaroidMesh(videoSrc, captionText) {
        const group = new THREE.Group();
        
        // 1. Frame mesh
        const frameMesh = this.createFrameMesh(captionText);
        group.add(frameMesh);
        
        // 2. Video element
        const video = document.createElement('video');
        video.src = videoSrc;
        video.crossOrigin = 'anonymous';
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.setAttribute('webkit-playsinline', 'true');
        video.load();
        
        const videoTexture = new THREE.VideoTexture(video);
        videoTexture.colorSpace = THREE.SRGBColorSpace;
        
        // 3. Video content mesh
        const videoGeo = new THREE.PlaneGeometry(3.15, 3.15);
        const videoMat = new THREE.MeshBasicMaterial({
            map: videoTexture,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide
        });
        
        const videoMesh = new THREE.Mesh(videoGeo, videoMat);
        videoMesh.position.set(0, 0.5, 0.015);
        group.add(videoMesh);
        
        // Store video reference on group
        group.userData = { video: video };
        
        return group;
    }
    
    showSlide(index) {
        if (index < 0 || index >= this.memoryCount) return;
        
        const oldIndex = this.currentIndex;
        this.currentIndex = index;
        
        // 1. Anim out old slide
        if (oldIndex >= 0 && oldIndex < this.memoryCount) {
            const oldPolaroid = this.polaroids[oldIndex];
            oldPolaroid.userData.isFocused = false;
            
            // If old slide had a video, pause it
            if (oldPolaroid.userData.video) {
                oldPolaroid.userData.video.pause();
            }
            
            // Fly current slide past the camera (zoom in/scale up and fade out)
            gsap.to(oldPolaroid.position, {
                z: 11.0, 
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
            
            oldPolaroid.children.forEach(c => {
                gsap.to(c.material, {
                    opacity: 0,
                    duration: 0.9,
                    ease: 'power2.in'
                });
            });
            
            // Reset position after fade
            setTimeout(() => {
                if (this.currentIndex !== oldIndex) { // make sure user didn't instantly scroll back
                    oldPolaroid.position.set(0, 0.4, -20);
                    oldPolaroid.scale.set(0, 0, 0);
                }
            }, 1000);
        }
        
        // 2. Anim in new slide
        const newPolaroid = this.polaroids[index];
        newPolaroid.position.set(0, 0.2, -18); 
        newPolaroid.scale.set(0.1, 0.1, 0.1);
        
        // Fly in from background and stop at focus z = 3.5 (camera is at z = 8.5)
        gsap.to(newPolaroid.position, {
            z: 3.5,
            y: 0.4,
            duration: 1.4,
            ease: 'back.out(1.2)',
            onComplete: () => {
                newPolaroid.userData.isFocused = true;
                // Play video if it's the video slide
                if (newPolaroid.userData.video) {
                    newPolaroid.userData.video.play().catch(err => {
                        console.warn("Video autoplay failed, waiting for user click.", err);
                    });
                }
            }
        });
        
        gsap.to(newPolaroid.scale, {
            x: 1.0,
            y: 1.0,
            z: 1.0,
            duration: 1.4,
            ease: 'back.out(1.2)'
        });
        
        newPolaroid.children.forEach(c => {
            gsap.to(c.material, {
                opacity: 1,
                duration: 1.0,
                ease: 'power2.out'
            });
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
                polaroid.position.y = ud.targetY + Math.sin(elapsed * 1.5 + ud.phase) * 0.08;
                polaroid.rotation.z = Math.sin(elapsed * 0.7 + ud.phase) * 0.015;
            }
        });
    }
    
    fadeOutAll(duration = 1.5) {
        this.polaroids.forEach((p) => {
            if (p.userData.video) {
                p.userData.video.pause();
            }
            gsap.to(p.scale, {
                x: 0,
                y: 0,
                z: 0,
                duration: duration,
                ease: 'power2.inOut'
            });
            p.children.forEach(c => {
                gsap.to(c.material, {
                    opacity: 0,
                    duration: duration,
                    ease: 'power2.inOut'
                });
            });
        });
    }
    
    destroy() {
        this.app.unregisterUpdatable(this);
        this.polaroids.forEach((p) => {
            if (p.userData.video) {
                p.userData.video.pause();
                p.userData.video.src = "";
                p.userData.video.load();
            }
            p.children.forEach(c => {
                c.geometry.dispose();
                if (c.material.map) c.material.map.dispose();
                c.material.dispose();
            });
        });
        this.scene.remove(this.group);
    }
}
