const request = require('request');

const config = require('../common/config.js');
const log = require('../common/log.js');

config.requireKeys('led-server-client.js', {
  LED_SERVER_CLIENT: {
    PORT: 5555,
    NUM_LEDS: 8
  }
});

function makeRequest(method, payload) {
  const url = `http://127.0.0.1:${config.LED_SERVER_CLIENT.PORT}/${method}`;
  request.post({
    url: url,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  }, (err, response, body) => {
    if(err) return log.error(err);
    log.debug(`<< LED Server: ${body}`);
  });
}

function setAll(rgbArr) {
  var payload = {};
  for(var i = 0; i < config.LED_SERVER_CLIENT.NUM_LEDS; i++) payload[i] = rgbArr;
  makeRequest('set', payload);
}

function blink(index, rgbArr) {
  var payload = {};
  payload[index] = rgbArr;
  makeRequest('blink', payload);
}
 
function set(index, rgbArr) {
  var payload = {};
  payload[index] = rgbArr;
  makeRequest('set', payload);
}
 
module.exports = {
  set: set,
  setAll: setAll,
  blink: blink
};
