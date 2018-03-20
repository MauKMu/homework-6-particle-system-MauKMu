#version 300 es

in vec4 vs_Pos; // Non-instanced; each particle is the same quad drawn in a different place

out vec4 fs_Pos;

void main()
{
    //vec4 pos = vec4(vs_Pos.xy * 2.0, 1.0, 1.0);
    fs_Pos = vs_Pos;

    gl_Position = vs_Pos;
}
