// ===== PROXIMITY PROMPT SYSTEM =====

// Proximity prompt class
class ProximityPrompt {
    constructor(options = {}) {
        this.object = options.object || null;          // The object this prompt is attached to
        this.position = options.position || { x: 0, y: 0, z: 0 }; // World position (auto-set if object provided)
        this.activationDistance = options.activationDistance || 150; // Distance to show prompt
        this.holdDuration = options.holdDuration || 1000; // Time to hold E (in milliseconds)
        this.promptText = options.promptText || "Interact"; // Text to display
        this.onActivate = options.onActivate || (() => {}); // Callback when activated
        this.onHoldStart = options.onHoldStart || (() => {}); // Callback when hold starts
        this.onHoldEnd = options.onHoldEnd || (() => {}); // Callback when hold ends
        this.enabled = options.enabled !== false; // Whether prompt is active
        this.keyCode = options.keyCode || 'e'; // Key to hold
        
        // Internal state
        this.isVisible = false;
        this.isHolding = false;
        this.holdStartTime = 0;
        this.holdProgress = 0;
        this.lastDistance = Infinity;
        
        // Visual settings
        this.backgroundColor = options.backgroundColor || 'rgba(0, 0, 0, 0.8)';
        this.textColor = options.textColor || '#ffffff';
        this.progressColor = options.progressColor || '#00ff00';
        this.progressBackgroundColor = options.progressBackgroundColor || 'rgba(255, 255, 255, 0.3)';
        this.fontSize = options.fontSize || 16;
        this.padding = options.padding || 10;
        this.borderRadius = options.borderRadius || 8;
        
        // Update position if object is provided
        if (this.object && this.object.x !== undefined) {
            this.position = { x: this.object.x, y: this.object.y, z: this.object.z };
        }
    }
    
    // Update prompt state
    update(camera, deltaTime) {
        if (!this.enabled) {
            this.isVisible = false;
            this.isHolding = false;
            return;
        }
        
        // Update position if attached to object
        if (this.object && this.object.x !== undefined) {
            this.position = { x: this.object.x, y: this.object.y, z: this.object.z };
        }
        
        // Calculate distance to camera
        const dx = this.position.x - camera.x;
        const dy = this.position.y - camera.y;
        const dz = this.position.z - camera.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        this.lastDistance = distance;
        
        // Check if prompt should be visible
        const wasVisible = this.isVisible;
        this.isVisible = distance <= this.activationDistance;
        
        // Reset hold state if prompt becomes invisible
        if (!this.isVisible && this.isHolding) {
            this.stopHolding();
        }
        
        // Update hold progress
        if (this.isHolding) {
            const currentTime = Date.now();
            const elapsed = currentTime - this.holdStartTime;
            this.holdProgress = Math.min(elapsed / this.holdDuration, 1);
            
            // Check if hold is complete
            if (this.holdProgress >= 1) {
                this.activate();
            }
        }
    }
    
    // Start holding the key
    startHolding() {
        if (!this.isVisible || this.isHolding) return;
        
        this.isHolding = true;
        this.holdStartTime = Date.now();
        this.holdProgress = 0;
        this.onHoldStart();
    }
    
    // Stop holding the key
    stopHolding() {
        if (!this.isHolding) return;
        
        this.isHolding = false;
        this.holdProgress = 0;
        this.onHoldEnd();
    }
    
    // Activate the prompt
    activate() {
        if (!this.isVisible) return;
        
        this.stopHolding();
        this.onActivate();
    }
    
    // Render the prompt
    render(camera, context, canvasWidth, canvasHeight) {
        if (!this.isVisible) return;
        
        // Transform world position to screen coordinates
        const translatedX = this.position.x - camera.x;
        const translatedY = this.position.y - camera.y;
        const translatedZ = this.position.z - camera.z;

        const rotYMatrix_neg = rotYMatrix(-camera.rotationX);
        const rotXMatrix_pos = rotXMatrix(camera.rotationY);

        const rotated = MatrixTimesVector(rotXMatrix_pos, 
                       MatrixTimesVector(rotYMatrix_neg, {
                           x: translatedX,
                           y: translatedY, 
                           z: translatedZ
                       }));

        const projected2D = addPerspective(rotated, camera.fov);
        if (!projected2D || rotated.z <= 0) return;

        // Check screen bounds
        if (projected2D.x < -200 || projected2D.x > canvasWidth + 200 || 
            projected2D.y < -200 || projected2D.y > canvasHeight + 200) {
            return;
        }
        
        // Calculate fade based on distance
        const fadeDistance = this.activationDistance * 0.8;
        const alpha = this.lastDistance > fadeDistance ? 
            Math.max(0, 1 - (this.lastDistance - fadeDistance) / (this.activationDistance - fadeDistance)) : 1;
        
        context.save();
        context.globalAlpha = alpha;
        
        // Prepare text
        const keyText = this.keyCode.toUpperCase();
        const fullText = `Hold ${keyText} to ${this.promptText}`;
        
        context.font = `${this.fontSize}px Arial`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        const textWidth = context.measureText(fullText).width;
        const promptWidth = Math.max(textWidth + this.padding * 2, 120);
        const promptHeight = this.fontSize + this.padding * 2;
        
        // Position above object
        const promptX = projected2D.x;
        const promptY = projected2D.y - 60;
        
        // Draw background
        context.fillStyle = this.backgroundColor;
        this.drawRoundedRect(context, 
            promptX - promptWidth / 2, 
            promptY - promptHeight / 2, 
            promptWidth, 
            promptHeight, 
            this.borderRadius
        );
        
        // Draw text
        context.fillStyle = this.textColor;
        context.fillText(fullText, promptX, promptY);
        
        // Draw progress bar if holding
        if (this.isHolding) {
            const progressBarWidth = promptWidth - this.padding * 2;
            const progressBarHeight = 4;
            const progressY = promptY + promptHeight / 2 - progressBarHeight - 4;
            
            // Background
            context.fillStyle = this.progressBackgroundColor;
            this.drawRoundedRect(context,
                promptX - progressBarWidth / 2,
                progressY,
                progressBarWidth,
                progressBarHeight,
                2
            );
            
            // Progress fill
            context.fillStyle = this.progressColor;
            const fillWidth = progressBarWidth * this.holdProgress;
            if (fillWidth > 0) {
                this.drawRoundedRect(context,
                    promptX - progressBarWidth / 2,
                    progressY,
                    fillWidth,
                    progressBarHeight,
                    2
                );
            }
        }
        
        // Draw key indicator
        const keySize = 24;
        const keyX = promptX;
        const keyY = promptY - promptHeight / 2 - keySize - 8;
        
        // Key background
        context.fillStyle = this.isHolding ? this.progressColor : 'rgba(255, 255, 255, 0.9)';
        this.drawRoundedRect(context,
            keyX - keySize / 2,
            keyY - keySize / 2,
            keySize,
            keySize,
            4
        );
        
        // Key text
        context.fillStyle = this.isHolding ? '#000000' : '#333333';
        context.font = `bold ${keySize * 0.6}px Arial`;
        context.fillText(keyText, keyX, keyY);
        
        context.restore();
    }
    
    // Helper function to draw rounded rectangles
    drawRoundedRect(context, x, y, width, height, radius) {
        context.beginPath();
        context.moveTo(x + radius, y);
        context.lineTo(x + width - radius, y);
        context.quadraticCurveTo(x + width, y, x + width, y + radius);
        context.lineTo(x + width, y + height - radius);
        context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        context.lineTo(x + radius, y + height);
        context.quadraticCurveTo(x, y + height, x, y + height - radius);
        context.lineTo(x, y + radius);
        context.quadraticCurveTo(x, y, x + radius, y);
        context.closePath();
        context.fill();
    }
}

// Proximity prompt manager
class ProximityPromptManager {
    constructor() {
        this.prompts = [];
        this.activePrompts = [];
        this.keyStates = {};
        
        // Bind event listeners
        this.bindEvents();
    }
    
    // Add a prompt to the manager
    addPrompt(prompt) {
        if (!(prompt instanceof ProximityPrompt)) {
            console.error('Invalid prompt object');
            return;
        }
        
        this.prompts.push(prompt);
        return prompt;
    }
    
    // Remove a prompt from the manager
    removePrompt(prompt) {
        const index = this.prompts.indexOf(prompt);
        if (index > -1) {
            this.prompts.splice(index, 1);
        }
        
        const activeIndex = this.activePrompts.indexOf(prompt);
        if (activeIndex > -1) {
            this.activePrompts.splice(activeIndex, 1);
        }
    }
    
    // Update all prompts
    update(camera, deltaTime) {
        this.activePrompts = [];
        
        this.prompts.forEach(prompt => {
            prompt.update(camera, deltaTime);
            
            if (prompt.isVisible) {
                this.activePrompts.push(prompt);
            }
        });
        
        // Handle key states
        this.activePrompts.forEach(prompt => {
            const keyPressed = this.keyStates[prompt.keyCode.toLowerCase()];
            
            if (keyPressed && !prompt.isHolding) {
                prompt.startHolding();
            } else if (!keyPressed && prompt.isHolding) {
                prompt.stopHolding();
            }
        });
    }
    
    // Render all visible prompts
    render(camera, context, canvasWidth, canvasHeight) {
        // Sort prompts by distance (closest first)
        const sortedPrompts = [...this.activePrompts].sort((a, b) => 
            a.lastDistance - b.lastDistance
        );
        
        sortedPrompts.forEach(prompt => {
            prompt.render(camera, context, canvasWidth, canvasHeight);
        });
    }
    
    // Bind keyboard events
    bindEvents() {
        document.addEventListener('keydown', (event) => {
            const key = event.key.toLowerCase();
            if (!this.keyStates[key]) {
                this.keyStates[key] = true;
            }
        });
        
        document.addEventListener('keyup', (event) => {
            const key = event.key.toLowerCase();
            this.keyStates[key] = false;
        });
    }
    
    // Get all prompts
    getPrompts() {
        return this.prompts;
    }
    
    // Get active (visible) prompts
    getActivePrompts() {
        return this.activePrompts;
    }
    
    // Enable/disable all prompts
    setEnabled(enabled) {
        this.prompts.forEach(prompt => {
            prompt.enabled = enabled;
        });
    }
}

// Helper function to create a prompt for an object
function createObjectPrompt(object, options = {}) {
    return new ProximityPrompt({
        object: object,
        position: { x: object.x, y: object.y, z: object.z },
        ...options
    });
}

// Example usage and integration code for main.js:

/*
// Add this to main.js after creating shapes:

// Create proximity prompt manager
const promptManager = new ProximityPromptManager();

// Add prompts to existing shapes
const cubePrompt = promptManager.addPrompt(new ProximityPrompt({
    object: Shapes[0], // back cube
    promptText: "Inspect Cube",
    holdDuration: 1500,
    activationDistance: 200,
    onActivate: () => {
        console.log("Cube inspected!");
        // Add your interaction logic here
    },
    onHoldStart: () => {
        console.log("Started inspecting cube...");
    },
    onHoldEnd: () => {
        console.log("Stopped inspecting cube");
    }
}));

const spherePrompt = promptManager.addPrompt(new ProximityPrompt({
    object: Shapes[1], // front sphere
    promptText: "Touch Sphere",
    holdDuration: 1000,
    activationDistance: 180,
    progressColor: '#0066ff',
    onActivate: () => {
        console.log("Sphere touched!");
        // Change sphere color or add effects
        Shapes[1].color = { 
            r: Math.random() * 255, 
            g: Math.random() * 255, 
            b: Math.random() * 255 
        };
    }
}));

// In the engine() function, add these lines after updateMovement():
// Update and render proximity prompts
promptManager.update(camera, 16); // 16ms for ~60fps

// Add this line at the end of the engine() function, after rendering UI:
// Render proximity prompts (should be rendered last to appear on top)
promptManager.render(camera, context, canvasWidth, canvasHeight);

*/

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ProximityPrompt, ProximityPromptManager, createObjectPrompt };
}