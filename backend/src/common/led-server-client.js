var request = require('request');

var config = require('../common/config.js');
var log = require('../common/log.js');

function makeRequest(method, payload) {
  var url = 'http://127.0.0.1:' + config.LED_SERVER_CLIENT.PORT + '/' + method;
  request.post({
    url: url,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  }, function(err, response, body) {
    if(err) return log.error(err);
    log.debug('<< LED Server: ' + body);
  });
}

function setAll(rgbArr) {
  var payload = {};
  for(var i = 0; i < config.LED_SERVER_CLIENT.NUM_LEDS; i++) {
    payload['' + i] = rgbArr;
  }
  makeRequest('set', payload);
}

function blink(index, rgbArr) {
  var payload = {};
  payload['' + index] = rgbArr;
  makeRequest('blink', payload);
}
 
function set(index, rgbArr) {
  var payload = {};
  payload['' + index] = rgbArr;
  makeRequest('set', payload);
}
 
module.exports.set = set;
module.exports.setAll = setAll;
module.exports.blink = blink;
