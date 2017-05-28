const request = require('request');

const config = require('./config.js');
const log = require('./log.js');

config.requireKeys('evt-daily.js', {
  EVT_DAILY: {
    OPERATOR_API_KEY: '',
    PROPERTY_KEY: '',
    THNG_ID: ''
  }
});

var value = 0;

function post(done) {
  const data = [{
    key: config.EVT_DAILY.PROPERTY_KEY,
    value: value
  }];
  log.info(`evt-daily >> ${JSON.stringify(data)}`);
  
  request.post({
    url: `https://api.evrythng.com/thngs/${config.EVT_DAILY.THNG_ID}/properties`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': config.EVT_DAILY.OPERATOR_API_KEY
    },
    body: JSON.stringify(data)
  }, (err, response, body) => {
    if(err) {
      log.error(err);
      return done();
    }
    log.info(`evt-daily << ${JSON.stringify(body)}`);
    done();
  });
}

function onMinuteChange() {
  const date = new Date();
  if(date.getHours() == 23 && date.getMinutes() == 59) post(() => value = 0);
}

function increment() {
  value += 1;
}

function begin() {
  setInterval(onMinuteChange, 1000 * 60);
}

module.exports = {
  increment: increment,
  begin: begin
};
