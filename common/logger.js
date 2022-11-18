var config = require('../config');
var pathLib = require('path');

var env = process.env.NODE_ENV || "development";

var log4js = require('log4js');
log4js.configure({
  appenders: {
    development: {
      type: 'file',
      filename: 'logs/development.log',
      maxLogSize: 10485760,
    }
  },
  categories: {default: {appenders: ['development'], level: 'debug'}}
});

var logger = log4js.getLogger('development');
logger.level = config.debug && env !== 'test' ? 'DEBUG' : 'ERROR';

module.exports = logger;