var models  = require('../models');
var Product = models.Product;
var User = models.User;
var mongoose = require('mongoose');
const getPm = require('../api/getPM');
var moment = require('moment');

var logger = require('../common/logger');

exports.findOrCreate = async function(user) {
  if (!user) {
    return null;
  }
  var user = await User.findOne({"name": user.name});
  if (user) {
    return user;
  } else {
    return await User.create({"name": user.name, "chatId": user.chat_id});
  }
}

exports.updateUser = async function(user) {
  var user = await User.findOne({"name": user.name});
  if (user) {
    user.chatId = user.chat_id;
    await user.save();
    return user;
  } else {
    return await User.create({"name": user.name, "chatId": user.chat_id});
  }
}