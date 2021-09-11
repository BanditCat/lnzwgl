'use strict';

function main() {
  let canvas = document.querySelector( '#canvas' );
  let gl = canvas.getContext( 'webgl2' );
  if ( !gl ) {
    lnzUtils.error( 'Failed to get WebGL 2 context!' );
  }

  let prog = lnzUtils.compileScripts( gl, ['vert', 'frag'] );

  let texcoordLoc = gl.getAttribLocation( prog, 'texCoord' );
  let positionLoc = gl.getAttribLocation( prog, 'pos' );

  let matrixLoc = gl.getUniformLocation( prog, 'mat' );
  let textureLoc = gl.getUniformLocation( prog, 'samp' );
  let colorMultLoc = gl.getUniformLocation( prog, 'color' );

  let positionBuffer = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, positionBuffer );
  setGeometry( gl );

  let texcoordBuf = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, texcoordBuf );
  setTexcoords( gl );

  let texture = gl.createTexture();
  gl.bindTexture( gl.TEXTURE_2D, texture );

  {
    const data = new Uint8Array( [0, 8, 16, 24, 32, 0, 255, 255, 255, 32, 0, 8, 255, 24, 32, 0, 8, 255, 24, 32, 0, 8, 16, 24, 32] );
    gl.pixelStorei( gl.UNPACK_ALIGNMENT, 1 );
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.LUMINANCE, 5, 5, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, data );

    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
  }

  const rttWidth = 256;
  const rttHeight = 256;
  const targetTexture = gl.createTexture();
  gl.bindTexture( gl.TEXTURE_2D, targetTexture );

  gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, rttWidth, rttHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null );

  gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR );
  gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE );
  gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE );

  const fb = gl.createFramebuffer();
  gl.bindFramebuffer( gl.FRAMEBUFFER, fb );

  const attachmentPoint = gl.COLOR_ATTACHMENT0;
  const level = 0;
  gl.framebufferTexture2D( gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, targetTexture, level );

  const depthBuffer = gl.createRenderbuffer();
  gl.bindRenderbuffer( gl.RENDERBUFFER, depthBuffer );

  gl.renderbufferStorage( gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, rttWidth, rttHeight );
  gl.framebufferRenderbuffer( gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer );

  let then = 0;

  requestAnimationFrame( drawScene );

  function drawCube( aspect, time ) {
    gl.useProgram( prog );
    gl.enableVertexAttribArray( positionLoc );
    gl.bindBuffer( gl.ARRAY_BUFFER, positionBuffer );
    gl.vertexAttribPointer( positionLoc, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( texcoordLoc );
    gl.bindBuffer( gl.ARRAY_BUFFER, texcoordBuf );
    gl.vertexAttribPointer( texcoordLoc, 2, gl.FLOAT, false, 0, 0 );

    let matrix = new Float32Array( [1 / aspect, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.1, 0, ( time % 1 ) / 2, 0, 1, 1] );
    gl.uniformMatrix4fv( matrixLoc, false, matrix );
    gl.uniform1i( textureLoc, 0 );
    gl.uniform4fv( colorMultLoc, [1, 1, 0, 1] );
    gl.drawArrays( gl.TRIANGLES, 0, 6 );
  }

  function drawScene( time ) {
    time *= 0.001;
    let deltaTime = time - then;
    then = time;

    lnzUtils.resize( gl.canvas, 1 );

    gl.disable( gl.CULL_FACE );
    gl.enable( gl.DEPTH_TEST );
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;

    gl.bindFramebuffer( gl.FRAMEBUFFER, fb );
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.viewport( 0, 0, rttWidth, rttHeight );
    gl.clearColor( 0, .8, 1, 1 );
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    drawCube( 1, time );

    gl.bindFramebuffer( gl.FRAMEBUFFER, null );
    gl.bindTexture( gl.TEXTURE_2D, targetTexture );
    gl.viewport( 0, 0, gl.canvas.width, gl.canvas.height );
    gl.clearColor( 0.3, 1, 1, 1 );
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    drawCube( aspect, time );

    requestAnimationFrame( drawScene );
  }
}

function setGeometry( gl ) {
  let positions = new Float32Array( [-0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5] );
  gl.bufferData( gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW );
}

function setTexcoords( gl ) {
  gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( [0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 0] ), gl.STATIC_DRAW );
}

main();