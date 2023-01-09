var mongoose = require('mongoose');
var BaseModel= require('./base_model');
var Schema = mongoose.Schema;
var UserSchema = new Schema({
  name: { type: String },
  chatId: { type: String }
})

UserSchema.plugin(BaseModel);
UserSchema.pre('save', function(next) {
  var now = new Date();
  this.updateAt = now;
  next();
})

mongoose.model('User', UserSchema);