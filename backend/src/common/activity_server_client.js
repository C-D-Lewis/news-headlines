// Requires Monitor instance on same box with ACTIVITY_SERVER enabled

var request = require('request');

var config = require('./config.js');
var log = require('./log.js');

function post() {
  if(!config.ACTIVITY_SERVER.POST) return;

  var url = 'http://127.0.0.1:' + config.ACTIVITY_SERVER.PORT + '/blink';
  request.post(url, function(err, response, body) {
    if(err) {
      log.error('Error reporting activity to ACTIVITY_SERVER');
      log.error(err);
      return;
    }

    log.debug('ACTIVITY_SERVER result: ' + body);
    response.destroy();
  });
}

module.exports.post = post;
