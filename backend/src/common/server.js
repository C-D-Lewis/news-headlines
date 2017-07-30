const express = require('express');

const config = require('./config');
const log = require('./log');

config.requireKeys('server.js', {
  SERVER: {
    PORT: 5000
  }
});

var app;

function start() {
  app = express();

  app.get('/status', (req, res) => {
    log.info('<< /status');
    res.status(200);
    res.send('OK\n');
    log.info('>> 200 OK');
  });
  
  app.listen(config.SERVER.PORT, () => log.info(`Express server up on ${config.SERVER.PORT}`));
}

function validatePayload(res, payload, spec) {
  const valid = config.compareObject('Request payload', 'root', spec, payload, false);
  if(!valid) {
    res.status(400);
    res.send('Bad request\n');
    log.info('>> 400 Bad Request');
  }
  return valid;
}

function getExpressApp() { return app; }

module.exports = {
  start: start,
  getExpressApp: getExpressApp,
  validatePayload: validatePayload
};
