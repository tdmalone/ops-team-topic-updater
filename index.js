/**
 * Starts an HTTP server for the Ops Team Topic Updater.
 *
 * @author Tim Malone <tdmalone@gmail.com>
 */

'use strict';

const PORT = process.env.PORT || 80;

const express = require( 'express' ),
      app = require( './src/app' );

/**
 * Bootstraps the app by starting up an Express HTTP server.
 */
const bootstrap = () => {

  const server = express();
  server.get( '/', app.handler );

  return server.listen( PORT, () => {
    console.log( 'Listening on port ' + PORT + '.' );
  });

};

// If module was called directly, bootstrap now.
if ( require.main === module ) {
  bootstrap();
}

module.exports = bootstrap;
