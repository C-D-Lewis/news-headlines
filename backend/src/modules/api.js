const images = require('./images');
const server = require('../node-common').server();

function setup() {
  server.start();
  const app = server.getExpressApp();

  app.get('/convert', images.handleImageRequest);
}

module.exports = { setup };
