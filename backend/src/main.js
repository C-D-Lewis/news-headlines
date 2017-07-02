const config = require('./common/config.js');
const data = require('./modules/data.js');
const log = require('./common/log.js');
const server = require('./modules/server.js');

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
