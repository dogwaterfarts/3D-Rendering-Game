let lastX = 0;
let lastY = 0;

let canSpin = false;

// Movement state tracking
const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    q: false,
    e: false
};

// Velocity and movement parameters
const velocity = { x: 0, y: 0, z: 0 };
const maxSpeed = 8;
const acceleration = 0.8;
const friction = 0.85;
const rotationSensitivity = 0.003;

// Mouse look
document.addEventListener("mousemove", (event) => {
    let deltaX = event.clientX - lastX;
    let deltaY = event.clientY - lastY;

    if (canSpin) {
        camera.rotationX += deltaX * rotationSensitivity;
        camera.rotationY += deltaY * rotationSensitivity;
        
        // Clamp vertical rotation to prevent flipping
        camera.rotationY = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, camera.rotationY));
    }
    lastX = event.clientX;
    lastY = event.clientY;
});

// Key state tracking
document.addEventListener("keydown", function(event) {
    switch (event.key.toLowerCase()) {
        case "w":
            keys.w = true;
            break;
        case "s":
            keys.s = true;
            break;
        case "d":
            keys.d = true;
            break;
        case "a":
            keys.a = true;
            break;
        case "q":
            keys.q = true;
            break;
        case "e":
            keys.e = true;
            break;
        case "l":
            lightMovement = !lightMovement;
            break;
    }
});

document.addEventListener("keyup", function(event) {
    switch (event.key.toLowerCase()) {
        case "w":
            keys.w = false;
            break;
        case "s":
            keys.s = false;
            break;
        case "d":
            keys.d = false;
            break;
        case "a":
            keys.a = false;
            break;
        case "q":
            keys.q = false;
            break;
        case "e":
            keys.e = false;
            break;
    }
});

// Smooth movement update function - call this in your main loop
function updateMovement() {
    // Calculate desired movement direction
    let desiredVelocity = { x: 0, y: 0, z: 0 };
    
    // Forward/backward movement
    if (keys.w) {
        desiredVelocity.x += Math.sin(camera.rotationX) * Math.cos(camera.rotationY);
        desiredVelocity.y += Math.sin(camera.rotationY);
        desiredVelocity.z += Math.cos(camera.rotationX) * Math.cos(camera.rotationY);
    }
    if (keys.s) {
        desiredVelocity.x -= Math.sin(camera.rotationX) * Math.cos(camera.rotationY);
        desiredVelocity.y -= Math.sin(camera.rotationY);
        desiredVelocity.z -= Math.cos(camera.rotationX) * Math.cos(camera.rotationY);
    }
    
    // Strafe left/right
    if (keys.d) {
        desiredVelocity.x += Math.cos(camera.rotationX);
        desiredVelocity.z -= Math.sin(camera.rotationX);
    }
    if (keys.a) {
        desiredVelocity.x -= Math.cos(camera.rotationX);
        desiredVelocity.z += Math.sin(camera.rotationX);
    }
    
    // Up/down movement
    if (keys.q) {
        desiredVelocity.y -= 1;
    }
    if (keys.e) {
        desiredVelocity.y += 1;
    }
    
    // Normalize diagonal movement
    const magnitude = Math.sqrt(
        desiredVelocity.x * desiredVelocity.x + 
        desiredVelocity.y * desiredVelocity.y + 
        desiredVelocity.z * desiredVelocity.z
    );
    
    if (magnitude > 0) {
        desiredVelocity.x = (desiredVelocity.x / magnitude) * maxSpeed;
        desiredVelocity.y = (desiredVelocity.y / magnitude) * maxSpeed;
        desiredVelocity.z = (desiredVelocity.z / magnitude) * maxSpeed;
    }
    
    // Smooth acceleration towards desired velocity
    velocity.x += (desiredVelocity.x - velocity.x) * acceleration;
    velocity.y += (desiredVelocity.y - velocity.y) * acceleration;
    velocity.z += (desiredVelocity.z - velocity.z) * acceleration;
    
    // Apply friction when not moving
    if (magnitude === 0) {
        velocity.x *= friction;
        velocity.y *= friction;
        velocity.z *= friction;
    }
    
    // Store original position for collision detection
    const originalX = camera.x;
    const originalY = camera.y;
    const originalZ = camera.z;
    
    // Try to move in each axis separately for better wall sliding
    // X-axis movement
    camera.x += velocity.x;
    if (!CollisionDetection(camera, Shapes)) {
        camera.x = originalX;
        velocity.x *= -0.1; // Small bounce back
    }
    
    // Y-axis movement
    camera.y += velocity.y;
    if (!CollisionDetection(camera, Shapes)) {
        camera.y = originalY;
        velocity.y *= -0.1;
    }
    
    // Z-axis movement
    camera.z += velocity.z;
    if (!CollisionDetection(camera, Shapes)) {
        camera.z = originalZ;
        velocity.z *= -0.1;
    }
    
    // Stop very small movements to prevent jitter
    if (Math.abs(velocity.x) < 0.01) velocity.x = 0;
    if (Math.abs(velocity.y) < 0.01) velocity.y = 0;
    if (Math.abs(velocity.z) < 0.01) velocity.z = 0;
}

// Mouse controls
document.addEventListener('mousedown', function(event) {
    if (event.button === 2) {
        event.preventDefault();
        canSpin = true;
    }
});

document.addEventListener('mouseup', function(event) {
    if (event.button === 2) {
        event.preventDefault();
        canSpin = false;
    }
});

document.addEventListener('contextmenu', function(event) {
    event.preventDefault();
});

// Pointer lock for better mouse look (optional enhancement)
document.addEventListener('click', function() {
    if (!document.pointerLockElement) {
        canvas.requestPointerLock();
    }
});

// Enhanced mouse movement with pointer lock
document.addEventListener('pointerlockchange', function() {
    if (document.pointerLockElement === canvas) {
        document.addEventListener('mousemove', handleMouseMove);
    } else {
        document.removeEventListener('mousemove', handleMouseMove);
    }
});

function handleMouseMove(event) {
    if (document.pointerLockElement === canvas) {
        camera.rotationX += event.movementX * rotationSensitivity;
        camera.rotationY += event.movementY * rotationSensitivity;
        
        // Clamp vertical rotation
        camera.rotationY = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, camera.rotationY));
    }
}