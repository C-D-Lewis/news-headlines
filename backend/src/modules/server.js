var express = require('express');

var ledServerClient = require('../common/led-server-client.js');
var config = require('../common/config.js');
var evtDaily = require('../common/evt-daily.js');
var images = require('./images.js');
var log = require('../common/log.js');

config.requireKeys('server.js', {
  ENV: {
    PORT: 5000
  }
});

var app = express();

function setup() {
  app.get('/convert', images.handleImageRequest);

  app.get('/status', function(req, res) {
    log.debug('Status requested.');
    ledServerClient.blink(6, [0, 0, 20]);
    evtDaily.increment();

    res.setHeader('Content-Type', 'text/html');
    res.send('OK\n');
  });

  app.listen(config.ENV.PORT, function() {
    log.debug('Node app is running at localhost:' + config.ENV.PORT);
  });
}

module.exports.setup = setup;
