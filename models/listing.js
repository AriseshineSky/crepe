var mongoose = require('mongoose');
var BaseModel= require('./base_model');
var Schema = mongoose.Schema;
var ListingSchema = new Schema({
  asin: { type: String },
  country: { type: String },
  fnsku: { type: String },
  account: { type: String },
  availableQuantity: { type: Number },
  reservedFCTransfer: { type: Number },
  reservedFCProcessing: { type: Number },
  inboundShipped: { type: Number },
  ps: { type: Number }
})

ListingSchema.plugin(BaseModel);
ListingSchema.pre('save', function(next) {
  var now = new Date();
  this.updateAt = now;
  next();
})

mongoose.model('Listing', ListingSchema);