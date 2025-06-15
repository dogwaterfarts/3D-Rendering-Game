function rayTriangleIntersection(rayOrigin, rayDirection, v0, v1, v2) {
    if (!rayOrigin || !rayDirection || !v0 || !v1 || !v2) return null;
    
    const EPSILON = 0.0000001;
    
    const edge1 = vectorSubtract(v1, v0);
    const edge2 = vectorSubtract(v2, v0);
    const h = vectorCross(rayDirection, edge2);
    const a = vectorDot(edge1, h);
    
    if (a > -EPSILON && a < EPSILON) {
        return null; // Ray is parallel to triangle
    }
    
    const f = 1.0 / a;
    const s = vectorSubtract(rayOrigin, v0);
    const u = f * vectorDot(s, h);
    
    if (u < 0.0 || u > 1.0) {
        return null;
    }
    
    const q = vectorCross(s, edge1);
    const v = f * vectorDot(rayDirection, q);
    
    if (v < 0.0 || u + v > 1.0) {
        return null;
    }
    
    const t = f * vectorDot(edge2, q);
    
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

function isPointInShadow(worldPoint, light, allShapes, excludeShape = null) {
    if (!worldPoint || !light) return false;
    
    const lightDirection = vectorSubtract(light, worldPoint);
    const lightDistance = Math.sqrt(
        lightDirection.x * lightDirection.x + 
        lightDirection.y * lightDirection.y + 
        lightDirection.z * lightDirection.z
    );
    
    if (lightDistance === 0) return false;
    
    const normalizedLightDir = {
        x: lightDirection.x / lightDistance,
        y: lightDirection.y / lightDistance,
        z: lightDirection.z / lightDistance
    };
    
    const rayOrigin = {
        x: worldPoint.x + normalizedLightDir.x * 0.1,
        y: worldPoint.y + normalizedLightDir.y * 0.1,
        z: worldPoint.z + normalizedLightDir.z * 0.1
    };
    
    for (let shape of allShapes) {
        if (shape === excludeShape) continue;
        
        for (let triangleIndices of shape.Triangles) {
            if (!triangleIndices || triangleIndices.length < 3) continue;
            
            const v0 = shape.Vertices[triangleIndices[0]];
            const v1 = shape.Vertices[triangleIndices[1]];
            const v2 = shape.Vertices[triangleIndices[2]];
            
            if (!v0 || !v1 || !v2) continue;
            
            const intersection = rayTriangleIntersection(
                rayOrigin, 
                normalizedLightDir, 
                v0, v1, v2
            );
            
            if (intersection && intersection.distance < lightDistance - 0.1) {
                return true;
            }
        }
    }
    
    return false;
}

function calculateShadowIntensity(worldPoint, light, allShapes, excludeShape = null) {
    const shadowSamples = 4;
    const lightRadius = 50;
    let shadowSum = 0;
    
    for (let i = 0; i < shadowSamples; i++) {
        const angle1 = (i / shadowSamples) * Math.PI * 2;
        const angle2 = Math.random() * Math.PI * 2;
        const radius = Math.random() * lightRadius;
        
        const offsetLight = {
            x: light.x + Math.cos(angle1) * radius,
            y: light.y + Math.sin(angle1) * Math.cos(angle2) * radius,
            z: light.z + Math.sin(angle1) * Math.sin(angle2) * radius
        };
        
        if (isPointInShadow(worldPoint, offsetLight, allShapes, excludeShape)) {
            shadowSum += 1;
        }
    }
    
    return 1.0 - (shadowSum / shadowSamples);
}