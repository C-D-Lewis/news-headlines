var config = require('./common/config.js');
var data = require('./modules/data.js');
var log = require('./common/log.js');
var server = require('./modules/server.js');

(function main() {
  log.begin();
  server.setup();

  setInterval(data.download, config.ENV.UPDATE_INTERVAL_M * 1000 * 60);
  data.download();
})();
