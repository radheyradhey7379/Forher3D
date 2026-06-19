import * as THREE from 'three';
import { gsap } from 'gsap';

export class FinalResolution {
    constructor(app) {
        this.app = app;
        this.scene = app.scene;
        
        this.group = new THREE.Group();
        this.scene.add(this.group);
        
        // 1. Create the 3D Heart Geometry
        this.heartMesh = this.createHeartMesh();
        this.group.add(this.heartMesh);
        
        // Start scale 0 (hidden initially)
        this.heartMesh.scale.set(0, 0, 0);
        
        // 2. Setup Fireworks Particle System
        this.fireworksCount = 1200;
        this.fireworksGeometry = new THREE.BufferGeometry();
        this.fireworksPositions = new Float32Array(this.fireworksCount * 3);
        this.fireworksColors = new Float32Array(this.fireworksCount * 3);
        
        this.fireworksGeometry.setAttribute('position', new THREE.BufferAttribute(this.fireworksPositions, 3));
        this.fireworksGeometry.setAttribute('color', new THREE.BufferAttribute(this.fireworksColors, 3));
        
        // Circular glow texture for fireworks
        const particleTexture = this.createCircleTexture();
        
        this.fireworksMaterial = new THREE.PointsMaterial({
            size: 0.22,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            map: particleTexture
        });
        
        this.fireworksPoints = new THREE.Points(this.fireworksGeometry, this.fireworksMaterial);
        this.group.add(this.fireworksPoints);
        
        this.particles = [];
        this.isExploding = false;
        
        this.app.registerUpdatable(this);
    }
    
    createCircleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        
        const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 16, 16);
        
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
    
    createHeartMesh() {
        // Create 2D Heart Shape
        const x = 0, y = 0;
        const heartShape = new THREE.Shape();
        
        heartShape.moveTo( x + 2.5, y + 2.5 );
        heartShape.bezierCurveTo( x + 2.5, y + 2.5, x + 2.0, y, x, y );
        heartShape.bezierCurveTo( x - 3.0, y, x - 3.0, y + 3.5, x - 3.0, y + 3.5 );
        heartShape.bezierCurveTo( x - 3.0, y + 5.5, x - 1.0, y + 7.7, x + 2.5, y + 9.5 );
        heartShape.bezierCurveTo( x + 6.0, y + 7.7, x + 8.0, y + 5.5, x + 8.0, y + 3.5 );
        heartShape.bezierCurveTo( x + 8.0, y + 3.5, x + 8.0, y, x + 5.0, y );
        heartShape.bezierCurveTo( x + 3.5, y, x + 2.5, y + 2.5, x + 2.5, y + 2.5 );
        
        // Extrude to 3D
        const extrudeSettings = {
            depth: 0.8,
            bevelEnabled: true,
            bevelSegments: 5,
            steps: 2,
            bevelSize: 0.15,
            bevelThickness: 0.15
        };
        
        const geometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
        geometry.center();
        
        // Rotate it so it's upright (it extrudes sideways/downwards based on drawing)
        geometry.rotateZ(Math.PI);
        geometry.rotateX(Math.PI / 12); // tilt it slightly forward
        
        // Double-layer visual: inner wireframe + outer glowing wireframe halo
        this.heartMaterialInner = new THREE.MeshBasicMaterial({
            color: 0xff3366,
            wireframe: true,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide
        });
        
        const innerMesh = new THREE.Mesh(geometry, this.heartMaterialInner);
        
        // Outer glowing semi-transparent wireframe mesh
        this.heartMaterialOuter = new THREE.MeshBasicMaterial({
            color: 0xff85a1,
            wireframe: true,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });
        
        const outerMesh = new THREE.Mesh(geometry, this.heartMaterialOuter);
        outerMesh.scale.set(1.05, 1.05, 1.05);
        
        const heartGroup = new THREE.Group();
        heartGroup.add(innerMesh);
        heartGroup.add(outerMesh);
        
        return heartGroup;
    }
    
    fadeIn(duration = 2.0) {
        // Position heart in front of camera
        this.heartMesh.position.set(0, 0.5, 0);
        this.heartMesh.scale.set(0, 0, 0);
        
        // Scale up
        gsap.to(this.heartMesh.scale, {
            x: 0.65,
            y: 0.65,
            z: 0.65,
            duration: duration,
            ease: 'back.out(1.7)'
        });
        
        // Fade in materials
        gsap.to(this.heartMaterialInner, {
            opacity: 0.85,
            duration: duration
        });
        
        gsap.to(this.heartMaterialOuter, {
            opacity: 0.25,
            duration: duration
        });
    }
    
    explode() {
        this.isExploding = true;
        
        // Fade out heart quickly
        gsap.to(this.heartMaterialInner, {
            opacity: 0,
            duration: 0.5
        });
        gsap.to(this.heartMaterialOuter, {
            opacity: 0,
            duration: 0.5
        });
        gsap.to(this.heartMesh.scale, {
            x: 0,
            y: 0,
            z: 0,
            duration: 0.5
        });
        
        // Set up particle starting states
        const positions = this.fireworksGeometry.attributes.position.array;
        const colors = this.fireworksGeometry.attributes.color.array;
        
        const palette = [
            new THREE.Color('#ffffff'), // white sparkles
            new THREE.Color('#ff3366'), // neon pink
            new THREE.Color('#ff758f'), // light pink
            new THREE.Color('#e0aaff'), // light violet
            new THREE.Color('#ffb703'), // gold
            new THREE.Color('#90e0ef')  // light blue
        ];
        
        for (let i = 0; i < this.fireworksCount; i++) {
            const i3 = i * 3;
            
            // Start at center (where heart was)
            positions[i3] = 0;
            positions[i3 + 1] = 0.5;
            positions[i3 + 2] = 0;
            
            // Random direction in a sphere (spherical coords)
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            
            // Velocity magnitude (explosion speed)
            const speed = 5.0 + Math.random() * 12.0;
            
            const vx = Math.sin(phi) * Math.cos(theta) * speed;
            const vy = Math.sin(phi) * Math.sin(theta) * speed;
            const vz = Math.cos(phi) * speed;
            
            // Assign custom color from palette
            const color = palette[Math.floor(Math.random() * palette.length)].clone();
            
            this.particles[i] = {
                vx: vx,
                vy: vy,
                vz: vz,
                color: color,
                life: 1.0,
                decay: 0.28 + Math.random() * 0.35, // decays in 2-3 seconds
                size: 0.15 + Math.random() * 0.25
            };
            
            // Assign color attribute
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
        }
        
        this.fireworksGeometry.attributes.position.needsUpdate = true;
        this.fireworksGeometry.attributes.color.needsUpdate = true;
        
        // Fade in particles material opacity
        this.fireworksMaterial.opacity = 1.0;
    }
    
    update(delta, elapsed) {
        // 1. Idle heart animations (rotate and pulse like a heartbeat)
        if (this.heartMesh.scale.x > 0) {
            // Spin slowly
            this.heartMesh.rotation.y = elapsed * 0.6;
            this.heartMesh.rotation.x = Math.sin(elapsed * 0.5) * 0.1;
            
            // Pulse beat (dual pulse: bump-bump)
            const cycle = (elapsed * 1.1) % (Math.PI * 2);
            let pulseScale = 0.65;
            
            if (cycle < 0.6) {
                // First beat
                pulseScale += Math.sin(cycle * (Math.PI / 0.6)) * 0.08;
            } else if (cycle > 0.8 && cycle < 1.4) {
                // Second beat
                pulseScale += Math.sin((cycle - 0.8) * (Math.PI / 0.6)) * 0.06;
            }
            
            this.heartMesh.scale.set(pulseScale, pulseScale, pulseScale);
        }
        
        // 2. Physics update for fireworks particles
        if (this.isExploding) {
            const positions = this.fireworksGeometry.attributes.position.array;
            const colors = this.fireworksGeometry.attributes.color.array;
            let activeParticles = 0;
            
            for (let i = 0; i < this.fireworksCount; i++) {
                const i3 = i * 3;
                const p = this.particles[i];
                
                if (p && p.life > 0) {
                    // Update positions
                    positions[i3] += p.vx * delta;
                    positions[i3 + 1] += p.vy * delta;
                    positions[i3 + 2] += p.vz * delta;
                    
                    // Apply gravity
                    p.vy -= 4.0 * delta;
                    
                    // Apply drag
                    p.vx *= 0.95;
                    p.vy *= 0.95;
                    p.vz *= 0.95;
                    
                    // Decay life
                    p.life -= p.decay * delta;
                    
                    // Fade color color according to life
                    colors[i3] = p.color.r * p.life;
                    colors[i3 + 1] = p.color.g * p.life;
                    colors[i3 + 2] = p.color.b * p.life;
                    
                    activeParticles++;
                } else {
                    // Hide dead particles
                    positions[i3] = 9999;
                    positions[i3 + 1] = 9999;
                    positions[i3 + 2] = 9999;
                }
            }
            
            this.fireworksGeometry.attributes.position.needsUpdate = true;
            this.fireworksGeometry.attributes.color.needsUpdate = true;
            
            // If all particles are dead, stop explosion loop
            if (activeParticles === 0) {
                this.isExploding = false;
                this.fireworksMaterial.opacity = 0;
            }
        }
    }
    
    destroy() {
        this.app.unregisterUpdatable(this);
        this.heartMesh.traverse((child) => {
            if (child.isMesh) {
                child.geometry.dispose();
                child.material.dispose();
            }
        });
        this.scene.remove(this.heartMesh);
        
        this.fireworksGeometry.dispose();
        this.fireworksMaterial.map.dispose();
        this.fireworksMaterial.dispose();
        this.scene.remove(this.fireworksPoints);
        this.scene.remove(this.group);
    }
}
