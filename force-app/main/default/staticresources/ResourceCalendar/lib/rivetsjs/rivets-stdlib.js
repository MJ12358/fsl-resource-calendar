(function() {

	//* General

	rivets.formatters.args = function(fn) {
		var args = Array.prototype.slice.call(arguments, 1);
		return function() {
			return fn.apply(this, Array.prototype.concat.call(arguments, args));
		}
	};

	rivets.formatters.log = function(value) {
		return console.log(value);
	};

	rivets.formatters.default = function(value, arg) {
		return !rivets.formatters.isEmpty(value) ? value : arg;
	};

	rivets.formatters.map = function(value, obj, prop) {
		var args = Array.prototype.slice.call(arguments);
		args.splice(1, 2);
		return obj[prop].apply(obj, args);
	};

	rivets.formatters.random = function(value, arg) {
		if (!arg) {
			arg = 1;
		}
		return Math.round(Math.random() * arg);
	};

	rivets.formatters.randomColor = function(value) {
		return '#' + Math.random().toString(16).slice(-6);
	};

	rivets.formatters.toggle = function(value, str1, str2) {
		return value ? str1 : str2;
	};

	//* Type checking

	rivets.formatters.isBoolean = function(value) {
		return typeof value == 'boolean';
	};

	rivets.formatters.isNumeric = function(value) {
		return !isNaN(value);
	};

	rivets.formatters.isNaN = function(value) {
		if (rivets.formatters.isArray(value))
			return true;
		return isNaN(value);
	};


	rivets.formatters.isInteger = function(n) {
		/**
		 * thanks a lot to Dagg Nabbit
		 * http://stackoverflow.com/questions/3885817/how-to-check-if-a-number-is-float-or-integer
		 */
		return n === +n && n === (n | 0);
	};

	rivets.formatters.isFloat = function(n) {
		/**
		 * thanks a lot to Dagg Nabbit
		 * http://stackoverflow.com/questions/3885817/how-to-check-if-a-number-is-float-or-integer
		 */
		return Infinity !== n && n === +n && n !== (n | 0);
	};

	rivets.formatters.isNumber = function(value) {
		return rivets.formatters.isFloat(value) || rivets.formatters.isInteger(value);
	};

	rivets.formatters.isObject = function(value) {
		return rivets.formatters.toBoolean(value) && typeof value == 'object' && !rivets.formatters.isArray(value);
	};

	rivets.formatters.isFunction = function(value) {
		return typeof value == 'function';
	};

	rivets.formatters.isArray = function(value) {
		return rivets.formatters.isFunction(Array.isArray) ? Array.isArray(value) : value instanceof Array;
	};

	rivets.formatters.isString = function(value) {
		return typeof value == 'string' || value instanceof String;
	};

	rivets.formatters.isInfinity = function(value) {
		return value === Infinity;
	};

	//* Type conversion

	rivets.formatters.toBoolean = function(value) {
		return !!value;
	};

	rivets.formatters.toInteger = function(value) {
		var ret = parseInt(value * 1, 10);
		return isNaN(ret) ? 0 : ret;
	};

	rivets.formatters.toFloat = function(value) {
		var ret = parseFloat(value * 1.0);
		return isNaN(ret) ? 0.0 : ret;
	};

	rivets.formatters.toDecimal = function(value) {
		var retI = rivets.formatters.toInteger(value * 1);
		var retF = rivets.formatters.toFloat(value);
		return retI == retF ? retI : retF;
	};

	rivets.formatters.toArray = function(value) {
		if (rivets.formatters.isArray(value)) {
			return value;
		} else if (rivets.formatters.isObject(value)) {
			return rivets.formatters.values(value);
		}
		return [value];
	};

	rivets.formatters.toString = function(value) {
		return value ? value.toString() : '';
	};

	rivets.formatters.integer = {
		read: function(value) {
			return rivets.formatters.toInteger(value);
		},
		publish: function(value) {
			return rivets.formatters.toInteger(value);
		}
	};

	//* Math functions

	rivets.formatters['+'] = function(value, arg) {
		return (1 * value) + (1 * arg);
	};

	rivets.formatters['-'] = function(value, arg) {
		return (1 * value) - (1 * arg);
	};

	rivets.formatters['*'] = function(value, arg) {
		return (1 * value) * (1 * arg);
	};

	rivets.formatters['/'] = function(value, arg) {
		return (1 * value) / (1 * arg);
	};

	rivets.formatters.min = function() {
		return Math.min.apply(Math, arguments);
	};

	rivets.formatters.max = function() {
		return Math.max.apply(Math, arguments);
	};

	rivets.formatters.round = function(value, decimals) {
		if (decimals) {
			var exp = Math.pow(10, decimals);
			value = Math.round(value * exp) / exp;
		} else {
			value = Math.round(value);
		}
		return value;
	};

	//* Comparisons

	rivets.formatters['=='] = function(value, arg) {
		return value == arg;
	};

	rivets.formatters['==='] = function(value, arg) {
		return value === arg;
	};

	rivets.formatters['!='] = function(value, arg) {
		return value != arg;
	};

	rivets.formatters['!=='] = function(value, arg) {
		return value !== arg;
	};

	rivets.formatters['<'] = function(value, arg) {
		return (value * 1) < (arg * 1);
	};

	rivets.formatters['>'] = function(value, arg) {
		return (value * 1) > (arg * 1);
	};

	rivets.formatters['<='] = function(value, arg) {
		return (value * 1) <= (arg * 1);
	};

	rivets.formatters['>='] = function(value, arg) {
		return (value * 1) >= (arg * 1);
	};

	//* Logical functions

	// could use formatters['||'], formatters['&&'] .....

	rivets.formatters.or = function() {
		for (var i = 0; i < arguments.length; i++) {
			if (rivets.formatters.toBoolean(arguments[i])) {
				return true;
			}
		}
		return false;
	};

	rivets.formatters.and = function() {
		for (var i = 0; i < arguments.length; i++) {
			if (!rivets.formatters.toBoolean(arguments[i])) {
				return false;
			}
		}
		return true;
	};

	rivets.formatters.not = function(value) {
		if (typeof value === 'boolean') {
			return !value;
		}
		return !(value == 'true');
	};

	rivets.formatters.negate = function(value) {
		return !rivets.formatters.toBoolean(value);
	};

	rivets.formatters.if = function(value, trueCase, falseCase) {
		console.log(value);
		console.log(trueCase);
		console.log(falseCase);
		return rivets.formatters.toBoolean(value) ? trueCase : falseCase;
	};

	//* Object formatters

	rivets.formatters.pairs = function(value) {
		return Object.keys(value).map(function(key) {
			return {
				'object': value,
				'property': key,
				'value': value[key]
			};
		});
	};

	rivets.formatters.keys = function(obj) {
		if (obj && typeof obj === 'object') {
			return Object.keys(obj);
		}
		return [];
	};

	rivets.formatters.values = function(obj) {
		if (obj && typeof obj === 'object') {
			return Object.keys(obj).map(function(key) { return obj[key]; });
		}
		return [];
	};

	rivets.formatters.get = function(obj, key) {
		if (obj && typeof obj === 'object') {
			return obj[key];
		}
		return null;
	};

	rivets.formatters.set = function(obj, key, value) {
		if (obj && typeof obj === 'object') {
			obj[key] = value;
		}
		return obj;
	};

	//* String formatters

	rivets.formatters.append = function(value, append) {
		if (value || typeof value === 'string' || value === 0) {
			return '' + value + append;
		}
		return '';
	};

	rivets.formatters.prepend = function(value, prepend) {
		if (value || typeof value === 'string' || value === 0) {
			return '' + prepend + value;
		}
		return '';
	};

	rivets.formatters.stringFormat = function(value) {
		for (var i = 1; i < arguments.length; i++) {
			var offset = value.indexOf('%s');
			if (offset === -1) {
				break;
			}
			value = value.slice(0, offset) + arguments[i] + value.slice(offset + 2);
		}
		return value;
	};

	rivets.formatters.split = function(value, arg) {
		return value && value.split(arg);
	};

	rivets.formatters.toLower = function(value) {
		return value && value.toLowerCase();
	};

	rivets.formatters.toUpper = function(value) {
		return value && value.toUpperCase();
	};

	rivets.formatters.capitalize = function(value) {
		value = rivets.formatters.toString(value);
		return value.split(' ').map(function(seq) {
			return seq.split('-').map(function(word) {
				return word.charAt(0).toUpperCase() + word.slice(1);
			}).join('-');
		}).join(' ');
	};

	rivets.formatters.percent = function(value) {
		return rivets.formatters.round(value, 2) + '%';
	};

	rivets.formatters.charAt = function(value, arg) {
		return value && value.charAt(arg * 1);
	};

	//* String & Array formatters

	rivets.formatters.contains = function(value, arg) {
		return value.indexOf(arg) !== -1;
	};

	rivets.formatters.doesNotContain = function(value, arg) {
		return rivets.formatters.negate(rivets.formatters.contains(value, arg));
	};

	rivets.formatters.prettyPrint = function(value) {
		return JSON.stringify(value, null, 2);
	};

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

	//* Array formatters

	rivets.formatters.length = function(value) {
		if (rivets.formatters.isString(value)) {
			return value.length
		}
		return rivets.formatters.toArray(value).length;
	};

	rivets.formatters.lengthEquals = function(value, arr) {
		return value.length === arr.length;
	};

	rivets.formatters.join = function(value, arg) {
		return rivets.formatters.toArray(value).join(arg);
	};

	rivets.formatters.index = function(value, arr) {
		if (!(value && value instanceof Array)) {
			return value;
		}
		return arr.findIndex(function(a) {
			return a === value;
		});
	};

	rivets.formatters.includes = function(value, arg) {
		if (!(value && value instanceof Array)) {
			return false;
		}
		return value.includes(arg);
	};

	rivets.formatters.has = function(value, arg) {
		if (!(value && value instanceof Set)) {
			return false;
		}
		return value.has(arg);
	};

	rivets.formatters.slice = function(value, start, end) {
		if (!(value && value instanceof Array)) {
			return value;
		}
		return value.slice(start || 0, end || value.length);
	};

	rivets.formatters.valueAt = function(value, index) {
		if (!(value && value instanceof Array)) {
			return value;
		}
		return value[index || 0];
	};

	rivets.formatters.every = function(arr, value, field) {
		if (arr instanceof Array) {
			if (field) {
				return arr.every(e => e[field] === value);
			}
			return arr.every(e => e === value);
		}
		return false;
	};

	rivets.formatters.some = function(arr, value, field) {
		if (arr instanceof Array) {
			if (field) {
				return arr.some(e => e[field] === value);
			}
			return arr.some(e => e === value);
		}
		return false;
	};

	rivets.formatters.none = function(arr, value, field) {
		return !rivets.formatters.every(arr, value, field);
	};

	//* Function formatters

	rivets.formatters.wrap = function(value) {
		var args = Array.prototype.slice.call(arguments);
		args.splice(0, 1);
		return function(evt) {
			var cpy = args.slice();
			Array.prototype.push.apply(cpy, Array.prototype.slice.call(arguments));
			return value.apply(this, cpy);
		};
	};

	rivets.formatters.delay = function(value, ts) {
		var self = this;
		return function() {
			setTimeout(function() { value.apply(self, arguments); }, ts);
		};
	};

	rivets.formatters.preventDefault = function(value) {
		var self = this;
		return function(evt) {
			evt.preventDefault();
			value.call(self, evt);
			return false;
		};
	};

	rivets.formatters.currency = function(value, symbol) {
		if (!isNaN(value)) {
			value = (Number(value)).toFixed(2);
			var parts = ('' + value).split('.');
			parts[0] = parts[0].replace('/\B(?=(\d{3})+(?!\d))/g', ',');
			value = parts.join('.');
			return symbol ? symbol + value : value;
		};
	}

	//* Bindings

	rivets.binders['hide-force'] = function(el, value) {
		if (value) {
			el.style.setProperty('display', 'none', 'important');
		} else {
			el.style.removeProperty('display');
		}
	};

	rivets.binders['show-force'] = function(el, value) {
		rivets.binders['hide-force'].call(this, el, !value);
	};

	rivets.binders.height = function(el, value) {
		el.style.height = value;
	};

	rivets.binders.width = function(el, value) {
		el.style.width = value;
	};

	rivets.binders.addClass = function(el, value) {
		if (el.addedClass) {
			el.classList.remove(el.addedClass);
			delete el.addedClass;
		}
		if (value) {
			el.classList.add(value);
			el.addedClass = value;
		}
	};

	rivets.binders['preventdefault-on-*'] = {
		function: true,
		routine: function(el, value) {
			rivets.binders['on-*'].routine.call(this, el, function(e) {
				e.preventDefault();
				value.call(this, e);
			});
		}
	};

	rivets.binders['trusted-on-*'] = {
		function: true,
		routine: function(el, value) {
			rivets.binders['on-*'].routine.call(this, el, function(e) {
				if (e.isTrusted) {
					value.call(this, e);
				}
			});
		}
	};

	rivets.binders['style-*'] = function(el, value) {
		el.style.setProperty(this.args[0], value);
	};

	rivets.binders['src-strict'] = function(el, value) {
		var img = new Image();
		img.onload = function() {
			el.setAttribute('src', value);
		}
		img.src = value;
	};

	rivets.binders['attr-*'] = function(el, value) {
		var attr = this.type.substring(this.type.indexOf('-') + 1);
		if (value || value === 0) {
			el.setAttribute(attr, value);
		} else {
			el.removeAttribute(attr);
		}
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

	rivets.binders.order = function(el, value) {
		el.setAttribute('data-order-value', value);
		if (el.parentNode === null) return;
		var siblings = el.parentNode.childNodes;
		for (var i = 0; i < siblings.length; i++) {
			if (!(siblings[i] instanceof Element)) continue;
			if (siblings[i].getAttribute('data-order-value') > value) {
				el.parentNode.insertBefore(el, siblings[i]);
				return;
			}
		}
		el.parentNode.appendChild(el);
	};

}(window.rivets = window.rivets || {}));