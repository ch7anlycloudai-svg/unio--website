/**
 * Root server file for Hostinger deployment
 * This file loads the actual server from backend/
 */

const path = require('path');

// Change working directory to backend for proper path resolution
process.chdir(path.join(__dirname, 'backend'));

// Now require the server (path is relative to new working directory)
require('./server.js');
