const canvas = document.getElementById('c');
const context = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const canvasWidth = canvas.width;
const canvasHeight = canvas.height;

const centerX = canvasWidth / 2;
const centerY = canvasHeight / 2;

const Shapes = [];

// Create shapes with configurable complexity
Shapes[0] = new Cube({x: 200, y: 100, z: 300, w: 200, h: 200, d: 200, name: "back cube", subdivisions: 4});
Shapes[1] = new Sphere({x: 0, y: 0, z: 500, radius: 150, segments: 15, name: "front sphere"});

Shapes[0].color = { r: 255, g: 100, b: 100 };
Shapes[1].color = { r: 100, g: 100, b: 255 };

// Create tiled floor with reasonable complexity
const tiledFloor = new TiledFloor(400, 20);

// Set up all shapes
for (let v of Shapes) {
    v.setUp();
}

// Performance optimization variables
let lastCameraX = null;
let lastCameraZ = null;
let cachedTiles = [];
let frameCount = 0;

// Pre-allocate arrays to avoid garbage collection
const projectedVertices = [];
const worldVertices = [];
const allTriangles = [];

// Camera setup
const camera = new Camera({x: 0, y: 0, z: -500});

// Multi-light system setup
const lights = [];

// Light 0: Main white light (moving)
lights[0] = new Light({
    x: 200,
    y: -200,
    z: 100,
    color: { r: 255, g: 255, b: 255 },
    intensity: 0.8,
    radius: 60,
    type: 'point'
});

// Light 1: Red accent light (static)
lights[1] = new Light({
    x: -300,
    y: -100,
    z: 200,
    color: { r: 255, g: 100, b: 100 },
    intensity: 0.6,
    radius: 40,
    type: 'point'
});

// Light 2: Blue directional light (like sunlight)
lights[2] = new Light({
    x: 0, y: 0, z: 0, // Position doesn't matter for directional
    color: { r: 150, g: 200, b: 255 },
    intensity: 0.4,
    type: 'directional'
});
lights[2].setDirection({ x: 1, y: 1, z: -0.5 }); // Direction vector

// Light 3: Green spotlight
lights[3] = new Light({
    x: 0,
    y: -400,
    z: 300,
    color: { r: 100, g: 255, b: 100 },
    intensity: 0.7,
    radius: 30,
    type: 'spot'
});
lights[3].setSpotlight(
    { x: 0, y: 1, z: -0.3 }, // Direction (pointing down and slightly forward)
    Math.PI / 4, // 45 degree cone
    2.0 // Falloff exponent
);

// Animation and control variables
let time = 0;
let lightMovement = true;

// Performance settings
const maxTrianglesPerFrame = 500;
const tileUpdateFrequency = 5; // Update tiles every N frames
const uiUpdateFrequency = 10; // Update UI every N frames

const engine = () => {
    updateMovement();

    // Clear canvas
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    context.fillStyle = '#1a1a1a';
    context.fillRect(0, 0, canvasWidth, canvasHeight);

    time += 0.02;
    frameCount++;
    
    // Animate lights
    if (lightMovement) {
        // Move the main light in a circle
        lights[0].x = Math.cos(time) * 300;
        lights[0].y = Math.sin(time * 1.2) * 150 - 200;
        lights[0].z = Math.sin(time * 0.8) * 200 + 150;
        
        // Slowly rotate the directional light
        const dirAngle = time * 0.3;
        lights[2].setDirection({ 
            x: Math.cos(dirAngle), 
            y: 1, 
            z: Math.sin(dirAngle) * 0.5 
        });
        
        // Oscillate spotlight intensity
        lights[3].intensity = 0.5 + Math.sin(time * 2) * 0.3;
    }

    // Update tiled floor (performance optimized)
    const cameraMoved = Math.abs(camera.x - (lastCameraX || 0)) > 100 || 
                      Math.abs(camera.z - (lastCameraZ || 0)) > 100;
    
    if (frameCount % tileUpdateFrequency === 0 || cameraMoved) {
        tiledFloor.updateTiles(camera.x, camera.z);
        cachedTiles = tiledFloor.getTiles();
        
        // Set up new tiles only
        cachedTiles.forEach(tile => {
            if (!tile.Vertices.length) {
                tile.setUp();
            }
        });
        
        lastCameraX = camera.x;
        lastCameraZ = camera.z;
    }

    // Create combined shapes array (main shapes + floor tiles)
    const allShapes = [...Shapes, ...cachedTiles];
    
    // Clear triangle array (reuse existing array)
    allTriangles.length = 0;

    // Pre-calculate camera transformation matrices
    const rotYMatrix_neg = rotYMatrix(-camera.rotationX);
    const rotXMatrix_pos = rotXMatrix(camera.rotationY);

    // Process all shapes
    for (let shapeIndex = 0; shapeIndex < allShapes.length; shapeIndex++) {
        const shape = allShapes[shapeIndex];
        
        // Clear and reuse arrays
        projectedVertices.length = 0;
        worldVertices.length = 0;

        // Transform all vertices for this shape
        for (let v of shape.Vertices) {
            const translated = {
                x: v.x - camera.x,
                y: v.y - camera.y,
                z: v.z - camera.z
            };

            const rotated = MatrixTimesVector(rotXMatrix_pos, 
                           MatrixTimesVector(rotYMatrix_neg, translated));

            const projected2D = addPerspective(rotated, camera.fov);

            if (!projected2D) {
                projectedVertices.push(null);
                worldVertices.push(null);
                continue;
            }

            projected2D.z = rotated.z;
            projectedVertices.push(projected2D);
            worldVertices.push(v);
        }
        
        // Process triangles for this shape
        for (let i = 0; i < shape.Triangles.length; i++) {
            const t = shape.Triangles[i];
            const p1 = projectedVertices[t[0]];
            const p2 = projectedVertices[t[1]];
            const p3 = projectedVertices[t[2]];

            const w1 = worldVertices[t[0]];
            const w2 = worldVertices[t[1]];
            const w3 = worldVertices[t[2]];

            if (!p1 || !p2 || !p3 || !w1 || !w2 || !w3) continue;

            // Quick visibility check first (cheapest)
            const avgZ = (p1.z + p2.z + p3.z) / 3;
            if (avgZ <= 0 || avgZ >= 5000) continue;

            // Enhanced visibility checks
            if (!isTriangleVisible(p1, p2, p3)) continue;

            // Basic frustum culling
            const minX = Math.min(p1.x, p2.x, p3.x);
            const maxX = Math.max(p1.x, p2.x, p3.x);
            const minY = Math.min(p1.y, p2.y, p3.y);
            const maxY = Math.max(p1.y, p2.y, p3.y);
            
            if (maxX < -500 || minX > canvasWidth + 500 || 
                maxY < -500 || minY > canvasHeight + 500) {
                continue;
            }

            // Enhanced backface culling check
            if (!isTriangleFacingCamera(p1, p2, p3, [w1, w2, w3], camera)) continue;

            // Calculate normal only for visible triangles
            const edge1 = vectorSubtract(w2, w1);
            const edge2 = vectorSubtract(w3, w1);
            const normal = vectorNormalize(vectorCross(edge1, edge2));

            allTriangles.push({
                vertices: [p1, p2, p3],
                worldVertices: [w1, w2, w3],
                normal: normal,
                avgZ: avgZ,
                shape: shape
            });
        }
    }

    // Sort triangles by depth
    allTriangles.sort((a, b) => b.avgZ - a.avgZ);

    // Limit number of triangles rendered per frame for consistent performance
    const maxTriangles = Math.min(allTriangles.length, maxTrianglesPerFrame);

    // Render triangles with multi-light support
    for (let i = 0; i < maxTriangles; i++) {
        const triangle = allTriangles[i];
        const [p1, p2, p3] = triangle.vertices;
        const [w1, w2, w3] = triangle.worldVertices;
        
        // Use multi-light rendering if available, fallback to single light
        if (typeof fillTriangleMultiLight === 'function') {
            fillTriangleMultiLight(p1, p2, p3, triangle.normal, w1, w2, w3, lights, triangle.shape.color, triangle.shape, allShapes);
        } else {
            // Fallback to single light (use the first enabled light)
            const primaryLight = lights.find(light => light.enabled !== false) || lights[0];
            fillTriangle(p1, p2, p3, triangle.normal, w1, w2, w3, primaryLight, triangle.shape.color, triangle.shape, allShapes);
        }
    }

    // Render all lights
    if (typeof renderLights === 'function') {
        renderLights(lights, camera);
    } else {
        // Fallback: render lights manually
        for (let light of lights) {
            if (light.enabled === false) continue;
            
            const lightTransformed = {
                x: light.x - camera.x,
                y: light.y - camera.y,
                z: light.z - camera.z
            };
            
            const lightRotated = MatrixTimesVector(rotXMatrix_pos, 
                                MatrixTimesVector(rotYMatrix_neg, lightTransformed));
            const lightProjected = addPerspective(lightRotated, camera.fov);
            
            if (lightProjected && lightProjected.z > 0) {
                const lightColor = `rgb(${light.color.r}, ${light.color.g}, ${light.color.b})`;
                context.fillStyle = lightColor;
                context.beginPath();
                context.arc(lightProjected.x, lightProjected.y, 8, 0, Math.PI * 2);
                context.fill();
            }
        }
    }

    // Render 3D floating text labels for main shapes
    if (typeof renderFloatingText === 'function') {
        renderFloatingText(Shapes[0], "Back Cube", camera, {
            fontSize: 20,
            color: '#ff6666',
            backgroundColor: 'rgba(0,0,0,0.7)',
            fixedSize: true,
            floatHeight: 120
        });

        renderFloatingText(Shapes[1], "Front Sphere", camera, {
            fontSize: 20,
            color: '#6666ff',
            backgroundColor: 'rgba(0,0,0,0.7)',
            fixedSize: true,
            floatHeight: 180
        });
    }

    // Main title
    renderUIText(10, 10, "Combined Multi-Light 3D Rendering Demo", {
        fontSize: 20,
        color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 8
    });

    // Performance stats
    renderUIText(10, 45, `Triangles: ${Math.min(allTriangles.length, maxTriangles)}/${allTriangles.length}`, {
        fontSize: 14,
        color: '#cccccc',
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 4
    });

    renderUIText(10, 70, `Shapes: ${allShapes.length} (${cachedTiles.length} tiles)`, {
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
        if (light.enabled === false) continue;
        
        const lightInfo = `L${i}: ${light.type} (${Math.floor(light.intensity * 100)}%)`;
        renderUIText(10, yOffset, lightInfo, {
            fontSize: 12,
            color: `rgb(${light.color.r}, ${light.color.g}, ${light.color.b})`,
            backgroundColor: 'rgba(0,0,0,0.6)',
            padding: 2
        });
        yOffset += 20;
    }

    // Controls
    renderUIText(10, canvasHeight - 75, "Press 1-4 to toggle lights", {
        fontSize: 14,
        color: '#aaaaaa',
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 4
    });

    renderUIText(10, canvasHeight - 50, "Press L to toggle light movement", {
        fontSize: 14,
        color: '#aaaaaa',
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

// Start the engine
engine();