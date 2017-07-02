const async = require('async');
const request = require('request');

const config = require('./config');
const log = require('./log');

config.requireKeys('boot.js', {
  ENV: {
    BOOT_URL: '',
    REQUEST_TIMEOUT_MS: 30000
  }
});

var ip = null;

function getServerUrl() {
  return new Promise((resolve, reject) => {
    if(ip !== null) return resolve(ip);

    request({
      url: config.ENV.BOOT_URL,
      timeout: config.ENV.REQUEST_TIMEOUT_MS
    }, (err, response, body) => {
      if(err) {
        log.error(err);
        log.error('Error getting boot!');
      }
      try {
        ip = JSON.parse(body).ip;
        log.info(`Server URL: ${ip}`);

        response.destroy();
        return resolve(ip);
      } catch(e) {
        log.error('Can\'t get ip from response!');
      }
    });
  });
}

module.exports = {
  getServerUrl: getServerUrl,
};
