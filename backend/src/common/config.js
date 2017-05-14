var child_process = require('child_process');
var fs = require('fs');
var path = require('path');

var CONFIG_PATH = __dirname + '/../../config.json';

var config = {};

function compareObject(context, parentKey, spec, query) {
  var error = false;
  for(var key in spec) {
    var value = spec[key];
    if(query.hasOwnProperty(key)) {
      if(typeof value === 'object' && !Array.isArray(value)) {
        compareObject(context, key, value, query[key]);
      }
    } else {
      console.log(context + ' key \'' + key + '\' not found in ' + parentKey);
      error = true;
    }
  }
  if(error) process.exit();
}

(function verify() {
  if(!fs.existsSync(CONFIG_PATH)) {
    config = {};
    fs.writeFileSync(CONFIG_PATH, config, 'utf8');
    console.log('Set up empty config.json');
    return;
  }
  console.log('config.json loaded');
  config = require(CONFIG_PATH);
})();

// Allow modules to require certain keys in config.json
config.requireKeys = function(moduleName, moduleSpec) {
  compareObject('Module ' + moduleName, 'root', moduleSpec, config);
};

// Get the app's install path
config.getInstallPath = function() {
  return child_process.execSync('pwd').toString().trim();
}

// Behave as if I required config.json directly, with tests!
module.exports = config;
