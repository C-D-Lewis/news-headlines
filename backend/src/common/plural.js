var request = require('request');

var boot = require('./boot.js');
var config = require('./config.js');
var log = require('./log.js');

function post(channel, message) {
  boot.getServerUrl(function(serverUrl) {
    var data = {
      channel: channel,
      message: message
    };
    log.info('Calling Plural with: ' + JSON.stringify(data));

    try {
      request.post({
        url: 'http://' + serverUrl + ':' + config.PORTS.PLURAL + '/post',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        timeout: config.ENV.REQUEST_TIMEOUT_MS
      }, function(err, response, body) {
        if(err) {
          log.error('Error posting to Plural');
          log.error(err);
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

module.exports.post = post;
