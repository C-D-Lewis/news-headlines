const request = require('request');

const boot = require('./boot.js');
const config = require('./config.js');
const log = require('./log.js');

config.requireKeys('plural.js', {
  ENV: {
    REQUEST_TIMEOUT_MS: 30000
  },
  PORTS: {
    PLURAL: 5550
  }
});

function post(channel, message) {
  boot.getServerUrl().then((serverUrl) => {
    const data = {
      channel: channel,
      message: message
    };
    log.info(`Calling Plural with: ${JSON.stringify(data)}`);

    try {
      request.post({
        url: `http://${serverUrl}:${config.PORTS.PLURAL}/post`,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        timeout: config.ENV.REQUEST_TIMEOUT_MS
      }, (err, response, body) => {
        if(err) {
          log.error('Error posting to Plural');
          log.error(err);
          boot.refresh().then(() => post(channel, message));
          return;
        }

        log.info('Plural responded: ' + body);
        response.destroy();
      });
    } catch(e) {
      log.error(e);
    }
  });
}

module.exports = {
  post: post
};
