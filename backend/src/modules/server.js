var express = require('express');

var activityServerClient = require('../common/activity_server_client.js');
var config = require('../../config.json');
var images = require('./images.js');
var log = require('../common/log.js');

var app = express();

function setup() {
  app.get('/convert', images.handleImageRequest);

  app.get('/status', function(req, res) {
    log.debug('Status requested.');
    activityServerClient.post();

    res.setHeader('Content-Type', 'text/html');
    res.send('OK\n');
  });

  app.listen(config.ENV.PORT, function() {
    log.debug('Node app is running at localhost:' + config.ENV.PORT);
  });
}

module.exports.setup = setup;
