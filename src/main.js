import { WebGLApp } from './scene/WebGLApp.js';
import { StateManager } from './stateManager.js';
import { UiController } from './ui/uiController.js';

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    // 1. Get canvas
    const canvas = document.getElementById('webgl-canvas');
    if (!canvas) {
        console.error("Canvas element not found!");
        return;
    }
    
    // 2. Initialize Three.js Base App
    const app = new WebGLApp(canvas);
    
    // 3. Initialize State Manager
    const stateManager = new StateManager();
    
    // 4. Initialize UI Manager & Audio
    const uiController = new UiController(stateManager);
    
    // 5. Connect State Manager to UI Controller
    stateManager.setUiController(uiController);
    
    // 6. Initialize State Background
    stateManager.init(app);
});
