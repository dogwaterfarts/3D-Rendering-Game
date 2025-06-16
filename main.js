const canvas = document.getElementById('c');
const context = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const canvasWidth = canvas.width;
const canvasHeight = canvas.height;

const centerX = canvasWidth / 2;
const centerY = canvasHeight / 2;

const Shapes = [];

// Create shapes with optimized complexity for performance
Shapes[0] = new Cube({x: 200, y: 100, z: 300, w: 200, h: 200, d: 200, name: "back cube", subdivisions: 3});
Shapes[1] = new Sphere({x: 0, y: 0, z: 500, radius: 150, segments: 12, name: "front sphere"});

Shapes[0].color = { r: 255, g: 100, b: 100 };
Shapes[1].color = { r: 100, g: 100, b: 255 };

// Create tiled floor with optimized complexity
const tiledFloor = new TiledFloor(800, 15); // Reduced from 400, 20

// Set up all shapes
for (let v of Shapes) {
    v.setUp();
}

// Performance optimization variables
let lastCameraX = null;
let lastCameraZ = null;
let cachedTiles = [];
let frameCount = 0;

// Pre-allocate arrays to avoid garbage collection (increased capacity)
const projectedVertices = new Array(1000);
const worldVertices = new Array(1000);
const allTriangles = new Array(2000);
let triangleCount = 0;

// Camera setup
const camera = new Camera({x: 0, y: 0, z: -500});

// Optimized multi-light system setup
const lights = [];

// // Light 0: Main white light (moving)
// lights[0] = new Light({
//     x: 200,
//     y: -200,
//     z: 100,
//     color: { r: 255, g: 255, b: 255 },
//     intensity: 2,
//     radius: 1000, // Reduced from 60
//     type: 'point',
//     enabled: true
// });

// // Light 1: Red accent light (static)
// lights[1] = new Light({
//     x: -300,
//     y: -100,
//     z: 200,
//     color: { r: 255, g: 100, b: 100 },
//     intensity: 1,
//     radius: 900, // Reduced from 40
//     type: 'point',
//     enabled: true
// });

// // Light 2: Blue directional light (like sunlight)
// lights[0] = new Light({
//     x: 0, y: 0, z: 0, // Position doesn't matter for directional
//     color: { r: 150, g: 200, b: 255 },
//     intensity: 1,
//     type: 'directional',
//     enabled: true
// });
// lights[0].setDirection({ x: 0, y: 1, z: 0 });

// lights[1] = new Light({
//     x: 0, y: 0, z: 0, // Position doesn't matter for directional
//     color: { r: 150, g: 200, b: 255 },
//     intensity: 1,
//     type: 'directional',
//     enabled: true
// });
// lights[1].setDirection({ x: 1, y: 0, z: 0 });

// lights[2] = new Light({
//     x: 0, y: 0, z: 0, // Position doesn't matter for directional
//     color: { r: 150, g: 200, b: 255 },
//     intensity: 1,
//     type: 'directional',
//     enabled: true
// });
// lights[2].setDirection({ x: 1, y: 1, z: -0.5 });

// Light 3: Green spotlight
lights[0] = new Light({
    x: 0,
    y: -400,
    z: 300,
    color: { r: 100, g: 255, b: 100 },
    intensity: 10,
    radius: 900, // Reduced from 30
    type: 'spot',
    enabled: true
});
lights[0].setSpotlight(
    { x:0.3, y: -1, z: -0.3 },
    Math.PI / 2,
    0.2
);

// Animation and control variables
let time = 0;
let lightMovement = true;

// Optimized performance settings
const maxTrianglesPerFrame = 2000; // Reduced from 500
const tileUpdateFrequency = 5; // Increased from 5
const frustumCullingMargin = 0; // Reduced from 500

// Pre-calculate camera transformation matrices (reuse these)
let rotYMatrix_neg, rotXMatrix_pos;
let lastCameraRotationX = null;
let lastCameraRotationY = null;


const engine = () => {
    updateMovement();

    // Clear canvas with optimized method
    context.fillStyle = '#1a1a1a';
    context.fillRect(0, 0, canvasWidth, canvasHeight);

    time += 0.02;
    frameCount++;
    
    // Animate lights with optimized calculations
    // if (lightMovement) {
    //     const cosTime = Math.cos(time);
    //     const sinTime = Math.sin(time);
        
    //     // Move the main light in optimized pattern
    //     lights[0].x = cosTime * 300;
    //     lights[0].y = Math.sin(time * 1.2) * 150 - 200;
    //     lights[0].z = Math.sin(time * 0.8) * 200 + 150;
        
    //     // Rotate directional light less frequently
    //     if (frameCount % 3 === 0) {
    //         const dirAngle = time * 0.3;
    //         lights[2].setDirection({ 
    //             x: Math.cos(dirAngle), 
    //             y: 1, 
    //             z: Math.sin(dirAngle) * 0.5 
    //         });
    //     }
        
    //     // Oscillate spotlight intensity
    //     lights[3].intensity = 0.5 + sinTime * 0.3;
    // }

    // Optimized tiled floor updates
    const cameraMoved = Math.abs(camera.x - (lastCameraX || 0)) > 120 || 
                      Math.abs(camera.z - (lastCameraZ || 0)) > 120;
    
    if (frameCount % tileUpdateFrequency === 0 || cameraMoved) {
        tiledFloor.updateTiles(camera.x, camera.z);
        cachedTiles = tiledFloor.getTiles();
        
        // Batch setup new tiles and mark them as tiles
        for (let i = 0; i < cachedTiles.length; i++) {
            const tile = cachedTiles[i];
            if (!tile.Vertices.length) {
                tile.setUp();
            }
            // Mark as tile for lighting system
            tile.isTile = true;
        }
        
        lastCameraX = camera.x;
        lastCameraZ = camera.z;
    }

    // Create combined shapes array
    const allShapes = [...Shapes, ...cachedTiles];
    
    // Reset triangle counter
    triangleCount = 0;

    // Only recalculate transformation matrices if camera rotation changed
    if (camera.rotationX !== lastCameraRotationX || camera.rotationY !== lastCameraRotationY) {
        rotYMatrix_neg = rotYMatrix(-camera.rotationX);
        rotXMatrix_pos = rotXMatrix(camera.rotationY);
        lastCameraRotationX = camera.rotationX;
        lastCameraRotationY = camera.rotationY;
    }

    // Process all shapes with optimized loop
    const allShapesLength = allShapes.length;
    for (let shapeIndex = 0; shapeIndex < allShapesLength; shapeIndex++) {
        const shape = allShapes[shapeIndex];
        const vertices = shape.Vertices;
        const triangles = shape.Triangles;
        const verticesLength = vertices.length;
        const trianglesLength = triangles.length;

        // Transform all vertices for this shape (optimized)
        for (let v = 0; v < verticesLength; v++) {
            const vertex = vertices[v];
            
            // Inline translation
            const translatedX = vertex.x - camera.x;
            const translatedY = vertex.y - camera.y;
            const translatedZ = vertex.z - camera.z;

            // Apply rotations using cached matrices
            const rotated = MatrixTimesVector(rotXMatrix_pos, 
                           MatrixTimesVector(rotYMatrix_neg, {
                               x: translatedX,
                               y: translatedY, 
                               z: translatedZ
                           }));

            // Use optimized perspective calculation
            const projected2D = addPerspectiveOptimized(rotated, camera.fov);

            if (!projected2D) {
                projectedVertices[v] = null;
                worldVertices[v] = null;
                continue;
            }

            projected2D.z = rotated.z;
            projectedVertices[v] = projected2D;
            worldVertices[v] = vertex;
        }
        
        // Process triangles with optimized visibility checks
        for (let i = 0; i < trianglesLength; i++) {
            if (triangleCount >= maxTrianglesPerFrame) break;
            
            const t = triangles[i];
            const p1 = projectedVertices[t[0]];
            const p2 = projectedVertices[t[1]];
            const p3 = projectedVertices[t[2]];

            const w1 = worldVertices[t[0]];
            const w2 = worldVertices[t[1]];
            const w3 = worldVertices[t[2]];

            if (!p1 || !p2 || !p3 || !w1 || !w2 || !w3) continue;

            // Optimized visibility checks
            if (!isTriangleVisibleOptimized(p1, p2, p3)) continue;
            
            // Pass the shape to the face culling function for proper tile handling
            if (!isTriangleFacingCameraOptimized(p1, p2, p3, shape)) continue;

            // Optimized frustum culling
            const minX = Math.min(p1.x, p2.x, p3.x);
            if (minX > canvasWidth + frustumCullingMargin) continue;
            
            const maxX = Math.max(p1.x, p2.x, p3.x);
            if (maxX < -frustumCullingMargin) continue;
            
            const minY = Math.min(p1.y, p2.y, p3.y);
            if (minY > canvasHeight + frustumCullingMargin) continue;
            
            const maxY = Math.max(p1.y, p2.y, p3.y);
            if (maxY < -frustumCullingMargin) continue;

            // Calculate depth and normal only for visible triangles
            const avgZ = (p1.z + p2.z + p3.z) * 0.33333333; // Faster than /3
            
            // Calculate normal using optimized vector operations
            const edge1 = vectorSubtract(w2, w1);
            const edge2 = vectorSubtract(w3, w1);
            const normal = vectorNormalize(vectorCross(edge1, edge2));

            // Store in pre-allocated array
            allTriangles[triangleCount] = {
                vertices: [p1, p2, p3],
                worldVertices: [w1, w2, w3],
                normal: normal,
                avgZ: avgZ,
                shape: shape
            };
            triangleCount++;
        }
    }

    // Sort only the triangles we actually have
    const trianglesToSort = allTriangles.slice(0, triangleCount);
    trianglesToSort.sort((a, b) => b.avgZ - a.avgZ);

    // Render triangles with different methods for tiles vs regular shapes
    for (let i = 0; i < triangleCount; i++) {
        const triangle = trianglesToSort[i];
        const [p1, p2, p3] = triangle.vertices;
        const [w1, w2, w3] = triangle.worldVertices;
        
        // Check if this is a tile
        if (isTileShape(triangle.shape)) {
            // Use shadow-only rendering for tiles
            fillTriangleTileOptimized(
                p1, p2, p3, 
                triangle.normal, 
                w1, w2, w3, 
                lights, 
                triangle.shape.color || { r: 120, g: 120, b: 120 }, // Default tile color
                triangle.shape, 
                allShapes
            );
        } else {
            // Use full multi-light rendering for regular shapes
            fillTriangleMultiLight(
                p1, p2, p3, 
                triangle.normal, 
                w1, w2, w3, 
                lights, 
                triangle.shape.color, 
                triangle.shape, 
                allShapes
            );
        }
    }

    // Render lights using optimized function
    renderLights(lights, camera);

    render3DText(
        { x: Shapes[0].x, y: Shapes[0].y - 120, z: Shapes[0].z },
        "Back Cube",
        camera,
        {
            fontSize: 18,
            color: '#ff6666',
            backgroundColor: 'rgba(0,0,0,0.7)',
            fixedSize: true
        }
    );

    render3DText(
        { x: Shapes[1].x, y: Shapes[1].y - 180, z: Shapes[1].z },
        "Front Sphere", 
        camera,
        {
            fontSize: 18,
            color: '#6666ff',
            backgroundColor: 'rgba(0,0,0,0.7)',
            fixedSize: true
        }
    );

    // Main title
    renderUIText(10, 10, "Optimized Multi-Light 3D Rendering Demo (Fixed Tile Culling)", {
        fontSize: 20,
        color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 8
    });

    // Performance stats
    renderUIText(10, 45, `Triangles: ${triangleCount}`, {
        fontSize: 14,
        color: '#cccccc',
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 4
    });

    renderUIText(10, 70, `Shapes: ${allShapes.length} (${cachedTiles.length} tiles - no shadows)`, {
        fontSize: 14,
        color: '#66ff66',
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 4
    });

    renderUIText(10, 95, `Camera: (${Math.floor(camera.x)}, ${Math.floor(camera.y)}, ${Math.floor(camera.z)})`, {
        fontSize: 14,
        color: '#cccccc',
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 4
    });

    // Display light information
    let yOffset = 125;
    for (let i = 0; i < lights.length; i++) {
        const light = lights[i];
        if (!light.enabled) continue;
        
        const lightInfo = `L${i}: ${light.type} (${Math.floor(light.intensity * 100)}%)`;
        renderUIText(10, yOffset, lightInfo, {
            fontSize: 12,
            color: `rgb(${light.color.r}, ${light.color.g}, ${light.color.b})`,
            backgroundColor: 'rgba(0,0,0,0.6)',
            padding: 2
        });
        yOffset += 20;
    }

    // Controls (render less frequently)
    renderUIText(10, canvasHeight - 100, "Press 1-4 to toggle lights", {
        fontSize: 14,
        color: '#aaaaaa',
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 4
    });

    renderUIText(10, canvasHeight - 75, "Press L to toggle light movement", {
        fontSize: 14,
        color: '#aaaaaa',
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 4
    });

    renderUIText(10, canvasHeight - 50, "Tiles now visible from all directions!", {
        fontSize: 14,
        color: '#00ff00',
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 4
    });

    renderUIText(10, canvasHeight - 25, "Use WASD to move, Mouse to look around", {
        fontSize: 14,
        color: '#aaaaaa',
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 4
    });

    requestAnimationFrame(engine);
}

// Start the optimized engine
engine();