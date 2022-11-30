var models  = require('../models');
var Product = models.Product;
var User = models.User;
var mongoose = require('mongoose');
const getPm = require('../api/getPM');
var moment = require('moment');

var logger = require('../common/logger');

exports.findOrCreate = async function(name) {
  var user = await User.findOne({"name": name});
  if (user) {
    return user;
  } else {
    return await User.create({"name": name});
  }
}