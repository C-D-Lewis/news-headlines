var request = require('request');

var config = require('../config.json');
var log = require('./log.js');

var PLURAL_PORT = 5550;

function post(channel, message) {
  request.get(config.BOOT_URL, function(e, r, body) {
    if(e) log.error(e);

    var ip = JSON.parse(body).ip;
    request.post({
      url: 'http://' + ip + ':' + PLURAL_PORT + '/post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel: channel, message: message })
    }, function(e, r, body) {
      if(e) log.error(e);
      log.verbose('Plural responded: ' + body);
    });
  });
}

module.exports.post = post;
