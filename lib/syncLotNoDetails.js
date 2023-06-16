const purchaseItemApi = require("../api/gerpgo/purchaseItem");
const Token = require("../api/token");
const authes = require("../api/gerpgo/auth");
const logger = require("../common/logger");

const GProduct = require("../proxy").GProduct;

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

async function updateAllPurchaseOrder(token, salt) {
	const url = `${gerpgo_api_prefix}` + `${open_apis.supplierSkuQuote}`;

	let i = 1;
	let state = "begin";
	while (state !== "end") {
		console.log("get products page: ", i);
		const data = {
			page: i,
			pagesize: 200,
		};
		state = await getSupplierProductsByBatch(url, data, token, salt);
		await wait(200);
		i++;
	}
}

async function getProcureItemView(token, salt) {
	await updateAllPurchaseOrder(token, salt);
}

async function syncProductInfo() {
	for (let auth of authes) {
		let token = await Token.getToken(`${gerpgo_api_prefix}` + `${open_apis.token}`, auth);
		await getProcureItemView(token, auth.appKey);
		await wait(2000);
	}
}

module.exports = { syncProductInfo };
