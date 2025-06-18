// Enhanced collision detection functions with proper cone support

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
        } else if (shape.name && shape.name.includes("cone")) {
            // Special cone collision detection
            if (checkConeCollision(player, shape, playerRadius)) {
                return false; // Collision detected
            }
        } else {
            // Get shape dimensions based on shape type
            const dimensions = getShapeDimensions(shape);
            
            // Check if player is within the expanded bounding box
            const isInXRange = Math.abs(player.x - shape.x) <= dimensions.halfWidth + playerRadius;
            const isInYRange = Math.abs(player.y - shape.y) <= dimensions.halfHeight + playerRadius;
            const isInZRange = Math.abs(player.z - shape.z) <= dimensions.halfDepth + playerRadius;
            
            if (isInXRange && isInYRange && isInZRange) {
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
        } else if (shape.name && shape.name.includes("cone")) {
            // Special cone collision detection against rectangular player
            if (checkConeVsAABB(shape, playerBounds)) {
                return false; // Collision detected
            }
        } else {
            // Box vs Box collision detection (AABB vs AABB)
            const dimensions = getShapeDimensions(shape);
            
            const shapeBounds = {
                minX: shape.x - dimensions.halfWidth,
                maxX: shape.x + dimensions.halfWidth,
                minY: shape.y - dimensions.halfHeight,
                maxY: shape.y + dimensions.halfHeight,
                minZ: shape.z - dimensions.halfDepth,
                maxZ: shape.z + dimensions.halfDepth
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

// Specialized cone collision detection for spherical player
function checkConeCollision(player, cone, playerRadius) {
    // Cone properties
    const coneBaseY = cone.y + cone.height / 2;  // Bottom of cone (since -y is up)
    const coneApexY = cone.y - cone.height / 2;  // Top of cone (apex)
    const coneRadius = cone.radius;
    
    // Check if player is within the cone's height range
    if (player.y > coneBaseY + playerRadius || player.y < coneApexY - playerRadius) {
        return false; // No collision - player is above or below cone
    }
    
    // Calculate the cone's radius at the player's Y level
    // Linear interpolation from apex (radius 0) to base (full radius)
    const heightFromApex = player.y - coneApexY;
    const totalHeight = coneBaseY - coneApexY;
    const heightRatio = Math.max(0, Math.min(1, heightFromApex / totalHeight));
    const radiusAtPlayerY = coneRadius * heightRatio;
    
    // Calculate horizontal distance from player to cone center
    const dx = player.x - cone.x;
    const dz = player.z - cone.z;
    const horizontalDistance = Math.sqrt(dx * dx + dz * dz);
    
    // Check if player intersects with the cone at this height
    return horizontalDistance <= radiusAtPlayerY + playerRadius;
}

// Specialized cone collision detection for rectangular player (AABB)
function checkConeVsAABB(cone, playerBounds) {
    // Cone properties
    const coneBaseY = cone.y + cone.height / 2;  // Bottom of cone
    const coneApexY = cone.y - cone.height / 2;  // Top of cone (apex)
    const coneRadius = cone.radius;
    
    // Check if AABB is completely outside cone's height range
    if (playerBounds.maxY < coneApexY || playerBounds.minY > coneBaseY) {
        return false; // No collision - player is above or below cone
    }
    
    // Check multiple Y levels within the player's AABB
    const yLevels = [playerBounds.minY, playerBounds.maxY, (playerBounds.minY + playerBounds.maxY) / 2];
    
    for (const testY of yLevels) {
        // Skip if this Y level is outside the cone
        if (testY < coneApexY || testY > coneBaseY) continue;
        
        // Calculate cone radius at this Y level
        const heightFromApex = testY - coneApexY;
        const totalHeight = coneBaseY - coneApexY;
        const heightRatio = Math.max(0, Math.min(1, heightFromApex / totalHeight));
        const radiusAtY = coneRadius * heightRatio;
        
        // Create a circle at this Y level and check if it intersects with the AABB
        const coneCircle = {
            x: cone.x,
            z: cone.z,
            radius: radiusAtY
        };
        
        // Check if the circle intersects with the rectangular cross-section of the AABB
        if (checkCircleAABB2D(coneCircle, playerBounds)) {
            return true; // Collision detected
        }
    }
    
    return false; // No collision
}

// Helper function to check 2D circle vs AABB intersection (ignoring Y)
function checkCircleAABB2D(circle, aabb) {
    // Find closest point on AABB to circle center (in XZ plane)
    const closestX = Math.max(aabb.minX, Math.min(circle.x, aabb.maxX));
    const closestZ = Math.max(aabb.minZ, Math.min(circle.z, aabb.maxZ));
    
    // Calculate distance from circle center to closest point
    const dx = circle.x - closestX;
    const dz = circle.z - closestZ;
    const distanceSquared = dx * dx + dz * dz;
    
    // Check if distance is less than circle radius
    return distanceSquared <= (circle.radius * circle.radius);
}

// Helper function to get dimensions for different shape types
function getShapeDimensions(shape) {
    // Check shape type and extract appropriate dimensions
    if (shape.name && shape.name.includes("cylinder")) {
        return {
            halfWidth: shape.radius || shape.w || 50,
            halfHeight: shape.height ? shape.height / 2 : (shape.h || 50),
            halfDepth: shape.radius || shape.d || 50
        };
    } else if (shape.name && shape.name.includes("cone")) {
        // Note: This is only used for fallback AABB collision
        // The proper cone collision is handled by checkConeCollision/checkConeVsAABB
        return {
            halfWidth: shape.radius || shape.w || 50,
            halfHeight: shape.height ? shape.height / 2 : (shape.h || 50),
            halfDepth: shape.radius || shape.d || 50
        };
    } else if (shape.name && shape.name.includes("wedge")) {
        return {
            halfWidth: shape.w || 50,
            halfHeight: shape.h || 50,
            halfDepth: shape.d || 50
        };
    } else if (shape.name && shape.name.includes("plane")) {
        return {
            halfWidth: shape.w || (shape.width ? shape.width / 2 : 500),
            halfHeight: shape.h || 1, // Very thin for collision
            halfDepth: shape.d || (shape.height ? shape.height / 2 : 500)
        };
    } else {
        // Default cube/box dimensions
        return {
            halfWidth: shape.w || 50,
            halfHeight: shape.h || 50,
            halfDepth: shape.d || 50
        };
    }
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