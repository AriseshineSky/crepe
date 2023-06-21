const purchaseItemApi = require("../api/gerpgo/purchaseItem");
const Token = require("../api/token");
const authes = require("../api/gerpgo/auth");
const logger = require("../common/logger");

const GerpgoClient = require("../services/gerpgoClient");
const GProduct = require("../proxy").GProduct;
const Supplier = require("../proxy").Supplier;

function parsePurchaseProcures(purchaseProcure) {
	const {
		id,
		memo,
		totalquantity,
		invoicesstatus,
		uninboundquantity,
		supervisorid,
		suppliercode,
		customcode,
		productname,
		ordertotalamount,
		creator,
		paymentrate,
		updatetime,
		createtime,
		transportname,
		product,
		asin,
		code,
		deliverystatur,
		fnsku,
		inboundquantity,
		orderquantity,
		actualquantity,
		stock,
		sellersku,
		inbounddetailsvolist,
	} = purchaseProcure;
	return {
		id,
		memo,
		totalQuantity,
		unInboundQuantity,
		paymentRate,
		supervisorId,
		supplierCode,
		customCode,
		productName,
		orderTotalAmount,
		creator,
		updateTime,
		createTime,
		transportName,
		product,
		asin,
		code,
		deliveryStatur,
		fnsku,
		inboundQuantity,
		orderQuantity,
		actualQuantity,
		stock,
		sellerSku,
		inboundDetailsVoList,
		invoicesStatus,
	};
}

function wait(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

async function getSupplierProductsByBatch(url, data, token, salt) {
	let supplierProductData = await purchaseItemApi(url, data, token, salt);
	if (supplierProductData.data.rows && supplierProductData.data.rows.length > 0) {
		supplierProductData.data.rows.forEach(async function (productRow) {
			logger.info(`[supplierSkuQuote:]${JSON.stringify(productRow)}`);
			await GProduct.createOrUpdate(productRow);
		});
		return "pending";
	} else {
		return "end";
	}
}

async function getSuppliers(gerpgoClient) {
	const url = open_apis.supplier;
	let i = 1;
	let state = "begin";
	while (state !== "end") {
		console.log("get purchase page: ", i);
		const data = {
			page: i,
			pagesize: 500,
		};
		const res = await gerpgoClient.fetchSuppliers(url, data);
		if (res.data) {
			state = await parseSuppliersRes(res.data);
		}
		await wait(500);
		i++;
		state = "end";
	}
}

function wait(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

async function parseSuppliersRes(data) {
	if (data.rows) {
		for (let supplier of data.rows) {
			logger.info("[Supplier]" + JSON.stringify(supplier));
			await Supplier.createOrUpdate(supplier);
		}
	}

	return "end";
}

async function syncSuppliers() {
	for (let auth of authes) {
		const gerpgoClient = new GerpgoClient(auth);
		await getSuppliers(gerpgoClient);
		await wait(2000);
	}
}

module.exports = { syncSuppliers };
