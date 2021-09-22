'use strict';

function main() {
    let canvas = document.querySelector( '#canvas' );
    let gl = canvas.getContext( 'webgl2' );
    if ( !gl ) {
        lnzUtils.error( 'Failed to get WebGL 2 context!' );
    }

    let prog = lnzUtils.compileScripts( gl, [ 'vert', 'frag' ] );

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
        const data = new Uint8Array( [ 0, 8, 16, 24, 32, 0, 255, 255, 255, 32, 0, 8, 255, 24, 32, 0, 8, 255, 24, 32, 0, 8, 16, 24, 32 ] );
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
    gl.vertexAttribPointer( texcoordLoc, 2, gl.FLOAT, false, 0, 0
    let matrix = new Float32Array( [ 1 / aspect, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.1, 0, ( time % 1 ) / 2, 0, 1, 1 ] );
        gl.uniformMatrix4fv( matrixLoc, false, matrix ); gl.uniform1i( textureLoc, 0 ); gl.uniform4fv( colorMultLoc, [ 1, 1, 0, 1 ] );
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
    let positions = new Float32Array( [ -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5 ] );
    gl.bufferData( gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW );
}

function setTexcoords( gl ) {
    gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( [ 0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 0 ] ), gl.STATIC_DRAW );
}

main();



////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////// HELP /////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
// Click the object to control with the mouse.                                //
// Press escape to release.                                                   //
// Right click to move.                                                       //
// Click and drag horizontally to change the axes of rotation.                //
// Pressing ctrl-enter attempts to run the script displayed here.             //
//                                                                            //
// The code here must create a function points to generate n-dimensional      //
// points, a function edges that produces an array of pairs of indices into   //
//  points. The function must also include a function edgeColors, with an rgb //
// array for each edge, or a function pointColors, for per-vertex coloring.   //
// An optional function, runOnce, may be included with a initialization       //
// routine. These must be bundled into an object and returned.                //
//                                                                            //
// Available functions:                                                       //
//   hsv2rgb( h, s, v )                                                       //
//     Takes a hue between 0 and 360, and a saturation and value              //
//     between 0 and 1, and converts it into a 3 element rgb array            //
//   shl( x, hightbit )                                                       //
//     This returns x shifted left one bit (i.e. divided by two),             //
//     and adds highbit if the low bit was set.                               //
//   log( msg )                                                               //
//     It's better than bad, it's good! msg may contain html.                 //
//                                                                            //
// Uncomment these lines to get a list of variables accessible through prmtr. //
// { let s = ""; for(const o in prmtr)
//                 s += 'prmtr.' + o + ' = ' + prmtr[o] + '<br>';
//   log(s); }
//                                                                            //
// You can add extra parameters like this   ↓                                 //
////////////////////////////////////////////////////////////////////////////////
function runOnce() {
    prmtr.add( { displayFunc : ( v => 'Saturation: ' + v ), name : 'sat', min : 0, max : 1, default : 0.5, step : 0.01 } );
    prmtr.add( { displayFunc : ( v => 'Grid segments: ' + v ), name : 'gridSegs', min : 3, max : 16, default : 5, step : 1 } );
    prmtr.dim = 5;
    prmtr.lineWidth = 0.3;
}


function points() {
    let nps = [...Array( s ).keys() ].map( e => [ e * 2 / ( s - 1 ) - 1 ] );
    let ps = nps;
    for ( let d = 1; d < prmtr.dim; ++d ) nps = nps.flatMap( e => ps.map( f => e.concat( f ) ) );
    return ps;
}

function edges() {
    let es = [ [ 0, prmtr.gridSegs - 1 ] ];
    for ( let d = 1; d < prmtr.dim; ++d ) {
        es = [...Array( s ).keys() ].flatMap( e => es.map( f => f.map( g => g + e * s * es.length ) ) )
    }

    let fmod = x => Math.floor( x / s ) + ( x % s ) * ( s ** ( prmtr.dim - 1 ) );
    let nes = [];
    for ( let d = 0; d < prmtr.dim; ++d ) {
        nes = nes.concat( es.map( e => e.concat( hsv2rgb( d * 360 / prmtr.dim, prmtr.sat, 1 ) ) ) );
        es = es.map( ( e, k ) => [ fmod( e[ 0 ] ), fmod( e[ 1 ] ) ] );
    }
    return es;
}


return { points : points, edges : edges, runOnce : runOnce, pointColors : pointColors };



let s = prmtr.gridSegs;
let nedges = [];
let npoints = points = [...Array( s ).keys() ].map( e => [ e * 2 / ( s - 1 ) - 1 ] );
edges = [ [ 0, s - 1 ] ];
for ( let d = 1; d < prmtr.dim; ++d ) {
    npoints = npoints.flatMap( e => points.map( f => e.concat( f ) ) );
    edges = [...Array( s ).keys() ].flatMap( e => edges.map( f => f.map( g => g + e * s * edges.length ) ) )
}

let fmod = x => Math.floor( x / s ) + ( x % s ) * ( s ** ( prmtr.dim - 1 ) );
nedges = [];
for ( let d = 0; d < prmtr.dim; ++d ) {
    nedges = nedges.concat( edges.map( e => e.concat( hsv2rgb( d * 360 / prmtr.dim, prmtr.sat, 1 ) ) ) );
    edges = edges.map( ( e, k ) => [ fmod( e[ 0 ] ), fmod( e[ 1 ] ) ] );
}
edges = nedges;
points = npoints;
