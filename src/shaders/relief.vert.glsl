varying vec2 vUv;
varying vec3 vWorldNormal;
varying float vPopFactor;
uniform float time;
uniform vec2 mousePosition;
uniform float popRadius;
uniform float popStrength;
uniform sampler2D tWatercolor;
uniform bool useWatercolorPop;

#include <common>
#include <shadowmap_pars_vertex>

void main() {
    vUv = uv;
    vec3 vPosition = position;
    vec3 vNormal = normal;
    vPopFactor = 0.0;

    if (vPosition.z > 0.) {
        vec4 clipPos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        vec2 screenUV = clipPos.xy / clipPos.w * 0.5 + 0.5;

        vec4 watercolor = texture2D(tWatercolor, screenUV);
        float luminance = dot(watercolor.rgb, vec3(0.299, 0.587, 0.114));

        float watercolorPop = 1.0 - luminance * 0.9;

        vec4 worldPos = modelMatrix * vec4(vPosition, 1.0);
        float dist = distance(worldPos.xy, mousePosition);
        float mouseInfluence = 1.0 - smoothstep(0.0, popRadius, dist);
        float mousePop = mouseInfluence * popStrength;

        vPopFactor = useWatercolorPop ? max(watercolorPop, mousePop) : mousePop;

        vPosition.z = mix(0.01, vPosition.z, vPopFactor);
        
        vPosition.y = mix(vPosition.y - 0.05 , vPosition.y, vPopFactor);
        vNormal = normalize(mix(vec3(0.0, 0.0, 1.0), normal, vPopFactor));
    }

    vec3 transformedNormal = normalMatrix * vNormal;
    vWorldNormal = normalize(mat3(modelMatrix) * vNormal);
    vec4 worldPosition = modelMatrix * vec4(vPosition, 1.0);
    #include <shadowmap_vertex>

    gl_Position = projectionMatrix * modelViewMatrix * vec4(vPosition, 1.0);
}