const express = require('express');

const config = require('../common/config');
const images = require('./images');
const log = require('../common/log');
const server = require('../common/server');

function setup() {
  server.start();
  const app = server.getExpressApp();

  app.get('/convert', images.handleImageRequest);
}

module.exports = {
  setup: setup
};
