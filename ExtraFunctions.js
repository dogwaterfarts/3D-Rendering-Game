function fillTriangle(v1, v2, v3, normal, worldV1, worldV2, worldV3, light, materialColor = { r: 100, g: 150, b: 200 }, currentShape = null, allShapes = []) {
    if (!v1 || !v2 || !v3 || !worldV1 || !worldV2 || !worldV3) return;
    
    context.save();

    const centerWorld = {
        x: (worldV1.x + worldV2.x + worldV3.x) / 3,
        y: (worldV1.y + worldV2.y + worldV3.y) / 3,
        z: (worldV1.z + worldV2.z + worldV3.z) / 3
    };

    const lightDir = vectorNormalize(vectorSubtract(light, centerWorld));
    
    let intensity = Math.max(0, vectorDot(normal, lightDir));
    
    let shadowIntensity = 1.0;
    if (allShapes.length > 1) {
        shadowIntensity = calculateShadowIntensity(centerWorld, light, allShapes, currentShape);
    }
    
    const ambient = 0.15;
    intensity = Math.min(1, intensity + ambient);
    
    const directLight = Math.max(0, intensity - ambient);
    intensity = ambient + (directLight * shadowIntensity);

    const colorInfluence = 0.3;
    
    const lightColor = {
        r: (light.color.r / 255) * colorInfluence + (1 - colorInfluence),
        g: (light.color.g / 255) * colorInfluence + (1 - colorInfluence),
        b: (light.color.b / 255) * colorInfluence + (1 - colorInfluence)
    };

    const finalColor = {
        r: Math.floor(materialColor.r * intensity * lightColor.r * light.intensity),
        g: Math.floor(materialColor.g * intensity * lightColor.g * light.intensity),
        b: Math.floor(materialColor.b * intensity * lightColor.b * light.intensity)
    };

    finalColor.r = Math.max(0, Math.min(255, finalColor.r));
    finalColor.g = Math.max(0, Math.min(255, finalColor.g));
    finalColor.b = Math.max(0, Math.min(255, finalColor.b));

    context.beginPath();
    context.moveTo(v1.x, v1.y);
    context.lineTo(v2.x, v2.y);
    context.lineTo(v3.x, v3.y);
    context.closePath();
    context.fillStyle = `rgb(${finalColor.r}, ${finalColor.g}, ${finalColor.b})`;
    context.strokeStyle = context.fillStyle;
    context.stroke();
    context.fill();

    context.restore();
}

function renderText(textObj, camera, light, allShapes) {
    if (!textObj.isVisible || !textObj.cube) return;
    
    // Check if the face is visible
    if (!textObj.isFaceVisible(camera)) return;

    const textPos = textObj.getTextPosition();
    if (!textPos) return;

    // Get face data for orientation
    const faceData = textObj.getFaceData();
    if (!faceData) return;

    // Transform text position relative to camera
    const translated = {
        x: textPos.x - camera.x,
        y: textPos.y - camera.y,
        z: textPos.z - camera.z
    };

    // Apply camera rotations to position only
    let rotatedPos = MatrixTimesVector(rotYMatrix(-camera.rotationX), translated);
    rotatedPos = MatrixTimesVector(rotXMatrix(camera.rotationY), rotatedPos);

    // Project to 2D
    const projected = addPerspective(rotatedPos, camera.fov);
    if (!projected || projected.z <= 0) return;

    // Check depth against other objects (occlusion testing)
    if (!isTextVisible(textPos, camera, allShapes, textObj.cube)) return;

    // Transform face normal and vectors to get text orientation in screen space
    const worldNormal = faceData.normal;
    const worldU = faceData.uVector;
    const worldV = faceData.vVector;

    // Transform vectors relative to camera (but don't translate them)
    let rotatedNormal = MatrixTimesVector(rotYMatrix(-camera.rotationX), worldNormal);
    rotatedNormal = MatrixTimesVector(rotXMatrix(camera.rotationY), rotatedNormal);

    let rotatedU = MatrixTimesVector(rotYMatrix(-camera.rotationX), worldU);
    rotatedU = MatrixTimesVector(rotXMatrix(camera.rotationY), rotatedU);

    let rotatedV = MatrixTimesVector(rotYMatrix(-camera.rotationX), worldV);
    rotatedV = MatrixTimesVector(rotXMatrix(camera.rotationY), rotatedV);

    // Calculate text orientation angle based on face normal
    const screenAngle = Math.atan2(rotatedU.x, rotatedU.y);

    // Check if face is too perpendicular to view (would appear too distorted)
    const viewDot = Math.abs(rotatedNormal.z);
    if (viewDot < 0.1) return; // Don't render text on faces too edge-on

    // Calculate lighting intensity for text
    const lightDir = vectorNormalize(vectorSubtract(light, textPos));
    let intensity = Math.max(0.3, vectorDot(worldNormal, lightDir)); // Minimum 30% brightness

    // Apply light color influence
    const lightColor = {
        r: (light.color.r / 255) * 0.3 + 0.7,
        g: (light.color.g / 255) * 0.3 + 0.7,
        b: (light.color.b / 255) * 0.3 + 0.7
    };

    const finalColor = {
        r: Math.floor(textObj.color.r * intensity * lightColor.r * light.intensity),
        g: Math.floor(textObj.color.g * intensity * lightColor.g * light.intensity),
        b: Math.floor(textObj.color.b * intensity * lightColor.b * light.intensity)
    };

    // Clamp colors
    finalColor.r = Math.max(0, Math.min(255, finalColor.r));
    finalColor.g = Math.max(0, Math.min(255, finalColor.g));
    finalColor.b = Math.max(0, Math.min(255, finalColor.b));

    // Calculate font size based on distance and perspective foreshortening
    const distanceScale = Math.max(0.3, Math.min(3, 800 / projected.z));
    const perspectiveScale = Math.max(0.3, viewDot); // Scale based on face angle
    const scaledFontSize = textObj.fontSize * distanceScale * perspectiveScale;

    // Render the text with proper orientation
    context.save();
    
    // Move to text position and rotate to match face orientation
    context.translate(projected.x, projected.y);
    context.rotate(screenAngle);
    
    // Apply perspective scaling
    context.scale(1, perspectiveScale);
    
    context.font = `${scaledFontSize}px ${textObj.fontFamily}`;
    context.fillStyle = `rgb(${finalColor.r}, ${finalColor.g}, ${finalColor.b})`;
    context.strokeStyle = `rgb(${Math.max(0, finalColor.r - 50)}, ${Math.max(0, finalColor.g - 50)}, ${Math.max(0, finalColor.b - 50)})`;
    context.lineWidth = 1;

    // Text alignment
    switch (textObj.alignment) {
        case "left":
            context.textAlign = "left";
            break;
        case "right":
            context.textAlign = "right";
            break;
        default:
            context.textAlign = "center";
    }
    context.textBaseline = "middle";

    // Draw text with outline for better visibility
    context.strokeText(textObj.text, 0, 0);
    context.fillText(textObj.text, 0, 0);
    context.restore();
}

// Depth testing function for text occlusion
function isTextVisible(textWorldPos, camera, allShapes, excludeShape) {
    // Create ray from camera to text position
    const rayDirection = vectorNormalize(vectorSubtract(textWorldPos, camera));
    const distanceToText = Math.sqrt(
        Math.pow(textWorldPos.x - camera.x, 2) +
        Math.pow(textWorldPos.y - camera.y, 2) +
        Math.pow(textWorldPos.z - camera.z, 2)
    );

    // Check if any shape blocks the view to the text
    for (let shape of allShapes) {
        if (shape === excludeShape) continue;

        // Check triangles of each shape
        for (let triangleIndices of shape.Triangles) {
            if (!triangleIndices || triangleIndices.length < 3) continue;

            const v0 = shape.Vertices[triangleIndices[0]];
            const v1 = shape.Vertices[triangleIndices[1]];
            const v2 = shape.Vertices[triangleIndices[2]];

            if (!v0 || !v1 || !v2) continue;

            const intersection = rayTriangleIntersection(camera, rayDirection, v0, v1, v2);

            // If intersection exists and is closer than text, text is occluded
            if (intersection && intersection.distance < distanceToText - 5) {
                return false;
            }
        }
    }

    return true;
}

function addPerspective(point, fov) {
    if (!point || point.z <= 0) return null;

    const scale = fov / point.z;
    
    return {
        x: point.x * scale + centerX,
        y: point.y * scale + centerY,
        z: point.z
    };
}

/**
 * Renders 3D positioned text that always faces the camera with consistent sizing
 * @param {Object} worldPos - 3D world position {x, y, z}
 * @param {string} text - Text to render
 * @param {Object} camera - Camera object
 * @param {Object} options - Rendering options
 */
function render3DText(worldPos, text, camera, options = {}) {
    // Default options
    const opts = {
        fontSize: options.fontSize || 16,
        font: options.font || 'Arial',
        color: options.color || '#ffffff',
        backgroundColor: options.backgroundColor || null,
        padding: options.padding || 4,
        fixedSize: options.fixedSize || true, // If true, text size doesn't change with distance
        maxDistance: options.maxDistance || 2000, // Max distance to render text
        ...options
    };

    // Transform world position to camera space
    const translated = {
        x: worldPos.x - camera.x,
        y: worldPos.y - camera.y,
        z: worldPos.z - camera.z
    };

    // Apply camera rotations
    let rotated = MatrixTimesVector(rotYMatrix(-camera.rotationX), translated);
    rotated = MatrixTimesVector(rotXMatrix(camera.rotationY), rotated);

    // Check if text is behind camera or too far away
    if (rotated.z <= 0 || rotated.z > opts.maxDistance) {
        return;
    }

    // Project to 2D screen space
    const projected = addPerspective(rotated, camera.fov);
    if (!projected) return;

    // Calculate distance-based scaling (if not fixed size)
    let scale = 1;
    if (!opts.fixedSize) {
        // Text gets smaller with distance
        scale = Math.max(0.1, Math.min(2, camera.fov / rotated.z * 0.5));
    }

    const finalFontSize = Math.floor(opts.fontSize * scale);
    
    // Set up text rendering
    context.save();
    
    // Set font
    context.font = `${finalFontSize}px ${opts.font}`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Measure text for background
    const textMetrics = context.measureText(text);
    const textWidth = textMetrics.width;
    const textHeight = finalFontSize;
    
    // Draw background if specified
    if (opts.backgroundColor) {
        context.fillStyle = opts.backgroundColor;
        const bgX = projected.x - textWidth / 2 - opts.padding;
        const bgY = projected.y - textHeight / 2 - opts.padding;
        const bgWidth = textWidth + opts.padding * 2;
        const bgHeight = textHeight + opts.padding * 2;
        
        context.fillRect(bgX, bgY, bgWidth, bgHeight);
    }
    
    // Draw text
    context.fillStyle = opts.color;
    context.fillText(text, projected.x, projected.y);
    
    context.restore();
}

/**
 * Renders text that floats above a 3D object
 * @param {Object} shape - The 3D shape object
 * @param {string} text - Text to render
 * @param {Object} camera - Camera object
 * @param {Object} options - Rendering options
 */
function renderFloatingText(shape, text, camera, options = {}) {
    // Calculate position above the shape
    const floatHeight = options.floatHeight || 100;
    const textPos = {
        x: shape.x,
        y: shape.y - floatHeight, // Float above the shape
        z: shape.z
    };
    
    render3DText(textPos, text, camera, options);
}

/**
 * Renders text attached to a specific vertex of a shape
 * @param {Object} vertex - The vertex object {x, y, z}
 * @param {string} text - Text to render
 * @param {Object} camera - Camera object
 * @param {Object} options - Rendering options
 */
function renderVertexText(vertex, text, camera, options = {}) {
    render3DText(vertex, text, camera, options);
}

/**
 * Renders UI text in screen space (always visible, not affected by 3D)
 * @param {number} x - Screen X position
 * @param {number} y - Screen Y position
 * @param {string} text - Text to render
 * @param {Object} options - Rendering options
 */
function renderUIText(x, y, text, options = {}) {
    const opts = {
        fontSize: options.fontSize || 16,
        font: options.font || 'Arial',
        color: options.color || '#ffffff',
        backgroundColor: options.backgroundColor || null,
        padding: options.padding || 4,
        align: options.align || 'left',
        baseline: options.baseline || 'top',
        ...options
    };

    context.save();
    
    context.font = `${opts.fontSize}px ${opts.font}`;
    context.textAlign = opts.align;
    context.textBaseline = opts.baseline;
    
    // Draw background if specified
    if (opts.backgroundColor) {
        const textMetrics = context.measureText(text);
        const textWidth = textMetrics.width;
        const textHeight = opts.fontSize;
        
        let bgX = x;
        if (opts.align === 'center') bgX -= textWidth / 2;
        else if (opts.align === 'right') bgX -= textWidth;
        
        let bgY = y;
        if (opts.baseline === 'middle') bgY -= textHeight / 2;
        else if (opts.baseline === 'bottom') bgY -= textHeight;
        
        context.fillStyle = opts.backgroundColor;
        context.fillRect(
            bgX - opts.padding, 
            bgY - opts.padding, 
            textWidth + opts.padding * 2, 
            textHeight + opts.padding * 2
        );
    }
    
    context.fillStyle = opts.color;
    context.fillText(text, x, y);
    
    context.restore();
}

function isTriangleFacingCamera(p1, p2, p3) {
    if (!p1 || !p2 || !p3) return false;
    
    const v1 = { x: p2.x - p1.x, y: p2.y - p1.y };
    const v2 = { x: p3.x - p1.x, y: p3.y - p1.y };
    
    const crossZ = v1.x * v2.y - v1.y * v2.x;
    
    return crossZ > 0;
}

function CollisionDetection(player, collidableObjects) {
    const playerRadius = 20; // Collision radius around the camera
    
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