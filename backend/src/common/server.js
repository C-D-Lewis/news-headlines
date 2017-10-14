const express = require('express');

const config = require('./config');
const compare = require('./compare');
const log = require('./log');

config.requireKeys('server.js', {
  SERVER: {
    PORT: 5000
  }
});

let app;

function respondOk(res) {
  res.status(200);
  res.send('OK\n');
}

function status(req, res) {
  log.info('<< /status');
  res.status(200);
  res.send('OK\n');
  log.info('>> 200 OK');
};

function start() {
  app = express();
  app.get('/status', status);
  app.listen(config.SERVER.PORT, () => log.info(`Express server up on ${config.SERVER.PORT}`));
}

function requirePayload(res, payload, spec) {
  const valid = compare('Request payload', 'root', spec, payload, false);
  
  if(!valid) {
    res.status(400);
    res.send('Bad Request\n');
    log.info('>> 400 Bad Request');
  }
  
  return valid;
}

function getExpressApp() { return app; }

module.exports = {
  start: start,
  getExpressApp: getExpressApp,
  requirePayload: requirePayload,
  respondOk: respondOk
};
