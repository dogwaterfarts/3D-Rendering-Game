// Updated fillTriangle function for multiple lights
function fillTriangleMultiLight(v1, v2, v3, normal, worldV1, worldV2, worldV3, lights, materialColor = { r: 100, g: 150, b: 200 }, currentShape = null, allShapes = []) {
    if (!v1 || !v2 || !v3 || !worldV1 || !worldV2 || !worldV3) return;
    
    context.save();

    const centerWorld = {
        x: (worldV1.x + worldV2.x + worldV3.x) / 3,
        y: (worldV1.y + worldV2.y + worldV3.y) / 3,
        z: (worldV1.z + worldV2.z + worldV3.z) / 3
    };

    // Initialize lighting components
    let totalDiffuse = { r: 0, g: 0, b: 0 };
    const ambient = 0.15;
    
    // Process each light source
    for (let light of lights) {
        if (!light.enabled) continue;
        
        let lightContribution = calculateLightContribution(
            centerWorld, 
            normal, 
            light, 
            allShapes, 
            currentShape
        );
        
        // Accumulate light contributions
        totalDiffuse.r += lightContribution.r;
        totalDiffuse.g += lightContribution.g;
        totalDiffuse.b += lightContribution.b;
    }
    
    // Apply ambient lighting
    const finalIntensity = {
        r: Math.min(1, ambient + totalDiffuse.r),
        g: Math.min(1, ambient + totalDiffuse.g),
        b: Math.min(1, ambient + totalDiffuse.b)
    };

    // Calculate final color
    const finalColor = {
        r: Math.floor(materialColor.r * finalIntensity.r),
        g: Math.floor(materialColor.g * finalIntensity.g),
        b: Math.floor(materialColor.b * finalIntensity.b)
    };

    // Clamp colors
    finalColor.r = Math.max(0, Math.min(255, finalColor.r));
    finalColor.g = Math.max(0, Math.min(255, finalColor.g));
    finalColor.b = Math.max(0, Math.min(255, finalColor.b));

    // Render triangle
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

// Calculate lighting contribution from a single light
function calculateLightContribution(worldPoint, normal, light, allShapes, excludeShape) {
    let lightDir, distance, attenuation = 1.0;
    
    // Calculate light direction and attenuation based on light type
    switch (light.type) {
        case 'directional':
            lightDir = vectorNormalize({
                x: -light.direction.x,
                y: -light.direction.y,
                z: -light.direction.z
            });
            distance = Infinity; // No distance attenuation for directional lights
            break;
            
        case 'spot':
            const toLightVec = vectorSubtract(light, worldPoint);
            distance = Math.sqrt(toLightVec.x * toLightVec.x + toLightVec.y * toLightVec.y + toLightVec.z * toLightVec.z);
            lightDir = vectorNormalize(toLightVec);
            
            // Calculate spot light cone attenuation
            const spotDot = vectorDot(lightDir, vectorNormalize({
                x: -light.direction.x,
                y: -light.direction.y,
                z: -light.direction.z
            }));
            const spotAngleCos = Math.cos(light.spotAngle);
            
            if (spotDot < spotAngleCos) {
                return { r: 0, g: 0, b: 0 }; // Outside spot cone
            }
            
            const spotAttenuation = Math.pow(spotDot, light.spotFalloff);
            attenuation *= spotAttenuation;
            break;
            
        case 'point':
        default:
            const toLightPoint = vectorSubtract(light, worldPoint);
            distance = Math.sqrt(toLightPoint.x * toLightPoint.x + toLightPoint.y * toLightPoint.y + toLightPoint.z * toLightPoint.z);
            lightDir = vectorNormalize(toLightPoint);
            break;
    }
    
    // Calculate distance attenuation (inverse square law with minimum)
    if (distance !== Infinity) {
        attenuation *= Math.max(0.01, 1.0 / (1.0 + 0.001 * distance + 0.0001 * distance * distance));
    }
    
    // Calculate diffuse lighting (Lambert)
    let intensity = Math.max(0, vectorDot(normal, lightDir));
    
    // Calculate shadows
    let shadowIntensity = 1.0;
    if (allShapes.length > 1) {
        shadowIntensity = calculateShadowIntensityForLight(worldPoint, light, allShapes, excludeShape, normal);
    }
    
    // Apply attenuation and shadow
    intensity *= attenuation * shadowIntensity * light.intensity;
    
    // Apply light color
    const colorInfluence = 0.3;
    const lightColor = {
        r: (light.color.r / 255) * colorInfluence + (1 - colorInfluence),
        g: (light.color.g / 255) * colorInfluence + (1 - colorInfluence),
        b: (light.color.b / 255) * colorInfluence + (1 - colorInfluence)
    };
    
    return {
        r: intensity * lightColor.r,
        g: intensity * lightColor.g,
        b: intensity * lightColor.b
    };
}

// Updated shadow calculation for individual lights
function calculateShadowIntensityForLight(worldPoint, light, allShapes, excludeShape, surfaceNormal) {
    const shadowSamples = 4;
    let shadowSum = 0;
    
    // For directional lights, use parallel rays
    if (light.type === 'directional') {
        const rayDirection = vectorNormalize({
            x: -light.direction.x,
            y: -light.direction.y,
            z: -light.direction.z
        });
        
        // Offset along surface normal
        const rayOrigin = {
            x: worldPoint.x + surfaceNormal.x * 0.1,
            y: worldPoint.y + surfaceNormal.y * 0.1,
            z: worldPoint.z + surfaceNormal.z * 0.1
        };
        
        if (isPointInShadowDirectional(rayOrigin, rayDirection, allShapes, excludeShape)) {
            return 0.3; // Heavy shadow for directional light
        }
        return 1.0;
    }
    
    // For point and spot lights, use area sampling
    const lightRadius = light.radius || 50;
    
    for (let i = 0; i < shadowSamples; i++) {
        const angle1 = (i / shadowSamples) * Math.PI * 2;
        const angle2 = Math.random() * Math.PI * 2;
        const radius = Math.random() * lightRadius;
        
        const offsetLight = {
            x: light.x + Math.cos(angle1) * radius,
            y: light.y + Math.sin(angle1) * Math.cos(angle2) * radius,
            z: light.z + Math.sin(angle1) * Math.sin(angle2) * radius,
            color: light.color,
            intensity: light.intensity,
            type: light.type
        };
        
        if (isPointInShadowWithNormal(worldPoint, surfaceNormal, offsetLight, allShapes, excludeShape)) {
            shadowSum += 1;
        }
    }
    
    return 1.0 - (shadowSum / shadowSamples);
}

// Shadow calculation for directional lights
function isPointInShadowDirectional(rayOrigin, rayDirection, allShapes, excludeShape) {
    for (let shape of allShapes) {
        if (shape === excludeShape) continue;
        
        for (let triangleIndices of shape.Triangles) {
            if (!triangleIndices || triangleIndices.length < 3) continue;
            
            const v0 = shape.Vertices[triangleIndices[0]];
            const v1 = shape.Vertices[triangleIndices[1]];
            const v2 = shape.Vertices[triangleIndices[2]];
            
            if (!v0 || !v1 || !v2) continue;
            
            const intersection = rayTriangleIntersection(rayOrigin, rayDirection, v0, v1, v2);
            
            // For directional lights, any intersection means shadow
            if (intersection && intersection.distance > 0.1) {
                return true;
            }
        }
    }
    
    return false;
}

// Function to render multiple light sources
function renderLights(lights, camera) {
    for (let i = 0; i < lights.length; i++) {
        const light = lights[i];
        if (!light.enabled) continue;
        
        // Only render point and spot lights (directional lights don't have a position to render)
        if (light.type === 'directional') continue;
        
        const lightTransformed = {
            x: light.x - camera.x,
            y: light.y - camera.y,
            z: light.z - camera.z
        };
        
        let lightRotated = MatrixTimesVector(rotYMatrix(-camera.rotationX), lightTransformed);
        lightRotated = MatrixTimesVector(rotXMatrix(camera.rotationY), lightRotated);
        
        const lightProjected = addPerspective(lightRotated, camera.fov);
        
        if (lightProjected && lightProjected.z > 0) {
            context.fillStyle = `rgb(${light.color.r}, ${light.color.g}, ${light.color.b})`;
            context.beginPath();
            
            // Different sizes for different light types
            const size = light.type === 'spot' ? 12 : 8;
            context.arc(lightProjected.x, lightProjected.y, size, 0, Math.PI * 2);
            context.fill();
            
            // Add light index label
            renderUIText(lightProjected.x + 15, lightProjected.y - 5, `L${i}`, {
                fontSize: 12,
                color: `rgb(${light.color.r}, ${light.color.g}, ${light.color.b})`,
                backgroundColor: 'rgba(0,0,0,0.7)',
                padding: 2
            });
        }
    }
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

function isTriangleFacingCamera(p1, p2, p3, worldVertices, cameraPos) {
    if (!p1 || !p2 || !p3) return false;
    
    // Calculate screen-space winding order for basic culling
    const v1 = { x: p2.x - p1.x, y: p2.y - p1.y };
    const v2 = { x: p3.x - p1.x, y: p3.y - p1.y };
    const crossZ = v1.x * v2.y - v1.y * v2.x;
    
    // If triangle is very close to camera, be more lenient with culling
    const avgZ = (p1.z + p2.z + p3.z) / 3;
    if (avgZ < 50) {
        return crossZ > -0.1; // More lenient threshold for close triangles
    }
    
    // For far triangles, use normal culling
    if (avgZ > 1000) {
        return crossZ > 0;
    }
    
    // For medium distance, use moderate culling
    return crossZ > -0.05;
}

// Improved triangle visibility check
function isTriangleVisible(p1, p2, p3) {
    if (!p1 || !p2 || !p3) return false;
    
    // Check if all vertices are behind camera
    if (p1.z <= 0 && p2.z <= 0 && p3.z <= 0) return false;
    
    // Check if triangle is completely outside screen bounds
    const minX = Math.min(p1.x, p2.x, p3.x);
    const maxX = Math.max(p1.x, p2.x, p3.x);
    const minY = Math.min(p1.y, p2.y, p3.y);
    const maxY = Math.max(p1.y, p2.y, p3.y);
    
    const margin = 1000; // Allow some margin for partially visible triangles
    if (maxX < -margin || minX > canvasWidth + margin || 
        maxY < -margin || minY > canvasHeight + margin) {
        return false;
    }
    
    return true;
}
