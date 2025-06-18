/**
 * Market Stand class that combines multiple shapes to create a market stall
 * Fixed positioning and alignment issues
 */
class MarketStand extends Shape3D {
    constructor({
        x, y, z,
        width = 200,
        height = 150,
        depth = 100,
        name = "market_stand",
        color = DEFAULT_COLOR,
        standColor = { r: 139, g: 69, b: 19 },    // Brown for wooden stand
        roofColor = { r: 200, g: 50, b: 50 },     // Red for roof
        postColor = { r: 101, g: 67, b: 33 }      // Dark brown for posts
    }) {
        super({ x, y, z, name, color });
        
        this.width = width;
        this.height = height;
        this.depth = depth;
        this.standColor = standColor;
        this.roofColor = roofColor;
        this.postColor = postColor;
        
        // Component shapes
        this.components = [];
        
        // For collision detection (overall bounds)
        this.w = width / 2;
        this.h = height / 2;
        this.d = depth / 2;
    }

    setUp() {
        this.clearGeometry();
        this.createStandComponents();
        this.assembleComponents();
    }

    /**
     * Create all components of the market stand
     */
    createStandComponents() {
        this.components = [];
        
        // Create components in logical order from bottom to top
        this.createBasePlatform();
        this.createSupportPosts();
        this.createCounter();
        this.createSidePanels();
        this.createRoof();
    }

    /**
     * Create the base platform at ground level
     */
    createBasePlatform() {
        const platformHeight = this.height * 0.13; // 13% of total height
        
        const platform = new Cube({
            x: this.x,
            y: this.y + this.height / 2 - platformHeight / 2, // Bottom of the stand
            z: this.z,
            w: this.width,
            h: platformHeight,
            d: this.depth,
            color: this.standColor,
            name: "platform"
        });
        
        this.components.push(platform);
    }

    /**
     * Create support posts at corners
     */
    createSupportPosts() {
        const postRadius = Math.min(this.width, this.depth) * 0.04; // 4% of smaller dimension
        const postHeight = this.height * 0.53; // 53% of total height
        const platformHeight = this.height * 0.13;
        
        // Position posts at corners, inset proportionally
        const offsetX = this.width * 0.425; // 42.5% from center (85% of half-width)
        const offsetZ = this.depth * 0.425; // 42.5% from center
        
        const postPositions = [
            { x: this.x - offsetX, z: this.z - offsetZ }, // Front left
            { x: this.x + offsetX, z: this.z - offsetZ }, // Front right
            { x: this.x - offsetX, z: this.z + offsetZ }, // Back left
            { x: this.x + offsetX, z: this.z + offsetZ }  // Back right
        ];
        
        postPositions.forEach((pos, index) => {
            const post = new Cylinder({
                x: pos.x,
                y: this.y + this.height / 2 - platformHeight - postHeight / 2, // From platform up
                z: pos.z,
                radius: postRadius,
                height: postHeight,
                segments: 8,
                color: this.postColor,
                name: `post_${index}`
            });
            
            this.components.push(post);
        });
    }

    /**
     * Create counter/display surface
     */
    createCounter() {
        const counterHeight = this.height * 0.1; // 10% of total height
        const counterYOffset = this.height * 0.53; // 53% from top (same as post height)
        
        const counter = new Cube({
            x: this.x,
            y: this.y + this.height / 2 - counterYOffset, // Positioned at top of posts
            z: this.z,
            w: this.width * 0.85, // 85% of platform width
            h: counterHeight,
            d: this.depth * 0.85, // 85% of platform depth
            color: this.standColor,
            name: "counter"
        });
        
        this.components.push(counter);
    }

    /**
     * Create roof structure
     */
    createRoof() {
        const roofHeight = this.height * 0.4; // 40% of total stand height
        const roofOffset = this.height * 0.13; // 13% of height above posts
        
        // Main roof - proportionally larger than the stand base
        const roof = new Pyramid({
            x: this.x,
            y: this.y - this.height / 2 + roofOffset, // Above the entire structure
            z: this.z,
            baseWidth: this.width * 1.2, // 20% larger than base
            baseHeight: this.depth * 1.2, // 20% larger than base
            height: roofHeight,
            segments: 4, // Square pyramid roof
            color: this.roofColor,
            name: "roof"
        });
        
        this.components.push(roof);
    }

    /**
     * Create side panels for partial enclosure
     */
    createSidePanels() {
        const panelHeight = this.height * 0.4; // 40% of total height
        const panelThickness = Math.min(this.width, this.depth) * 0.04; // 4% of smaller dimension
        const panelYPosition = this.y + this.height / 2 - this.height * 0.4; // Between platform and counter
        
        // Left side panel
        const leftPanel = new Cube({
            x: this.x - this.width / 2 + panelThickness / 2,
            y: panelYPosition,
            z: this.z,
            w: panelThickness,
            h: panelHeight * 1.1,
            d: this.depth * 0.6, // 60% of total depth
            color: this.standColor,
            name: "left_panel"
        });
        
        // Right side panel
        const rightPanel = new Cube({
            x: this.x + this.width / 2 - panelThickness / 2,
            y: panelYPosition,
            z: this.z,
            w: panelThickness,
            h: panelHeight * 1.1,
            d: this.depth * 0.6, // 60% of total depth
            color: this.standColor,
            name: "right_panel"
        });
        
        // Back panel (partial)
        const backPanel = new Cube({
            x: this.x,
            y: panelYPosition,
            z: this.z + this.depth / 2 - panelThickness / 2,
            w: this.width * 0.8, // 80% of total width
            h: panelHeight * 1.1,
            d: panelThickness,
            color: this.standColor,
            name: "back_panel"
        });
        
        this.components.push(leftPanel, rightPanel, backPanel);
    }

    /**
     * Assemble all components into this shape's geometry
     */
    assembleComponents() {
        this.components.forEach(component => {
            component.setUp();
            
            // Add component's vertices with offset
            const startIndex = this.Vertices.length;
            this.Vertices.push(...component.Vertices);
            
            // Add component's triangles with index offset
            component.Triangles.forEach(triangle => {
                const offsetTriangle = triangle.map(index => index + startIndex);
                this.Triangles.push(offsetTriangle);
            });
        });
    }

    /**
     * Get a specific component by name
     */
    getComponent(name) {
        return this.components.find(component => component.name === name);
    }

    /**
     * Update component colors
     */
    updateComponentColor(componentName, newColor) {
        const component = this.getComponent(componentName);
        if (component) {
            component.color = { ...newColor };
            // Would need to rebuild geometry to see color changes
        }
    }

    /**
     * Get component positions for debugging
     */
    getComponentPositions() {
        return this.components.map(component => ({
            name: component.name,
            x: component.x,
            y: component.y,
            z: component.z,
            dimensions: {
                w: component.w || component.radius,
                h: component.h || component.height,
                d: component.d || component.radius
            }
        }));
    }

    /**
     * Static factory methods for different market stand styles
     */
    static createFruitStand(options) {
        return new MarketStand({
            ...options,
            roofColor: { r: 255, g: 165, b: 0 }, // Orange roof
            standColor: { r: 160, g: 82, b: 45 }, // Saddle brown
            name: "fruit_stand"
        });
    }

    static createFlowerStand(options) {
        return new MarketStand({
            ...options,
            roofColor: { r: 255, g: 192, b: 203 }, // Pink roof
            standColor: { r: 255, g: 255, b: 255 }, // White stand
            name: "flower_stand"
        });
    }

    static createBookStand(options) {
        return new MarketStand({
            ...options,
            roofColor: { r: 25, g: 25, b: 112 }, // Midnight blue roof
            standColor:{ r: 139, g: 69, b: 19 }, // Saddle brown
            name: "book_stand"
        });
    }
}