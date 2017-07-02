const express = require('express');

const config = require('../common/config.js');
const images = require('./images.js');
const log = require('../common/log.js');

config.requireKeys('server.js', {
  ENV: {
    PORT: 5000
  }
});

const app = express();

function setup() {
  app.get('/convert', images.handleImageRequest);

  app.get('/status', (req, res) => {
    log.debug('Status requested.');
    res.status(200);
    res.send('OK\n');
  });

  app.listen(config.ENV.PORT, () => log.debug(`Express app is running on ${config.ENV.PORT}`));
}

module.exports = {
  setup: setup
};
