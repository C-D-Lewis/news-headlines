const fs = require('fs');

const config = require('./config');

config.requireKeys('log.js', {
  LOG: {
    APP_NAME: '',
    LOG_NAME: 'app.log',
    LEVEL: 'info',
    TO_FILE: true
  }
});

function getAppName() {
  return `[${config.LOG.APP_NAME}]`;
}

function getTimeString() {
  const str = new Date().toISOString();
  return `[${str.substring(0, str.indexOf('.')).replace('T', ' ')}]`;
}

function setPid() {
  const path = `${config.getInstallPath()}/pid`;
  fs.writeFileSync(path, process.pid, 'utf8');
}

function log(msg) {
  if(typeof msg === 'object') {
    if(msg.message) msg = msg.message;
    else msg = JSON.stringify(msg);
  }
  msg = `${getAppName()} ${getTimeString()} ${msg}`;
  console.log(msg);

  if(config.LOG.TO_FILE) {
    const filePath = `${config.getInstallPath()}/${config.LOG.LOG_NAME}`;
    var stream;
    if(!fs.existsSync(filePath)) {
      stream = fs.createWriteStream(filePath, {'flags': 'w'});  
      stream.end(`${getTimeString()} New log file!\n`);
    }
    stream = fs.createWriteStream(filePath, {'flags': 'a'});
    stream.end(`${msg}\n`);
  }
}

function info(msg) {
  if(config.LOG.LEVEL.includes('info')) log(`[I] ${msg}`);
}

function debug(msg) {
  if(config.LOG.LEVEL.includes('debug')) log(`[D] ${msg}`);
}

function verbose(msg) {
  log(`[V] ${msg}`);
}

function error(msg) {
  log(`[E] ${msg}`);
}

function fatal(msg) {
  log(`[F] ${msg}`);
  process.exit(1);
}

function assert(condition, msg, strict) {
  if(!condition) {
    msg = `Assertion failed: ${msg}`;
    var func = strict ? fatal : error;
    func(msg);
  }
}

function begin() {
  verbose(`===== ${getAppName()} =====`);
  setPid();
  process.on('uncaughtException', (err) => {
    error('uncaughtException:');
    error(err.stack);
    fatal('Application must now exit');
  });
  process.on('unhandledRejection', (err) => {
    error('unhandledRejection:');
    error(err.stack);
    fatal('Application must now exit');
  });
}

module.exports = {
  begin: begin,
  info: info,
  debug: debug,
  error: error,
  verbose: verbose,
  fatal: fatal,
  assert: assert
};
