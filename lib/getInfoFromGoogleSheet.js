var Product = require("../proxy").Product;
var Csv = require("../proxy").Csv;
var sheetApi = require("../proxy").sheetApi;
var logger = require("../common/logger");
const HEADER = [
	"pm",
	"asin",
	"plwhsId",
	"yisucangId",
	"cycle",
	"maxAvgSales",
	"box.length",
	"box.width",
	"box.height",
	"unitsPerBox",
	"box.weight",
];
const PRODUCT_ATTR = ["asin", "plwhsId", "yisucangId", "cycle", "maxAvgSales", "unitsPerBox"];
const INBOUND_ATTR = ["deliveryDue", "quantity"];
var syncProducts = async function () {
	var rows = await sheetApi.listProducts();
	var header = rows.shift();

	rows.forEach(function (row) {
		if (row.length > 3) {
			parseRow(row);
		}
	});
	return rows;
};

async function parseYisucangId(yisucangId) {
	return yisucangId.split(",");
}
var parseRow = async function (row) {
	if (!row[2].trim()) {
		return;
	}
	console.log(row[2].trim());
	let product = await Product.getProductByPlwhsId(row[2].trim());
	if (!product) {
		var newProduct = {};
		var box = {
			length: row[HEADER.indexOf("box.length")],
			width: row[HEADER.indexOf("box.width")],
			height: row[HEADER.indexOf("box.height")],
			weight: row[HEADER.indexOf("box.weight")],
		};
		for (var i = 0; i < PRODUCT_ATTR.length; i++) {
			newProduct[PRODUCT_ATTR[i]] = row[HEADER.indexOf(PRODUCT_ATTR[i])]?.trim();
		}
		newProduct.yisucangId = await parseYisucangId(row[HEADER.indexOf("yisucangId")]?.trim());
		newProduct.box = box;

		Product.newAndSave(newProduct, function (err, product) {
			console.log("save", product);
			if (err) {
				logger.error(err);
			}
		});
	} else {
		var box = {
			length: row[HEADER.indexOf("box.length")],
			width: row[HEADER.indexOf("box.width")],
			height: row[HEADER.indexOf("box.height")],
			weight: row[HEADER.indexOf("box.weight")],
		};
		for (var i = 0; i < PRODUCT_ATTR.length; i++) {
			product[PRODUCT_ATTR[i]] = row[HEADER.indexOf(PRODUCT_ATTR[i])];
		}
		product.yisucangId = await parseYisucangId(row[HEADER.indexOf("yisucangId")]?.trim());
		product.box = box;
		product.save(function (err) {
			if (err) {
				logger.error(err);
			}
		});
	}
};
module.exports.syncProducts = syncProducts;
