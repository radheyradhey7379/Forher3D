import * as THREE from 'three';

export class ParticleGalaxy {
    constructor(app) {
        this.app = app;
        this.scene = app.scene;
        
        // Configuration
        this.count = 4500;
        this.radius = 28;
        this.geometry = new THREE.BufferGeometry();
        
        const positions = new Float32Array(this.count * 3);
        const colors = new Float32Array(this.count * 3);
        
        // Colors mapping
        const colorInside = new THREE.Color('#ffb3c6'); // soft pink
        const colorOutside = new THREE.Color('#90e0ef'); // soft blue
        const colorWhite = new THREE.Color('#ffffff'); // pure white
        
        for (let i = 0; i < this.count; i++) {
            const i3 = i * 3;
            
            // Distribute points in a double spiral galaxy pattern
            const r = Math.pow(Math.random(), 2.5) * this.radius;
            const spinAngle = r * 0.35;
            const branchAngle = ((i % 2) * Math.PI);
            
            // Randomness to spread them out
            const randomX = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.4 * r;
            const randomY = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.4 * r;
            const randomZ = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.4 * r;
            
            positions[i3] = Math.cos(branchAngle + spinAngle) * r + randomX;
            positions[i3 + 1] = randomY;
            positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r + randomZ;
            
            // Color blend: inside pink, outside blue, with random bright white stars
            let mixedColor = colorInside.clone();
            mixedColor.lerp(colorOutside, r / this.radius);
            
            if (Math.random() > 0.94) {
                mixedColor = colorWhite;
            }
            
            colors[i3] = mixedColor.r;
            colors[i3 + 1] = mixedColor.g;
            colors[i3 + 2] = mixedColor.b;
        }
        
        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        // Generate circular glow texture dynamically
        const texture = this.createCircleTexture();
        
        this.material = new THREE.PointsMaterial({
            size: 0.15,
            sizeAttenuation: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            vertexColors: true,
            transparent: true,
            opacity: 0.65,
            map: texture
        });
        
        this.points = new THREE.Points(this.geometry, this.material);
        this.scene.add(this.points);
        
        this.app.registerUpdatable(this);
    }
    
    createCircleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        
        const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 16, 16);
        
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
    
    update(delta, elapsed) {
        // Slow rotating galaxy
        this.points.rotation.y = elapsed * 0.015;
        
        // Add subtle breathing scale
        const scaleVal = 1 + Math.sin(elapsed * 0.4) * 0.02;
        this.points.scale.set(scaleVal, scaleVal, scaleVal);
    }
    
    destroy() {
        this.app.unregisterUpdatable(this);
        this.scene.remove(this.points);
        this.geometry.dispose();
        this.material.map.dispose();
        this.material.dispose();
    }
}
