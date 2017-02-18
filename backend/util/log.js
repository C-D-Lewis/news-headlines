var config = require('../config.json');
var fs = require('fs');

function getPrefix() {
  var str = new Date().toISOString();
  return str.substring(0, str.indexOf('.')).replace('T', ' ');
}

function _log(msg) {
  console.log(msg);

  if(config.LOG_TO_FILE) {
    var filePath = config.INSTALL_PATH + '/' + config.LOG_NAME;
    if(!fs.existsSync(filePath)) {
      var stream = fs.createWriteStream(filePath, {'flags': 'w'});  
      stream.end(getPrefix() + ' New log file!\n');
    }
    var stream = fs.createWriteStream(filePath, {'flags': 'a'});
    stream.end(msg + '\n');
  }
}

function info(msg) {
  if(config.LOG_LEVEL.includes('info')) {
    _log(getPrefix() + ' [I] ' + msg);
  }
}

function debug(msg) {
  if(config.LOG_LEVEL.includes('debug')) {
    _log(getPrefix() + ' [D] ' + msg);
  }
}

function verbose(msg) {
  _log(getPrefix() + ' [V] ' + msg);
}

function error(msg) {
  _log(getPrefix() + ' [E] ' + msg);
}

function fatal(msg) {
  _log(getPrefix + ' [K] ' + msg);
  process.exit(1);
}

module.exports.info = info;
module.exports.debug = debug;
module.exports.error = error;
module.exports.verbose = verbose;
module.exports.fatal = fatal;
