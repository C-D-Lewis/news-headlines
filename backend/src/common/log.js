var fs = require('fs');

var config = require('./config.js');
config.requireKeys('log.js', {
  LOG: {
    APP_NAME: '',
    LOG_NAME: 'app.log',
    LEVEL: 'info',
    ENABLED: true
  }
});

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
    var filePath = config.getInstallPath() + '/' + config.LOG.LOG_NAME;
    var stream;
    if(!fs.existsSync(filePath)) {
      stream = fs.createWriteStream(filePath, {'flags': 'w'});  
      stream.end(getTimeString() + ' New log file!\n');
    }
    stream = fs.createWriteStream(filePath, {'flags': 'a'});
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
    var fun = strict ? fatal : error;
    fun(msg);
  }
}

function begin() {
  verbose('===== ' + getAppName() + ' (PID: ' + process.pid + ') =====');
  process.on('uncaughtException', function(err) {
    error('uncaughtException:');
    error(err);
    fatal('Application must now exit');
  });
}

module.exports.begin = begin;
module.exports.info = info;
module.exports.debug = debug;
module.exports.error = error;
module.exports.verbose = verbose;
module.exports.fatal = fatal;
module.exports.assert = assert;
