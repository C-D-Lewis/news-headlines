var fs = require('fs');

var config = require('../../config.json');

function getAppName() {
  return '[' + config.LOG.APP_NAME + ']';
}

function getTimeString() {
  var str = new Date().toISOString();
  return '[' + str.substring(0, str.indexOf('.')).replace('T', ' ') + ']';
}

function _log(msg) {
  if((typeof msg).toLowerCase() === 'object') {
    if(msg.message) {
      msg = msg.message;
    } else {
      msg = JSON.stringify(msg);
    }
  }

  msg = getAppName() + ' ' + getTimeString() + ' ' + msg;
  console.log(msg);

  if(config.LOG.ENABLED) {
    var filePath = config.ENV.INSTALL_PATH + '/' + config.LOG.LOG_NAME;
    if(!fs.existsSync(filePath)) {
      var stream = fs.createWriteStream(filePath, {'flags': 'w'});  
      stream.end(getTimeString() + ' New log file!\n');
    }
    var stream = fs.createWriteStream(filePath, {'flags': 'a'});
    stream.end(msg + '\n');
  }
}

function info(msg) {
  if(config.LOG.LEVEL.includes('info')) {
    _log('[I] ' + msg);
  }
}

function debug(msg) {
  if(config.LOG.LEVEL.includes('debug')) {
    _log('[D] ' + msg);
  }
}

function verbose(msg) {
  _log('[V] ' + msg);
}

function error(msg) {
  _log('[E] ' + msg);
}

function fatal(msg) {
  _log('[F] ' + msg);
  process.exit(1);
}

function assert(condition, msg, strict) {
  if(!condition) {
    msg = 'Assertion failed: ' + msg;
    strict ? fatal(msg) : error(msg);
  }
}

module.exports.info = info;
module.exports.debug = debug;
module.exports.error = error;
module.exports.verbose = verbose;
module.exports.fatal = fatal;
module.exports.assert = assert;
