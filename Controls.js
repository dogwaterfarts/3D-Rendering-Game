let lastX = 0;
let lastY = 0;

let canSpin = false;

// Movement state tracking
const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    space: false
};

// Velocity and movement parameters
const velocity = { x: 0, y: 0, z: 0 };
const maxSpeed = 8;
const acceleration = 0.8;
const friction = 0.85;
const rotationSensitivity = 0.003;

// Jumping parameters
const jumpForce = 12;
const gravity = 0.6;
const groundLevel = 0; // Adjust this to match your world's ground level
const maxFallSpeed = 20;
let isGrounded = false;
let groundCheckDistance = 25; // Distance to check for ground collision

// Player hitbox dimensions
const playerHitbox = {
    width: 30,    // X-axis width
    height: 100,   // Y-axis height (player height)
    depth: 30     // Z-axis depth
};

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
        case " ": // Spacebar for jumping
            event.preventDefault(); // Prevent page scrolling
            keys.space = true;
            break;

        case '1':
            lights[0].enabled = !lights[0].enabled;
            break;
        case '2':
            lights[1].enabled = !lights[1].enabled;
            break;
        case '3':
            lights[2].enabled = !lights[2].enabled;
            break;
        case '4':
            lights[3].enabled = !lights[3].enabled;
            break;
        case 'l':
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
        case " ": // Spacebar for jumping
            event.preventDefault();
            keys.space = false;
            break;
    }
});

// Smooth movement update function - call this in your main loop
function updateMovement() {
    // Check if player is grounded
    isGrounded = checkGrounded(camera, Shapes);
    
    // Calculate desired movement direction (horizontal only)
    let desiredVelocity = { x: 0, y: 0, z: 0 };
    
    // Forward/backward movement
    if (keys.w) {
        desiredVelocity.x += Math.sin(camera.rotationX) * Math.cos(camera.rotationY);
        desiredVelocity.z += Math.cos(camera.rotationX) * Math.cos(camera.rotationY);
    }
    if (keys.s) {
        desiredVelocity.x -= Math.sin(camera.rotationX) * Math.cos(camera.rotationY);
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
    
    // Normalize diagonal movement (horizontal only)
    const magnitude = Math.sqrt(
        desiredVelocity.x * desiredVelocity.x + 
        desiredVelocity.z * desiredVelocity.z
    );
    
    if (magnitude > 0) {
        desiredVelocity.x = (desiredVelocity.x / magnitude) * maxSpeed;
        desiredVelocity.z = (desiredVelocity.z / magnitude) * maxSpeed;
    }
    
    // Smooth acceleration towards desired velocity (horizontal)
    velocity.x += (desiredVelocity.x - velocity.x) * acceleration;
    velocity.z += (desiredVelocity.z - velocity.z) * acceleration;
    
    // Apply friction when not moving horizontally
    if (magnitude === 0) {
        velocity.x *= friction;
        velocity.z *= friction;
    }
    
    // Handle jumping
    if (keys.space && isGrounded && velocity.y >= -1) {
        velocity.y = -jumpForce; // Negative because Y increases downward in your system
        isGrounded = false;
    }
    
    // Apply gravity
    if (!isGrounded) {
        velocity.y += gravity;
        velocity.y = Math.min(velocity.y, maxFallSpeed); // Terminal velocity
    } else {
        // When grounded, reset vertical velocity if falling
        if (velocity.y > 0) {
            velocity.y = 0;
        }
    }
    
    // Store original position for collision detection
    const originalX = camera.x;
    const originalY = camera.y;
    const originalZ = camera.z;
    
    // Try to move in each axis separately for better wall sliding
    
    // X-axis movement
    if (Math.abs(velocity.x) > 0.01) {
        camera.x += velocity.x;
        if (!CollisionDetectionRectangular(camera, Shapes)) {
            camera.x = originalX;
            velocity.x *= -0.1; // Small bounce back
        }
    }
    
    // Y-axis movement (vertical)
    if (Math.abs(velocity.y) > 0.01) {
        camera.y += velocity.y;
        if (!CollisionDetectionRectangular(camera, Shapes)) {
            camera.y = originalY;
            
            // If we hit something while moving up (jumping), stop upward movement
            if (velocity.y < 0) {
                velocity.y = 0;
            }
            // If we hit something while falling, we're now grounded
            else if (velocity.y > 0) {
                velocity.y = 0;
                isGrounded = true;
            }
        }
    }
    
    // Z-axis movement
    if (Math.abs(velocity.z) > 0.01) {
        camera.z += velocity.z;
        if (!CollisionDetectionRectangular(camera, Shapes)) {
            camera.z = originalZ;
            velocity.z *= -0.1;
        }
    }
    
    // Ground level check (fallback)
    if (camera.y > groundLevel) {
        camera.y = groundLevel;
        velocity.y = 0;
        isGrounded = true;
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