var request = require('request');

var config = require('./config.js');
var log = require('./log.js');

var value = 0;

function post(done) {
  var data = [{
    key: config.EVT_DAILY.PROPERTY_KEY,
    value: value
  }];
  log.info('evt-daily >> ' + JSON.stringify(data));
  
  request.post({
    url: 'https://api.evrythng.com/thngs/' + config.EVT_DAILY.THNG_ID + '/properties',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': config.EVT_DAILY.OPERATOR_API_KEY
    },
    body: JSON.stringify(data)
  }, function(err, response, body) {
    if(err) {
      log.error(err);
      return done();
    }
    log.info('evt-daily << ' + JSON.stringify(body));
    done();
  });
}

function onMinuteChange() {
  var date = new Date();
  if(date.getHours() == 23 && date.getMinutes() == 59) {
    post(function() {
      value = 0;
    });
  }
}

function increment() {
  value += 1;
}

function begin() {
  setInterval(onMinuteChange, 1000 * 60);
}

module.exports.increment = increment;
module.exports.begin = begin;
