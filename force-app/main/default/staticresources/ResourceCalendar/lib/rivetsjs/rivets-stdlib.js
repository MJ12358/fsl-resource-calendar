/* global
  rivets
*/

/* eslint
  no-unused-vars: "warn",
  no-empty: "off",
  no-prototype-builtins: "off"
*/

(function() {

	//* General

	rivets.formatters.args = function(fn) {
		var args = Array.prototype.slice.call(arguments, 1);
		return function() {
			return fn.apply(this, Array.prototype.concat.call(arguments, args));
		}
	};

	//* Comparisons

	rivets.formatters.isEmpty = function(value) {
		if (Array.isArray(value) || typeof value === 'string') {
			return value.length <= 0;
		} else if (!Array.isArray(value) && typeof value === 'object') {
			for (var prop in value) {
				if (value.hasOwnProperty(prop) && value[prop]) {
					return false;
				}
			}
			return true;
		} else {
			return true;
		}
	};

	rivets.formatters.isNotEmpty = function(value) {
		return !rivets.formatters.isEmpty(value);
	};

	//* Logical functions

	rivets.formatters.includes = function(value, arg) {
		if (!(value && value instanceof Array)) {
			return false;
		}
		return value.includes(arg);
	};

	//* Bindings

  rivets.binders['style-*'] = function(el, value) {
		el.style.setProperty(this.args[0], value);
	};

	rivets.binders.keyupdelay = {
		callback: null,
		publishes: true,
		priority: 2000,
		preValue: '',
		timer: null,
		value: '',

		bind: function(el) {
			var self = this;
			this.event = 'keyup';
			self.callback = function() {
				self.publish();
				clearTimeout(self.binder.timer);
				self.binder.timer = setTimeout(function() {
					self.binder.value = el.value.trim();
					if (self.binder.preValue.length !== self.binder.value.length || self.binder.preValue !== self.binder.value) {
						self.binder.callback();
						self.binder.preValue = self.binder.value;
					}
				}, 500);
			};
			el.addEventListener('keyup', this.callback, false);
		},

		unbind: function(el) {
			el.removeEventListener('keyup', this.callback, false);
		},

		routine: function() {
			rivets.binders.value.routine.apply(this, arguments);
		}

	};

}(window.rivets = window.rivets || {}));