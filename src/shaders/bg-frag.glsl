#version 300 es
precision highp float;

uniform vec2 u_Dims;
uniform vec2 u_MousePos;

in vec4 fs_Pos;

out vec4 out_Col;

void main()
{
    //float dist = 1.0 - (length(fs_Pos.xyz) * 2.0);
    //out_Col = vec4(dist) * fs_Col;
    // normalize position based on aspect ratio
    vec2 pos = fs_Pos.xy * vec2(u_Dims.x / u_Dims.y, 1);
    // set default color
    out_Col = vec4(pos * 0.5 + vec2(0.5), 0.0, 1.0);

    // draw shape around mouse cursor
    if (u_MousePos.x >= -1.0) {
        vec2 mousePos = u_MousePos * vec2(u_Dims.x / u_Dims.y, 1);
        if (distance(pos, mousePos) < 0.1) {
            out_Col.z = 1.0;
        }
    }
}
