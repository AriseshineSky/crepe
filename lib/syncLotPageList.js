const purchaseItemApi = require("../api/gerpgo/purchaseItem");
const Token = require("../api/token");
const authes = require("../api/gerpgo/auth");
const logger = require("../common/logger");

const Lot = require("../proxy").Lot;

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
	let lotNo = await purchaseItemApi(url, data, token, salt);
	if (lotNo.data.rows && lotNo.data.rows.length > 0) {
		lotNo.data.rows.forEach(async function (lotRow) {
			logger.info(`[lotnoPage:]${JSON.stringify(lotRow)}`);
			await Lot.createOrUpdate(lotRow);
		});
		return "pending";
	} else {
		return "end";
	}
}

async function updateAllPurchaseOrder(token, salt) {
	const url = `${gerpgo_api_prefix}` + `${open_apis.lotNoPageList}`;

	let i = 1;
	let state = "begin";
	while (state !== "end") {
		console.log("get lot no page: ", i);
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

async function syncPageList() {
	for (let auth of authes) {
		let token = await Token.getToken(`${gerpgo_api_prefix}` + `${open_apis.token}`, auth);
		await getProcureItemView(token, auth.appKey);
		await wait(2000);
	}
}

module.exports = { syncPageList };
