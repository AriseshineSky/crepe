/**
 * 给所有的 Model 扩展功能
 * http://mongoosejs.com/docs/plugins.html
 */
const tools = require("../common/tools");

module.exports = function (schema) {
	schema.add({
		createAt: { type: Date, default: Date.now() },
		updateAt: { type: Date, default: Date.now() },
		deletedAt: { type: Date },
	});
	schema.methods.create_at_ago = function () {
		return tools.formatDate(this.create_at, true);
	};

	schema.methods.update_at_ago = function () {
		return tools.formatDate(this.update_at, true);
	};

	schema.pre("save", function (next) {
		const now = new Date();
		this.updateAt = now;
		next();
	});
};
