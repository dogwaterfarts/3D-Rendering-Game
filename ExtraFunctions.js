// ===== OPTIMIZED EXTRA FUNCTIONS =====

// Pre-allocated objects for reuse to avoid garbage collection
const tempVector1 = { x: 0, y: 0, z: 0 };
const tempVector2 = { x: 0, y: 0, z: 0 };
const tempVector3 = { x: 0, y: 0, z: 0 };
const tempColor = { r: 0, g: 0, b: 0 };
const tempLightContrib = { r: 0, g: 0, b: 0 };

// Optimized fillTriangle function with pre-allocated objects and reduced calculations
// function fillTriangleMultiLight(v1, v2, v3, normal, worldV1, worldV2, worldV3, lights, materialColor = { r: 100, g: 150, b: 200 }, currentShape = null, allShapes = []) {
//     if (!v1 || !v2 || !v3 || !worldV1 || !worldV2 || !worldV3) return;
    
//     // Pre-calculate center world position (reuse temp object)
//     tempVector1.x = (worldV1.x + worldV2.x + worldV3.x) * 0.33333333; // Faster than /3
//     tempVector1.y = (worldV1.y + worldV2.y + worldV3.y) * 0.33333333;
//     tempVector1.z = (worldV1.z + worldV2.z + worldV3.z) * 0.33333333;

//     // Initialize lighting components (reuse objects)
//     tempColor.r = tempColor.g = tempColor.b = 0;
//     const ambient = 0.15;
    
//     // Process each light source with optimized loop
//     const lightsLength = lights.length;
//     for (let i = 0; i < lightsLength; i++) {
//         const light = lights[i];
//         if (!light.enabled) continue;
        
//         calculateLightContributionOptimized(tempVector1, normal, light, allShapes, currentShape, tempLightContrib);
        
//         // Accumulate light contributions
//         tempColor.r += tempLightContrib.r;
//         tempColor.g += tempLightContrib.g;
//         tempColor.b += tempLightContrib.b;
//     }
    
//     // Apply ambient and clamp in one step
//     const finalR = Math.min(255, Math.max(0, Math.floor(materialColor.r * Math.min(1, ambient + tempColor.r))));
//     const finalG = Math.min(255, Math.max(0, Math.floor(materialColor.g * Math.min(1, ambient + tempColor.g))));
//     const finalB = Math.min(255, Math.max(0, Math.floor(materialColor.b * Math.min(1, ambient + tempColor.b))));

//     // Optimized rendering with pre-built path
//     context.beginPath();
//     context.moveTo(v1.x, v1.y);
//     context.lineTo(v2.x, v2.y);
//     context.lineTo(v3.x, v3.y);
//     context.closePath();
    
//     // Use single style assignment
//     const colorStr = `rgb(${finalR},${finalG},${finalB})`;
//     context.fillStyle = colorStr;
//     context.strokeStyle = colorStr;
//     context.stroke();
//     context.fill();
// }

// Optimized light contribution calculation with reduced allocations
function calculateLightContributionOptimized(worldPoint, normal, light, allShapes, excludeShape, result) {
    let lightDirX, lightDirY, lightDirZ, distance, attenuation = 1.0;
    
    // Calculate light direction and attenuation based on light type
    switch (light.type) {
        case 'directional':
            lightDirX = -light.direction.x;
            lightDirY = -light.direction.y;
            lightDirZ = -light.direction.z;
            // Normalize inline
            const dirLength = Math.sqrt(lightDirX * lightDirX + lightDirY * lightDirY + lightDirZ * lightDirZ);
            if (dirLength > 0) {
                const invLength = 1 / dirLength;
                lightDirX *= invLength;
                lightDirY *= invLength;
                lightDirZ *= invLength;
            }
            distance = Infinity;
            break;
            
        case 'spot':
            const toLightX = light.x - worldPoint.x;
            const toLightY = light.y - worldPoint.y;
            const toLightZ = light.z - worldPoint.z;
            distance = Math.sqrt(toLightX * toLightX + toLightY * toLightY + toLightZ * toLightZ);
            
            if (distance > 0) {
                const invDist = 1 / distance;
                lightDirX = toLightX * invDist;
                lightDirY = toLightY * invDist;
                lightDirZ = toLightZ * invDist;
            } else {
                result.r = result.g = result.b = 0;
                return;
            }
            
            // Calculate spot light cone attenuation inline
            const spotDot = lightDirX * (-light.direction.x) + lightDirY * (-light.direction.y) + lightDirZ * (-light.direction.z);
            const spotAngleCos = Math.cos(light.spotAngle);
            
            if (spotDot < spotAngleCos) {
                result.r = result.g = result.b = 0;
                return;
            }
            
            attenuation *= Math.pow(spotDot, light.spotFalloff);
            break;
            
        case 'point':
        default:
            const toPointX = light.x - worldPoint.x;
            const toPointY = light.y - worldPoint.y;
            const toPointZ = light.z - worldPoint.z;
            distance = Math.sqrt(toPointX * toPointX + toPointY * toPointY + toPointZ * toPointZ);
            
            if (distance > 0) {
                const invDist = 1 / distance;
                lightDirX = toPointX * invDist;
                lightDirY = toPointY * invDist;
                lightDirZ = toPointZ * invDist;
            } else {
                result.r = result.g = result.b = 0;
                return;
            }
            break;
    }
    
    // Distance attenuation (optimized)
    if (distance !== Infinity) {
        const distSq = distance * distance;
        attenuation *= Math.max(0.01, 1.0 / (1.0 + 0.001 * distance + 0.0001 * distSq));
    }
    
    // Diffuse lighting (inline dot product)
    let intensity = Math.max(0, normal.x * lightDirX + normal.y * lightDirY + normal.z * lightDirZ);
    
    // Simplified shadow calculation (only for multiple shapes)
    let shadowIntensity = 1.0;
    if (allShapes.length > 1) {
        shadowIntensity = calculateShadowIntensityOptimized(worldPoint, light, allShapes, excludeShape, normal);
    }
    
    // Apply final intensity
    intensity *= attenuation * shadowIntensity * light.intensity;
    
    // Apply light color with optimized calculation
    const colorInfluence = 0.3;
    const lightR = (light.color.r * 0.00392156862745098) * colorInfluence + (1 - colorInfluence); // /255 pre-calculated
    const lightG = (light.color.g * 0.00392156862745098) * colorInfluence + (1 - colorInfluence);
    const lightB = (light.color.b * 0.00392156862745098) * colorInfluence + (1 - colorInfluence);
    
    result.r = intensity * lightR;
    result.g = intensity * lightG;
    result.b = intensity * lightB;
}

// Optimized shadow calculation with reduced sampling for performance
function calculateShadowIntensityOptimized(worldPoint, light, allShapes, excludeShape, surfaceNormal) {
    // Reduced shadow samples for performance (was 4, now 2)
    const shadowSamples = 2;
    let shadowCount = 0;
    
    // For directional lights, use single ray
    if (light.type === 'directional') {
        // Reuse temp vector for ray direction
        tempVector2.x = -light.direction.x;
        tempVector2.y = -light.direction.y;
        tempVector2.z = -light.direction.z;
        
        // Normalize inline
        const length = Math.sqrt(tempVector2.x * tempVector2.x + tempVector2.y * tempVector2.y + tempVector2.z * tempVector2.z);
        if (length > 0) {
            const invLength = 1 / length;
            tempVector2.x *= invLength;
            tempVector2.y *= invLength;
            tempVector2.z *= invLength;
        }
        
        // Offset ray origin
        tempVector3.x = worldPoint.x + surfaceNormal.x * 0.1;
        tempVector3.y = worldPoint.y + surfaceNormal.y * 0.1;
        tempVector3.z = worldPoint.z + surfaceNormal.z * 0.1;
        
        return isPointInShadowDirectionalOptimized(tempVector3, tempVector2, allShapes, excludeShape) ? 0.3 : 1.0;
    }
    
    // For point and spot lights, use reduced sampling
    const lightRadius = light.radius || 50;
    const angleStep = Math.PI / shadowSamples; // Pre-calculate step
    
    for (let i = 0; i < shadowSamples; i++) {
        const angle1 = i * angleStep * 2;
        const radius = Math.random() * lightRadius;
        
        // Create offset light position inline
        const offsetX = light.x + Math.cos(angle1) * radius;
        const offsetY = light.y + Math.sin(angle1) * radius * 0.5; // Reduced Y variation
        const offsetZ = light.z;
        
        if (isPointInShadowOptimized(worldPoint, surfaceNormal, offsetX, offsetY, offsetZ, allShapes, excludeShape)) {
            shadowCount++;
        }
    }
    
    return 1.0 - (shadowCount / shadowSamples);
}

// Optimized shadow test for directional lights
function isPointInShadowDirectionalOptimized(rayOrigin, rayDirection, allShapes, excludeShape) {
    const shapesLength = allShapes.length;
    for (let s = 0; s < shapesLength; s++) {
        const shape = allShapes[s];
        if (shape === excludeShape) continue;
        
        const triangles = shape.Triangles;
        const vertices = shape.Vertices;
        const trianglesLength = triangles.length;
        
        for (let t = 0; t < trianglesLength; t++) {
            const triangleIndices = triangles[t];
            if (!triangleIndices || triangleIndices.length < 3) continue;
            
            const v0 = vertices[triangleIndices[0]];
            const v1 = vertices[triangleIndices[1]];
            const v2 = vertices[triangleIndices[2]];
            
            if (!v0 || !v1 || !v2) continue;
            
            const intersection = rayTriangleIntersectionOptimized(rayOrigin, rayDirection, v0, v1, v2);
            
            if (intersection && intersection > 0.1) {
                return true;
            }
        }
    }
    return false;
}

// Optimized point shadow test
function isPointInShadowOptimized(worldPoint, surfaceNormal, lightX, lightY, lightZ, allShapes, excludeShape) {
    // Calculate light direction inline
    const lightDirX = lightX - worldPoint.x;
    const lightDirY = lightY - worldPoint.y;
    const lightDirZ = lightZ - worldPoint.z;
    
    const lightDistance = Math.sqrt(lightDirX * lightDirX + lightDirY * lightDirY + lightDirZ * lightDirZ);
    if (lightDistance === 0) return false;
    
    const invDist = 1 / lightDistance;
    const normalizedX = lightDirX * invDist;
    const normalizedY = lightDirY * invDist;
    const normalizedZ = lightDirZ * invDist;
    
    // Ray origin with normal offset
    const rayOriginX = worldPoint.x + surfaceNormal.x * 0.1;
    const rayOriginY = worldPoint.y + surfaceNormal.y * 0.1;
    const rayOriginZ = worldPoint.z + surfaceNormal.z * 0.1;
    
    // Use temp vector for ray origin
    tempVector3.x = rayOriginX;
    tempVector3.y = rayOriginY;
    tempVector3.z = rayOriginZ;
    
    tempVector2.x = normalizedX;
    tempVector2.y = normalizedY;
    tempVector2.z = normalizedZ;
    
    const shapesLength = allShapes.length;
    for (let s = 0; s < shapesLength; s++) {
        const shape = allShapes[s];
        if (shape === excludeShape) continue;
        
        const triangles = shape.Triangles;
        const vertices = shape.Vertices;
        const trianglesLength = triangles.length;
        
        for (let t = 0; t < trianglesLength; t++) {
            const triangleIndices = triangles[t];
            if (!triangleIndices || triangleIndices.length < 3) continue;
            
            const v0 = vertices[triangleIndices[0]];
            const v1 = vertices[triangleIndices[1]];
            const v2 = vertices[triangleIndices[2]];
            
            if (!v0 || !v1 || !v2) continue;
            
            const intersectionDistance = rayTriangleIntersectionOptimized(tempVector3, tempVector2, v0, v1, v2);
            
            if (intersectionDistance && intersectionDistance < lightDistance - 0.1) {
                return true;
            }
        }
    }
    
    return false;
}

// Highly optimized ray-triangle intersection (returns distance only)
function rayTriangleIntersectionOptimized(rayOrigin, rayDirection, v0, v1, v2) {
    const EPSILON = 0.0000001;
    
    // Edge vectors (inline calculation)
    const edge1X = v1.x - v0.x;
    const edge1Y = v1.y - v0.y;
    const edge1Z = v1.z - v0.z;
    
    const edge2X = v2.x - v0.x;
    const edge2Y = v2.y - v0.y;
    const edge2Z = v2.z - v0.z;
    
    // Cross product rayDirection × edge2
    const hX = rayDirection.y * edge2Z - rayDirection.z * edge2Y;
    const hY = rayDirection.z * edge2X - rayDirection.x * edge2Z;
    const hZ = rayDirection.x * edge2Y - rayDirection.y * edge2X;
    
    // Dot product edge1 · h
    const a = edge1X * hX + edge1Y * hY + edge1Z * hZ;
    
    if (a > -EPSILON && a < EPSILON) {
        return null; // Ray is parallel to triangle
    }
    
    const f = 1.0 / a;
    
    // Vector from v0 to ray origin
    const sX = rayOrigin.x - v0.x;
    const sY = rayOrigin.y - v0.y;
    const sZ = rayOrigin.z - v0.z;
    
    const u = f * (sX * hX + sY * hY + sZ * hZ);
    
    if (u < 0.0 || u > 1.0) {
        return null;
    }
    
    // Cross product s × edge1
    const qX = sY * edge1Z - sZ * edge1Y;
    const qY = sZ * edge1X - sX * edge1Z;
    const qZ = sX * edge1Y - sY * edge1X;
    
    const v = f * (rayDirection.x * qX + rayDirection.y * qY + rayDirection.z * qZ);
    
    if (v < 0.0 || u + v > 1.0) {
        return null;
    }
    
    const t = f * (edge2X * qX + edge2Y * qY + edge2Z * qZ);
    
    return t > EPSILON ? t : null;
}

// function renderLights(lights, camera) {
//     for (let i = 0; i < lights.length; i++) {
//         const light = lights[i];
//         if (!light.enabled) continue;
        
//         // Only render point and spot lights (directional lights don't have a position to render)
//         if (light.type === 'directional') continue;
        
//         const lightTransformed = {
//             x: light.x - camera.x,
//             y: light.y - camera.y,
//             z: light.z - camera.z
//         };
        
//         let lightRotated = MatrixTimesVector(rotYMatrix(-camera.rotationX), lightTransformed);
//         lightRotated = MatrixTimesVector(rotXMatrix(camera.rotationY), lightRotated);
        
//         const lightProjected = addPerspectiveOptimized(lightRotated, camera.fov);
        
//         if (lightProjected && lightProjected.z > 0) {
//             context.fillStyle = `rgb(${light.color.r}, ${light.color.g}, ${light.color.b})`;
//             context.beginPath();
            
//             // Different sizes for different light types
//             const size = light.type === 'spot' ? 12 : 8;
//             context.arc(lightProjected.x, lightProjected.y, size, 0, Math.PI * 2);
//             context.fill();
            
//             // Add light index label
//             renderUIText(lightProjected.x + 15, lightProjected.y - 5, `L${i}`, {
//                 fontSize: 12,
//                 color: `rgb(${light.color.r}, ${light.color.g}, ${light.color.b})`,
//                 backgroundColor: 'rgba(0,0,0,0.7)',
//                 padding: 2
//             });
//         }
//     }
// }

// Helper function to check if a shape is a tile
// function isTileShape(shape) {
//     return shape && (shape.isTile === true || 
//                     shape.name === 'tile' || 
//                     shape.constructor.name === 'Tile' ||
//                     (shape.x !== undefined && shape.z !== undefined && shape.y !== undefined && 
//                      shape.w !== undefined && shape.d !== undefined && shape.h !== undefined &&
//                      shape.name === undefined));
// }

// Improved face culling function that handles tiles properly
function isTriangleFacingCameraOptimized(p1, p2, p3, shape = null) {
    // For tiles (horizontal planes), we need special handling
    if (isTileShape(shape)) {
        // For horizontal tiles, check if we're looking down at them
        // Calculate the normal in screen space
        const v1 = { x: p2.x - p1.x, y: p2.y - p1.y };
        const v2 = { x: p3.x - p1.x, y: p3.y - p1.y };
        const cross = v1.x * v2.y - v1.y * v2.x;
        
        // For horizontal planes viewed from above, we want to show triangles
        // The cross product should be positive for counter-clockwise triangles
        return cross > 0;
    } else {
        // For regular shapes, use the original face culling
        const v1 = { x: p2.x - p1.x, y: p2.y - p1.y };
        const v2 = { x: p3.x - p1.x, y: p3.y - p1.y };
        const cross = v1.x * v2.y - v1.y * v2.x;
        return cross > 0;
    }
}

// Original visibility check function (unchanged)
function isTriangleVisibleOptimized(p1, p2, p3) {
    return p1.z > 0 && p2.z > 0 && p3.z > 0;
}

// Modified fillTriangleMultiLight function for tiles
function fillTriangleTileOptimized(p1, p2, p3, normal, w1, w2, w3, lights, baseColor, shape, allShapes) {
    // For tiles, render with flat color - no shadows or lighting
    context.fillStyle = `rgb(${baseColor.r}, ${baseColor.g}, ${baseColor.b})`;
    
    context.beginPath();
    context.moveTo(p1.x, p1.y);
    context.lineTo(p2.x, p2.y);
    context.lineTo(p3.x, p3.y);
    context.closePath();
    context.fill();
}

// Cached perspective calculation
const perspectiveCache = new Map();
let cacheFrameCount = 0;

function addPerspectiveOptimized(point, fov) {
    if (!point || point.z <= 0) return null;

    // Clear cache every 60 frames to prevent memory buildup
    if (++cacheFrameCount > 60) {
        perspectiveCache.clear();
        cacheFrameCount = 0;
    }

    const scale = fov / point.z;
    
    return {
        x: point.x * scale + centerX,
        y: point.y * scale + centerY,
        z: point.z
    };
}

// Optimized visibility checks with early termination
function isTriangleVisibleOptimized(p1, p2, p3) {
    if (!p1 || !p2 || !p3) return false;
    
    // Quick Z-test first (cheapest)
    if (p1.z <= 0 && p2.z <= 0 && p3.z <= 0) return false;
    
    // Quick bounds test with minimal calculations
    const minX = Math.min(p1.x, p2.x, p3.x);
    if (minX > canvasWidth + 500) return false;
    
    const maxX = Math.max(p1.x, p2.x, p3.x);
    if (maxX < -500) return false;
    
    const minY = Math.min(p1.y, p2.y, p3.y);
    if (minY > canvasHeight + 500) return false;
    
    const maxY = Math.max(p1.y, p2.y, p3.y);
    if (maxY < -500) return false;
    
    return true;
}

// Optimized backface culling with distance-based thresholds
function isTriangleFacingCameraOptimized(p1, p2, p3) {
    if (!p1 || !p2 || !p3) return false;
    
    // Screen-space winding order
    const v1x = p2.x - p1.x;
    const v1y = p2.y - p1.y;
    const v2x = p3.x - p1.x;
    const v2y = p3.y - p1.y;
    const crossZ = v1x * v2y - v1y * v2x;
    
    // Distance-based culling thresholds (optimized)
    const avgZ = (p1.z + p2.z + p3.z) * 0.33333333;
    
    if (avgZ < 50) {
        return crossZ > -0.1;
    } else if (avgZ > 1000) {
        return crossZ > 0;
    } else {
        return crossZ > -0.05;
    }
}

// Optimized 3D text rendering with reduced calculations
function render3DTextOptimized(worldPos, text, camera, options = {}) {
    const opts = {
        fontSize: options.fontSize || 16,
        font: options.font || 'Arial',
        color: options.color || '#ffffff',
        backgroundColor: options.backgroundColor || null,
        padding: options.padding || 4,
        fixedSize: options.fixedSize || true,
        maxDistance: options.maxDistance || 2000,
        ...options
    };

    // Transform world position (reuse temp vector)
    tempVector1.x = worldPos.x - camera.x;
    tempVector1.y = worldPos.y - camera.y;
    tempVector1.z = worldPos.z - camera.z;

    // Apply rotations inline (same as light rendering)
    let rotatedY = tempVector1.y * Math.cos(camera.rotationY) - tempVector1.z * Math.sin(camera.rotationY);
    let rotatedZ = tempVector1.y * Math.sin(camera.rotationY) + tempVector1.z * Math.cos(camera.rotationY);
    
    const cosRotX = Math.cos(-camera.rotationX);
    const sinRotX = Math.sin(-camera.rotationX);
    const finalX = tempVector1.x * cosRotX - rotatedZ * sinRotX;
    const finalZ = tempVector1.x * sinRotX + rotatedZ * cosRotX;

    if (finalZ <= 0 || finalZ > opts.maxDistance) return;

    const scale = camera.fov / finalZ;
    const projectedX = finalX * scale + centerX;
    const projectedY = rotatedY * scale + centerY;

    // Calculate font size
    let finalFontSize = opts.fontSize;
    if (!opts.fixedSize) {
        finalFontSize = Math.floor(opts.fontSize * Math.max(0.1, Math.min(2, camera.fov / finalZ * 0.5)));
    }

    // Render text
    context.save();
    context.font = `${finalFontSize}px ${opts.font}`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    // Background rendering (if needed)
    if (opts.backgroundColor) {
        const textWidth = context.measureText(text).width;
        const bgWidth = textWidth + opts.padding * 2;
        const bgHeight = finalFontSize + opts.padding * 2;
        
        context.fillStyle = opts.backgroundColor;
        context.fillRect(
            projectedX - bgWidth * 0.5,
            projectedY - bgHeight * 0.5,
            bgWidth,
            bgHeight
        );
    }

    context.fillStyle = opts.color;
    context.fillText(text, projectedX, projectedY);
    context.restore();
}

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
    const projected = addPerspectiveOptimized(rotated, camera.fov);
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

// Optimized UI text rendering
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

    if (opts.backgroundColor) {
        const metrics = context.measureText(text);
        const textWidth = metrics.width;
        const textHeight = opts.fontSize;

        let bgX = x - (opts.align === 'center' ? textWidth * 0.5 : opts.align === 'right' ? textWidth : 0);
        let bgY = y - (opts.baseline === 'middle' ? textHeight * 0.5 : opts.baseline === 'bottom' ? textHeight : 0);

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

// Simplified tile rendering (reduced lighting for performance)
function fillTriangleTileOptimized(p1, p2, p3, normal, w1, w2, w3, lights, shapeColor, shape, allShapes) {
    // Simplified lighting for tiles - just use first enabled light
    let lightIntensity = 0.3; // Base lighting for tiles
    
    for (let light of lights) {
        if (!light.enabled) continue;
        
        if (light.type === 'spot') {
            const center = {
                x: (w1.x + w2.x + w3.x) / 3,
                y: (w1.y + w2.y + w3.y) / 3,
                z: (w1.z + w2.z + w3.z) / 3
            };
            
            const spotIntensity = calculateSpotlightIntensity(light, center);
            const lightVector = vectorSubtract(light, center);
            const distance = vectorMagnitude(lightVector);
            const attenuation = 1 / (1 + distance * distance * 0.0001);
            
            lightIntensity = Math.max(lightIntensity, spotIntensity * attenuation * light.intensity * 0.5);
        }
        break; // Only use first light for tiles
    }
    
    const finalColor = {
        r: Math.min(255, Math.max(0, lightIntensity * shapeColor.r)),
        g: Math.min(255, Math.max(0, lightIntensity * shapeColor.g)),
        b: Math.min(255, Math.max(0, lightIntensity * shapeColor.b))
    };
    
    context.fillStyle = `rgb(${Math.floor(finalColor.r)}, ${Math.floor(finalColor.g)}, ${Math.floor(finalColor.b)})`;
    context.beginPath();
    context.moveTo(p1.x, p1.y);
    context.lineTo(p2.x, p2.y);
    context.lineTo(p3.x, p3.y);
    context.closePath();
    context.fill();
}

// Helper function to check if shape is a tile
function isTileShape(shape) {
    return shape.isTile === true;
}

// Render light indicators
function renderLights(lights, camera) {
    lights.forEach((light, index) => {
        if (!light.enabled) return;
        
        // Project light position to screen
        const lightPos = {
            x: light.x - camera.x,
            y: light.y - camera.y,
            z: light.z - camera.z
        };
        
        // Apply camera rotations (simplified)
        const projected = addPerspectiveOptimized(lightPos, camera.fov);
        if (!projected) return;
        
        // Draw light indicator
        context.fillStyle = `rgb(${light.color.r}, ${light.color.g}, ${light.color.b})`;
        context.beginPath();
        context.arc(projected.x, projected.y, 8, 0, Math.PI * 2);
        context.fill();
        
        // Draw light cone for spotlights
        if (light.type === 'spot') {
            context.strokeStyle = `rgba(${light.color.r}, ${light.color.g}, ${light.color.b}, 0.3)`;
            context.lineWidth = 2;
            context.beginPath();
            
            // Simple cone representation
            const coneRadius = 30;
            context.arc(projected.x, projected.y, coneRadius, 0, Math.PI * 2);
            context.stroke();
        }
    });
}

function calculateSpotlightIntensity(light, worldPos) {
    if (light.type !== 'spot') return 1.0;
    
    // Vector from light to surface point
    const lightToSurface = vectorNormalize(vectorSubtract(worldPos, light));
    
    // Calculate angle between light direction and light-to-surface vector
    const cosAngle = vectorDot(light.direction, lightToSurface);
    const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
    
    // Check if point is within spotlight cone
    if (angle > light.spotAngle) {
        return 0.0; // Outside spotlight cone
    }
    
    // Calculate falloff based on angle
    const falloffFactor = Math.pow(Math.cos(angle), light.spotFalloff);
    return falloffFactor;
}

function fillTriangleMultiLight(p1, p2, p3, normal, w1, w2, w3, lights, shapeColor, shape, allShapes) {
    // Calculate triangle center for lighting
    const center = {
        x: (w1.x + w2.x + w3.x) / 3,
        y: (w1.y + w2.y + w3.y) / 3,
        z: (w1.z + w2.z + w3.z) / 3
    };
    
    let totalLighting = { r: 0, g: 0, b: 0 };
    let ambientLight = 0.2; // Base ambient lighting
    
    // Process each light
    for (let light of lights) {
        if (!light.enabled) continue;
        
        let lightContribution = { r: 0, g: 0, b: 0 };
        let lightIntensity = 0;
        
        if (light.type === 'directional') {
            // Directional light (like sun)
            const lightDotNormal = Math.max(0, vectorDot(normal, vectorScale(light.direction, -1)));
            lightIntensity = lightDotNormal * light.intensity;
        } else if (light.type === 'point') {
            // Point light
            const lightVector = vectorSubtract(light, center);
            const distance = vectorMagnitude(lightVector);
            const lightDir = vectorNormalize(lightVector);
            
            // Distance attenuation
            const attenuation = 1 / (1 + distance * distance * 0.0001);
            const lightDotNormal = Math.max(0, vectorDot(normal, lightDir));
            lightIntensity = lightDotNormal * light.intensity * attenuation;
        } else if (light.type === 'spot') {
            // Spotlight
            const lightVector = vectorSubtract(light, center);
            const distance = vectorMagnitude(lightVector);
            const lightDir = vectorNormalize(lightVector);
            
            // Distance attenuation
            const attenuation = 1 / (1 + distance * distance * 0.0001);
            const lightDotNormal = Math.max(0, vectorDot(normal, lightDir));
            
            // Spotlight cone calculation
            const spotIntensity = calculateSpotlightIntensity(light, center);
            
            lightIntensity = lightDotNormal * light.intensity * attenuation * spotIntensity;
        }
        
        // Apply light color
        lightContribution.r = light.color.r * lightIntensity / 255;
        lightContribution.g = light.color.g * lightIntensity / 255;
        lightContribution.b = light.color.b * lightIntensity / 255;
        
        totalLighting.r += lightContribution.r;
        totalLighting.g += lightContribution.g;
        totalLighting.b += lightContribution.b;
    }
    
    // Apply ambient + total lighting to shape color
    const finalColor = {
        r: Math.min(255, Math.max(0, (ambientLight + totalLighting.r) * shapeColor.r)),
        g: Math.min(255, Math.max(0, (ambientLight + totalLighting.g) * shapeColor.g)),
        b: Math.min(255, Math.max(0, (ambientLight + totalLighting.b) * shapeColor.b))
    };
    
    // Fill the triangle
    context.fillStyle = `rgb(${Math.floor(finalColor.r)}, ${Math.floor(finalColor.g)}, ${Math.floor(finalColor.b)})`;
    context.beginPath();
    context.moveTo(p1.x, p1.y);
    context.lineTo(p2.x, p2.y);
    context.lineTo(p3.x, p3.y);
    context.closePath();
    context.fill();
}