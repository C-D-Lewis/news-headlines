const async = require('async');
const request = require('request');

const config = require('./config.js');
const log = require('./log.js');

config.requireKeys('boot.js', {
  ENV: {
    BOOT_URL: '',
    REQUEST_TIMEOUT_MS: 30000
  }
});

var ip = null;

function getUrl() {
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

function getServerUrl() {
  return getUrl();
}

function refresh() {
  ip = null;
  return new Promise((resolve, reject) => {
    async.retry({
      times: 60,
      interval: 60000
    }, (done) => {
      log.info('Retrying...');
      getUrl()
        .then(() => done(null, null))
        .catch((err) => done(err, null));
    }, (err, results) => resolve());  
  });
}

module.exports = {
  getServerUrl: getServerUrl,
  refresh: refresh
};
