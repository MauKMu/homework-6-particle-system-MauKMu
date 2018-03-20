#version 300 es
precision highp float;

uniform vec2 u_Dims;
uniform vec2 u_MousePos;
uniform float u_Time;

in vec4 fs_Pos;

out vec4 out_Col;

// constants
const float THRESHOLD = 1.4;
const float BLEND_EPSILON = 0.05;
const float PI = 3.14159265;

// metaball helper functions

// don't eat uncooked metaballs
float rawMetaball(vec2 p, vec2 center, float radius) {
    return radius / distance(p, center);
}

// anime metaball, or ~metaballon animé~
float aniMetaball(vec2 p, vec2 dir, float radius, float timeOffset) {
    float dist = cos(u_Time * 0.001 * PI + timeOffset) * 0.5 + 0.5;
    vec2 center = dir * dist;
    return rawMetaball(p, center, radius);
}

void main()
{
    float time = u_Time * 0.001;
    float piTime = time * PI;
    //float dist = 1.0 - (length(fs_Pos.xyz) * 2.0);
    //out_Col = vec4(dist) * fs_Col;
    // normalize position based on aspect ratio
    vec2 pos = fs_Pos.xy * vec2(u_Dims.x / u_Dims.y, 1);
    // set default color
    out_Col = vec4(pos * 0.5 * 0.2 + vec2(0.2), 0.0, 1.0);

    // draw shape around mouse cursor
    if (u_MousePos.x >= -1.0) {
        vec2 mousePos = u_MousePos * vec2(u_Dims.x / u_Dims.y, 1);
        vec2 p = pos - mousePos; // now p is in mousePos-space
        vec2 diff = mousePos - pos;
        float metaSum = 0.0;
        metaSum += rawMetaball(p, vec2(0), 0.16);
        metaSum += aniMetaball(p, vec2(0, 0.3), 0.08, 0.0);
        vec3 BALL_COLOR = vec3(out_Col.xy, 1.0);

        if (metaSum >= THRESHOLD) {
            out_Col.xyz = mix(out_Col.xyz, BALL_COLOR, smoothstep(0.0, BLEND_EPSILON, metaSum - THRESHOLD));
        }

        /*
        float metaDist = distance(mousePos, pos) * 5.0;
        metaDist += distance(mousePos + vec2(0.0, 0.6 + 0.3 * sin(piTime)), pos);
        float angle = atan(diff.y, diff.x);
        //float upperBound = (angle > PI * 0.8) ? 0.5 : 0.12;
        //float upperBound = (0.5 + 0.5 * sin(6.0 * PI * smoothstep(PI * 0.8, PI, angle))) * 0.4 + 0.11;
        //float upperBound = (0.5 + 0.5 * sin(6.0 * PI * smoothstep(-PI, PI, angle))) * 0.4 + 0.11;
        float f = 1.0 - smoothstep(0.82, 1.2, metaDist);
        //float f = 1.0 - smoothstep(0.08, upperBound, distance(pos, mousePos));
        out_Col.z = f;
        */

    }
}

/*

const float PI = 3.14159265;
const vec3 BG_COLOR = vec3(1.0);
const vec3 BALL_COLOR = vec3(0.1);
const float THRESHOLD = 3.4;
const float BLEND_EPSILON = 0.05;

const float DIR_LEN = 0.75;
const float HALF_SQRT2 = 0.70710678118;
const vec2 DIR1 = (vec2(+0.0, +1.0)) * DIR_LEN;
const vec2 DIR2 = (vec2(-HALF_SQRT2, +HALF_SQRT2)) * DIR_LEN;
const vec2 DIR3 = (vec2(-1.0, +0.0)) * DIR_LEN;
const vec2 DIR4 = (vec2(-HALF_SQRT2, -HALF_SQRT2)) * DIR_LEN;
const vec2 DIR5 = (vec2(+0.0, -1.0)) * DIR_LEN;
const vec2 DIR6 = (vec2(+HALF_SQRT2, -HALF_SQRT2)) * DIR_LEN;
const vec2 DIR7 = (vec2(+1.0, +0.0)) * DIR_LEN;
const vec2 DIR8 = (vec2(+HALF_SQRT2, +HALF_SQRT2)) * DIR_LEN;
// some browsers don't like normalize() in const declarations?

const float TIME_OFFSET = -PI * 0.25;

// can switch to fixed value for easier debugging/tweaking (a.k.a TOKI YO TOMARE)
// can also change general speed with this
#define U_TIME (iTime * 0.44)

// don't eat uncooked metaballs
float rawMetaball(vec2 p, vec2 center, float radius) {
    return radius / distance(p, center);
}

// anime metaball, or ~metaballon animé~
float aniMetaball(vec2 p, vec2 dir, float radius, float timeOffset) {
    float dist = cos(U_TIME * PI + timeOffset) * 0.5 + 0.5;
    //dist = pow(dist, 1.1);
    vec2 center = dir * dist;
    return rawMetaball(p, center, radius);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord / iResolution.xy;

    vec2 p = uv * 2.0 - 1.0;
    p.x *= iResolution.x / iResolution.y;

    float metaSum = 0.0;
    metaSum += rawMetaball(p, vec2(0.0), 0.08);
    metaSum += aniMetaball(p, DIR1, 0.16, 0.0);
    metaSum += aniMetaball(p, DIR2, 0.16, TIME_OFFSET);
    metaSum += aniMetaball(p, DIR3, 0.16, TIME_OFFSET * 2.0);
    metaSum += aniMetaball(p, DIR4, 0.16, TIME_OFFSET * 3.0);
    metaSum += aniMetaball(p, DIR5, 0.16, TIME_OFFSET * 4.0);
    metaSum += aniMetaball(p, DIR6, 0.16, TIME_OFFSET * 5.0);
    metaSum += aniMetaball(p, DIR7, 0.16, TIME_OFFSET * 6.0);
    metaSum += aniMetaball(p, DIR8, 0.16, TIME_OFFSET * 7.0);

    vec3 col = vec3(1.0);

    if (metaSum >= THRESHOLD) {
        col = mix(BG_COLOR, BALL_COLOR, smoothstep(0.0, BLEND_EPSILON, metaSum - THRESHOLD));
    }

    // Output to screen
    fragColor = vec4(col, 1.0);
}
*/