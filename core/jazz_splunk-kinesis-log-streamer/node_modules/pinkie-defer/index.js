'use strict';
module.exports = function () {
	var fn = function (resolve, reject) {
		fn._resolveFn = resolve;
		fn._rejectFn = reject;
	};

	fn.resolve = function (result) {
		this._resolveFn(result);
	};

	fn.reject = function (err) {
		this._rejectFn(err);
	};

	return fn;
};
