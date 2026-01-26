uniform sampler2D tWatercolor;
uniform vec3 overlayColor;
uniform float time;
uniform float grainIntensity;
varying vec2 vUv;

#include './grain.glsl';

void main() {
    vec4 watercolor = texture2D(tWatercolor, vUv);
    
    float luminance = dot(watercolor.rgb, vec3(0.299, 0.587, 0.114));

    float n = grain(vUv * 10.0, time) * 2.0 - 1.0;
    vec3 grainedColor = overlayColor - n * grainIntensity;

    gl_FragColor = vec4(grainedColor, luminance);
}
