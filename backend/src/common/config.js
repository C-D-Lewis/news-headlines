const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const compare = require('./compare');

const CONFIG_PATH = `${__dirname}/../../config.json`;

var config = {};

(() => {
  if(!fs.existsSync(CONFIG_PATH)) {
    fs.writeFileSync(CONFIG_PATH, config, 'utf8');
    console.log('Set up empty config.json');
    return;
  }
  config = require(CONFIG_PATH);
  console.log('config.json loaded');
})();

// Allow modules to require certain keys in config.json
config.requireKeys = (moduleName, moduleSpec) => {
  compare(`Module ${moduleName}`, 'root', moduleSpec, config, true);
};

config.getInstallPath = () => execSync('pwd').toString().trim();

// Behave as if I required config.json directly, with tests!
module.exports = config;
