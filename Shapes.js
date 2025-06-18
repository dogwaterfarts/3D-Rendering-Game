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
 * 3D Wedge (triangular prism) with configurable dimensions and subdivisions
 */
class Wedge extends Shape3D {
    constructor({
        x, y, z,
        width = 100,
        height = 100,
        depth = 100,
        name = "wedge",
        color = DEFAULT_COLOR,
        subdivisions = 1
    }) {
        super({ x, y, z, name, color });
        
        this.subdivisions = Shape3D.clampSubdivisions(subdivisions);
        
        // Store half-dimensions for easier calculations
        this.w = width / 2;
        this.h = height / 2;
        this.d = depth / 2;
    }

    setUp() {
        this.clearGeometry();
        this.generateWedgeGeometry();
    }

    /**
     * Generate wedge geometry - a triangular prism with proper faces
     */
    generateWedgeGeometry() {
        this.generateTriangularFaces();  // Front and back triangular faces
        this.generateRectangularFaces(); // Bottom, left slope, right slope
    }

    /**
     * Generate the triangular front and back faces
     */
    generateTriangularFaces() {
        // Front triangular face (at z = -d)
        this.generateTriangularFace(-this.d, false);
        
        // Back triangular face (at z = +d)
        this.generateTriangularFace(this.d, true);
    }

    /**
     * Generate a single triangular face at given z position
     */
    generateTriangularFace(zPos, reverse) {
        const startIndex = this.Vertices.length;
        
        // Three corner vertices of the triangle
        const vertices = [
            new Vertex(this.x - this.w, this.y + this.h, this.z + zPos),  // Bottom left (higher y since -y is up)
            new Vertex(this.x + this.w, this.y + this.h, this.z + zPos),  // Bottom right
            new Vertex(this.x, this.y - this.h, this.z + zPos)            // Top center (lower y since -y is up)
        ];
        
        this.Vertices.push(...vertices);
        
        // Create triangle with proper winding
        if (reverse) {
            this.Triangles.push([startIndex, startIndex + 2, startIndex + 1]);
        } else {
            this.Triangles.push([startIndex, startIndex + 1, startIndex + 2]);
        }
    }

    /**
     * Generate rectangular faces (bottom, left slope, right slope)
     */
    generateRectangularFaces() {
        // Bottom face (rectangle from bottom edge to bottom edge)
        this.generateBottomFace();
        
        // Left slope face (from left bottom edge to top point)
        this.generateSlopeFace(true);  // left slope
        
        // Right slope face (from right bottom edge to top point)  
        this.generateSlopeFace(false); // right slope
    }

    /**
     * Generate bottom rectangular face
     */
    generateBottomFace() {
        const startIndex = this.Vertices.length;
        
        // Four corners of bottom face
        const vertices = [
            new Vertex(this.x - this.w, this.y + this.h, this.z - this.d),  // Front bottom left
            new Vertex(this.x + this.w, this.y + this.h, this.z - this.d),  // Front bottom right
            new Vertex(this.x + this.w, this.y + this.h, this.z + this.d),  // Back bottom right
            new Vertex(this.x - this.w, this.y + this.h, this.z + this.d)   // Back bottom left
        ];
        
        this.Vertices.push(...vertices);
        
        // Two triangles for the bottom face (counter-clockwise for upward normal in -y up system)
        this.Triangles.push([startIndex, startIndex + 2, startIndex + 1]);
        this.Triangles.push([startIndex, startIndex + 3, startIndex + 2]);
    }

    /**
     * Generate slope faces (left or right)
     */
    generateSlopeFace(isLeft) {
        const startIndex = this.Vertices.length;
        
        if (isLeft) {
            // Left slope: from left bottom edge to top center
            const vertices = [
                new Vertex(this.x - this.w, this.y + this.h, this.z - this.d),  // Front bottom left
                new Vertex(this.x, this.y - this.h, this.z - this.d),          // Front top center  
                new Vertex(this.x, this.y - this.h, this.z + this.d),          // Back top center
                new Vertex(this.x - this.w, this.y + this.h, this.z + this.d)   // Back bottom left
            ];
            
            this.Vertices.push(...vertices);
            
            // Two triangles for left slope (clockwise for outward normal)
            this.Triangles.push([startIndex, startIndex + 1, startIndex + 2]);
            this.Triangles.push([startIndex, startIndex + 2, startIndex + 3]);
        } else {
            // Right slope: from right bottom edge to top center
            const vertices = [
                new Vertex(this.x + this.w, this.y + this.h, this.z - this.d),  // Front bottom right
                new Vertex(this.x + this.w, this.y + this.h, this.z + this.d),  // Back bottom right
                new Vertex(this.x, this.y - this.h, this.z + this.d),          // Back top center
                new Vertex(this.x, this.y - this.h, this.z - this.d)           // Front top center
            ];
            
            this.Vertices.push(...vertices);
            
            // Two triangles for right slope (counter-clockwise for outward normal)
            this.Triangles.push([startIndex, startIndex + 1, startIndex + 2]);
            this.Triangles.push([startIndex, startIndex + 2, startIndex + 3]);
        }
    }
}


/**
 * 3D Cylinder with configurable radius, height, and detail level
 */
class Cylinder extends Shape3D {
    constructor({
        x, y, z,
        radius = 50,
        height = 100,
        segments = 16,
        name = "cylinder",
        color = DEFAULT_COLOR,
        capTop = true,
        capBottom = true
    }) {
        super({ x, y, z, name, color });
        
        this.radius = Math.max(1, radius);
        this.height = height;
        this.segments = Math.max(3, Math.min(segments, 64)); // Reasonable segment limits
        this.capTop = capTop;
        this.capBottom = capBottom;
        
        // For collision detection
        this.w = radius;
        this.h = height / 2;
        this.d = radius;
    }

    setUp() {
        this.clearGeometry();
        this.generateCylinderGeometry();
    }

    /**
     * Generate cylinder geometry
     */
    generateCylinderGeometry() {
        this.generateCylinderSides();
        
        if (this.capTop) {
            this.generateCylinderCap(true);  // Top cap
        }
        
        if (this.capBottom) {
            this.generateCylinderCap(false); // Bottom cap
        }
    }

    /**
     * Generate the curved sides of the cylinder
     */
    generateCylinderSides() {
        const startIndex = this.Vertices.length;
        
        // Generate vertices for cylinder sides
        for (let i = 0; i <= 1; i++) { // Two rings: top (0) and bottom (1)
            const y = this.y + (0.5 - i) * this.height; // Flipped: top at +0.5, bottom at -0.5
            
            for (let j = 0; j <= this.segments; j++) {
                const angle = (2 * Math.PI * j) / this.segments;
                const x = this.x + this.radius * Math.cos(angle);
                const z = this.z + this.radius * Math.sin(angle);
                
                this.Vertices.push(new Vertex(x, y, z));
            }
        }

        // Generate triangles for cylinder sides
        for (let j = 0; j < this.segments; j++) {
            const topLeft = startIndex + j;                           // Top ring
            const topRight = startIndex + j + 1;
            const bottomLeft = startIndex + (this.segments + 1) + j;  // Bottom ring
            const bottomRight = startIndex + (this.segments + 1) + j + 1;

            // Two triangles per quad (adjusted winding for -y up coordinate system)
            this.Triangles.push([topLeft, bottomLeft, topRight]);
            this.Triangles.push([topRight, bottomLeft, bottomRight]);
        }
    }

    /**
     * Generate top or bottom cap of the cylinder
     */
    generateCylinderCap(isTop) {
        const startIndex = this.Vertices.length;
        const y = this.y + (isTop ? 0.5 : -0.5) * this.height; // Corrected for -y up
        
        // Center vertex
        this.Vertices.push(new Vertex(this.x, y, this.z));
        const centerIndex = startIndex;
        
        // Ring vertices
        for (let j = 0; j <= this.segments; j++) {
            const angle = (2 * Math.PI * j) / this.segments;
            const x = this.x + this.radius * Math.cos(angle);
            const z = this.z + this.radius * Math.sin(angle);
            
            this.Vertices.push(new Vertex(x, y, z));
        }

        // Generate triangles for the cap
        for (let j = 0; j < this.segments; j++) {
            const current = startIndex + 1 + j;
            const next = startIndex + 1 + j + 1;
            
            if (isTop) {
                // Clockwise for upward-facing normal (since -y is up)
                this.Triangles.push([centerIndex, current, next]);
            } else {
                // Counter-clockwise for downward-facing normal
                this.Triangles.push([centerIndex, next, current]);
            }
        }
    }

    /**
     * Create a cylinder without caps (tube)
     */
    static createTube(options) {
        return new Cylinder({
            ...options,
            capTop: false,
            capBottom: false
        });
    }

    /**
     * Create a cone (cylinder with top radius = 0)
     */
    static createCone(options) {
        const cone = new Cylinder(options);
        cone.generateConeGeometry = function() {
            this.clearGeometry();
            const startIndex = 0;
            
            // Center vertex at top (higher y value, but since -y is up, this is lower y)
            this.Vertices.push(new Vertex(this.x, this.y - this.height / 2, this.z));
            const topCenterIndex = 0;
            
            // Bottom ring vertices (lower y value, but since -y is up, this is higher y)
            for (let j = 0; j <= this.segments; j++) {
                const angle = (2 * Math.PI * j) / this.segments;
                const x = this.x + this.radius * Math.cos(angle);
                const z = this.z + this.radius * Math.sin(angle);
                const y = this.y + this.height / 2;
                
                this.Vertices.push(new Vertex(x, y, z));
            }

            // Generate side triangles
            for (let j = 0; j < this.segments; j++) {
                const current = 1 + j;
                const next = 1 + j + 1;
                
                this.Triangles.push([topCenterIndex, next, current]);
            }

            // Generate bottom cap if enabled
            if (this.capBottom) {
                const bottomCenterIndex = this.Vertices.length;
                this.Vertices.push(new Vertex(this.x, this.y + this.height / 2, this.z));
                
                for (let j = 0; j < this.segments; j++) {
                    const current = 1 + j;
                    const next = 1 + j + 1;
                    
                    this.Triangles.push([bottomCenterIndex, current, next]);
                }
            }
        };
        
        cone.setUp = cone.generateConeGeometry;
        return cone;
    }
}

/* *
 * General Pyramid class that can create both polygonal pyramids and cones
 */
class Pyramid extends Shape3D {
    constructor({
        x, y, z,
        baseRadius = 50,
        baseWidth = null,  // For square/rectangular pyramids
        baseHeight = null, // For rectangular pyramids
        height = 100,
        segments = 4,      // 4 for square pyramid, high number for cone-like
        name = "pyramid",
        color = DEFAULT_COLOR,
        capBottom = true,
        isCone = false     // Flag to indicate if this should behave like a cone
    }) {
        super({ x, y, z, name, color });
        
        this.isCone = isCone;
        this.height = height;
        this.capBottom = capBottom;
        
        if (this.isCone) {
            // Cone configuration
            this.baseRadius = Math.max(1, baseRadius);
            this.segments = Math.max(8, Math.min(segments, 64)); // More segments for smooth cone
        } else {
            // Pyramid configuration
            this.segments = Math.max(3, Math.min(segments, 32)); // Fewer segments for polygonal pyramid
            
            if (baseWidth !== null) {
                // Rectangular/square pyramid
                this.baseWidth = baseWidth;
                this.baseHeight = baseHeight || baseWidth; // Default to square if height not specified
                this.useRectangularBase = true;
            } else {
                // Circular/polygonal pyramid
                this.baseRadius = Math.max(1, baseRadius);
                this.useRectangularBase = false;
            }
        }
        
        // For collision detection
        this.w = this.useRectangularBase ? this.baseWidth / 2 : (this.baseRadius || baseRadius);
        this.h = height / 2;
        this.d = this.useRectangularBase ? this.baseHeight / 2 : (this.baseRadius || baseRadius);
    }

    setUp() {
        this.clearGeometry();
        this.generatePyramidGeometry();
    }

    /**
     * Generate pyramid/cone geometry
     */
    generatePyramidGeometry() {
        // Apex vertex at top (lower y value since -y is up)
        const apexIndex = this.Vertices.length;
        this.Vertices.push(new Vertex(this.x, this.y - this.height / 2, this.z));
        
        // Generate base vertices
        const baseStartIndex = this.Vertices.length;
        this.generateBaseVertices();

        // Generate side triangles
        this.generateSideTriangles(apexIndex, baseStartIndex);

        // Generate bottom cap if enabled
        if (this.capBottom) {
            this.generateBottomCap(baseStartIndex);
        }
    }

    /**
     * Generate base vertices based on pyramid type
     */
    generateBaseVertices() {
        const baseY = this.y + this.height / 2;

        if (this.useRectangularBase) {
            // Rectangular base vertices
            const halfWidth = this.baseWidth / 2;
            const halfHeight = this.baseHeight / 2;
            
            this.Vertices.push(new Vertex(this.x - halfWidth, baseY, this.z - halfHeight)); // Bottom-left
            this.Vertices.push(new Vertex(this.x + halfWidth, baseY, this.z - halfHeight)); // Bottom-right
            this.Vertices.push(new Vertex(this.x + halfWidth, baseY, this.z + halfHeight)); // Top-right
            this.Vertices.push(new Vertex(this.x - halfWidth, baseY, this.z + halfHeight)); // Top-left
        } else {
            // Circular/polygonal base vertices
            for (let j = 0; j <= this.segments; j++) {
                const angle = (2 * Math.PI * j) / this.segments;
                const x = this.x + this.baseRadius * Math.cos(angle);
                const z = this.z + this.baseRadius * Math.sin(angle);
                
                this.Vertices.push(new Vertex(x, baseY, z));
            }
        }
    }

    /**
     * Generate side triangles from apex to base
     */
    generateSideTriangles(apexIndex, baseStartIndex) {
        if (this.useRectangularBase) {
            // 4 triangular faces for rectangular pyramid
            for (let i = 0; i < 4; i++) {
                const current = baseStartIndex + i;
                const next = baseStartIndex + ((i + 1) % 4);
                
                // Triangle from apex to base edge
                this.Triangles.push([apexIndex, next, current]);
            }
        } else {
            // Triangular faces for circular/polygonal pyramid
            for (let j = 0; j < this.segments; j++) {
                const current = baseStartIndex + j;
                const next = baseStartIndex + j + 1;
                
                // Triangle from apex to base edge
                this.Triangles.push([apexIndex, next, current]);
            }
        }
    }

    /**
     * Generate bottom cap
     */
    generateBottomCap(baseStartIndex) {
        const bottomCenterIndex = this.Vertices.length;
        const baseY = this.y + this.height / 2;
        this.Vertices.push(new Vertex(this.x, baseY, this.z));
        
        if (this.useRectangularBase) {
            // Two triangles for rectangular base
            this.Triangles.push([bottomCenterIndex, baseStartIndex, baseStartIndex + 1]);
            this.Triangles.push([bottomCenterIndex, baseStartIndex + 1, baseStartIndex + 2]);
            this.Triangles.push([bottomCenterIndex, baseStartIndex + 2, baseStartIndex + 3]);
            this.Triangles.push([bottomCenterIndex, baseStartIndex + 3, baseStartIndex]);
        } else {
            // Triangular fan for circular/polygonal base
            for (let j = 0; j < this.segments; j++) {
                const current = baseStartIndex + j;
                const next = baseStartIndex + j + 1;
                
                this.Triangles.push([bottomCenterIndex, current, next]);
            }
        }
    }

    /**
     * Static factory methods for different pyramid types
     */
    static createSquarePyramid(options) {
        return new Pyramid({
            ...options,
            segments: 4,
            baseWidth: options.baseSize || options.baseRadius * 2,
            baseHeight: options.baseSize || options.baseRadius * 2,
            isCone: false
        });
    }

    static createTriangularPyramid(options) {
        return new Pyramid({
            ...options,
            segments: 3,
            isCone: false
        });
    }

    static createCone(options) {
        return new Pyramid({
            ...options,
            segments: options.segments || 16,
            isCone: true
        });
    }

    static createHexagonalPyramid(options) {
        return new Pyramid({
            ...options,
            segments: 6,
            isCone: false
        });
    }
}

