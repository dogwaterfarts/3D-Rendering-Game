const canvas = document.getElementById('c');
const context = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const canvasWidth = canvas.width;
const canvasHeight = canvas.height;
const centerX = canvasWidth / 2;
const centerY = canvasHeight / 2;

// Create shapes
const Shapes = [
    new Cube({x: 200, y: 100, z: 300, w: 200, h: 200, d: 200, name: "back cube", subdivisions: 3}),
    new Sphere({x: 0, y: 0, z: 500, radius: 150, segments: 30, name: "front sphere"}),
    new Cylinder({x: 900, y: -50, z: 950, radius: 50, height: 250, segments: 10, name: "cylinder", capBottom: true, capTop: true}),
    new Wedge({x: 700, y: -150, z: 300, height: 50, depth: 200, name: "wedge", subdivisions: 4}),
    // new Pyramid({x: 600, y: -50, z: -400, radius: 200, height: 250, segments: 10, isCone: true, name: "cone", capBottom: true}),
    // MarketStand.createFruitStand({x: 600, y: -150, z: -400, height: 400, width: 250, depth: 200})
];

Shapes[0].color = { r: 255, g: 100, b: 100 };
Shapes[1].color = { r: 100, g: 100, b: 255 };
Shapes[2].color = { r: 100, g: 100, b: 100 };
Shapes[3].color = { r: 200, g: 100, b: 200 };
// Shapes[4].color = { r: 250, g: 180, b: 200 };

// Create tiled floor
const tiledFloor = new TiledFloor(800, 15);

// Set up shapes
Shapes.forEach(shape => shape.setUp());

// Create proximity prompt manager
const promptManager = new ProximityPromptManager();

// Add prompts to existing shapes
const cubePrompt = promptManager.addPrompt(new ProximityPrompt({
    object: Shapes[0], // back cube
    promptText: "Inspect Cube",
    holdDuration: 1500,
    activationDistance: 200,
    progressColor: '#ff6666',
    onActivate: () => {
        console.log("Cube inspected!");
        // Change cube color when activated
        Shapes[0].color = { 
            r: Math.random() * 255, 
            g: Math.random() * 100 + 100, 
            b: Math.random() * 100 + 100 
        };
    },
    onHoldStart: () => {
        console.log("Started inspecting cube...");
    },
    onHoldEnd: () => {
        console.log("Stopped inspecting cube");
    }
}));

const spherePrompt = promptManager.addPrompt(new ProximityPrompt({
    object: Shapes[1], // front sphere
    promptText: "Touch Sphere",
    holdDuration: 1000,
    activationDistance: 240,
    progressColor: '#6666ff',
    onActivate: () => {
        console.log("Sphere touched!");
        // Change sphere color and add a light effect
        Shapes[1].color = { 
            r: Math.random() * 100 + 100, 
            g: Math.random() * 100 + 100, 
            b: Math.random() * 255 
        };
        
        // Temporarily boost a light's intensity
        if (lights[1]) {
            lights[1].intensity = 2.0;
            setTimeout(() => {
                lights[1].intensity = 1.2;
            }, 500);
        }
    },
    onHoldStart: () => {
        console.log("Started touching sphere...");
    }
}));

// Create a static interaction point
const staticInteractionPoint = {
    x: -300,
    y: 0,
    z: 200
};

const staticPrompt = promptManager.addPrompt(new ProximityPrompt({
    position: staticInteractionPoint,
    promptText: "Mysterious Point",
    holdDuration: 2000,
    activationDistance: 150,
    progressColor: '#ffff00',
    backgroundColor: 'rgba(50, 0, 50, 0.9)',
    textColor: '#ffff66',
    onActivate: () => {
        console.log("Mystery activated!");
        // Toggle light movement
        lightMovement = !lightMovement;
        console.log(`Light movement ${lightMovement ? 'enabled' : 'disabled'}`);
    }
}));

// Performance optimization variables
let lastCameraX = null;
let lastCameraZ = null;
let cachedTiles = [];
let frameCount = 0;

// Pre-allocated arrays
const projectedVertices = new Array(1000);
const worldVertices = new Array(1000);
const allTriangles = new Array(2000);
let triangleCount = 0;

// Camera and lighting
const camera = new Camera({x: 0, y: 0, z: -500});
const lights = [
    new Light({
        x: 200, y: -200, z: 100,
        color: { r: 255, g: 255, b: 255 },
        intensity: 1.5, type: 'point', enabled: true
    }),
    new Light({
        x: -300, y: -100, z: 200,
        color: { r: 255, g: 100, b: 100 },
        intensity: 1.2, type: 'point', enabled: true
    }),
    new Light({
        x: 100, y: -300, z: 400,
        color: { r: 100, g: 150, b: 255 },
        intensity: 1.0, type: 'point', enabled: true
    }),
    new Light({
        x: 0, y: -150, z: 200,
        color: { r: 100, g: 255, b: 100 },
        intensity: 0.8, type: 'point', enabled: true
    })
];

// Animation variables
let time = 0;
let lightMovement = true;

// Performance settings
const maxTrianglesPerFrame = 10000;
const tileUpdateFrequency = 5;

// Cached transformation matrices
let rotYMatrix_neg, rotXMatrix_pos;
let lastCameraRotationX = null;
let lastCameraRotationY = null;

const engine = () => {
    updateMovement();

    // Update and render proximity prompts FIRST
    promptManager.update(camera, 16); // 16ms for ~60fps

    // Clear canvas
    context.fillStyle = '#1a1a1a';
    context.fillRect(0, 0, canvasWidth, canvasHeight);

    time += 0.02;
    frameCount++;
    
    // Animate lights
    if (lightMovement) {
        const cosTime = Math.cos(time);
        const sinTime = Math.sin(time);
        
        // Light animations
        lights[0].x = cosTime * 300;
        lights[0].y = Math.sin(time * 1.2) * 150 - 200;
        lights[0].z = Math.sin(time * 0.8) * 200 + 150;
        
        lights[2].y = -300 + Math.sin(time * 2) * 100;
        
        lights[3].x = Math.cos(time * 0.5) * 250;
        lights[3].z = Math.sin(time * 0.5) * 250 + 200;
        
        // Vary intensities
        lights[0].intensity = 1.0 + sinTime * 0.5;
        lights[2].intensity = 0.8 + cosTime * 0.4;
        lights[3].intensity = 0.6 + Math.sin(time * 1.5) * 0.3;
    }

    // Update tiled floor
    const cameraMoved = Math.abs(camera.x - (lastCameraX || 0)) > 120 || 
                      Math.abs(camera.z - (lastCameraZ || 0)) > 120;
    
    if (frameCount % tileUpdateFrequency === 0 || cameraMoved) {
        tiledFloor.updateTiles(camera.x, camera.z);
        cachedTiles = tiledFloor.getTiles();
        
        // Setup new tiles
        cachedTiles.forEach(tile => {
            if (!tile.Vertices.length) tile.setUp();
            tile.isTile = true;
        });
        
        lastCameraX = camera.x;
        lastCameraZ = camera.z;
    }

    const allShapes = [...Shapes, ...cachedTiles];
    triangleCount = 0;

    // Update transformation matrices if camera rotated
    if (camera.rotationX !== lastCameraRotationX || camera.rotationY !== lastCameraRotationY) {
        rotYMatrix_neg = rotYMatrix(-camera.rotationX);
        rotXMatrix_pos = rotXMatrix(camera.rotationY);
        lastCameraRotationX = camera.rotationX;
        lastCameraRotationY = camera.rotationY;
    }

    // Process all shapes
    allShapes.forEach(shape => {
        const vertices = shape.Vertices;
        const triangles = shape.Triangles;

        // Transform vertices
        vertices.forEach((vertex, v) => {
            const translatedX = vertex.x - camera.x;
            const translatedY = vertex.y - camera.y;
            const translatedZ = vertex.z - camera.z;

            const rotated = MatrixTimesVector(rotXMatrix_pos, 
                           MatrixTimesVector(rotYMatrix_neg, {
                               x: translatedX,
                               y: translatedY, 
                               z: translatedZ
                           }));

            const projected2D = addPerspective(rotated, camera.fov);

            if (projected2D) {
                projected2D.z = rotated.z;
                projectedVertices[v] = projected2D;
                worldVertices[v] = vertex;
            } else {
                projectedVertices[v] = null;
                worldVertices[v] = null;
            }
        });
        
        // Process triangles
        triangles.forEach(t => {
            if (triangleCount >= maxTrianglesPerFrame) return;
            
            const p1 = projectedVertices[t[0]];
            const p2 = projectedVertices[t[1]];
            const p3 = projectedVertices[t[2]];
            const w1 = worldVertices[t[0]];
            const w2 = worldVertices[t[1]];
            const w3 = worldVertices[t[2]];

            if (!p1 || !p2 || !p3 || !w1 || !w2 || !w3) return;

            // Visibility and culling checks
            if (!isTriangleVisible(p1, p2, p3)) return;
            if (!isTriangleFacingCamera(p1, p2, p3)) return;

            // Frustum culling
            const minX = Math.min(p1.x, p2.x, p3.x);
            const maxX = Math.max(p1.x, p2.x, p3.x);
            const minY = Math.min(p1.y, p2.y, p3.y);
            const maxY = Math.max(p1.y, p2.y, p3.y);
            
            if (minX > canvasWidth || maxX < 0 || minY > canvasHeight || maxY < 0) return;

            // Calculate depth and normal
            const avgZ = (p1.z + p2.z + p3.z) * 0.33333333;
            const edge1 = vectorSubtract(w2, w1);
            const edge2 = vectorSubtract(w3, w1);
            const normal = vectorNormalize(vectorCross(edge1, edge2));

            allTriangles[triangleCount] = {
                vertices: [p1, p2, p3],
                worldVertices: [w1, w2, w3],
                normal: normal,
                avgZ: avgZ,
                shape: shape
            };
            triangleCount++;
        });
    });

    // Sort and render triangles
    const trianglesToSort = allTriangles.slice(0, triangleCount);
    trianglesToSort.sort((a, b) => b.avgZ - a.avgZ);

    trianglesToSort.forEach(triangle => {
        const [p1, p2, p3] = triangle.vertices;
        const [w1, w2, w3] = triangle.worldVertices;
        
        fillTriangleMultiLight(
            p1, p2, p3, 
            triangle.normal, 
            w1, w2, w3, 
            lights,
            triangle.shape.color, 
            triangle.shape
        );
    });

    // Render lights and UI
    renderLights(lights, camera);

    // 3D text labels
    render3DText(
        { x: Shapes[0].x, y: Shapes[0].y - 120, z: Shapes[0].z },
        "Back Cube", camera,
        { fontSize: 18, color: '#ff6666', backgroundColor: 'rgba(0,0,0,0.7)' }
    );

    render3DText(
        { x: Shapes[1].x, y: Shapes[1].y - 180, z: Shapes[1].z },
        "Front Sphere", camera,
        { fontSize: 18, color: '#6666ff', backgroundColor: 'rgba(0,0,0,0.7)' }
    );

    // Render static interaction point as a small indicator
    render3DText(
        staticInteractionPoint,
        "●", camera,
        { fontSize: 24, color: '#ffff66', backgroundColor: 'rgba(50,0,50,0.8)' }
    );

    // RENDER PROXIMITY PROMPTS HERE (after 3D content, before UI)
    promptManager.render(camera, context, canvasWidth, canvasHeight);

    // UI Information
    renderUIText(10, 10, "3D Point Light Rendering with Proximity Prompts", {
        fontSize: 20, color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.8)', padding: 8
    });

    renderUIText(10, 45, `Triangles: ${triangleCount}`, {
        fontSize: 14, color: '#cccccc', backgroundColor: 'rgba(0,0,0,0.6)', padding: 4
    });

    renderUIText(10, 70, `Shapes: ${allShapes.length} (${cachedTiles.length} tiles)`, {
        fontSize: 14, color: '#66ff66', backgroundColor: 'rgba(0,0,0,0.6)', padding: 4
    });

    renderUIText(10, 95, `Camera: (${Math.floor(camera.x)}, ${Math.floor(camera.y)}, ${Math.floor(camera.z)})`, {
        fontSize: 14, color: '#cccccc', backgroundColor: 'rgba(0,0,0,0.6)', padding: 4
    });

    // Active prompts information
    const activePrompts = promptManager.getActivePrompts();
    if (activePrompts.length > 0) {
        renderUIText(10, 120, `Active Prompts: ${activePrompts.length}`, {
            fontSize: 14, color: '#ffff66', backgroundColor: 'rgba(0,0,0,0.6)', padding: 4
        });
        
        // Debug: Show distances to prompts
        activePrompts.forEach((prompt, i) => {
            renderUIText(10, 145 + i * 20, `${prompt.promptText}: ${Math.floor(prompt.lastDistance)}px`, {
                fontSize: 12, color: '#ffaaaa', backgroundColor: 'rgba(0,0,0,0.6)', padding: 2
            });
        });
    }

    // Light information
    let yOffset = 125 + (activePrompts.length * 20);
    let activePointLights = 0;
    lights.forEach((light, i) => {
        if (!light.enabled || light.type !== 'point') return;
        
        activePointLights++;
        renderUIText(10, yOffset, `Point Light ${i}: Intensity ${Math.floor(light.intensity * 100)}%`, {
            fontSize: 12, color: `rgb(${light.color.r}, ${light.color.g}, ${light.color.b})`,
            backgroundColor: 'rgba(0,0,0,0.6)', padding: 2
        });
        yOffset += 20;
    });

    renderUIText(10, yOffset + 10, `Active Point Lights: ${activePointLights}`, {
        fontSize: 14, color: '#ffff66', backgroundColor: 'rgba(0,0,0,0.6)', padding: 4
    });

    renderUIText(canvasWidth - 200, 10, `Money: ${playerStats.Money}`, {
        fontSize: 20, color: 'rgba(0, 255, 55, 0.84)', backgroundColor: 'rgba(0, 0, 0, 0.6)', padding: 5
    });


    // Controls
    const controls = [
        "Press 1-4 to toggle lights",
        "Press L to toggle light movement", 
        "Use WASD to move, Mouse to look around",
        "Hold E near objects to interact"
    ];
    
    controls.forEach((control, i) => {
        renderUIText(10, canvasHeight - 100 + (i * 25), control, {
            fontSize: 14, color: '#aaaaaa', backgroundColor: 'rgba(0,0,0,0.6)', padding: 4
        });
    });

    requestAnimationFrame(engine);
}

// Debug function to test proximity prompts
function debugProximityPrompts() {
    console.log("=== Proximity Prompt Debug ===");
    console.log("Total prompts:", promptManager.getPrompts().length);
    console.log("Active prompts:", promptManager.getActivePrompts().length);
    console.log("Camera position:", camera.x, camera.y, camera.z);
    
    promptManager.getPrompts().forEach((prompt, i) => {
        console.log(`Prompt ${i}:`, {
            text: prompt.promptText,
            position: prompt.position,
            distance: prompt.lastDistance,
            activationDistance: prompt.activationDistance,
            isVisible: prompt.isVisible,
            enabled: prompt.enabled
        });
    });
}

// Add debug key (press P to debug)
document.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() === 'p') {
        debugProximityPrompts();
    }
});

engine();