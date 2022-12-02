const logger = require('../common/logger');
var models = require('../models');
const { save } = require('./product');
var Token = models.Token;

exports.get = async function() {
  return await Token.findOne({});
}

async function saveToken(token) {
  token.update_at = new Date();
  token.save(function(error) {
    if (error) {
      logger.error(error);
    }
  })
}

exports.create = async function(token) {
  var newToken = new Token();
  newToken.token = JSON.stringify(token);
  await saveToken(newToken);
}

exports.update = async function(tokenObj, token) {
  tokenObj.token = JSON.stringify(token);
  await saveToken(tokenObj);
}

exports.saveToken = saveToken;

