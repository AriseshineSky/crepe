var mongoose  = require('mongoose');
var BaseModel = require("./base_model");
var Schema    = mongoose.Schema;
var ProductSchema = new Schema({
  asin: { type: String},
  cycle: { type: Number, default: 0 },
  units_per_box: { type: Number, default: 0 },
  max_avg_sales: { type: Number, default: 0 },
  box: { 
    length: {type: Number, default: 0 },
    width: {type: Number, default: 0 },
    height: {type: Number, default: 0 },
    weight: {type: Number, default: 0 }
  },
  create_at: { type: Date, default: Date.now },
  update_at: { type: Date, default: Date.now },
});

ProductSchema.plugin(BaseModel);

ProductSchema.pre('save', function(next){
  var now = new Date();
  this.update_at = now;
  next();
});

mongoose.model('Product', ProductSchema);
