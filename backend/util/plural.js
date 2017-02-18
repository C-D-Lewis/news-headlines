var request = require('request');

var log = require('./log.js');

var IP_URL = 'https://gist.githubusercontent.com/C-D-Lewis/32144c1e0408c2cea325e277a24b99d5/raw/357ea6a69a77a5c930a9785f0720050841330481/ip.json';
var PLURAL_PORT = 5550;

function post(channel, message) {
  request.get(IP_URL, function(e, r, body) {
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
