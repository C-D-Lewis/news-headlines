const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = `${__dirname}/../../config.json`;

var config = {};

function compareObject(context, parentKey, spec, query) {
  var error = false;
  for(var key in spec) {
    const value = spec[key];
    if(query.hasOwnProperty(key)) {
      if(typeof value === 'object' && !Array.isArray(value)) {
        compareObject(context, key, value, query[key]);
      }
    } else {
      console.log(`${context} key \'${key}\' not found in ${parentKey}`);
      error = true;
    }
  }
  if(error) process.exit();
}

(() => {
  if(!fs.existsSync(CONFIG_PATH)) {
    fs.writeFileSync(CONFIG_PATH, config, 'utf8');
    console.log('Set up empty config.json');
    return;
  }
  console.log('config.json loaded');
  config = require(CONFIG_PATH);
})();

// Allow modules to require certain keys in config.json
config.requireKeys = function(moduleName, moduleSpec) {
  compareObject(`Module ${moduleName}`, 'root', moduleSpec, config);
};

// Get the app's install path
config.getInstallPath = function() {
  return execSync('pwd').toString().trim();
}

// Behave as if I required config.json directly, with tests!
module.exports = config;
