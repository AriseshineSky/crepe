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

module.exports = {
	wait,
	deepClone,
	convertDateToPeroid,
};
