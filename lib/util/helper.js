const moment = require("moment");
function deepClone(obj) {
	return JSON.parse(JSON.stringify(obj));
}

function convertDateToPeroid(date) {
	return moment(date).diff(moment(), "days");
}

function wait(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

function absCeil(num) {
	return Math.abs(Math.ceil(num));
}

function isExpired(expireDate) {
	return moment(expireDate).isBefore(moment());
}

function isDateValid(validDate) {
	return moment(validDate).isBefore(moment());
}

module.exports = {
	wait,
	deepClone,
	convertDateToPeroid,
	absCeil,
	isExpired,
	isDateValid,
};
