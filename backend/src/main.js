const config = require('./common/config');
const data = require('./modules/data');
const log = require('./common/log');
const api = require('./modules/api');

config.requireKeys('main.js', {
  ENV: {
    UPDATE_INTERVAL_M: 240
  }
});

(() => {
  log.begin();
  api.setup();

  setInterval(data.download, config.ENV.UPDATE_INTERVAL_M * 1000 * 60);
  data.download();
})();
