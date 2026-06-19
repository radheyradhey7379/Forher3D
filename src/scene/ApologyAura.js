import * as THREE from 'three';
import { gsap } from 'gsap';

export class ApologyAura {
    constructor(app) {
        this.app = app;
        this.scene = app.scene;
        
        this.group = new THREE.Group();
        this.scene.add(this.group);
        
        // 1. Soft Warm Lights
        this.lights = [];
        const colors = ['#ff4d6d', '#ff758f', '#ff85a1', '#ffe5ec'];
        
        for (let i = 0; i < 3; i++) {
            const light = new THREE.PointLight(colors[i], 0, 15);
            light.position.set(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 5,
                (Math.random() - 0.5) * 10
            );
            this.group.add(light);
            this.lights.push(light);
        }
        
        // 2. Floating Warm Embers/Dust
        this.count = 250;
        this.geometry = new THREE.BufferGeometry();
        
        const positions = new Float32Array(this.count * 3);
        const velocities = [];
        
        for (let i = 0; i < this.count; i++) {
            const i3 = i * 3;
            // Distribute in a box around the center
            positions[i3] = (Math.random() - 0.5) * 20;
            positions[i3 + 1] = (Math.random() - 0.5) * 15 - 5; // Start slightly lower
            positions[i3 + 2] = (Math.random() - 0.5) * 20;
            
            // Random upward velocity, slow float
            velocities.push({
                x: (Math.random() - 0.5) * 0.2,
                y: 0.5 + Math.random() * 0.8,
                z: (Math.random() - 0.5) * 0.2,
                speedMultiplier: 0.8 + Math.random() * 0.6
            });
        }
        
        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.velocities = velocities;
        
        // Soft round glow material
        this.material = new THREE.PointsMaterial({
            size: 0.18,
            color: new THREE.Color('#ff758f'),
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.embers = new THREE.Points(this.geometry, this.material);
        this.group.add(this.embers);
        
        this.app.registerUpdatable(this);
    }
    
    fadeIn(duration = 2.5) {
        // Fade in ember particles
        gsap.to(this.material, {
            opacity: 0.6,
            duration: duration,
            ease: 'power2.out'
        });
        
        // Fade in point lights intensity
        this.lights.forEach((light) => {
            gsap.to(light, {
                intensity: 6.0,
                duration: duration + 1.0,
                ease: 'power2.out'
            });
        });
        
        // Gradually fade in a warm background fog
        const targetFogColor = new THREE.Color('#100508');
        const targetBgColor = new THREE.Color('#030102');
        
        gsap.to(this.scene.background || targetBgColor, {
            r: targetBgColor.r,
            g: targetBgColor.g,
            b: targetBgColor.b,
            duration: duration
        });
        
        this.scene.fog = new THREE.FogExp2('#030102', 0.015);
        gsap.to(this.scene.fog, {
            density: 0.045,
            duration: duration
        });
    }
    
    update(delta, elapsed) {
        // 1. Float embers upwards
        const positions = this.geometry.attributes.position.array;
        
        for (let i = 0; i < this.count; i++) {
            const i3 = i * 3;
            const vel = this.velocities[i];
            
            // Move y upwards
            positions[i3 + 1] += vel.y * delta * vel.speedMultiplier;
            // Add subtle sine drift to x & z
            positions[i3] += Math.sin(elapsed + i) * 0.1 * delta;
            positions[i3 + 2] += Math.cos(elapsed + i) * 0.1 * delta;
            
            // Reset position if it floats too high
            if (positions[i3 + 1] > 12) {
                positions[i3] = (Math.random() - 0.5) * 20;
                positions[i3 + 1] = -8;
                positions[i3 + 2] = (Math.random() - 0.5) * 20;
            }
        }
        
        this.geometry.attributes.position.needsUpdate = true;
        
        // 2. Slow orbital movement for the point lights
        this.lights.forEach((light, index) => {
            const angle = elapsed * 0.15 + (index * Math.PI * 2 / 3);
            light.position.x = Math.cos(angle) * (5 + index);
            light.position.z = Math.sin(angle) * (5 + index);
            light.position.y = Math.sin(elapsed * 0.3 + index) * 2;
        });
    }
    
    fadeOut(duration = 2.0) {
        gsap.to(this.material, {
            opacity: 0,
            duration: duration,
            ease: 'power2.inOut'
        });
        
        this.lights.forEach((light) => {
            gsap.to(light, {
                intensity: 0,
                duration: duration,
                ease: 'power2.inOut'
            });
        });
        
        if (this.scene.fog) {
            gsap.to(this.scene.fog, {
                density: 0,
                duration: duration,
                onComplete: () => {
                    this.scene.fog = null;
                }
            });
        }
    }
    
    destroy() {
        this.app.unregisterUpdatable(this);
        this.lights.forEach((light) => {
            this.group.remove(light);
        });
        this.geometry.dispose();
        this.material.dispose();
        this.scene.remove(this.group);
    }
}
