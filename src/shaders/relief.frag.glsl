varying vec2 vUv;
varying vec3 vWorldNormal;
varying float vPopFactor;

uniform float envMapIntensity;
uniform sampler2D envMap;
uniform float time;
uniform float grainIntensity;

#include './grain.glsl';

#include <common>
#include <packing>
#include <lights_pars_begin>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
#include <cube_uv_reflection_fragment>

void main() {
    vec3 worldNormal = normalize(vWorldNormal);
    
    vec3 envColor = textureCubeUV(envMap, worldNormal, 1.0).rgb;

    vec3 baseColor = vec3(0.993,0.93,0.93) * 0.32;
    vec3 color = baseColor * (1.0 + envColor * envMapIntensity);

    float shadowMask = getShadowMask();

    vec3 shadowColor = vec3(0.0, 0.016, 0.208);

    vec3 finalColor = mix(
        color * shadowColor * 0.5,
        color,
        shadowMask
    );

    float n = grain(vUv * 1000.0, 1.0) * 2.0 - 1.0;
    finalColor -= n * grainIntensity;

    gl_FragColor = vec4(finalColor, 1.0);
}