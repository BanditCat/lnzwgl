attribute vec4 pos;
attribute vec2 texCoord;

uniform mat4 mat;
varying vec2 tex;

void main() {
  gl_Position = mat * pos;
  tex = texCoord;
} 