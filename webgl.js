'use strict';

let lnzUtils = ( function() {
  function error( msg ) {
    document.body.innerHTML = '<div class=\'error\'><h1>Error!</h1><pre id=\'errorMsg\'></pre>';
    document.getElementById( 'errorMsg' ).innerText = msg;
    window.stop();
  }

  function compile( gl, shaders ) {
    const program = gl.createProgram();
    shaders.forEach( function( shader ) {
      gl.attachShader( program, shader );
    } );
    gl.linkProgram( program );

    const link = gl.getProgramParameter( program, gl.LINK_STATUS );
    if ( !link ) {
      error( 'Failed to link shader:' + gl.getProgramInfoLog( program ) )
      gl.deleteProgram( program );
      return null;
    }
    return program;
  }

  function getShader( gl, scriptId ) {
    let shaderType;
    const shaderScript = document.getElementById( scriptId );
    if ( shaderScript.type === 'text/glsl-fragment' ) {
      shaderType = gl.FRAGMENT_SHADER;
    } else if ( shaderScript.type === 'text/glsl-vertex' ) {
      shaderType = gl.VERTEX_SHADER;
    } else
      error( 'Unknown shader type.' );
    function loadUrl( url, callback ) {
      let request = new XMLHttpRequest();
      request.open( 'GET', url, false );
      request.addEventListener( 'load', function() {
        callback( request.responseText );
      } );
      request.send();
    }
    let res;
    loadUrl( shaderScript.src, function( source ) {
      const shader = gl.createShader( shaderType );

      gl.shaderSource( shader, source );
      gl.compileShader( shader );

      if ( !gl.getShaderParameter( shader, gl.COMPILE_STATUS ) ) {
        const err = gl.getShaderInfoLog( shader );
        error( 'Failed to compile shader \'' + shaderScript.src + '\':\n\n' + err + `\n\n` +
               source.split( '\n' ).map( ( l, i ) => `${i + 1}: ${l}` ).join( '\n' ) );
        gl.deleteShader( shader );
        return null;
      }

      res = shader;
    } );
    return res;
  }

  function compileScripts( gl, shaderScriptIds ) {
    let shaders = [];
    for ( let ii = 0; ii < shaderScriptIds.length; ++ii ) {
      shaders.push( getShader( gl, shaderScriptIds[ii] ) );
    }
    return compile( gl, shaders );
  }

  function resize( canvas, multiplier ) {
    multiplier = multiplier || 1;
    const width = document.documentElement.clientWidth * multiplier | 0;
    const height = document.documentElement.clientHeight * multiplier | 0;
    if ( canvas.width !== width || canvas.height !== height ) {
      canvas.width = width;
      canvas.height = height;
      return true;
    }
    return false;
  }

  return {
    error: error,
    compileScripts: compileScripts,
    resize: resize,
  };
}() );
