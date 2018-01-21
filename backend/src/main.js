const config = require('./node-common').config();
const data = require('./modules/data');
const log = require('./node-common').log();
const mbus = require('./node-common').mbus();

config.requireKeys('main.js', {
  required: [ 'ENV' ],
  type: 'object', properties: {
    ENV: {
      required: [ 'UPDATE_INTERVAL_M' ],
      type: 'object', properties: {
        UPDATE_INTERVAL_M: { type: 'number' }
      }
    }
  }
});

(async () => {
  log.begin();
  
  await mbus.register();

  setInterval(data.download, config.ENV.UPDATE_INTERVAL_M * 1000 * 60);
  data.download();
})();
