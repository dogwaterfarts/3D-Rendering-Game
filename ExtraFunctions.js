// ===== OPTIMIZED 3D RENDERING FUNCTIONS =====

// Pre-allocated objects for performance
const tempVector1 = { x: 0, y: 0, z: 0 };
const tempColor = { r: 0, g: 0, b: 0 };

// Main triangle fill with point lighting
function fillTriangleMultiLight(p1, p2, p3, normal, w1, w2, w3, lights, materialColor, shape) {
    if (!p1 || !p2 || !p3 || !w1 || !w2 || !w3) return;
    
    // Tiles get fixed color, other shapes get lighting
    if (shape && shape.isTile) {
        const fixedR = Math.floor(materialColor.r * 0.8);
        const fixedG = Math.floor(materialColor.g * 0.8);
        const fixedB = Math.floor(materialColor.b * 0.8);
        
        context.fillStyle = `rgb(${fixedR}, ${fixedG}, ${fixedB})`;
    } else {
        // Calculate triangle center for lighting
        tempVector1.x = (w1.x + w2.x + w3.x) * 0.33333333;
        tempVector1.y = (w1.y + w2.y + w3.y) * 0.33333333;
        tempVector1.z = (w1.z + w2.z + w3.z) * 0.33333333;

        // Start with ambient light
        let totalR = materialColor.r * 0.2;
        let totalG = materialColor.g * 0.2;
        let totalB = materialColor.b * 0.2;
        
        // Add point light contributions
        for (let i = 0; i < lights.length; i++) {
            const light = lights[i];
            if (!light.enabled || light.type !== 'point') continue;
            
            const lightContribution = calculatePointLighting(tempVector1, normal, light);
            
            totalR += materialColor.r * lightContribution * (light.color.r / 255);
            totalG += materialColor.g * lightContribution * (light.color.g / 255);
            totalB += materialColor.b * lightContribution * (light.color.b / 255);
        }
        
        // Clamp values
        const finalR = Math.max(0, Math.min(255, Math.floor(totalR)));
        const finalG = Math.max(0, Math.min(255, Math.floor(totalG)));
        const finalB = Math.max(0, Math.min(255, Math.floor(totalB)));
        
        context.fillStyle = `rgb(${finalR},${finalG},${finalB})`;
    }
    
    // Render triangle
    context.beginPath();
    context.moveTo(p1.x, p1.y);
    context.lineTo(p2.x, p2.y);
    context.lineTo(p3.x, p3.y);
    context.closePath();
    context.fill();
}

// Point light calculation
function calculatePointLighting(worldPoint, normal, light) {
    const lightDirX = light.x - worldPoint.x;
    const lightDirY = light.y - worldPoint.y;
    const lightDirZ = light.z - worldPoint.z;
    
    const distance = Math.sqrt(lightDirX * lightDirX + lightDirY * lightDirY + lightDirZ * lightDirZ);
    if (distance === 0) return 0;
    
    // Normalize light direction
    const normalizedLightX = lightDirX / distance;
    const normalizedLightY = lightDirY / distance;
    const normalizedLightZ = lightDirZ / distance;
    
    // Diffuse lighting
    const dotProduct = Math.max(0, 
        normal.x * normalizedLightX + 
        normal.y * normalizedLightY + 
        normal.z * normalizedLightZ
    );
    
    // Distance attenuation
    const attenuation = Math.max(0.01, 1.0 / (1.0 + distance * distance * 0.0001));
    
    return dotProduct * attenuation * (light.intensity || 1.0);
}

// Face culling
function isTriangleFacingCamera(p1, p2, p3) {
    if (!p1 || !p2 || !p3) return false;
    
    const v1x = p2.x - p1.x;
    const v1y = p2.y - p1.y;
    const v2x = p3.x - p1.x;
    const v2y = p3.y - p1.y;
    
    return (v1x * v2y - v1y * v2x) > 0;
}

// Visibility check
function isTriangleVisible(p1, p2, p3) {
    if (!p1 || !p2 || !p3) return false;
    return p1.z > 0 && p2.z > 0 && p3.z > 0;
}

// Perspective projection
function addPerspective(point, fov) {
    if (!point || point.z <= 0) return null;
    
    const scale = fov / point.z;
    return {
        x: point.x * scale + centerX,
        y: point.y * scale + centerY,
        z: point.z
    };
}

// 3D text rendering 
function render3DText(worldPos, text, camera, options = {}) {
    const opts = {
        fontSize: 16,
        font: 'Arial',
        color: '#ffffff',
        backgroundColor: null,
        padding: 4,
        maxDistance: 2000,
        ...options
    };

    // Transform world position to screen coordinates
    const translatedX = worldPos.x - camera.x;
    const translatedY = worldPos.y - camera.y;
    const translatedZ = worldPos.z - camera.z;

    const rotYMatrix_neg = rotYMatrix(-camera.rotationX);
    const rotXMatrix_pos = rotXMatrix(camera.rotationY);

    const rotated = MatrixTimesVector(rotXMatrix_pos, 
                   MatrixTimesVector(rotYMatrix_neg, {
                       x: translatedX,
                       y: translatedY, 
                       z: translatedZ
                   }));

    const projected2D = addPerspective(rotated, camera.fov);
    if (!projected2D || rotated.z > opts.maxDistance) return;

    // Check screen bounds
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

// UI text rendering
function renderUIText(x, y, text, options = {}) {
    const opts = {
        fontSize: 16,
        font: 'Arial',
        color: '#ffffff',
        backgroundColor: null,
        padding: 4,
        ...options
    };

    context.save();
    context.font = `${opts.fontSize}px ${opts.font}`;
    context.textAlign = 'left';
    context.textBaseline = 'top';

    if (opts.backgroundColor) {
        const textWidth = context.measureText(text).width;
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

// Light rendering
function renderLights(lights, camera) {
    if (!lights || !camera) return;
    
    const rotYMatrix_neg = rotYMatrix(-camera.rotationX);
    const rotXMatrix_pos = rotXMatrix(camera.rotationY);
    
    lights.forEach((light, index) => {
        if (!light.enabled || light.type !== 'point') return;
        
        // Transform light position
        const translatedX = light.x - camera.x;
        const translatedY = light.y - camera.y;
        const translatedZ = light.z - camera.z;

        const rotated = MatrixTimesVector(rotXMatrix_pos, 
                       MatrixTimesVector(rotYMatrix_neg, {
                           x: translatedX,
                           y: translatedY, 
                           z: translatedZ
                       }));

        const projected = addPerspective(rotated, camera.fov);
        if (!projected || rotated.z <= 0 || rotated.z > 2000) return;
        
        // Check screen bounds
        if (projected.x < -50 || projected.x > canvasWidth + 50 || 
            projected.y < -50 || projected.y > canvasHeight + 50) {
            return;
        }
        
        // Draw light with glow effect
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
        
        // Inner core
        context.fillStyle = `rgb(${light.color.r}, ${light.color.g}, ${light.color.b})`;
        context.beginPath();
        context.arc(projected.x, projected.y, 4, 0, Math.PI * 2);
        context.fill();
        
        // Label
        context.fillStyle = '#ffffff';
        context.font = '12px Arial';
        context.fillText(`Point ${index}`, projected.x + 15, projected.y - 10);
    });
}