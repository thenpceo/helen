// Film grain noise function
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float grain(vec2 uv, float t) {
    return hash(uv + fract(t));
}