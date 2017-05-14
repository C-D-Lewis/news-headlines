var request = require('request');

var config = require('./config.js');
var log = require('./log.js');

config.requireKeys('boot.js', {
  ENV: {
    BOOT_URL: '',
    REQUEST_TIMEOUT_MS: 30000
  }
});

var serverUrl = null;

function getServerUrl(cb) {
  if(serverUrl !== null) {
    cb(serverUrl);
    return;
  }

  request({
    url: config.ENV.BOOT_URL,
    timeout: config.ENV.REQUEST_TIMEOUT_MS
  }, function(err, response, body) {
    if(err) {
      log.error(err);
      log.fatal('Error getting boot!');
    }

    if(!body) {
      log.error('No body!');
      log.fatal('Can\'t get boot!');
    }

    serverUrl = JSON.parse(body).ip;
    log.info('Server URL: ' + serverUrl);

    response.destroy();
    cb(serverUrl);
  });
}

module.exports.getServerUrl = getServerUrl;
