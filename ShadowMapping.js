// ===== SIMPLIFIED SHADOW MAPPING =====
// This file now contains minimal shadow functionality for backward compatibility
// Most complex shadow calculations have been removed for better performance

// Simple shadow check - returns basic shadow/no shadow result
function isPointInShadow(worldPoint, light, allShapes, excludeShape = null) {
    // Simplified: no complex shadow calculations
    // You can implement basic shadow logic here if needed
    return false; // Always no shadow for maximum performance
}

// Simple shadow with normal (for compatibility)
function isPointInShadowWithNormal(worldPoint, surfaceNormal, light, allShapes, excludeShape = null) {
    return false; // No shadows for simplicity
}

// Basic shadow intensity (always returns full lighting)
function calculateShadowIntensity(worldPoint, light, allShapes, excludeShape = null, surfaceNormal = null) {
    return 1.0; // Always full lighting
}

// Multi-light shadows (simplified to return no shadows)
function calculateMultiLightShadows(worldPoint, surfaceNormal, lights, allShapes, excludeShape = null) {
    const shadowResults = new Array(lights.length);
    shadowResults.fill(1.0); // No shadows for any light
    return shadowResults;
}

// Directional shadow (disabled)
function isPointInDirectionalShadow(worldPoint, surfaceNormal, lightDirection, allShapes, excludeShape = null) {
    return false;
}

// Batch shadow processing (simplified)
function calculateBatchShadows(worldPoints, surfaceNormals, lights, allShapes, excludeShapes = null) {
    const results = new Array(worldPoints.length);
    
    for (let p = 0; p < worldPoints.length; p++) {
        results[p] = new Array(lights.length).fill(1.0); // No shadows
    }
    
    return results;
}

// Optional: Simple ray-triangle intersection for basic use cases
function rayTriangleIntersection(rayOrigin, rayDirection, v0, v1, v2) {
    // Basic implementation - can be used for simple collision detection
    const EPSILON = 0.0000001;
    
    const edge1 = {
        x: v1.x - v0.x,
        y: v1.y - v0.y,
        z: v1.z - v0.z
    };
    
    const edge2 = {
        x: v2.x - v0.x,
        y: v2.y - v0.y,
        z: v2.z - v0.z
    };
    
    // Cross product
    const h = {
        x: rayDirection.y * edge2.z - rayDirection.z * edge2.y,
        y: rayDirection.z * edge2.x - rayDirection.x * edge2.z,
        z: rayDirection.x * edge2.y - rayDirection.y * edge2.x
    };
    
    const a = edge1.x * h.x + edge1.y * h.y + edge1.z * h.z;
    
    if (a > -EPSILON && a < EPSILON) {
        return null; // Ray is parallel
    }
    
    const f = 1.0 / a;
    const s = {
        x: rayOrigin.x - v0.x,
        y: rayOrigin.y - v0.y,
        z: rayOrigin.z - v0.z
    };
    
    const u = f * (s.x * h.x + s.y * h.y + s.z * h.z);
    if (u < 0.0 || u > 1.0) return null;
    
    const q = {
        x: s.y * edge1.z - s.z * edge1.y,
        y: s.z * edge1.x - s.x * edge1.z,
        z: s.x * edge1.y - s.y * edge1.x
    };
    
    const v = f * (rayDirection.x * q.x + rayDirection.y * q.y + rayDirection.z * q.z);
    if (v < 0.0 || u + v > 1.0) return null;
    
    const t = f * (edge2.x * q.x + edge2.y * q.y + edge2.z * q.z);
    
    if (t > EPSILON) {
        return {
            distance: t,
            point: {
                x: rayOrigin.x + rayDirection.x * t,
                y: rayOrigin.y + rayDirection.y * t,
                z: rayOrigin.z + rayDirection.z * t
            }
        };
    }
    
    return null;
}

// Debug function (simplified)
function debugShadowRay(worldPoint, surfaceNormal, light, allShapes, excludeShape = null) {
    return {
        inShadow: false,
        message: "Shadow system simplified - no complex shadows calculated"
    };
}

// Performance stats (placeholder)
let shadowCalculationStats = {
    totalShadowTests: 0,
    shadowHits: 0,
    averageRaysPerTest: 0,
    lastResetTime: Date.now()
};

function getShadowPerformanceStats() {
    return {
        ...shadowCalculationStats,
        testsPerSecond: 0,
        hitRate: 0,
        message: "Shadow system simplified - performance stats disabled"
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

// Export functions for compatibility
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