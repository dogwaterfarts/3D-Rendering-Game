// ===== OPTIMIZED MATRIX AND VECTOR OPERATIONS =====
class Vec3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    
    set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }
    
    copy(v) {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;
        return this;
    }
    
    subtract(v) {
        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;
        return this;
    }
    
    add(v) {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        return this;
    }
    
    scale(s) {
        this.x *= s;
        this.y *= s;
        this.z *= s;
        return this;
    }
    
    normalize() {
        const len = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        if (len > 0) {
            const invLen = 1 / len;
            this.x *= invLen;
            this.y *= invLen;
            this.z *= invLen;
        }
        return this;
    }
    
    dot(v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }
    
    cross(v, result = new Vec3()) {
        result.x = this.y * v.z - this.z * v.y;
        result.y = this.z * v.x - this.x * v.z;
        result.z = this.x * v.y - this.y * v.x;
        return result;
    }
    
    distanceTo(v) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        const dz = this.z - v.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    
    clone() {
        return new Vec3(this.x, this.y, this.z);
    }
}

// Pre-allocated vectors for reuse
const tempVec1 = new Vec3();
const tempVec2 = new Vec3();
const tempVec3 = new Vec3();
const tempVec4 = new Vec3();

// Optimized matrix operations with pre-allocated arrays
class Matrix4 {
    constructor() {
        this.m = new Float32Array(16);
        this.identity();
    }
    
    identity() {
        this.m.fill(0);
        this.m[0] = this.m[5] = this.m[10] = this.m[15] = 1;
        return this;
    }
    
    rotateX(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        this.m[5] = cos;
        this.m[6] = -sin;
        this.m[9] = sin;
        this.m[10] = cos;
        return this;
    }
    
    rotateY(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        this.m[0] = cos;
        this.m[2] = sin;
        this.m[8] = -sin;
        this.m[10] = cos;
        return this;
    }
    
    transformVector(v, result = new Vec3()) {
        const x = v.x, y = v.y, z = v.z;
        result.x = this.m[0] * x + this.m[4] * y + this.m[8] * z;
        result.y = this.m[1] * x + this.m[5] * y + this.m[9] * z;
        result.z = this.m[2] * x + this.m[6] * y + this.m[10] * z;
        return result;
    }
}

// Pre-allocated matrices
const rotXMatrix = new Matrix4();
const rotYMatrix = new Matrix4();

// ===== OPTIMIZED SHAPES =====
class OptimizedCube {
    constructor({x, y, z, w = 100, h = 100, d = 100, name = "cube", color = { r: 100, g: 150, b: 200 }, subdivisions = 1}) {
        this.name = name;
        this.color = color;
        this.position = new Vec3(x, y, z);
        this.w = w * 0.5;
        this.h = h * 0.5;
        this.d = d * 0.5;
        this.subdivisions = Math.max(1, subdivisions);
        
        this.vertices = [];
        this.triangles = [];
        this.normals = [];
        this.bounds = { min: new Vec3(), max: new Vec3() };
        
        this.generateGeometry();
        this.calculateBounds();
    }
    
    generateGeometry() {
        const sub = this.subdivisions;
        const faces = [
            // Front face
            { dir: new Vec3(0, 0, -1), u: new Vec3(1, 0, 0), v: new Vec3(0, 1, 0) },
            // Back face
            { dir: new Vec3(0, 0, 1), u: new Vec3(-1, 0, 0), v: new Vec3(0, 1, 0) },
            // Left face
            { dir: new Vec3(-1, 0, 0), u: new Vec3(0, 0, 1), v: new Vec3(0, 1, 0) },
            // Right face
            { dir: new Vec3(1, 0, 0), u: new Vec3(0, 0, -1), v: new Vec3(0, 1, 0) },
            // Bottom face
            { dir: new Vec3(0, -1, 0), u: new Vec3(1, 0, 0), v: new Vec3(0, 0, -1) },
            // Top face
            { dir: new Vec3(0, 1, 0), u: new Vec3(1, 0, 0), v: new Vec3(0, 0, 1) }
        ];
        
        for (const face of faces) {
            this.generateFace(face, sub);
        }
    }
    
    generateFace(face, sub) {
        const startIndex = this.vertices.length;
        
        // Generate vertices for this face
        for (let i = 0; i <= sub; i++) {
            for (let j = 0; j <= sub; j++) {
                const u = (j / sub - 0.5) * 2;
                const v = (i / sub - 0.5) * 2;
                
                const vertex = new Vec3()
                    .copy(face.dir).scale(face.dir.x ? this.w : face.dir.y ? this.h : this.d)
                    .add(tempVec1.copy(face.u).scale(u * (face.u.x ? this.w : face.u.z ? this.d : this.h)))
                    .add(tempVec2.copy(face.v).scale(v * (face.v.y ? this.h : face.v.z ? this.d : this.w)))
                    .add(this.position);
                
                this.vertices.push(vertex);
            }
        }
        
        // Generate triangles for this face
        for (let i = 0; i < sub; i++) {
            for (let j = 0; j < sub; j++) {
                const topLeft = startIndex + i * (sub + 1) + j;
                const topRight = topLeft + 1;
                const bottomLeft = topLeft + (sub + 1);
                const bottomRight = bottomLeft + 1;
                
                this.triangles.push([topLeft, topRight, bottomLeft]);
                this.triangles.push([topRight, bottomRight, bottomLeft]);
                
                // Store normals for lighting
                this.normals.push(face.dir.clone(), face.dir.clone());
            }
        }
    }
    
    calculateBounds() {
        this.bounds.min.set(
            this.position.x - this.w,
            this.position.y - this.h,
            this.position.z - this.d
        );
        this.bounds.max.set(
            this.position.x + this.w,
            this.position.y + this.h,
            this.position.z + this.d
        );
    }
}

class OptimizedSphere {
    constructor({x, y, z, radius, segments = 16, name = "sphere", color = { r: 100, g: 150, b: 200 }}) {
        this.name = name;
        this.color = color;
        this.position = new Vec3(x, y, z);
        this.radius = radius;
        this.segments = Math.max(8, segments);
        
        this.vertices = [];
        this.triangles = [];
        this.normals = [];
        this.bounds = { min: new Vec3(), max: new Vec3() };
        
        this.generateGeometry();
        this.calculateBounds();
    }
    
    generateGeometry() {
        const segments = this.segments;
        
        // Generate vertices
        for (let i = 0; i <= segments; i++) {
            const theta = i * Math.PI / segments;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);
            
            for (let j = 0; j <= segments; j++) {
                const phi = 2 * j * Math.PI / segments;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);
                
                const x = sinTheta * cosPhi;
                const y = sinTheta * sinPhi;
                const z = cosTheta;
                
                const vertex = new Vec3(
                    x * this.radius + this.position.x,
                    y * this.radius + this.position.y,
                    z * this.radius + this.position.z
                );
                
                this.vertices.push(vertex);
                this.normals.push(new Vec3(x, y, z)); // Normal is the normalized position for spheres
            }
        }
        
        // Generate triangles
        for (let i = 0; i < segments; i++) {
            for (let j = 0; j < segments; j++) {
                const a = i * (segments + 1) + j;
                const b = a + 1;
                const c = a + segments + 1;
                const d = c + 1;
                
                this.triangles.push([a, b, c], [b, d, c]);
            }
        }
    }
    
    calculateBounds() {
        this.bounds.min.set(
            this.position.x - this.radius,
            this.position.y - this.radius,
            this.position.z - this.radius
        );
        this.bounds.max.set(
            this.position.x + this.radius,
            this.position.y + this.radius,
            this.position.z + this.radius
        );
    }
}

// ===== OPTIMIZED RENDERING =====
class OptimizedRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.centerX = this.width * 0.5;
        this.centerY = this.height * 0.5;
        
        // Pre-allocated arrays for batch processing
        this.trianglePool = [];
        this.projectedVertices = [];
        this.visibleTriangles = [];
        
        // Frustum culling bounds
        this.frustumNear = 1;
        this.frustumFar = 5000;
        
        // Initialize image data for potential pixel-level optimizations
        this.imageData = this.ctx.createImageData(this.width, this.height);
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.centerX = width * 0.5;
        this.centerY = height * 0.5;
        this.imageData = this.ctx.createImageData(width, height);
    }
    
    // Frustum culling
    isInFrustum(bounds, camera) {
        // Simple sphere-based frustum culling
        const center = tempVec1.set(
            (bounds.min.x + bounds.max.x) * 0.5 - camera.x,
            (bounds.min.y + bounds.max.y) * 0.5 - camera.y,
            (bounds.min.z + bounds.max.z) * 0.5 - camera.z
        );
        
        const radius = Math.max(
            bounds.max.x - bounds.min.x,
            bounds.max.y - bounds.min.y,
            bounds.max.z - bounds.min.z
        ) * 0.5;
        
        // Apply camera rotation
        rotYMatrix.identity().rotateY(-camera.rotationX);
        rotXMatrix.identity().rotateX(camera.rotationY);
        
        rotYMatrix.transformVector(center, center);
        rotXMatrix.transformVector(center, center);
        
        // Check if behind camera
        if (center.z < this.frustumNear - radius) return false;
        if (center.z > this.frustumFar + radius) return false;
        
        // Simple side culling (could be improved with proper frustum planes)
        const fovScale = camera.fov / center.z;
        if (Math.abs(center.x) > this.centerX / fovScale + radius) return false;
        if (Math.abs(center.y) > this.centerY / fovScale + radius) return false;
        
        return true;
    }
    
    // Optimized perspective projection
    project(worldVertex, camera, result = new Vec3()) {
        // Transform to camera space
        tempVec1.copy(worldVertex).subtract(camera);
        
        // Apply rotations
        rotYMatrix.identity().rotateY(-camera.rotationX);
        rotXMatrix.identity().rotateX(camera.rotationY);
        
        rotYMatrix.transformVector(tempVec1, tempVec1);
        rotXMatrix.transformVector(tempVec1, tempVec1);
        
        // Perspective projection
        if (tempVec1.z <= 0) return null;
        
        const scale = camera.fov / tempVec1.z;
        result.set(
            tempVec1.x * scale + this.centerX,
            tempVec1.y * scale + this.centerY,
            tempVec1.z
        );
        
        return result;
    }
    
    // Batch triangle rendering with depth sorting
    renderTriangles(triangles, light) {
        // Sort triangles by depth (back to front)
        triangles.sort((a, b) => b.avgZ - a.avgZ);
        
        this.ctx.save();
        
        for (const triangle of triangles) {
            this.renderTriangle(triangle, light);
        }
        
        this.ctx.restore();
    }
    
    renderTriangle(triangle, light) {
        const { vertices, worldVertices, normal, color } = triangle;
        const [p1, p2, p3] = vertices;
        const [w1, w2, w3] = worldVertices;
        
        // Calculate lighting
        const center = tempVec1.set(
            (w1.x + w2.x + w3.x) / 3,
            (w1.y + w2.y + w3.y) / 3,
            (w1.z + w2.z + w3.z) / 3
        );
        
        const lightDir = tempVec2.copy(light).subtract(center).normalize();
        let intensity = Math.max(0.15, normal.dot(lightDir)); // Ambient + diffuse
        
        // Apply light color and intensity
        const r = Math.floor(Math.min(255, color.r * intensity * light.intensity));
        const g = Math.floor(Math.min(255, color.g * intensity * light.intensity));
        const b = Math.floor(Math.min(255, color.b * intensity * light.intensity));
        
        // Render triangle
        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
        this.ctx.lineTo(p3.x, p3.y);
        this.ctx.closePath();
        
        const fillColor = `rgb(${r},${g},${b})`;
        this.ctx.fillStyle = fillColor;
        this.ctx.strokeStyle = fillColor;
        this.ctx.fill();
        this.ctx.stroke();
    }
    
    // Backface culling check
    isTriangleFacing(p1, p2, p3) {
        const v1x = p2.x - p1.x;
        const v1y = p2.y - p1.y;
        const v2x = p3.x - p1.x;
        const v2y = p3.y - p1.y;
        return (v1x * v2y - v1y * v2x) > 0;
    }
    
    // Main render function
    render(shapes, camera, light) {
        // Clear screen
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.visibleTriangles.length = 0;
        
        // Process each shape
        for (const shape of shapes) {
            // Frustum culling
            if (!this.isInFrustum(shape.bounds, camera)) continue;
            
            // Project vertices
            const projectedVertices = [];
            let validVertices = 0;
            let totalZ = 0;
            
            for (const vertex of shape.vertices) {
                const projected = this.project(vertex, camera);
                projectedVertices.push(projected);
                
                if (projected) {
                    validVertices++;
                    totalZ += projected.z;
                }
            }
            
            if (validVertices === 0) continue;
            
            const avgShapeZ = totalZ / validVertices;
            
            // Process triangles
            for (let i = 0; i < shape.triangles.length; i++) {
                const triangle = shape.triangles[i];
                const [i1, i2, i3] = triangle;
                
                const p1 = projectedVertices[i1];
                const p2 = projectedVertices[i2];
                const p3 = projectedVertices[i3];
                
                if (!p1 || !p2 || !p3) continue;
                
                // Backface culling
                if (!this.isTriangleFacing(p1, p2, p3)) continue;
                
                const avgZ = (p1.z + p2.z + p3.z) / 3;
                
                this.visibleTriangles.push({
                    vertices: [p1, p2, p3],
                    worldVertices: [shape.vertices[i1], shape.vertices[i2], shape.vertices[i3]],
                    normal: shape.normals[i] || shape.normals[Math.floor(i / 2)], // Handle potential missing normals
                    color: shape.color,
                    avgZ: avgZ
                });
            }
        }
        
        // Render all visible triangles
        this.renderTriangles(this.visibleTriangles, light);
    }
}

// ===== OPTIMIZED 3D TEXT =====
class Text3D {
    constructor(text, position, options = {}) {
        this.text = text;
        this.position = position instanceof Vec3 ? position : new Vec3(position.x, position.y, position.z);
        this.fontSize = options.fontSize || 16;
        this.font = options.font || 'Arial';
        this.color = options.color || '#ffffff';
        this.backgroundColor = options.backgroundColor || null;
        this.fixedSize = options.fixedSize !== false;
        this.maxDistance = options.maxDistance || 2000;
        this.padding = options.padding || 4;
    }
    
    render(ctx, camera, renderer) {
        const projected = renderer.project(this.position, camera);
        if (!projected || projected.z > this.maxDistance) return;
        
        let scale = 1;
        if (!this.fixedSize) {
            scale = Math.max(0.1, Math.min(2, camera.fov / projected.z * 0.5));
        }
        
        const finalFontSize = Math.floor(this.fontSize * scale);
        
        ctx.save();
        ctx.font = `${finalFontSize}px ${this.font}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (this.backgroundColor) {
            const metrics = ctx.measureText(this.text);
            const width = metrics.width + this.padding * 2;
            const height = finalFontSize + this.padding * 2;
            
            ctx.fillStyle = this.backgroundColor;
            ctx.fillRect(
                projected.x - width * 0.5,
                projected.y - height * 0.5,
                width,
                height
            );
        }
        
        ctx.fillStyle = this.color;
        ctx.fillText(this.text, projected.x, projected.y);
        ctx.restore();
    }
}

// ===== OPTIMIZED CAMERA =====
class Camera extends Vec3 {
    constructor(x, y, z) {
        super(x, y, z);
        this.fov = 800;
        this.rotationX = 0;
        this.rotationY = 0;
        this.speed = 10;
        this.sensitivity = 0.002;
    }
    
    // Optimized movement with collision detection
    move(direction, shapes, deltaTime = 1) {
        const moveVector = tempVec1.copy(direction).scale(this.speed * deltaTime);
        const newPosition = tempVec2.copy(this).add(moveVector);
        
        // Simple collision detection
        const playerRadius = 20;
        let canMove = true;
        
        for (const shape of shapes) {
            const distance = newPosition.distanceTo(shape.position);
            const shapeRadius = Math.max(shape.w || shape.radius || 50, 
                                       shape.h || shape.radius || 50, 
                                       shape.d || shape.radius || 50);
            
            if (distance < shapeRadius + playerRadius) {
                canMove = false;
                break;
            }
        }
        
        if (canMove) {
            this.copy(newPosition);
        }
    }
}

// ===== MAIN OPTIMIZED ENGINE =====
class OptimizedEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.renderer = new OptimizedRenderer(this.canvas);
        this.camera = new Camera(0, 0, -500);
        this.light = new Vec3(400, 200, 100);
        this.light.intensity = 1;
        this.light.color = { r: 255, g: 255, b: 255 };
        
        this.shapes = [];
        this.texts = [];
        this.time = 0;
        this.lastTime = 0;
        this.running = false;
        
        this.keys = {};
        this.mouseX = 0;
        this.mouseY = 0;
        this.isMouseLocked = false;
        
        this.initializeScene();
        this.setupEventListeners();
    }
    
    initializeScene() {
        // Create optimized shapes
        this.shapes.push(
            new OptimizedCube({
                x: 200, y: 100, z: 300,
                w: 200, h: 200, d: 200,
                name: "back_cube",
                color: { r: 255, g: 100, b: 100 },
                subdivisions: 2
            }),
            new OptimizedCube({
                x: 400, y: 300, z: 200,
                w: 400, h: 100, d: 100,
                name: "middle_cube",
                color: { r: 100, g: 255, b: 100 },
                subdivisions: 3
            }),
            new OptimizedSphere({
                x: 0, y: 0, z: 100,
                radius: 150,
                segments: 20,
                name: "front_sphere",
                color: { r: 100, g: 100, b: 255 }
            })
        );
        
        // Create 3D text labels
        this.texts.push(
            new Text3D("Back Cube", new Vec3(200, -20, 300), {
                fontSize: 20, color: '#ff6666', backgroundColor: 'rgba(0,0,0,0.7)'
            }),
            new Text3D("Middle Cube", new Vec3(400, 220, 200), {
                fontSize: 20, color: '#66ff66', backgroundColor: 'rgba(0,0,0,0.7)'
            }),
            new Text3D("Front Sphere", new Vec3(0, -180, 100), {
                fontSize: 20, color: '#6666ff', backgroundColor: 'rgba(0,0,0,0.7)'
            })
        );
    }
    
    setupEventListeners() {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.key === 'Escape') this.isMouseLocked = false;
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        // Mouse
        this.canvas.addEventListener('click', () => {
            this.canvas.requestPointerLock();
        });
        
        document.addEventListener('pointerlockchange', () => {
            this.isMouseLocked = document.pointerLockElement === this.canvas;
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.isMouseLocked) {
                this.camera.rotationX += e.movementX * this.camera.sensitivity;
                this.camera.rotationY += e.movementY * this.camera.sensitivity;
                
                // Clamp vertical rotation
                this.camera.rotationY = Math.max(-Math.PI * 0.45, 
                                                Math.min(Math.PI * 0.45, this.camera.rotationY));
            }
        });
        
        // Resize
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.renderer.resize(this.canvas.width, this.canvas.height);
        });
    }
    
    updateInput(deltaTime) {
        const moveSpeed = 300 * deltaTime;
        
        // Calculate movement direction based on camera rotation
        const forward = new Vec3(
            Math.sin(this.camera.rotationX),
            0,
            Math.cos(this.camera.rotationX)
        );
        
        const right = new Vec3(
            Math.cos(this.camera.rotationX),
            0,
            -Math.sin(this.camera.rotationX)
        );
        
        const movement = new Vec3();
        
        if (this.keys['w']) movement.add(forward);
        if (this.keys['s']) movement.subtract(forward);
        if (this.keys['a']) movement.subtract(right);
        if (this.keys['d']) movement.add(right);
        if (this.keys['q']) movement.y -= 1;
        if (this.keys['e']) movement.y += 1;
        
        if (movement.x !== 0 || movement.y !== 0 || movement.z !== 0) {
            movement.normalize().scale(moveSpeed);
            this.camera.move(movement, this.shapes, deltaTime);
        }
    }
    
    update(deltaTime) {
        this.time += deltaTime;
        
        // Animate light
        this.light.set(
            this.renderer.centerX + Math.cos(this.time * 0.5) * 400,
            this.renderer.centerY + Math.sin(this.time * 0.65) * 200,
            Math.sin(this.time * 0.35) * 300 - 200
        );
        
        this.updateInput(deltaTime);
    }
    
    render() {
        // Render 3D scene
        this.renderer.render(this.shapes, this.camera, this.light);
        
        // Render 3D text
        for (const text of this.texts) {
            text.render(this.renderer.ctx, this.camera, this.renderer);
        }
        
        // Render UI
        this.renderUI();
    }
    
    renderUI() {
        const ctx = this.renderer.ctx;
        
        ctx.save();
        ctx.font = '16px Arial';
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(10, 10, 300, 100);
        
        ctx.fillStyle = '#ffffff';
        ctx.fillText('Optimized 3D Engine', 20, 30);
        ctx.fillText(`Camera: (${Math.floor(this.camera.x)}, ${Math.floor(this.camera.y)}, ${Math.floor(this.camera.z)})`, 20, 50);
        ctx.fillText(`Light: (${Math.floor(this.light.x)}, ${Math.floor(this.light.y)}, ${Math.floor(this.light.z)})`, 20, 70);
        ctx.fillText('Click to capture mouse, WASD to move, QE for up/down', 20, 90);
        
        ctx.restore();
    }
    
    gameLoop(currentTime) {
        if (!this.running) return;
        
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.016); // Cap at 60fps
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    start() {
        if (this.running) return;
        
        this.running = true;
        this.lastTime = performance.now();
        
        // Initialize canvas size
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.renderer.resize(this.canvas.width, this.canvas.height);
        
        // Start the game loop
        requestAnimationFrame((time) => this.gameLoop(time));
        
        console.log('Optimized 3D Engine started');
    }
    
    stop() {
        this.running = false;
        console.log('Optimized 3D Engine stopped');
    }
    
    addShape(shape) {
        this.shapes.push(shape);
        return this;
    }
    
    addText(text) {
        this.texts.push(text);
        return this;
    }
    
    removeShape(name) {
        this.shapes = this.shapes.filter(shape => shape.name !== name);
        return this;
    }
    
    getShape(name) {
        return this.shapes.find(shape => shape.name === name);
    }
    
    // Performance monitoring
    updatePerformance() {
        const now = performance.now();
        if (!this.lastFpsUpdate) this.lastFpsUpdate = now;
        
        if (now - this.lastFpsUpdate >= 1000) {
            this.fps = Math.round(1000 / (now - this.lastTime));
            this.lastFpsUpdate = now;
            
            // Update performance display if element exists
            const perfElement = document.getElementById('performance');
            if (perfElement) {
                const triangleCount = this.shapes.reduce((sum, shape) => sum + shape.triangles.length, 0);
                perfElement.innerHTML = `
                    FPS: ${this.fps}<br>
                    Triangles: ${triangleCount}<br>
                    Shapes: ${this.shapes.length}<br>
                    Camera: (${Math.floor(this.camera.x)}, ${Math.floor(this.camera.y)}, ${Math.floor(this.camera.z)})
                `;
            }
        }
    }
}

// ===== INITIALIZATION =====
let engine;

function initializeEngine() {
    // Create canvas element if it doesn't exist
    let canvas = document.getElementById('canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'canvas';
        canvas.style.cssText = 'display: block; background: linear-gradient(to bottom, #1a1a2e, #16213e);';
        document.body.appendChild(canvas);
    }
    
    // Initialize the engine
    engine = new OptimizedEngine('canvas');
    
    // Add some extra shapes for a more interesting scene
    engine.addShape(new OptimizedCube({
        x: -300, y: -200, z: 500,
        w: 150, h: 150, d: 150,
        name: "left_cube",
        color: { r: 255, g: 255, b: 100 },
        subdivisions: 1
    }));
    
    engine.addShape(new OptimizedSphere({
        x: -200, y: 200, z: 800,
        radius: 100,
        segments: 16,
        name: "far_sphere",
        color: { r: 255, g: 100, b: 255 }
    }));
    
    engine.addShape(new OptimizedCube({
        x: 0, y: -300, z: 0,
        w: 800, h: 50, d: 800,
        name: "ground",
        color: { r: 80, g: 80, b: 120 },
        subdivisions: 4
    }));
    
    // Add text labels for new shapes
    engine.addText(new Text3D("Left Cube", new Vec3(-300, -320, 500), {
        fontSize: 18, color: '#ffff66', backgroundColor: 'rgba(0,0,0,0.7)'
    }));
    
    engine.addText(new Text3D("Far Sphere", new Vec3(-200, 80, 800), {
        fontSize: 18, color: '#ff66ff', backgroundColor: 'rgba(0,0,0,0.7)'
    }));
    
    engine.addText(new Text3D("Ground Platform", new Vec3(0, -250, 0), {
        fontSize: 22, color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.8)'
    }));
    
    // Start the engine
    engine.start();
    
    // Hide loading screen
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'none';
    }
    
    return engine;
}

// Auto-initialize when the script loads
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeEngine);
    } else {
        initializeEngine();
    }
}