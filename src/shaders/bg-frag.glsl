#version 300 es
precision highp float;

uniform vec2 u_Dims;
uniform vec2 u_MousePos;
uniform float u_Time;
uniform int u_MouseButtons;

in vec4 fs_Pos;

out vec4 out_Col;

// constants
const float THRESHOLD = 8.4;
const float BLEND_EPSILON = 0.05;
const float PI = 3.14159265;

const float TIME_OFFSET = -PI * 0.25;

const float DIR_LEN = 0.12;
const float HALF_SQRT2 = 0.70710678118;
const vec2 DIR1 = (vec2(+0.0, +1.0)) * DIR_LEN;
const vec2 DIR2 = (vec2(-HALF_SQRT2, +HALF_SQRT2)) * DIR_LEN;
const vec2 DIR3 = (vec2(-1.0, +0.0)) * DIR_LEN;
const vec2 DIR4 = (vec2(-HALF_SQRT2, -HALF_SQRT2)) * DIR_LEN;
const vec2 DIR5 = (vec2(+0.0, -1.0)) * DIR_LEN;
const vec2 DIR6 = (vec2(+HALF_SQRT2, -HALF_SQRT2)) * DIR_LEN;
const vec2 DIR7 = (vec2(+1.0, +0.0)) * DIR_LEN;
const vec2 DIR8 = (vec2(+HALF_SQRT2, +HALF_SQRT2)) * DIR_LEN;

// metaball helper functions

// don't eat uncooked metaballs
float rawMetaball(vec2 p, vec2 center, float radius) {
    return radius / distance(p, center);
}

// anime metaball, or ~metaballon animé~
float aniMetaball(vec2 p, vec2 dir, float radius, float timeOffset) {
    float dist = cos(u_Time * 0.002 * PI + timeOffset) * 0.5 + 0.5;
    vec2 center = dir * dist;
    return rawMetaball(p, center, radius);
}

// noise helper functions

// from Adam's demo
vec2 random2(vec2 p) {
    //vec2 sinVec = sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))));
    //return sinVec * 0.5 + vec2(0.5);
    //return fract(sinVec * 123.45);
    //return fract(sinVec * 43758.5453);
    return normalize(2.0 * fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))))*123.45) - 1.0);
}

float surflet(vec2 P, vec2 gridPoint)
{
    //return (P.x * P.x) * 0.07;
    // Compute falloff function by converting linear distance to a polynomial
    float distX = abs(P.x - gridPoint.x);
    float distY = abs(P.y - gridPoint.y);
    float tX = 1.0 - 6.0 * pow(distX, 5.0) + 15.0 * pow(distX, 4.0) - 10.0 * pow(distX, 3.0);
    float tY = 1.0 - 6.0 * pow(distY, 5.0) + 15.0 * pow(distY, 4.0) - 10.0 * pow(distY, 3.0);

    // Get the random vector for the grid point
    vec2 gradient = random2(gridPoint);
    // Get the vector from the grid point to P
    vec2 diff = P - gridPoint;
    // Get the value of our height field by dotting grid->P with our gradient
    float height = dot(diff, gradient);
    // Scale our height field (i.e. reduce it) by our polynomial falloff function
    return height * tX * tY;
}

float PerlinNoise(vec2 uv)
{
    // Tile the space
    vec2 uvXLYL = floor(uv);
    vec2 uvXHYL = uvXLYL + vec2(1, 0);
    vec2 uvXHYH = uvXLYL + vec2(1, 1);
    vec2 uvXLYH = uvXLYL + vec2(0, 1);

    return surflet(uv, uvXLYL) + surflet(uv, uvXHYL) + surflet(uv, uvXHYH) + surflet(uv, uvXLYH);
}


float normalizedPerlinNoise(vec2 v) {
    return clamp(0.0, 1.0, PerlinNoise(v) + 0.5);
}

/* FBM (uses Perlin) */
float getFBM(vec2 pt, float startFreq) {
    float noiseSum = 0.0;
    float amplitudeSum = 0.0;
    float amplitude = 1.0;
    float frequency = startFreq;
    for (int i = 0; i < 4; i++) {
        float perlin = normalizedPerlinNoise(pt * frequency);
        noiseSum += perlin * amplitude;
        amplitudeSum += amplitude;
        amplitude *= 0.5;
        frequency *= 2.0;
    }
    return noiseSum / amplitudeSum;
}

// "normalizes" coordinate before calling FBM
float getFBMFromRawPosition(vec2 pos, float startFreq) {
    vec2 coord = pos / 150.0;
    coord += vec2(3.14, 5.01);// +vec2(u_PerlinSeed);
    //return pow(sin(coord.x + coord.y), 2.0);
    return getFBM(coord, startFreq);
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
    float fbm = getFBMFromRawPosition((pos + vec2(9.91) + vec2(u_Time * 0.0003, u_Time * 0.000001)) * 18.0 * (1.0 + 0.25 * cos(u_Time * 0.00008)), 2.0);
    // remap FBM because it's apparently in [0.25, 0.65]
    fbm = pow(clamp(0.0, 1.0, (fbm - 0.25) / 0.6), 2.2) * 0.5;
    out_Col = vec4(vec3(fbm), 1.0);

    // draw shape around mouse cursor
    if (u_MousePos.x >= -1.0) {
        vec2 mousePos = u_MousePos * vec2(u_Dims.x / u_Dims.y, 1);
        vec2 p = pos - mousePos; // now p is in mousePos-space
        // rotate over time
        float angle = u_Time * 0.003;
        float c = cos(angle);
        float s = sin(angle);
        mat2 rot = mat2(
            c, s,
            -s, c
        );
        p = rot * p;
        //vec2 diff = mousePos - pos;
        float metaSum = 0.0;
        metaSum += rawMetaball(p, vec2(0), 0.16);
        metaSum += aniMetaball(p, DIR1, 0.08, 0.0);
        metaSum += aniMetaball(p, DIR2, 0.08, TIME_OFFSET);
        metaSum += aniMetaball(p, DIR3, 0.08, TIME_OFFSET * 2.0);
        metaSum += aniMetaball(p, DIR4, 0.08, TIME_OFFSET * 3.0);
        metaSum += aniMetaball(p, DIR5, 0.08, TIME_OFFSET * 4.0);
        metaSum += aniMetaball(p, DIR6, 0.08, TIME_OFFSET * 5.0);
        metaSum += aniMetaball(p, DIR7, 0.08, TIME_OFFSET * 6.0);
        metaSum += aniMetaball(p, DIR8, 0.08, TIME_OFFSET * 7.0);
        vec3 BALL_COLOR = out_Col.xyz;
        BALL_COLOR.z = ((u_MouseButtons & 1) != 0) ? (1.0) : BALL_COLOR.z;
        BALL_COLOR.x = ((u_MouseButtons & 2) != 0) ? (1.0) : BALL_COLOR.x;

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