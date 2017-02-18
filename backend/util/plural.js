var request = require('request');

var config = require('../config.json');
var log = require('./log.js');

function post(ip, channel, message) {
  var e = {
    channel: channel,
    message: message
  };
  request.post({
    url: 'http://' + ip + ':' + config.PORTS.PLURAL + '/post',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(e)
  }, function(err, response, body) {
    if(err) {
      log.error(err);
    }
    log.verbose('Plural responded: ' + body);
  });
}

module.exports.post = post;
