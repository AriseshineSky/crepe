var mongoose = require('mongoose');
var BaseModel= require('./base_model');
var Schema = mongoose.Schema;
var TokenSchema = new Schema({
  token: { type: String },
  create_at: { type: Date, default: Date.now },
  update_at: { type: Date, default: Date.now }
})

TokenSchema.plugin(BaseModel);
TokenSchema.pre('save', function(next) {
  var now = new Date();
  this.updateAt = now;
  next();
})

mongoose.model('Token', TokenSchema);