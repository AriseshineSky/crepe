const Product = require("../proxy").Product;
var Csv = require("../proxy").Csv;
var sheetApi = require("../proxy").sheetApi;
var logger = require("../common/logger");
const HEADER = [
	"pm",
	"asin",
	"plwhsId",
	"yisucangId",
	"gSku",
	"cycle",
	"maxAvgSales",
	"box.length",
	"box.width",
	"box.height",
	"unitsPerBox",
	"box.weight",
];
const PRODUCT_ATTR = [
	"asin",
	"plwhsId",
	"yisucangId",
	"gSku",
	"cycle",
	"maxAvgSales",
	"unitsPerBox",
];

async function syncProducts() {
	var rows = await sheetApi.listProducts();
	var header = rows.shift();
	rows.forEach(function (row) {
		if (row.length > 3) {
			parseRow(row);
		}
	});
	return rows;
}

async function parseYisucangId(yisucangId) {
	if (yisucangId) {
		return yisucangId.split(",");
	} else {
		return [];
	}
}

async function parseRow(row) {
	if (!row[2].trim()) {
		return;
	}
	console.log(row[2].trim());
	let product = {};
	for (let i = 0; i < PRODUCT_ATTR.length; i++) {
		product[PRODUCT_ATTR[i]] = row[HEADER.indexOf(PRODUCT_ATTR[i])]?.trim();
	}
	product.yisucangId = await parseYisucangId(row[HEADER.indexOf("yisucangId")]?.trim());
	await Product.createOrUpdate(product);
}

module.exports = {
	syncProducts,
};
