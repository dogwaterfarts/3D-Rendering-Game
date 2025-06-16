// ===== OPTIMIZED SHADOW MAPPING FUNCTIONS =====
// This file is now optimized to work with ExtraFunctions.js
// Most shadow calculations are now handled in the optimized functions

// Legacy compatibility function - kept for backward compatibility
// The actual optimized implementation is in ExtraFunctions.js as rayTriangleIntersectionOptimized
function rayTriangleIntersection(rayOrigin, rayDirection, v0, v1, v2) {
    // Redirect to optimized version and format output for compatibility
    const distance = rayTriangleIntersectionOptimized(rayOrigin, rayDirection, v0, v1, v2);
    
    if (distance === null || distance <= 0) {
        return null;
    }
    
    return {
        distance: distance,
        point: {
            x: rayOrigin.x + rayDirection.x * distance,
            y: rayOrigin.y + rayDirection.y * distance,
            z: rayOrigin.z + rayDirection.z * distance
        }
    };
}

// Legacy shadow function - now redirects to optimized versions
function isPointInShadow(worldPoint, light, allShapes, excludeShape = null) {
    if (!worldPoint || !light) return false;
    
    // Handle different light formats for backward compatibility
    let lightPos;
    if (light.x !== undefined) {
        lightPos = { x: light.x, y: light.y, z: light.z };
    } else {
        lightPos = light;
    }
    
    // Create a simple surface normal approximation (pointing up)
    const surfaceNormal = { x: 0, y: -1, z: 0 };
    
    // Use optimized shadow calculation
    return isPointInShadowOptimized(worldPoint, surfaceNormal, lightPos.x, lightPos.y, lightPos.z, allShapes, excludeShape);
}

// Enhanced shadow function with proper surface normal support
function isPointInShadowWithNormal(worldPoint, surfaceNormal, light, allShapes, excludeShape = null) {
    if (!worldPoint || !light || !surfaceNormal) return false;
    
    // Handle different light formats
    let lightPos;
    if (light.x !== undefined) {
        lightPos = { x: light.x, y: light.y, z: light.z };
    } else {
        lightPos = light;
    }
    
    // Use optimized shadow calculation with proper normal
    return isPointInShadowOptimized(worldPoint, surfaceNormal, lightPos.x, lightPos.y, lightPos.z, allShapes, excludeShape);
}

// Updated calculateShadowIntensity function that works with the optimized system
function calculateShadowIntensity(worldPoint, light, allShapes, excludeShape = null, surfaceNormal = null) {
    if (!worldPoint || !light) return 1.0;
    
    // Handle different light types using the optimized functions
    let lightObj;
    if (light.type !== undefined) {
        lightObj = light;
    } else {
        // Convert legacy light format
        lightObj = {
            x: light.x || 0,
            y: light.y || 0,
            z: light.z || 0,
            type: 'point',
            intensity: light.intensity || 1.0,
            color: light.color || { r: 255, g: 255, b: 255 }
        };
    }
    
    // Use the optimized shadow intensity calculation
    return calculateShadowIntensityOptimized(worldPoint, lightObj, allShapes, excludeShape, surfaceNormal);
}

// Fast shadow check for multiple lights - optimized for performance
function calculateMultiLightShadows(worldPoint, surfaceNormal, lights, allShapes, excludeShape = null) {
    const shadowResults = new Array(lights.length);
    
    for (let i = 0; i < lights.length; i++) {
        const light = lights[i];
        if (!light.enabled) {
            shadowResults[i] = 0.0; // Fully shadowed if light disabled
            continue;
        }
        
        // Use optimized shadow calculation
        shadowResults[i] = calculateShadowIntensityOptimized(worldPoint, light, allShapes, excludeShape, surfaceNormal);
    }
    
    return shadowResults;
}

// Optimized shadow casting for directional lights specifically
function isPointInDirectionalShadow(worldPoint, surfaceNormal, lightDirection, allShapes, excludeShape = null) {
    if (!worldPoint || !lightDirection || !surfaceNormal) return false;
    
    // Normalize the light direction
    const length = Math.sqrt(lightDirection.x * lightDirection.x + 
                           lightDirection.y * lightDirection.y + 
                           lightDirection.z * lightDirection.z);
    
    if (length === 0) return false;
    
    const normalizedDir = {
        x: -lightDirection.x / length, // Negate because we want direction TO light
        y: -lightDirection.y / length,
        z: -lightDirection.z / length
    };
    
    // Offset ray origin along surface normal
    const rayOrigin = {
        x: worldPoint.x + surfaceNormal.x * 0.1,
        y: worldPoint.y + surfaceNormal.y * 0.1,
        z: worldPoint.z + surfaceNormal.z * 0.1
    };
    
    // Use optimized directional shadow test
    return isPointInShadowDirectionalOptimized(rayOrigin, normalizedDir, allShapes, excludeShape);
}

// Batch shadow processing for multiple points (useful for performance)
function calculateBatchShadows(worldPoints, surfaceNormals, lights, allShapes, excludeShapes = null) {
    const results = new Array(worldPoints.length);
    
    for (let p = 0; p < worldPoints.length; p++) {
        const worldPoint = worldPoints[p];
        const surfaceNormal = surfaceNormals[p];
        const excludeShape = excludeShapes ? excludeShapes[p] : null;
        
        results[p] = calculateMultiLightShadows(worldPoint, surfaceNormal, lights, allShapes, excludeShape);
    }
    
    return results;
}

// Utility function for shadow debugging
function debugShadowRay(worldPoint, surfaceNormal, light, allShapes, excludeShape = null) {
    if (!worldPoint || !light || !surfaceNormal) return null;
    
    const lightDirection = {
        x: light.x - worldPoint.x,
        y: light.y - worldPoint.y,
        z: light.z - worldPoint.z
    };
    
    const distance = Math.sqrt(lightDirection.x * lightDirection.x + 
                              lightDirection.y * lightDirection.y + 
                              lightDirection.z * lightDirection.z);
    
    if (distance === 0) return null;
    
    const normalizedDir = {
        x: lightDirection.x / distance,
        y: lightDirection.y / distance,
        z: lightDirection.z / distance
    };
    
    const rayOrigin = {
        x: worldPoint.x + surfaceNormal.x * 0.1,
        y: worldPoint.y + surfaceNormal.y * 0.1,
        z: worldPoint.z + surfaceNormal.z * 0.1
    };
    
    // Find first intersection
    for (let shape of allShapes) {
        if (shape === excludeShape) continue;
        
        for (let triangleIndices of shape.Triangles) {
            if (!triangleIndices || triangleIndices.length < 3) continue;
            
            const v0 = shape.Vertices[triangleIndices[0]];
            const v1 = shape.Vertices[triangleIndices[1]];
            const v2 = shape.Vertices[triangleIndices[2]];
            
            if (!v0 || !v1 || !v2) continue;
            
            const intersectionDist = rayTriangleIntersectionOptimized(rayOrigin, normalizedDir, v0, v1, v2);
            
            if (intersectionDist && intersectionDist < distance - 0.1) {
                return {
                    inShadow: true,
                    rayOrigin: rayOrigin,
                    rayDirection: normalizedDir,
                    lightDistance: distance,
                    intersectionDistance: intersectionDist,
                    intersectionPoint: {
                        x: rayOrigin.x + normalizedDir.x * intersectionDist,
                        y: rayOrigin.y + normalizedDir.y * intersectionDist,
                        z: rayOrigin.z + normalizedDir.z * intersectionDist
                    },
                    blockingShape: shape
                };
            }
        }
    }
    
    return {
        inShadow: false,
        rayOrigin: rayOrigin,
        rayDirection: normalizedDir,
        lightDistance: distance
    };
}

// Performance monitoring for shadow calculations
let shadowCalculationStats = {
    totalShadowTests: 0,
    shadowHits: 0,
    averageRaysPerTest: 0,
    lastResetTime: Date.now()
};

function getShadowPerformanceStats() {
    const elapsed = Date.now() - shadowCalculationStats.lastResetTime;
    return {
        ...shadowCalculationStats,
        testsPerSecond: shadowCalculationStats.totalShadowTests / (elapsed / 1000),
        hitRate: shadowCalculationStats.shadowHits / shadowCalculationStats.totalShadowTests
    };
}

function resetShadowPerformanceStats() {
    shadowCalculationStats = {
        totalShadowTests: 0,
        shadowHits: 0,
        averageRaysPerTest: 0,
        lastResetTime: Date.now()
    };
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        rayTriangleIntersection,
        isPointInShadow,
        isPointInShadowWithNormal,
        calculateShadowIntensity,
        calculateMultiLightShadows,
        isPointInDirectionalShadow,
        calculateBatchShadows,
        debugShadowRay,
        getShadowPerformanceStats,
        resetShadowPerformanceStats
    };
}