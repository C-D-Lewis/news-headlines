const express = require('express');

const ledServerClient = require('../common/led-server-client.js');
const config = require('../common/config.js');
const evtDaily = require('../common/evt-daily.js');
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
    ledServerClient.blink(6, [0, 0, 20]);
    evtDaily.increment();

    res.setHeader('Content-Type', 'text/html');
    res.send('OK\n');
  });

  app.listen(config.ENV.PORT, function() {
    log.debug(`Express app is running at localhost:${config.ENV.PORT}`);
  });
}

module.exports = {
  setup: setup
};
