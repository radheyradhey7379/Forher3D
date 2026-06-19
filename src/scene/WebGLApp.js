import * as THREE from 'three';

export class WebGLApp {
    constructor(canvas) {
        this.canvas = canvas;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        // 1. Create Scene
        this.scene = new THREE.Scene();
        
        // 2. Create Camera
        this.camera = new THREE.PerspectiveCamera(60, this.width / this.height, 0.1, 1000);
        // Start far back in State 1
        this.camera.position.set(0, 0, 16);
        
        // 3. Create Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        
        // 4. Update loops & resizing
        this.updatables = [];
        this.resizeListeners = [];
        
        window.addEventListener('resize', this.onResize.bind(this));
        
        this.clock = new THREE.Clock();
        this.tick();
    }
    
    registerUpdatable(object) {
        this.updatables.push(object);
    }
    
    unregisterUpdatable(object) {
        const index = this.updatables.indexOf(object);
        if (index > -1) {
            this.updatables.splice(index, 1);
        }
    }
    
    registerResizeListener(listener) {
        this.resizeListeners.push(listener);
    }
    
    onResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        for (const listener of this.resizeListeners) {
            if (typeof listener.onResize === 'function') {
                listener.onResize(this.width, this.height);
            }
        }
    }
    
    tick() {
        requestAnimationFrame(this.tick.bind(this));
        
        const delta = this.clock.getDelta();
        const elapsed = this.clock.getElapsedTime();
        
        for (const updatable of this.updatables) {
            if (typeof updatable.update === 'function') {
                updatable.update(delta, elapsed);
            }
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}
