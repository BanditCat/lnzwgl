'use strict';

class State {
        constructor( readSize, writeReadSize, outFunc, nextFunc, readOffsetFunc, writeOffsetFunc ) {
                this.readSize = readSize;
                this.writeReadSize = writeReadSize;
                this.count = 1 << ( 8 * ( readSize + writeReadSize ) );
                let map = new Uint32Array( this.count );
                let outt = new Uint8Array[ 7 ];
                for ( let i = 0; i < this.count; ++i ) {
                        let out = outFunc( i );
                        let outc = out.size();
                        for ( let i = 0; i < outc; ++i ) outt[ i ] = out[ i ];
                        let next = nextFunc( i );
                        let readOffset = readOffsetFunc( i );
                        let writeOffset = writeOffsetFunc( i );
                        let addr = i * 4;
                        map[ addr ] = ( next << 16 ) + writeOffset;
                        map[ addr + 1 ] = readOffset;
                        map[ addr + 2 ] = ( outc << 24 ) + ( outt[ 0 ] << 16 ) + ( outt[ 1 ] << 8 ) + ( outt[ 2 ] );
                        map[ addr + 3 ] = ( outt[ 3 ] << 24 ) + ( outt[ 4 ] << 16 ) + ( outt[ 5 ] << 8 ) + ( outt[ 6 ] );
                }
                this.map = map;
        }
}

class Machine {
        constructor( size, cores, stateTable ) {
                // Make sure size is at least big enough for core ids.
                if ( size < 4 || cores >= 2 ** 32 ) {
                        error( 'Invalid machine size or core count!' );
                }
                this.size = size;
                this.cores = cores;
                this.memsize = size * cores;
                this.states = new Uint32Array( cores * 2 );
                this.stateArray = [];
                this.statePointers = [];
                for ( let i = 0; i < stateTable.size(); ++i ) {
                        this.statePointers.push( this.stateArray.size() );
                        this.stateArray = this.stateArray.concat( stateTable[ i ].map );
                }
                this.stateArray = Uint32Array.from( this.stateArray );
                this.statePointers = Uint32Array.from( this.statePointers );

                this.mem = new Int8Array( this.memsize );
                for ( let i = 0; i < cores; ++i ) {
                        let coreId = i;
                        for ( let j = 0; j < 4; ++j ) {
                                this.mem[ i * size + j ] = coreId & 255;
                                coreId >>= 8;
                        }
                }
        }
        function tick() {
                for ( let i = 0; i < this.cores; ++i ) {
                        let read = this.readPointers[ i ];
                        let write = this.writePointers[ i ] + read;
                        let state = this.stateTable[ this.states[ i ] ];
                        let addr = 0;
                        let shift = 0;
                        for ( let i = 0; i < state.readSize; ++i ) {
                                addr += ( this.mem[ read + i ] << shift );
                                shift += 8;
                        }
                        for ( let i = 0; i < state.writeReadSize; ++i ) {
                                addr += ( this.mem[ write + i ] << shift );
                                shift += 8;
                        }
                        let res = state.map[ addr ];
                        let next = state.next[ addr ];
                }
        }
}