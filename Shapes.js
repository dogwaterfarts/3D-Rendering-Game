class Vertex {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

class Cube {
    constructor({x, y, z, h = 100, w = 100, d = 100, name = "cube", color = { r: 100, g: 150, b: 200 }, subdivisions = 2}) {
        this.name = name;
        this.color = color;
        this.subdivisions = subdivisions;

        this.x = x;
        this.y = y;
        this.z = z;

        this.w = w/2;
        this.h = h/2;
        this.d = d/2;

        this.Vertices = [];
        this.Triangles = [];
    }

    setUp() {
        this.Vertices = [];
        this.Triangles = [];
        
        const x = this.x;
        const y = this.y;
        const z = this.z;
        const w = this.w;
        const h = this.h;
        const d = this.d;
        const sub = this.subdivisions;

        this.generateFace(x, y, z, w, h, d, sub);
    }

    generateFace(x, y, z, w, h, d, sub) {
        let vertexIndex = 0;

        // Front face
        const frontStart = vertexIndex;
        for (let i = 0; i <= sub; i++) {
            for (let j = 0; j <= sub; j++) {
                const px = -w + x + (2 * w * j) / sub;
                const py = -h + y + (2 * h * i) / sub;
                const pz = -d + z;
                this.Vertices.push(new Vertex(px, py, pz));
                vertexIndex++;
            }
        }
        this.generateFaceTriangles(frontStart, sub, true);

        // Back face
        const backStart = vertexIndex;
        for (let i = 0; i <= sub; i++) {
            for (let j = 0; j <= sub; j++) {
                const px = w + x - (2 * w * j) / sub;
                const py = -h + y + (2 * h * i) / sub;
                const pz = d + z;
                this.Vertices.push(new Vertex(px, py, pz));
                vertexIndex++;
            }
        }
        this.generateFaceTriangles(backStart, sub, true);

        // Left face
        const leftStart = vertexIndex;
        for (let i = 0; i <= sub; i++) {
            for (let j = 0; j <= sub; j++) {
                const px = -w + x;
                const py = -h + y + (2 * h * i) / sub;
                const pz = d + z - (2 * d * j) / sub;
                this.Vertices.push(new Vertex(px, py, pz));
                vertexIndex++;
            }
        }
        this.generateFaceTriangles(leftStart, sub, true);

        // Right face
        const rightStart = vertexIndex;
        for (let i = 0; i <= sub; i++) {
            for (let j = 0; j <= sub; j++) {
                const px = w + x;
                const py = -h + y + (2 * h * i) / sub;
                const pz = -d + z + (2 * d * j) / sub;
                this.Vertices.push(new Vertex(px, py, pz));
                vertexIndex++;
            }
        }
        this.generateFaceTriangles(rightStart, sub, true);

        // Bottom face
        const bottomStart = vertexIndex;
        for (let i = 0; i <= sub; i++) {
            for (let j = 0; j <= sub; j++) {
                const px = -w + x + (2 * w * j) / sub;
                const py = -h + y;
                const pz = d + z - (2 * d * i) / sub;
                this.Vertices.push(new Vertex(px, py, pz));
                vertexIndex++;
            }
        }
        this.generateFaceTriangles(bottomStart, sub, true);

        // Top face
        const topStart = vertexIndex;
        for (let i = 0; i <= sub; i++) {
            for (let j = 0; j <= sub; j++) {
                const px = -w + x + (2 * w * j) / sub;
                const py = h + y;
                const pz = -d + z + (2 * d * i) / sub;
                this.Vertices.push(new Vertex(px, py, pz));
                vertexIndex++;
            }
        }
        this.generateFaceTriangles(topStart, sub, true);
    }

    generateFaceTriangles(startIndex, sub, clockwise = false) {
        for (let i = 0; i < sub; i++) {
            for (let j = 0; j < sub; j++) {
                const topLeft = startIndex + i * (sub + 1) + j;
                const topRight = topLeft + 1;
                const bottomLeft = topLeft + (sub + 1);
                const bottomRight = bottomLeft + 1;

                if (clockwise) {
                    this.Triangles.push([topLeft, topRight, bottomLeft]);
                    this.Triangles.push([topRight, bottomRight, bottomLeft]);
                } else {
                    this.Triangles.push([topLeft, bottomLeft, topRight]);
                    this.Triangles.push([topRight, bottomLeft, bottomRight]);
                }
            }
        }
    }
}

class Sphere {
    constructor({x, y, z, radius, segments, name = "sphere", color = { r: 100, g: 150, b: 200 }}) {
        this.name = name;
        this.color = color;
        
        this.radius = radius;
        this.segments = segments;

        this.x = x;
        this.y = y;
        this.z = z;

        this.Vertices = [];
        this.Triangles = [];
    }

    setUp() {
        for (let i = 0; i <= this.segments; i++) {
            const theta = i * Math.PI / this.segments;

            for (let j = 0; j <= this.segments; j++) {
                const phi = 2 * j * Math.PI / this.segments;

                const x = this.radius * Math.sin(theta) * Math.cos(phi);
                const y = this.radius * Math.sin(theta) * Math.sin(phi);
                const z = this.radius * Math.cos(theta);

                this.Vertices.push(new Vertex(x + this.x, y + this.y, z + this.z));
            }
        }

        for (let i = 0; i < this.segments; i++) {
            for (let j = 0; j < this.segments; j++){
                const a = i * (this.segments + 1) + j;
                const b = a + 1;
                const c = a + this.segments + 1;
                const d = c + 1;

                this.Triangles.push([a, b, c]);
                this.Triangles.push([b, d, c]);
            }
        }
    }
}

class Text {
    constructor({
        text = "Sample Text",
        cube = null, // Reference to the cube object
        face = "front", // "front", "back", "left", "right", "top", "bottom"
        fontSize = 20,
        fontFamily = "Arial",
        color = { r: 255, g: 255, b: 255 },
        offsetX = 0, // Offset from center of face
        offsetY = 0,
        alignment = "center" // "left", "center", "right"
    }) {
        this.text = text;
        this.cube = cube;
        this.face = face;
        this.fontSize = fontSize;
        this.fontFamily = fontFamily;
        this.color = color;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.alignment = alignment;
        this.isVisible = true;
    }

    // Get the center point and normal of the specified face
    getFaceData() {
        if (!this.cube) return null;

        const { x, y, z, w, h, d } = this.cube;
        let center, normal, uVector, vVector;

        switch (this.face) {
            case "front":
                center = { x: x, y: y, z: z - d };
                normal = { x: 0, y: 0, z: -1 };
                uVector = { x: 1, y: 0, z: 0 }; // Right direction
                vVector = { x: 0, y: 1, z: 0 }; // Up direction
                break;
            case "back":
                center = { x: x, y: y, z: z + d };
                normal = { x: 0, y: 0, z: 1 };
                uVector = { x: -1, y: 0, z: 0 };
                vVector = { x: 0, y: 1, z: 0 };
                break;
            case "left":
                center = { x: x - w, y: y, z: z };
                normal = { x: -1, y: 0, z: 0 };
                uVector = { x: 0, y: 0, z: 1 };
                vVector = { x: 0, y: 1, z: 0 };
                break;
            case "right":
                center = { x: x + w, y: y, z: z };
                normal = { x: 1, y: 0, z: 0 };
                uVector = { x: 0, y: 0, z: -1 };
                vVector = { x: 0, y: 1, z: 0 };
                break;
            case "top":
                center = { x: x, y: y + h, z: z };
                normal = { x: 0, y: 1, z: 0 };
                uVector = { x: 1, y: 0, z: 0 };
                vVector = { x: 0, y: 0, z: 1 };
                break;
            case "bottom":
                center = { x: x, y: y - h, z: z };
                normal = { x: 0, y: -1, z: 0 };
                uVector = { x: 1, y: 0, z: 0 };
                vVector = { x: 0, y: 0, z: -1 };
                break;
            default:
                return null;
        }

        return { center, normal, uVector, vVector };
    }

    // Check if the text face is visible to the camera
    isFaceVisible(camera) {
        const faceData = this.getFaceData();
        if (!faceData) return false;

        const { center, normal } = faceData;
        
        // Vector from face center to camera
        const toCamera = vectorSubtract(
            { x: camera.x, y: camera.y, z: camera.z },
            center
        );
        
        // If dot product is positive, face is visible
        return vectorDot(vectorNormalize(toCamera), normal) > 0;
    }

    // Get the 3D position where text should be rendered
    getTextPosition() {
        const faceData = this.getFaceData();
        if (!faceData) return null;

        const { center, uVector, vVector } = faceData;

        // Apply offsets
        return {
            x: center.x + (uVector.x * this.offsetX) + (vVector.x * this.offsetY),
            y: center.y + (uVector.y * this.offsetX) + (vVector.y * this.offsetY),
            z: center.z + (uVector.z * this.offsetX) + (vVector.z * this.offsetY)
        };
    }
}

class Light {
    constructor({ x, y, z, color = { r: 255, g: 255, b: 255 }, intensity = 1 }) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.color = color;
        this.intensity = intensity;
    }
}

class Camera {
    constructor({ x, y, z }) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.fov = 800;
        this.rotationX = 0;
        this.rotationY = 0;
    }
}