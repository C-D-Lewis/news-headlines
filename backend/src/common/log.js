const fs = require('fs');

const config = require('./config');

config.requireKeys('log.js', {
  LOG: {
    APP_NAME: '',
    LEVEL: 'info',
    TO_FILE: true
  }
});

function getAppName() { return `[${config.LOG.APP_NAME}]`; }

function getTimeString() {
  const str = new Date().toISOString();
  return `[${str.substring(0, str.indexOf('.')).replace('T', ' ')}]`;
}

function writePid() { fs.writeFileSync(`${config.getInstallPath()}/pid`, process.pid, 'utf8'); }

function makeLogName() { return config.LOG.APP_NAME.split(' ').join('-'); }

function writeToFile(msg) {
  const filePath = `${config.getInstallPath()}/${makeLogName()}.log`;
  let stream;
  if(!fs.existsSync(filePath)) {
    stream = fs.createWriteStream(filePath, {'flags': 'w'});  
    stream.end(`${getTimeString()} New log file!\n`);
  }

  stream = fs.createWriteStream(filePath, {'flags': 'a'});
  stream.end(`${msg}\n`);
}

function willLog(level, msg) {
  return config.LOG.LEVEL.includes(level) ||
         level === 'verbose' ||
         level === 'error' ||
         level === 'fatal';
}

function getTag(level) {
  return {
    info: '[I]',
    debug: '[D]',
    error: '[E]',
    verbose: '[V]',
    fatal: '[F]'
  }[level];
}

function convertObject(msg) { return msg.message ? msg.message : JSON.stringify(msg); }

function log(level, msg) {
  if(!willLog(level, msg)) return;

  if(typeof msg === 'object') msg = convertObject(msg);

  msg = `${getTag(level)} ${getAppName()} ${getTimeString()} ${msg}`;
  console.log(msg);

  if(config.LOG.TO_FILE) writeToFile(msg);

  if(level === 'fatal') process.exit(1);
}

function assert(condition, msg, strict) {
  if(!condition) {
    msg = `Assertion failed: ${msg}`;
    var func = strict ? fatal : error;
    func(msg);
  }

  return condition;
}

function begin() {
  info(`===== ${getAppName()} =====`);
  writePid();
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

const info = (msg) => log('info', msg);
const debug = (msg) => log('debug', msg);
const error = (msg) => log('error', msg);
const verbose = (msg) => log('verbose', msg);
const fatal = (msg) => log('fatal', msg);

module.exports = {
  begin: begin,
  info: (msg) => log('info', msg),
  debug: (msg) => log('debug', msg),
  error: (msg) => log('error', msg),
  verbose: (msg) => log('verbose', msg),
  fatal: (msg) => log('fatal', msg),
  assert: assert
};
