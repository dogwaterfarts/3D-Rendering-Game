function CollisionDetection(player, collidableObjects) {
    const playerRadius = 70; // Collision radius around the camera
    
    for (const shape of collidableObjects) {
        if (shape.name && shape.name.includes("sphere")) {
            // Sphere collision detection
            const distance = Math.sqrt(
                Math.pow(player.x - shape.x, 2) + 
                Math.pow(player.y - shape.y, 2) + 
                Math.pow(player.z - shape.z, 2)
            );
            
            if (distance <= shape.radius + playerRadius) {
                return false; // Collision detected
            }
        } else {
            // Cube/Box collision detection using AABB (Axis-Aligned Bounding Box)
            const halfWidth = shape.w || 50;   // Use shape dimensions or default
            const halfHeight = shape.h || 50;
            const halfDepth = shape.d || 50;
            
            // Check if player is within the expanded bounding box
            const isInXRange = Math.abs(player.x - shape.x) <= halfWidth + playerRadius;
            const isInYRange = Math.abs(player.y - shape.y) <= halfHeight + playerRadius;
            const isInZRange = Math.abs(player.z - shape.z) <= halfDepth + playerRadius;
            
            if (isInXRange && isInYRange && isInZRange) {
                return false; // Collision detected
            }
        }
    }
    return true; // No collision
}

// Helper function for sphere vs AABB collision
function sphereVsAABB(sphere, aabb) {
    // Find the closest point on the AABB to the sphere center
    const closestX = Math.max(aabb.minX, Math.min(sphere.x, aabb.maxX));
    const closestY = Math.max(aabb.minY, Math.min(sphere.y, aabb.maxY));
    const closestZ = Math.max(aabb.minZ, Math.min(sphere.z, aabb.maxZ));
    
    // Calculate distance from sphere center to closest point
    const distanceSquared = 
        (sphere.x - closestX) * (sphere.x - closestX) +
        (sphere.y - closestY) * (sphere.y - closestY) +
        (sphere.z - closestZ) * (sphere.z - closestZ);
    
    // Check if distance is less than sphere radius
    return distanceSquared <= (sphere.radius * sphere.radius);
}

// Optional: Get player hitbox for debugging/visualization
function getPlayerHitbox(player) {
    const halfWidth = playerHitbox.width / 2;
    const halfHeight = playerHitbox.height / 2;
    const halfDepth = playerHitbox.depth / 2;
    
    return {
        minX: player.x - halfWidth,
        maxX: player.x + halfWidth,
        minY: player.y - halfHeight,
        maxY: player.y + halfHeight,
        minZ: player.z - halfDepth,
        maxZ: player.z + halfDepth,
        center: { x: player.x, y: player.y, z: player.z },
        dimensions: { ...playerHitbox }
    };
}

// Rectangular/Capsule collision detection for player
function CollisionDetectionRectangular(player, collidableObjects) {
    const halfWidth = playerHitbox.width / 2;
    const halfHeight = playerHitbox.height / 2;
    const halfDepth = playerHitbox.depth / 2;
    
    // Player bounding box (centered on player position)
    const playerBounds = {
        minX: player.x - halfWidth,
        maxX: player.x + halfWidth,
        minY: player.y - halfHeight,
        maxY: player.y + halfHeight,
        minZ: player.z - halfDepth,
        maxZ: player.z + halfDepth
    };
    
    for (const shape of collidableObjects) {
        if (shape.name && shape.name.includes("sphere")) {
            // Sphere collision detection against rectangular player
            const collision = sphereVsAABB(shape, playerBounds);
            if (collision) {
                return false; // Collision detected
            }
        } else {
            // Box vs Box collision detection (AABB vs AABB)
            const shapeHalfWidth = shape.w || 50;
            const shapeHalfHeight = shape.h || 50;
            const shapeHalfDepth = shape.d || 50;
            
            const shapeBounds = {
                minX: shape.x - shapeHalfWidth,
                maxX: shape.x + shapeHalfWidth,
                minY: shape.y - shapeHalfHeight,
                maxY: shape.y + shapeHalfHeight,
                minZ: shape.z - shapeHalfDepth,
                maxZ: shape.z + shapeHalfDepth
            };
            
            // AABB vs AABB collision test
            const collision = !(
                playerBounds.maxX < shapeBounds.minX ||
                playerBounds.minX > shapeBounds.maxX ||
                playerBounds.maxY < shapeBounds.minY ||
                playerBounds.minY > shapeBounds.maxY ||
                playerBounds.maxZ < shapeBounds.minZ ||
                playerBounds.minZ > shapeBounds.maxZ
            );
            
            if (collision) {
                return false; // Collision detected
            }
        }
    }
    return true; // No collision
}

// Enhanced collision detection that returns collision info
function checkCollisionWithInfo(camera, shapes, axis, movement) {
    const originalPos = { x: camera.x, y: camera.y, z: camera.z };
    
    // Move camera temporarily
    camera[axis] += movement;
    
    // Check collision using rectangular hitbox
    const hasCollision = !CollisionDetectionRectangular(camera, shapes);
    
    // Restore original position
    camera.x = originalPos.x;
    camera.y = originalPos.y;
    camera.z = originalPos.z;
    
    return hasCollision;
}

function checkGrounded(camera, shapes) {
    // Check if camera is at or below ground level
    if (camera.y >= groundLevel - 5) {
        return true;
    }
    
    // Check collision with shapes below the camera using rectangular hitbox
    const testPosition = {
        x: camera.x,
        y: camera.y + groundCheckDistance,
        z: camera.z
    };
    
    // Use collision detection to see if there's something below
    const originalY = camera.y;
    camera.y = testPosition.y;
    const collision = !CollisionDetectionRectangular(camera, shapes);
    camera.y = originalY;
    
    return collision;
}