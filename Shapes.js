class Vertex {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

class Cube {
    constructor({x, y, z, h = 100, w = 100, d = 100, name = "cube", color = { r: 100, g: 150, b: 200 }, subdivisions = 1}) {
        this.name = name;
        this.color = color;
        this.subdivisions = Math.max(1, Math.min(subdivisions, 8)); // Limit subdivisions

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

class Plane {
    constructor({x, y, z, width = 1000, height = 1000, name = "plane", color = { r: 100, g: 150, b: 200 }, subdivisions = 2, orientation = "horizontal"}) {
        this.name = name;
        this.color = color;
        this.subdivisions = Math.max(1, Math.min(subdivisions, 4)); // Limit subdivisions for performance
        this.orientation = orientation;

        this.x = x;
        this.y = y;
        this.z = z;

        this.width = width;
        this.height = height;

        // For collision detection
        this.w = width / 2;
        this.h = 1; // Very thin for collision
        this.d = height / 2;

        this.Vertices = [];
        this.Triangles = [];
    }

    setUp() {
        this.Vertices = [];
        this.Triangles = [];
        
        const x = this.x;
        const y = this.y;
        const z = this.z;
        const w = this.width / 2;
        const h = this.height / 2;
        const sub = this.subdivisions;

        let vertexIndex = 0;

        // Generate vertices based on orientation
        for (let i = 0; i <= sub; i++) {
            for (let j = 0; j <= sub; j++) {
                let px, py, pz;
                
                if (this.orientation === "horizontal") {
                    // Horizontal plane (floor/ceiling)
                    px = -w + x + (2 * w * j) / sub;
                    py = y;
                    pz = -h + z + (2 * h * i) / sub;
                } else if (this.orientation === "vertical-xz") {
                    // Vertical plane facing Y direction
                    px = -w + x + (2 * w * j) / sub;
                    py = -h + y + (2 * h * i) / sub;
                    pz = z;
                } else if (this.orientation === "vertical-yz") {
                    // Vertical plane facing X direction
                    px = x;
                    py = -h + y + (2 * h * i) / sub;
                    pz = -w + z + (2 * w * j) / sub;
                }
                
                this.Vertices.push(new Vertex(px, py, pz));
                vertexIndex++;
            }
        }

        // Generate triangles
        for (let i = 0; i < sub; i++) {
            for (let j = 0; j < sub; j++) {
                const topLeft = i * (sub + 1) + j;
                const topRight = topLeft + 1;
                const bottomLeft = topLeft + (sub + 1);
                const bottomRight = bottomLeft + 1;

                // Ensure proper winding order based on orientation
                if (this.orientation === "horizontal") {
                    // For horizontal planes, use counter-clockwise for upward-facing normal
                    this.Triangles.push([topLeft, bottomLeft, topRight]);
                    this.Triangles.push([topRight, bottomLeft, bottomRight]);
                } else {
                    // For vertical planes
                    this.Triangles.push([topLeft, topRight, bottomLeft]);
                    this.Triangles.push([topRight, bottomRight, bottomLeft]);
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
        this.segments = segments // Limit segments for performance

        this.x = x;
        this.y = y;
        this.z = z;

        this.Vertices = [];
        this.Triangles = [];
    }

    setUp() {
        this.Vertices = [];
        this.Triangles = [];
        
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
        cube = null,
        face = "front",
        fontSize = 20,
        fontFamily = "Arial",
        color = { r: 255, g: 255, b: 255 },
        offsetX = 0,
        offsetY = 0,
        alignment = "center"
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

    getFaceData() {
        if (!this.cube) return null;

        const { x, y, z, w, h, d } = this.cube;
        let center, normal, uVector, vVector;

        switch (this.face) {
            case "front":
                center = { x: x, y: y, z: z - d };
                normal = { x: 0, y: 0, z: -1 };
                uVector = { x: 1, y: 0, z: 0 };
                vVector = { x: 0, y: 1, z: 0 };
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

    isFaceVisible(camera) {
        const faceData = this.getFaceData();
        if (!faceData) return false;

        const { center, normal } = faceData;
        
        const toCamera = vectorSubtract(
            { x: camera.x, y: camera.y, z: camera.z },
            center
        );
        
        return vectorDot(vectorNormalize(toCamera), normal) > 0;
    }

    getTextPosition() {
        const faceData = this.getFaceData();
        if (!faceData) return null;

        const { center, uVector, vVector } = faceData;

        return {
            x: center.x + (uVector.x * this.offsetX) + (vVector.x * this.offsetY),
            y: center.y + (uVector.y * this.offsetX) + (vVector.y * this.offsetY),
            z: center.z + (uVector.z * this.offsetX) + (vVector.z * this.offsetY)
        };
    }
}

class TiledFloor {
    constructor(tileSize = 800, gridSize = 15, color = {r: 70, g: 200, b: 90}) {
        this.tileSize = tileSize;
        this.gridSize = gridSize; // Store the grid size
        this.tiles = new Map();
        this.floorY = 120;
        this.lastUpdateX = null;
        this.lastUpdateZ = null;
        this.color = color;
    }
    
    updateTiles(cameraX, cameraZ) {
        // Only update if camera moved significantly
        if (this.lastUpdateX !== null && this.lastUpdateZ !== null) {
            const deltaX = Math.abs(cameraX - this.lastUpdateX);
            const deltaZ = Math.abs(cameraZ - this.lastUpdateZ);
            if (deltaX < this.tileSize / 2 && deltaZ < this.tileSize / 2) {
                return; // Don't update if camera hasn't moved much
            }
        }
        
        const centerTileX = Math.floor(cameraX / this.tileSize);
        const centerTileZ = Math.floor(cameraZ / this.tileSize);
        
        const renderDistance = 2; // Reduced render distance
        
        // Clear old tiles that are too far
        for (let [key, tile] of this.tiles) {
            const [tileX, tileZ] = key.split(',').map(Number);
            if (Math.abs(tileX - centerTileX) > renderDistance + 1 || 
                Math.abs(tileZ - centerTileZ) > renderDistance + 1) {
                this.tiles.delete(key);
            }
        }
        
        // Add new tiles that are needed
        for (let x = centerTileX - renderDistance; x <= centerTileX + renderDistance; x++) {
            for (let z = centerTileZ - renderDistance; z <= centerTileZ + renderDistance; z++) {
                const key = `${x},${z}`;
                if (!this.tiles.has(key)) {
                    this.tiles.set(key, this.createTile(x, z));
                }
            }
        }
        
        this.lastUpdateX = cameraX;
        this.lastUpdateZ = cameraZ;
    }
    
    createTile(tileX, tileZ) {
        const worldX = tileX * this.tileSize;
        const worldZ = tileZ * this.tileSize;
        
        // Calculate subdivisions based on gridSize
        // Higher gridSize = more subdivisions (more detail)
        const subdivisions = Math.max(1, Math.min(this.gridSize, 8)); // Clamp between 1 and 8
        
        const tile = new Plane({
            x: worldX, 
            y: this.floorY, 
            z: worldZ,
            width: this.tileSize,
            height: this.tileSize,
            subdivisions: subdivisions, // Now uses the gridSize parameter
            normal: {x: 0, y: 1, z: 0},
            orientation: "horizontal"
        });
        
        // Set a subtle floor color variation
        const variation = Math.sin(tileX * 0.1) * Math.cos(tileZ * 0.1) * 20;
        tile.color = this.color;
        
        return tile;
    }
    
    getTiles() {
        return Array.from(this.tiles.values());
    }
}

// Updated Light class with additional properties
class Light {
    constructor({x = 0, y = 0, z = 0, color = {r: 255, g: 255, b: 255}, intensity = 1.0, radius = 100, type = 'point'}) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.color = color;
        this.intensity = intensity;
        this.radius = radius; // For area lighting/soft shadows
        this.type = type; // 'point', 'directional', 'spot'
        this.enabled = true;
    }
    
    // For directional lights
    setDirection(direction) {
        this.direction = vectorNormalize(direction);
        this.type = 'directional';
    }
    
    // For spot lights
    setSpotlight(direction, angle, falloff = 1.0) {
        this.direction = vectorNormalize(direction);
        this.spotAngle = angle;
        this.spotFalloff = falloff;
        this.type = 'spot';
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