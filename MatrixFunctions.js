const projectionMatrix = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1]
];

const rotZMatrix = (angle) => {
    return [
        [Math.cos(angle), -Math.sin(angle), 0],
        [Math.sin(angle), Math.cos(angle), 0],
        [0, 0, 1]
    ];
}

const rotYMatrix = (angle) => {
    return [
        [Math.cos(angle), 0, Math.sin(angle)],
        [0, 1, 0],
        [-Math.sin(angle), 0, Math.cos(angle)]
    ];
}

const rotXMatrix = (angle) => {
    return [
        [1, 0, 0],
        [0, Math.cos(angle), -Math.sin(angle)],
        [0, Math.sin(angle), Math.cos(angle)]
    ];
}

function MatrixTimesVector(m, v) {
    const {x, y, z} = v;
    return {
        x: m[0][0] * x + m[0][1] * y + m[0][2] * z,
        y: m[1][0] * x + m[1][1] * y + m[1][2] * z,
        z: m[2][0] * x + m[2][1] * y + m[2][2] * z
    }
}

function vectorSubtract(a, b) {
    if (!a || !b) return { x: 0, y: 0, z: 0 };
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function vectorCross(a, b) {
    if (!a || !b) return { x: 0, y: 0, z: 0 };
    return {
        x: a.y * b.z - a.z * b.y,
        y: a.z * b.x - a.x * b.z,
        z: a.x * b.y - a.y * b.x
    };
}

function vectorNormalize(v) {
    if (!v) return { x: 0, y: 0, z: 0 };
    const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    if (length === 0) return { x: 0, y: 0, z: 0 };
    return { x: v.x / length, y: v.y / length, z: v.z / length };
}

function vectorDot(a, b) {
    if (!a || !b) return 0;
    return a.x * b.x + a.y * b.y + a.z * b.z;
}