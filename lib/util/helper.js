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

module.exports = {
	wait,
	deepClone,
	convertDateToPeroid,
	absCeil,
};
