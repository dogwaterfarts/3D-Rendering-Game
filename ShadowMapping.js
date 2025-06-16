// ===== SIMPLIFIED SHADOW SYSTEM =====
// Minimal shadow functionality for performance optimization

// Basic shadow functions (disabled for performance)
function isPointInShadow(worldPoint, light, allShapes, excludeShape = null) {
    return false; // Always no shadow for maximum performance
}

function isPointInShadowWithNormal(worldPoint, surfaceNormal, light, allShapes, excludeShape = null) {
    return false;
}

function calculateShadowIntensity(worldPoint, light, allShapes, excludeShape = null, surfaceNormal = null) {
    return 1.0; // Always full lighting
}

// Multi-light shadow calculation (simplified)
function calculateMultiLightShadows(worldPoint, surfaceNormal, lights, allShapes, excludeShape = null) {
    return new Array(lights.length).fill(1.0); // No shadows for any light
}

// Directional shadow (disabled)
function isPointInDirectionalShadow(worldPoint, surfaceNormal, lightDirection, allShapes, excludeShape = null) {
    return false;
}

// Ray-triangle intersection for collision detection
function rayTriangleIntersection(rayOrigin, rayDirection, v0, v1, v2) {
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
    
    // Cross product: rayDirection × edge2
    const h = {
        x: rayDirection.y * edge2.z - rayDirection.z * edge2.y,
        y: rayDirection.z * edge2.x - rayDirection.x * edge2.z,
        z: rayDirection.x * edge2.y - rayDirection.y * edge2.x
    };
    
    const a = edge1.x * h.x + edge1.y * h.y + edge1.z * h.z;
    
    if (a > -EPSILON && a < EPSILON) return null; // Ray is parallel
    
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

// Performance stats (placeholder)
const shadowStats = {
    totalTests: 0,
    hits: 0,
    lastReset: Date.now()
};

function getShadowPerformanceStats() {
    return {
        ...shadowStats,
        message: "Shadow system simplified for performance"
    };
}

function resetShadowPerformanceStats() {
    shadowStats.totalTests = 0;
    shadowStats.hits = 0;
    shadowStats.lastReset = Date.now();
}