var mongoose = require('mongoose');
var BaseModel= require('./base_model');
var Schema = mongoose.Schema;
var FreightSchema = new Schema({
  type: { type: String },
  period: { type: Number },
  price: { type: Number }
})

FreightSchema.plugin(BaseModel);
FreightSchema.pre('save', function(next) {
  var now = new Date();
  this.updateAt = now;
  next();
})

mongoose.model('Freight', FreightSchema);