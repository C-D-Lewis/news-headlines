const config = require('./common/config');
const data = require('./modules/data');
const log = require('./common/log');
const server = require('./modules/server');

config.requireKeys('main.js', {
  ENV: {
    UPDATE_INTERVAL_M: 240
  }
});

(() => {
  log.begin();
  server.setup();

  setInterval(data.download, config.ENV.UPDATE_INTERVAL_M * 1000 * 60);
  data.download();
})();
