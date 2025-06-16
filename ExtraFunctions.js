// ===== SIMPLIFIED POINT LIGHT SYSTEM =====

// Pre-allocated objects for reuse to avoid garbage collection
const tempVector1 = { x: 0, y: 0, z: 0 };
const tempVector2 = { x: 0, y: 0, z: 0 };
const tempVector3 = { x: 0, y: 0, z: 0 };
const tempColor = { r: 0, g: 0, b: 0 };

// Simplified triangle fill with point lighting only
function fillTriangleSimpleLight(v1, v2, v3, normal, worldV1, worldV2, worldV3, lights, materialColor = { r: 100, g: 150, b: 200 }) {
    if (!v1 || !v2 || !v3 || !worldV1 || !worldV2 || !worldV3) return;
    
    // Calculate triangle center for lighting
    tempVector1.x = (worldV1.x + worldV2.x + worldV3.x) * 0.33333333;
    tempVector1.y = (worldV1.y + worldV2.y + worldV3.y) * 0.33333333;
    tempVector1.z = (worldV1.z + worldV2.z + worldV3.z) * 0.33333333;

    // Start with ambient light
    let totalR = materialColor.r * 0.2; // Ambient contribution
    let totalG = materialColor.g * 0.2;
    let totalB = materialColor.b * 0.2;
    
    // Add contribution from all enabled point lights
    for (let i = 0; i < lights.length; i++) {
        const light = lights[i];
        if (!light.enabled || light.type !== 'point') continue;
        
        const lightContribution = calculatePointLighting(tempVector1, normal, light);
        
        // Add light's color contribution
        totalR += materialColor.r * lightContribution * (light.color.r / 255);
        totalG += materialColor.g * lightContribution * (light.color.g / 255);
        totalB += materialColor.b * lightContribution * (light.color.b / 255);
    }
    
    // Clamp values to valid range
    const finalR = Math.max(0, Math.min(255, Math.floor(totalR)));
    const finalG = Math.max(0, Math.min(255, Math.floor(totalG)));
    const finalB = Math.max(0, Math.min(255, Math.floor(totalB)));

    // Render triangle
    context.beginPath();
    context.moveTo(v1.x, v1.y);
    context.lineTo(v2.x, v2.y);
    context.lineTo(v3.x, v3.y);
    context.closePath();
    
    const colorStr = `rgb(${finalR},${finalG},${finalB})`;
    context.fillStyle = colorStr;
    context.fill();
}

// Point light calculation only
function calculatePointLighting(worldPoint, normal, light) {
    // Calculate direction from surface to light
    const lightDirX = light.x - worldPoint.x;
    const lightDirY = light.y - worldPoint.y;
    const lightDirZ = light.z - worldPoint.z;
    
    const distance = Math.sqrt(lightDirX * lightDirX + lightDirY * lightDirY + lightDirZ * lightDirZ);
    
    if (distance === 0) return 0;
    
    // Normalize light direction
    const normalizedLightX = lightDirX / distance;
    const normalizedLightY = lightDirY / distance;
    const normalizedLightZ = lightDirZ / distance;
    
    // Calculate diffuse lighting (Lambert's cosine law)
    const dotProduct = Math.max(0, 
        normal.x * normalizedLightX + 
        normal.y * normalizedLightY + 
        normal.z * normalizedLightZ
    );
    
    // Simple distance attenuation (inverse square law with minimum)
    const attenuation = Math.max(0.01, 1.0 / (1.0 + distance * distance * 0.0001));
    
    // Combine diffuse lighting with attenuation and light intensity
    return dotProduct * attenuation * (light.intensity || 1.0);
}

// Simplified face culling
function isTriangleFacingCameraSimple(p1, p2, p3) {
    if (!p1 || !p2 || !p3) return false;
    
    const v1x = p2.x - p1.x;
    const v1y = p2.y - p1.y;
    const v2x = p3.x - p1.x;
    const v2y = p3.y - p1.y;
    const crossZ = v1x * v2y - v1y * v2x;
    
    return crossZ > 0;
}

// Simplified visibility check
function isTriangleVisibleSimple(p1, p2, p3) {
    if (!p1 || !p2 || !p3) return false;
    return p1.z > 0 && p2.z > 0 && p3.z > 0;
}

// Simplified tile rendering with NO LIGHTING - fixed color
function fillTriangleTileSimple(p1, p2, p3, normal, w1, w2, w3, lights, baseColor) {
    // Use fixed color for tiles - no lighting calculations
    // This gives tiles a consistent appearance regardless of lighting
    const fixedR = Math.floor(baseColor.r * 0.8); // Slightly darker than base for better visibility
    const fixedG = Math.floor(baseColor.g * 0.8);
    const fixedB = Math.floor(baseColor.b * 0.8);
    
    context.fillStyle = `rgb(${fixedR}, ${fixedG}, ${fixedB})`;
    context.beginPath();
    context.moveTo(p1.x, p1.y);
    context.lineTo(p2.x, p2.y);
    context.lineTo(p3.x, p3.y);
    context.closePath();
    context.fill();
}

// Simple perspective calculation (unchanged but cleaned up)
function addPerspectiveSimple(point, fov) {
    if (!point || point.z <= 0) return null;
    
    const scale = fov / point.z;
    return {
        x: point.x * scale + centerX,
        y: point.y * scale + centerY,
        z: point.z
    };
}

// Fixed 3D text rendering function - matches main.js transformation pipeline exactly
function render3DTextSimple(worldPos, text, camera, options = {}) {
    const opts = {
        fontSize: options.fontSize || 16,
        font: options.font || 'Arial',
        color: options.color || '#ffffff',
        backgroundColor: options.backgroundColor || null,
        padding: options.padding || 4,
        maxDistance: options.maxDistance || 2000,
        ...options
    };

    // Create a temporary vertex object to match your main pipeline
    const vertex = {
        x: worldPos.x,
        y: worldPos.y,
        z: worldPos.z
    };

    // Apply the EXACT same transformation as your main rendering loop
    // Step 1: Translate relative to camera (inline translation from main.js)
    const translatedX = vertex.x - camera.x;
    const translatedY = vertex.y - camera.y;
    const translatedZ = vertex.z - camera.z;

    // Step 2: Apply rotations using the same matrices as main.js
    // This uses the cached matrices from your main loop - we need to recreate them
    const rotYMatrix_neg = rotYMatrix(-camera.rotationX);
    const rotXMatrix_pos = rotXMatrix(camera.rotationY);

    // Apply rotations using cached matrices (same as main.js)
    const rotated = MatrixTimesVector(rotXMatrix_pos, 
                   MatrixTimesVector(rotYMatrix_neg, {
                       x: translatedX,
                       y: translatedY, 
                       z: translatedZ
                   }));

    // Step 3: Use the same perspective projection as main.js
    const projected2D = addPerspectiveOptimized(rotated, camera.fov);

    if (!projected2D) return;

    // Check distance limit
    if (rotated.z > opts.maxDistance) return;

    // Check if within screen bounds (with some margin)
    if (projected2D.x < -100 || projected2D.x > canvasWidth + 100 || 
        projected2D.y < -100 || projected2D.y > canvasHeight + 100) {
        return;
    }

    // Render text
    context.save();
    context.font = `${opts.fontSize}px ${opts.font}`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    if (opts.backgroundColor) {
        const textWidth = context.measureText(text).width;
        const bgWidth = textWidth + opts.padding * 2;
        const bgHeight = opts.fontSize + opts.padding * 2;
        
        context.fillStyle = opts.backgroundColor;
        context.fillRect(
            projected2D.x - bgWidth * 0.5,
            projected2D.y - bgHeight * 0.5,
            bgWidth,
            bgHeight
        );
    }

    context.fillStyle = opts.color;
    context.fillText(text, projected2D.x, projected2D.y);
    context.restore();
}

// Simple UI text rendering
function renderUITextSimple(x, y, text, options = {}) {
    const opts = {
        fontSize: options.fontSize || 16,
        font: options.font || 'Arial',
        color: options.color || '#ffffff',
        backgroundColor: options.backgroundColor || null,
        padding: options.padding || 4,
        ...options
    };

    context.save();
    context.font = `${opts.fontSize}px ${opts.font}`;
    context.textAlign = 'left';
    context.textBaseline = 'top';

    if (opts.backgroundColor) {
        const metrics = context.measureText(text);
        const textWidth = metrics.width;
        const textHeight = opts.fontSize;

        context.fillStyle = opts.backgroundColor;
        context.fillRect(
            x - opts.padding,
            y - opts.padding,
            textWidth + opts.padding * 2,
            textHeight + opts.padding * 2
        );
    }

    context.fillStyle = opts.color;
    context.fillText(text, x, y);
    context.restore();
}

// Simple point light rendering with proper 3D transformations
function renderLightsSimple(lights, camera) {
    if (!lights || !camera) return;
    
    // Get the same transformation matrices used in main rendering loop
    const rotYMatrix_neg = rotYMatrix(-camera.rotationX);
    const rotXMatrix_pos = rotXMatrix(camera.rotationY);
    
    lights.forEach((light, index) => {
        if (!light.enabled || light.type !== 'point') return;
        
        // Apply the SAME transformation pipeline as main objects
        // Step 1: Translate relative to camera
        const translatedX = light.x - camera.x;
        const translatedY = light.y - camera.y;
        const translatedZ = light.z - camera.z;

        // Step 2: Apply camera rotations using same matrices as main.js
        const rotated = MatrixTimesVector(rotXMatrix_pos, 
                       MatrixTimesVector(rotYMatrix_neg, {
                           x: translatedX,
                           y: translatedY, 
                           z: translatedZ
                       }));

        // Step 3: Project to 2D using same perspective function
        const projected = addPerspectiveOptimized(rotated, camera.fov);
        if (!projected) return;
        
        // Check if light is behind camera or too far
        if (rotated.z <= 0 || rotated.z > 2000) return;
        
        // Check if within screen bounds
        if (projected.x < -50 || projected.x > canvasWidth + 50 || 
            projected.y < -50 || projected.y > canvasHeight + 50) {
            return;
        }
        
        // Draw simple light indicator with glow effect
        const gradient = context.createRadialGradient(
            projected.x, projected.y, 0,
            projected.x, projected.y, 12
        );
        gradient.addColorStop(0, `rgba(${light.color.r}, ${light.color.g}, ${light.color.b}, 0.8)`);
        gradient.addColorStop(1, `rgba(${light.color.r}, ${light.color.g}, ${light.color.b}, 0.1)`);
        
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(projected.x, projected.y, 12, 0, Math.PI * 2);
        context.fill();
        
        // Inner bright core
        context.fillStyle = `rgb(${light.color.r}, ${light.color.g}, ${light.color.b})`;
        context.beginPath();
        context.arc(projected.x, projected.y, 4, 0, Math.PI * 2);
        context.fill();
        
        // Add simple label
        context.fillStyle = '#ffffff';
        context.font = '12px Arial';
        context.fillText(`Point ${index}`, projected.x + 15, projected.y - 10);
    });
}

// Helper function for tiles
function isTileShape(shape) {
    return shape && shape.isTile === true;
}

// Main simplified fill function that replaces the complex fillTriangleMultiLight
function fillTriangleMultiLight(p1, p2, p3, normal, w1, w2, w3, lights, shapeColor, shape, allShapes) {
    // Check if it's a tile and use appropriate rendering
    if (isTileShape(shape)) {
        // Tiles get NO LIGHTING - just fixed color
        fillTriangleTileSimple(p1, p2, p3, normal, w1, w2, w3, lights, shapeColor);
    } else {
        // Regular shapes get full point lighting
        const pointLights = lights.filter(light => light.enabled && light.type === 'point');
        fillTriangleSimpleLight(p1, p2, p3, normal, w1, w2, w3, pointLights, shapeColor);
    }
}

// Backward compatibility aliases
const fillTriangleMultiLightOptimized = fillTriangleMultiLight;
const isTriangleFacingCameraOptimized = isTriangleFacingCameraSimple;
const isTriangleVisibleOptimized = isTriangleVisibleSimple;
const addPerspectiveOptimized = addPerspectiveSimple;
const render3DTextOptimized = render3DTextSimple;
const renderUIText = renderUITextSimple;
const renderLights = renderLightsSimple;