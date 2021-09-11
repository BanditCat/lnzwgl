precision mediump float;

varying vec2 tex;

uniform sampler2D samp;
uniform vec4 color;

void main() {
   gl_FragColor = texture2D(samp, tex) * color;
}