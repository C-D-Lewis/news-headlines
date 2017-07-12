const request = require('request');

const config = require('../common/config');
const log = require('../common/log');

config.requireKeys('fcm.js', {
  FCM: {
    API_KEY: ''
  }
});

const FCM_URL = 'https://fcm.googleapis.com/fcm/send';

function post(title, topic, message) {
  const data = {
    to: `/topics/${topic}`,
    notification: {
      title: title,
      body: message
    }
  }
  log.info(`FCM >> ${JSON.stringify(data)}`);
  
  request.post({
    url: FCM_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `key=${config.FCM.API_KEY}`
    },
    body: JSON.stringify(data)
  }, (err, response, body) => {
    if(err) return log.error(err);
    log.info(`FCM << ${body}`);
  });
}

module.exports = {
  post: post
};
