const canvas = document.getElementById('c');
const context = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const canvasWidth = canvas.width;
const canvasHeight = canvas.height;

const centerX = canvasWidth / 2;
const centerY = canvasHeight / 2;

const Shapes = [];

Shapes[0] = new Cube({x: 200, y: 100, z: 300, w: 200, h: 200, d: 200, name: "back cube", subdivisions: 2});
// Replace the floor cube with a proper plane
// Shapes[1] = new Plane({
//     x: 0, y: 120, z: 0, 
//     width: 2000, height: 2000, 
//     name: "Floor", 
//     subdivisions: 12, 
//     orientation: "horizontal"
// });
Shapes[1] = new Cube({x: 0, y: 120, z: 0, w: 3000, h: 0, d: 3000, name: "floor", subdivisions: 15});
Shapes[2] = new Sphere({x: 0, y: 0, z: 100, radius: 150, segments: 15, name: "front sphere"});

Shapes[0].color = { r: 255, g: 100, b: 100 };
Shapes[1].color = { r: 100, g: 255, b: 100 };
Shapes[2].color = { r: 100, g: 100, b: 255 };

for (let v of Shapes) {
    v.setUp();
}

const camera = new Camera({x: 0, y: 0, z: -500});

let light = new Light({
    x: centerX + 200,
    y: centerY + 300,
    z: 100,
    color: { r: 255, g: 255, b: 255 },
    intensity: 1
});

let time = 0;
let lightMovement = true;


const engine = () => {
    updateMovement();

    context.clearRect(0, 0, canvasWidth, canvasHeight);
    context.fillStyle = '#1a1a1a';
    context.fillRect(0, 0, canvasWidth, canvasHeight);

    time += 0.02;
    
    // if (lightMovement) {
    //     light.x = Math.cos(time) * 400;
    //     light.y = Math.sin(time * 1.3) * 200 - 200;
    //     light.z = Math.sin(time * 0.7) * 300 + 200;
    // }

    let shapesWithDepth = [];

    for (let shape of Shapes) {
        let projected = [];
        let worldVertices = [];
        let totalDepth = 0;
        let validVertices = 0;

        for (let v of shape.Vertices) {
            let translated = new Vertex(
                v.x - camera.x,
                v.y - camera.y,
                v.z - camera.z
            );

            let rotated = MatrixTimesVector(rotYMatrix(-camera.rotationX), translated);
            rotated = MatrixTimesVector(rotXMatrix(camera.rotationY), rotated);

            let projected2D = addPerspective(rotated, camera.fov);

            if (!projected2D) {
                projected.push(null);
                worldVertices.push(null);
                continue;
            }

            projected2D.z = rotated.z;
            projected.push(projected2D);
            worldVertices.push(v);
            
            totalDepth += rotated.z;
            validVertices++;
        }

        const avgShapeDepth = validVertices > 0 ? totalDepth / validVertices : 0;

        let trianglesWithDepth = [];
        
        for (let i = 0; i < shape.Triangles.length; i++) {
            const t = shape.Triangles[i];
            const p1 = projected[t[0]];
            const p2 = projected[t[1]];
            const p3 = projected[t[2]];

            const w1 = worldVertices[t[0]];
            const w2 = worldVertices[t[1]];
            const w3 = worldVertices[t[2]];

            if (!p1 || !p2 || !p3 || !w1 || !w2 || !w3) continue;

            // Improved visibility check
            if (!isTriangleVisible(p1, p2, p3)) continue;

            const edge1 = vectorSubtract(w2, w1);
            const edge2 = vectorSubtract(w3, w1);
            const normal = vectorNormalize(vectorCross(edge1, edge2));

            const avgTriangleDepth = (p1.z + p2.z + p3.z) / 3;

            // Increased max depth for better far plane visibility
            if (avgTriangleDepth >= 5000) continue;

            // Improved backface culling
            if (isTriangleFacingCamera(p1, p2, p3, [w1, w2, w3], camera)) {
                trianglesWithDepth.push({
                    vertices: [p1, p2, p3],
                    worldVertices: [w1, w2, w3],
                    normal: normal,
                    avgZ: avgTriangleDepth
                });
            }
        }

        trianglesWithDepth.sort((a, b) => b.avgZ - a.avgZ);

        shapesWithDepth.push({
            shape: shape,
            triangles: trianglesWithDepth,
            avgDepth: avgShapeDepth
        });
    }

    shapesWithDepth.sort((a, b) => b.avgDepth - a.avgDepth);

    for (let shapeData of shapesWithDepth) {
        const shape = shapeData.shape;
        const triangles = shapeData.triangles;

        for (let triangle of triangles) {
            const [p1, p2, p3] = triangle.vertices;
            const [w1, w2, w3] = triangle.worldVertices;
            
            fillTriangle(p1, p2, p3, triangle.normal, w1, w2, w3, light, shape.color, shape, Shapes);
        }
    }

    // Render the light
    const lightTransformed = {
        x: light.x - camera.x,
        y: light.y - camera.y,
        z: light.z - camera.z
    };
    
    let lightRotated = MatrixTimesVector(rotYMatrix(-camera.rotationX), lightTransformed);
    lightRotated = MatrixTimesVector(rotXMatrix(camera.rotationY), lightRotated);
    
    const lightProjected = addPerspective(lightRotated, camera.fov);
    
    if (lightProjected && lightProjected.z > 0) {
        context.fillStyle = 'yellow';
        context.beginPath();
        context.arc(lightProjected.x, lightProjected.y, 8, 0, Math.PI * 2);
        context.fill();
    }

    // Render 3D text labels for each shape
    renderFloatingText(Shapes[0], "Back Cube", camera, {
        fontSize: 20,
        color: '#ff6666',
        backgroundColor: 'rgba(0,0,0,0.7)',
        fixedSize: true,
        floatHeight: 120
    });

    renderFloatingText(Shapes[2], "Front Sphere", camera, {
        fontSize: 20,
        color: '#6666ff',
        backgroundColor: 'rgba(0,0,0,0.7)',
        fixedSize: true,
        floatHeight: 180
    });

    // Render UI text
    renderUIText(10, 10, "3D Plane Rendering Demo", {
        fontSize: 20,
        color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 8
    });

    renderUIText(10, 45, `Camera: (${Math.floor(camera.x)}, ${Math.floor(camera.y)}, ${Math.floor(camera.z)})`, {
        fontSize: 20,
        color: '#cccccc',
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 4
    });

    renderUIText(10, 70, `Light: (${Math.floor(light.x)}, ${Math.floor(light.y)}, ${Math.floor(light.z)})`, {
        fontSize: 20,
        color: '#ffff66',
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 4
    });

    renderUIText(10, canvasHeight - 25, "Use WASD to move, Mouse to look around", {
        fontSize: 20,
        color: '#aaaaaa',
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 4
    });

    requestAnimationFrame(engine);
}

engine();