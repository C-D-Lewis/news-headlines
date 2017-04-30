var fs = require('fs');

var CONFIG_PATH = __dirname + '/../../config.json';
var DEFAULT_CONFIG_PATH = __dirname + '/../config-default.json';

var config = null;
var error = false;

function isArray(a) {
  return Object.prototype.toString.call(a) === '[object Array]';
}

function checkObject(context, parentKey, spec, query) {
  for(var key in spec) {
    var value = spec[key];
    if(query.hasOwnProperty(key)) {
      if(typeof value === 'object' && !isArray(value)) {
        checkObject(context, key, value, query[key]);
      }
    } else {
      console.log(context + ' key \'' + key + '\' not found in ' + parentKey);
      error = true;
    }
  }
}

(function verify() {
  // Check config exists
  if(!fs.existsSync(CONFIG_PATH)) {
    // Check default exists
    if(!fs.existsSync(DEFAULT_CONFIG_PATH)) {
      console.log('config-default.js not available for this app!');
      fs.writeFileSync(DEFAULT_CONFIG_PATH, JSON.stringify({}, null, 2), 'utf8');
      process.exit();
    }

    // Replicate default
    config = require(DEFAULT_CONFIG_PATH);
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
    console.log('Set up config.json from config-default.json');
    return;
  }

  // Verify config against default
  var defaultConfig = require(DEFAULT_CONFIG_PATH);
  config = require(CONFIG_PATH);
  checkObject('config.json', 'root', defaultConfig, config);
  if(error) {
    console.log('config.json is missing items from config-default.json');
    process.exit();
  }

  checkObject('config-default.json', 'root', config, defaultConfig);
  if(error) {
    console.log('config-default.json is missing items from config.json');
    process.exit();
  }

  console.log('config.json loaded successfully');
})();

module.exports = config;
