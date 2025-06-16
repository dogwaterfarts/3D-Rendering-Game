/**
 * 3D Graphics Library - Core Shape Classes
 * Provides basic 3D shapes, lighting, and camera functionality
 */

// Utility functions for vector operations
function vectorSubtract(v1, v2) {
    return {
        x: v1.x - v2.x,
        y: v1.y - v2.y,
        z: v1.z - v2.z
    };
}

function vectorDot(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
}

function vectorNormalize(v) {
    const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    if (length === 0) return { x: 0, y: 0, z: 0 };
    return {
        x: v.x / length,
        y: v.y / length,
        z: v.z / length
    };
}

// Constants
const MAX_SUBDIVISIONS = 8;
const MIN_SUBDIVISIONS = 1;
const DEFAULT_COLOR = { r: 100, g: 150, b: 200 };

/**
 * Represents a 3D vertex with x, y, z coordinates
 */
class Vertex {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

/**
 * Base class for 3D shapes with common properties and methods
 */
class Shape3D {
    constructor({ x, y, z, name, color = DEFAULT_COLOR }) {
        this.name = name;
        this.color = { ...color };
        this.x = x;
        this.y = y;
        this.z = z;
        this.Vertices = [];
        this.Triangles = [];
    }

    /**
     * Clamps subdivisions within valid range
     */
    static clampSubdivisions(subdivisions) {
        return Math.max(MIN_SUBDIVISIONS, Math.min(subdivisions, MAX_SUBDIVISIONS));
    }

    /**
     * Abstract method - must be implemented by subclasses
     */
    setUp() {
        throw new Error('setUp() must be implemented by subclass');
    }

    /**
     * Clears vertices and triangles arrays
     */
    clearGeometry() {
        this.Vertices = [];
        this.Triangles = [];
    }
}

/**
 * 3D Cube with configurable dimensions and subdivisions
 */
class Cube extends Shape3D {
    constructor({
        x, y, z,
        h = 100, w = 100, d = 100,
        name = "cube",
        color = DEFAULT_COLOR,
        subdivisions = 1
    }) {
        super({ x, y, z, name, color });
        
        this.subdivisions = Shape3D.clampSubdivisions(subdivisions);
        
        // Store half-dimensions for easier calculations
        this.w = w / 2;
        this.h = h / 2;
        this.d = d / 2;
    }

    setUp() {
        this.clearGeometry();
        this.generateAllFaces();
    }

    /**
     * Generates all six faces of the cube
     */
    generateAllFaces() {
        const faces = [
            { name: 'front', vertices: this.getFrontFaceVertices() },
            { name: 'back', vertices: this.getBackFaceVertices() },
            { name: 'left', vertices: this.getLeftFaceVertices() },
            { name: 'right', vertices: this.getRightFaceVertices() },
            { name: 'bottom', vertices: this.getBottomFaceVertices() },
            { name: 'top', vertices: this.getTopFaceVertices() }
        ];

        faces.forEach(face => {
            const startIndex = this.Vertices.length;
            this.Vertices.push(...face.vertices);
            this.generateFaceTriangles(startIndex, this.subdivisions, true);
        });
    }

    /**
     * Generate vertices for each face
     */
    getFrontFaceVertices() {
        return this.generateFaceVertices(
            (i, j) => ({
                x: -this.w + this.x + (2 * this.w * j) / this.subdivisions,
                y: -this.h + this.y + (2 * this.h * i) / this.subdivisions,
                z: -this.d + this.z
            })
        );
    }

    getBackFaceVertices() {
        return this.generateFaceVertices(
            (i, j) => ({
                x: this.w + this.x - (2 * this.w * j) / this.subdivisions,
                y: -this.h + this.y + (2 * this.h * i) / this.subdivisions,
                z: this.d + this.z
            })
        );
    }

    getLeftFaceVertices() {
        return this.generateFaceVertices(
            (i, j) => ({
                x: -this.w + this.x,
                y: -this.h + this.y + (2 * this.h * i) / this.subdivisions,
                z: this.d + this.z - (2 * this.d * j) / this.subdivisions
            })
        );
    }

    getRightFaceVertices() {
        return this.generateFaceVertices(
            (i, j) => ({
                x: this.w + this.x,
                y: -this.h + this.y + (2 * this.h * i) / this.subdivisions,
                z: -this.d + this.z + (2 * this.d * j) / this.subdivisions
            })
        );
    }

    getBottomFaceVertices() {
        return this.generateFaceVertices(
            (i, j) => ({
                x: -this.w + this.x + (2 * this.w * j) / this.subdivisions,
                y: -this.h + this.y,
                z: this.d + this.z - (2 * this.d * i) / this.subdivisions
            })
        );
    }

    getTopFaceVertices() {
        return this.generateFaceVertices(
            (i, j) => ({
                x: -this.w + this.x + (2 * this.w * j) / this.subdivisions,
                y: this.h + this.y,
                z: -this.d + this.z + (2 * this.d * i) / this.subdivisions
            })
        );
    }

    /**
     * Helper method to generate vertices for a face using a position function
     */
    generateFaceVertices(positionFunc) {
        const vertices = [];
        for (let i = 0; i <= this.subdivisions; i++) {
            for (let j = 0; j <= this.subdivisions; j++) {
                const pos = positionFunc(i, j);
                vertices.push(new Vertex(pos.x, pos.y, pos.z));
            }
        }
        return vertices;
    }

    /**
     * Generate triangles for a face
     */
    generateFaceTriangles(startIndex, subdivisions, clockwise = false) {
        for (let i = 0; i < subdivisions; i++) {
            for (let j = 0; j < subdivisions; j++) {
                const topLeft = startIndex + i * (subdivisions + 1) + j;
                const topRight = topLeft + 1;
                const bottomLeft = topLeft + (subdivisions + 1);
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

/**
 * 3D Plane with configurable orientation and subdivisions
 */
class Plane extends Shape3D {
    static ORIENTATIONS = {
        HORIZONTAL: "horizontal",
        VERTICAL_XZ: "vertical-xz",
        VERTICAL_YZ: "vertical-yz"
    };

    constructor({
        x, y, z,
        width = 1000,
        height = 1000,
        name = "plane",
        color = DEFAULT_COLOR,
        subdivisions = 2,
        orientation = Plane.ORIENTATIONS.HORIZONTAL
    }) {
        super({ x, y, z, name, color });
        
        this.width = width;
        this.height = height;
        this.subdivisions = Math.max(1, Math.min(subdivisions, 4)); // Lower limit for planes
        this.orientation = orientation;

        // For collision detection
        this.w = width / 2;
        this.h = 1; // Very thin for collision
        this.d = height / 2;
    }

    setUp() {
        this.clearGeometry();
        this.generatePlaneGeometry();
    }

    /**
     * Generate plane geometry based on orientation
     */
    generatePlaneGeometry() {
        const w = this.width / 2;
        const h = this.height / 2;
        const sub = this.subdivisions;

        // Generate vertices
        for (let i = 0; i <= sub; i++) {
            for (let j = 0; j <= sub; j++) {
                const pos = this.calculateVertexPosition(i, j, w, h, sub);
                this.Vertices.push(new Vertex(pos.x, pos.y, pos.z));
            }
        }

        // Generate triangles
        this.generatePlaneTriangles(sub);
    }

    /**
     * Calculate vertex position based on orientation
     */
    calculateVertexPosition(i, j, w, h, sub) {
        const ratioI = i / sub;
        const ratioJ = j / sub;

        switch (this.orientation) {
            case Plane.ORIENTATIONS.HORIZONTAL:
                return {
                    x: -w + this.x + (2 * w * ratioJ),
                    y: this.y,
                    z: -h + this.z + (2 * h * ratioI)
                };
            
            case Plane.ORIENTATIONS.VERTICAL_XZ:
                return {
                    x: -w + this.x + (2 * w * ratioJ),
                    y: -h + this.y + (2 * h * ratioI),
                    z: this.z
                };
            
            case Plane.ORIENTATIONS.VERTICAL_YZ:
                return {
                    x: this.x,
                    y: -h + this.y + (2 * h * ratioI),
                    z: -w + this.z + (2 * w * ratioJ)
                };
            
            default:
                throw new Error(`Invalid plane orientation: ${this.orientation}`);
        }
    }

    /**
     * Generate triangles for the plane
     */
    generatePlaneTriangles(sub) {
        for (let i = 0; i < sub; i++) {
            for (let j = 0; j < sub; j++) {
                const topLeft = i * (sub + 1) + j;
                const topRight = topLeft + 1;
                const bottomLeft = topLeft + (sub + 1);
                const bottomRight = bottomLeft + 1;

                if (this.orientation === Plane.ORIENTATIONS.HORIZONTAL) {
                    // Counter-clockwise for upward-facing normal
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

/**
 * 3D Sphere with configurable radius and detail level
 */
class Sphere extends Shape3D {
    constructor({
        x, y, z,
        radius,
        segments,
        name = "sphere",
        color = DEFAULT_COLOR
    }) {
        super({ x, y, z, name, color });
        
        this.radius = radius;
        this.segments = segments;
    }

    setUp() {
        this.clearGeometry();
        this.generateSphereGeometry();
    }

    /**
     * Generate sphere geometry using spherical coordinates
     */
    generateSphereGeometry() {
        // Generate vertices
        for (let i = 0; i <= this.segments; i++) {
            const theta = i * Math.PI / this.segments;

            for (let j = 0; j <= this.segments; j++) {
                const phi = 2 * j * Math.PI / this.segments;

                const x = this.radius * Math.sin(theta) * Math.cos(phi) + this.x;
                const y = this.radius * Math.sin(theta) * Math.sin(phi) + this.y;
                const z = this.radius * Math.cos(theta) + this.z;

                this.Vertices.push(new Vertex(x, y, z));
            }
        }

        // Generate triangles
        for (let i = 0; i < this.segments; i++) {
            for (let j = 0; j < this.segments; j++) {
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

/**
 * Text rendering on cube faces
 */
class Text {
    static FACES = {
        FRONT: "front",
        BACK: "back",
        LEFT: "left",
        RIGHT: "right",
        TOP: "top",
        BOTTOM: "bottom"
    };

    static ALIGNMENTS = {
        CENTER: "center",
        LEFT: "left",
        RIGHT: "right"
    };

    constructor({
        text = "Sample Text",
        cube = null,
        face = Text.FACES.FRONT,
        fontSize = 20,
        fontFamily = "Arial",
        color = { r: 255, g: 255, b: 255 },
        offsetX = 0,
        offsetY = 0,
        alignment = Text.ALIGNMENTS.CENTER
    }) {
        this.text = text;
        this.cube = cube;
        this.face = face;
        this.fontSize = fontSize;
        this.fontFamily = fontFamily;
        this.color = { ...color };
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.alignment = alignment;
        this.isVisible = true;
    }

    /**
     * Get face data for text positioning
     */
    getFaceData() {
        if (!this.cube) return null;

        const { x, y, z, w, h, d } = this.cube;
        const faceConfigs = {
            [Text.FACES.FRONT]: {
                center: { x, y, z: z - d },
                normal: { x: 0, y: 0, z: -1 },
                uVector: { x: 1, y: 0, z: 0 },
                vVector: { x: 0, y: 1, z: 0 }
            },
            [Text.FACES.BACK]: {
                center: { x, y, z: z + d },
                normal: { x: 0, y: 0, z: 1 },
                uVector: { x: -1, y: 0, z: 0 },
                vVector: { x: 0, y: 1, z: 0 }
            },
            [Text.FACES.LEFT]: {
                center: { x: x - w, y, z },
                normal: { x: -1, y: 0, z: 0 },
                uVector: { x: 0, y: 0, z: 1 },
                vVector: { x: 0, y: 1, z: 0 }
            },
            [Text.FACES.RIGHT]: {
                center: { x: x + w, y, z },
                normal: { x: 1, y: 0, z: 0 },
                uVector: { x: 0, y: 0, z: -1 },
                vVector: { x: 0, y: 1, z: 0 }
            },
            [Text.FACES.TOP]: {
                center: { x, y: y + h, z },
                normal: { x: 0, y: 1, z: 0 },
                uVector: { x: 1, y: 0, z: 0 },
                vVector: { x: 0, y: 0, z: 1 }
            },
            [Text.FACES.BOTTOM]: {
                center: { x, y: y - h, z },
                normal: { x: 0, y: -1, z: 0 },
                uVector: { x: 1, y: 0, z: 0 },
                vVector: { x: 0, y: 0, z: -1 }
            }
        };

        return faceConfigs[this.face] || null;
    }

    /**
     * Check if the face is visible from camera position
     */
    isFaceVisible(camera) {
        const faceData = this.getFaceData();
        if (!faceData) return false;

        const { center, normal } = faceData;
        const toCamera = vectorSubtract(camera, center);
        
        return vectorDot(vectorNormalize(toCamera), normal) > 0;
    }

    /**
     * Get world position for text rendering
     */
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

/**
 * Dynamically generated tiled floor system
 */
class TiledFloor {
    constructor(tileSize = 800, gridSize = 15, color = { r: 70, g: 200, b: 90 }) {
        this.tileSize = tileSize;
        this.gridSize = gridSize;
        this.tiles = new Map();
        this.floorY = 120;
        this.lastUpdatePosition = { x: null, z: null };
        this.color = { ...color };
        this.renderDistance = 2;
    }

    /**
     * Update tiles based on camera position
     */
    updateTiles(cameraX, cameraZ) {
        if (!this.shouldUpdate(cameraX, cameraZ)) {
            return;
        }

        const centerTile = {
            x: Math.floor(cameraX / this.tileSize),
            z: Math.floor(cameraZ / this.tileSize)
        };

        this.removeDistantTiles(centerTile);
        this.addNeededTiles(centerTile);

        this.lastUpdatePosition = { x: cameraX, z: cameraZ };
    }

    /**
     * Check if tiles need updating based on camera movement
     */
    shouldUpdate(cameraX, cameraZ) {
        if (this.lastUpdatePosition.x === null || this.lastUpdatePosition.z === null) {
            return true;
        }

        const deltaX = Math.abs(cameraX - this.lastUpdatePosition.x);
        const deltaZ = Math.abs(cameraZ - this.lastUpdatePosition.z);
        
        return deltaX >= this.tileSize / 2 || deltaZ >= this.tileSize / 2;
    }

    /**
     * Remove tiles that are too far from camera
     */
    removeDistantTiles(centerTile) {
        for (let [key, tile] of this.tiles) {
            const [tileX, tileZ] = key.split(',').map(Number);
            if (Math.abs(tileX - centerTile.x) > this.renderDistance + 1 || 
                Math.abs(tileZ - centerTile.z) > this.renderDistance + 1) {
                this.tiles.delete(key);
            }
        }
    }

    /**
     * Add new tiles within render distance
     */
    addNeededTiles(centerTile) {
        for (let x = centerTile.x - this.renderDistance; x <= centerTile.x + this.renderDistance; x++) {
            for (let z = centerTile.z - this.renderDistance; z <= centerTile.z + this.renderDistance; z++) {
                const key = `${x},${z}`;
                if (!this.tiles.has(key)) {
                    this.tiles.set(key, this.createTile(x, z));
                }
            }
        }
    }

    /**
     * Create a single tile at grid coordinates
     */
    createTile(tileX, tileZ) {
        const worldX = tileX * this.tileSize;
        const worldZ = tileZ * this.tileSize;
        const subdivisions = Shape3D.clampSubdivisions(this.gridSize);

        const tile = new Plane({
            x: worldX,
            y: this.floorY,
            z: worldZ,
            width: this.tileSize,
            height: this.tileSize,
            subdivisions: subdivisions,
            orientation: Plane.ORIENTATIONS.HORIZONTAL
        });

        // Add subtle color variation
        const variation = Math.sin(tileX * 0.1) * Math.cos(tileZ * 0.1) * 20;
        tile.color = {
            r: Math.max(0, Math.min(255, this.color.r + variation)),
            g: Math.max(0, Math.min(255, this.color.g + variation)),
            b: Math.max(0, Math.min(255, this.color.b + variation))
        };

        return tile;
    }

    /**
     * Get all currently active tiles
     */
    getTiles() {
        return Array.from(this.tiles.values());
    }
}

/**
 * Light source for 3D scene lighting
 */
class Light {
    static TYPES = {
        POINT: 'point',
        DIRECTIONAL: 'directional',
        SPOT: 'spot'
    };

    constructor({
        x = 0, y = 0, z = 0,
        color = { r: 255, g: 255, b: 255 },
        intensity = 1.0,
        radius = 100,
        type = Light.TYPES.POINT
    }) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.color = { ...color };
        this.intensity = Math.max(0, intensity);
        this.radius = Math.max(0, radius);
        this.type = type;
        this.enabled = true;
    }

    /**
     * Configure as directional light
     */
    setDirection(direction) {
        this.direction = vectorNormalize(direction);
        this.type = Light.TYPES.DIRECTIONAL;
        return this;
    }

    /**
     * Configure as spotlight
     */
    setSpotlight(direction, angle, falloff = 1.0) {
        this.direction = vectorNormalize(direction);
        this.spotAngle = Math.max(0, Math.min(Math.PI, angle));
        this.spotFalloff = Math.max(0, falloff);
        this.type = Light.TYPES.SPOT;
        return this;
    }

    /**
     * Toggle light on/off
     */
    toggle() {
        this.enabled = !this.enabled;
        return this;
    }
}

/**
 * Camera for 3D scene viewing
 */
class Camera {
    constructor({ x, y, z, fov = 800 }) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.fov = Math.max(100, fov); // Minimum FOV to prevent issues
        this.rotationX = 0;
        this.rotationY = 0;
    }

    /**
     * Set camera position
     */
    setPosition(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }

    /**
     * Set camera rotation
     */
    setRotation(rotationX, rotationY) {
        this.rotationX = rotationX;
        this.rotationY = rotationY;
        return this;
    }

    /**
     * Get camera forward direction vector
     */
    getForwardVector() {
        const cosY = Math.cos(this.rotationY);
        const sinY = Math.sin(this.rotationY);
        const cosX = Math.cos(this.rotationX);
        const sinX = Math.sin(this.rotationX);

        return {
            x: sinY * cosX,
            y: -sinX,
            z: cosY * cosX
        };
    }
}