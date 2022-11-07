var mongoose  = require('mongoose');
var BaseModel = require("./base_model");
var Schema    = mongoose.Schema;
var ProductSchema = new Schema({
  asin: { type: String},
  cycle: { type: Number, default: 0 },
  unitsPerBox: { type: Number, default: 0 },
  maxAvgSales: { type: Number, default: 0 },
  minInventory: { type: Number, default: 0 },
  box: { 
    length: {type: Number, default: 0 },
    width: {type: Number, default: 0 },
    height: {type: Number, default: 0 },
    weight: {type: Number, default: 0 }
  },
  inboundShippeds: [
    {
      quantity: {type: Number, default: 0 },
      deliveryDue: { type: Date, default: Date.now }
    }
  ],
  plwhsId: {type: Number, default: 0 },
  yisucangId: {type: Number, default: 0 },
  createAt: { type: Date, default: Date.now },
  updateAt: { type: Date, default: Date.now },
});

ProductSchema.plugin(BaseModel);

ProductSchema.pre('save', function(next){
  var now = new Date();
  this.updateAt = now;
  next();
});

mongoose.model('Product', ProductSchema);
