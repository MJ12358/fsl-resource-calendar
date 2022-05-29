/* global
  rivets
*/

/* eslint
  no-unused-vars: "warn",
  no-empty: "warn"
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

	rivets.formatters['!='] = function(value, arg) {
		return value != arg;
	};

	//* Logical functions

	rivets.formatters.or = function(value, args) {
		return value || args;
	};

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