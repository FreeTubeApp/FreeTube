/*!
 * MediaElement.js
 * http://www.mediaelementjs.com/
 *
 * Wrapper that mimics native HTML5 MediaElement (audio and video)
 * using a variety of technologies (pure JavaScript, Flash, iframe)
 *
 * Copyright 2010-2017, John Dyer (http://j.hn/)
 * License: MIT
 *
 */(function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(_dereq_,module,exports){

},{}],2:[function(_dereq_,module,exports){
(function (global){
var topLevel = typeof global !== 'undefined' ? global :
    typeof window !== 'undefined' ? window : {}
var minDoc = _dereq_(1);

var doccy;

if (typeof document !== 'undefined') {
    doccy = document;
} else {
    doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'];

    if (!doccy) {
        doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'] = minDoc;
    }
}

module.exports = doccy;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"1":1}],3:[function(_dereq_,module,exports){
(function (global){
var win;

if (typeof window !== "undefined") {
    win = window;
} else if (typeof global !== "undefined") {
    win = global;
} else if (typeof self !== "undefined"){
    win = self;
} else {
    win = {};
}

module.exports = win;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],4:[function(_dereq_,module,exports){
(function (root) {

  // Store setTimeout reference so promise-polyfill will be unaffected by
  // other code modifying setTimeout (like sinon.useFakeTimers())
  var setTimeoutFunc = setTimeout;

  function noop() {}

  // Polyfill for Function.prototype.bind
  function bind(fn, thisArg) {
    return function () {
      fn.apply(thisArg, arguments);
    };
  }

  function Promise(fn) {
    if (typeof this !== 'object') throw new TypeError('Promises must be constructed via new');
    if (typeof fn !== 'function') throw new TypeError('not a function');
    this._state = 0;
    this._handled = false;
    this._value = undefined;
    this._deferreds = [];

    doResolve(fn, this);
  }

  function handle(self, deferred) {
    while (self._state === 3) {
      self = self._value;
    }
    if (self._state === 0) {
      self._deferreds.push(deferred);
      return;
    }
    self._handled = true;
    Promise._immediateFn(function () {
      var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
      if (cb === null) {
        (self._state === 1 ? resolve : reject)(deferred.promise, self._value);
        return;
      }
      var ret;
      try {
        ret = cb(self._value);
      } catch (e) {
        reject(deferred.promise, e);
        return;
      }
      resolve(deferred.promise, ret);
    });
  }

  function resolve(self, newValue) {
    try {
      // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
      if (newValue === self) throw new TypeError('A promise cannot be resolved with itself.');
      if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
        var then = newValue.then;
        if (newValue instanceof Promise) {
          self._state = 3;
          self._value = newValue;
          finale(self);
          return;
        } else if (typeof then === 'function') {
          doResolve(bind(then, newValue), self);
          return;
        }
      }
      self._state = 1;
      self._value = newValue;
      finale(self);
    } catch (e) {
      reject(self, e);
    }
  }

  function reject(self, newValue) {
    self._state = 2;
    self._value = newValue;
    finale(self);
  }

  function finale(self) {
    if (self._state === 2 && self._deferreds.length === 0) {
      Promise._immediateFn(function() {
        if (!self._handled) {
          Promise._unhandledRejectionFn(self._value);
        }
      });
    }

    for (var i = 0, len = self._deferreds.length; i < len; i++) {
      handle(self, self._deferreds[i]);
    }
    self._deferreds = null;
  }

  function Handler(onFulfilled, onRejected, promise) {
    this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
    this.onRejected = typeof onRejected === 'function' ? onRejected : null;
    this.promise = promise;
  }

  /**
   * Take a potentially misbehaving resolver function and make sure
   * onFulfilled and onRejected are only called once.
   *
   * Makes no guarantees about asynchrony.
   */
  function doResolve(fn, self) {
    var done = false;
    try {
      fn(function (value) {
        if (done) return;
        done = true;
        resolve(self, value);
      }, function (reason) {
        if (done) return;
        done = true;
        reject(self, reason);
      });
    } catch (ex) {
      if (done) return;
      done = true;
      reject(self, ex);
    }
  }

  Promise.prototype['catch'] = function (onRejected) {
    return this.then(null, onRejected);
  };

  Promise.prototype.then = function (onFulfilled, onRejected) {
    var prom = new (this.constructor)(noop);

    handle(this, new Handler(onFulfilled, onRejected, prom));
    return prom;
  };

  Promise.all = function (arr) {
    var args = Array.prototype.slice.call(arr);

    return new Promise(function (resolve, reject) {
      if (args.length === 0) return resolve([]);
      var remaining = args.length;

      function res(i, val) {
        try {
          if (val && (typeof val === 'object' || typeof val === 'function')) {
            var then = val.then;
            if (typeof then === 'function') {
              then.call(val, function (val) {
                res(i, val);
              }, reject);
              return;
            }
          }
          args[i] = val;
          if (--remaining === 0) {
            resolve(args);
          }
        } catch (ex) {
          reject(ex);
        }
      }

      for (var i = 0; i < args.length; i++) {
        res(i, args[i]);
      }
    });
  };

  Promise.resolve = function (value) {
    if (value && typeof value === 'object' && value.constructor === Promise) {
      return value;
    }

    return new Promise(function (resolve) {
      resolve(value);
    });
  };

  Promise.reject = function (value) {
    return new Promise(function (resolve, reject) {
      reject(value);
    });
  };

  Promise.race = function (values) {
    return new Promise(function (resolve, reject) {
      for (var i = 0, len = values.length; i < len; i++) {
        values[i].then(resolve, reject);
      }
    });
  };

  // Use polyfill for setImmediate for performance gains
  Promise._immediateFn = (typeof setImmediate === 'function' && function (fn) { setImmediate(fn); }) ||
    function (fn) {
      setTimeoutFunc(fn, 0);
    };

  Promise._unhandledRejectionFn = function _unhandledRejectionFn(err) {
    if (typeof console !== 'undefined' && console) {
      console.warn('Possible Unhandled Promise Rejection:', err); // eslint-disable-line no-console
    }
  };

  /**
   * Set the immediate function to execute callbacks
   * @param fn {function} Function to execute
   * @deprecated
   */
  Promise._setImmediateFn = function _setImmediateFn(fn) {
    Promise._immediateFn = fn;
  };

  /**
   * Change the function to execute on unhandled rejection
   * @param {function} fn Function to execute on unhandled rejection
   * @deprecated
   */
  Promise._setUnhandledRejectionFn = function _setUnhandledRejectionFn(fn) {
    Promise._unhandledRejectionFn = fn;
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Promise;
  } else if (!root.Promise) {
    root.Promise = Promise;
  }

})(this);

},{}],5:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _mejs = _dereq_(7);

var _mejs2 = _interopRequireDefault(_mejs);

var _en = _dereq_(15);

var _general = _dereq_(27);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var i18n = { lang: 'en', en: _en.EN };

i18n.language = function () {
	for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
		args[_key] = arguments[_key];
	}

	if (args !== null && args !== undefined && args.length) {

		if (typeof args[0] !== 'string') {
			throw new TypeError('Language code must be a string value');
		}

		if (!/^[a-z]{2,3}((\-|_)[a-z]{2})?$/i.test(args[0])) {
			throw new TypeError('Language code must have format 2-3 letters and. optionally, hyphen, underscore followed by 2 more letters');
		}

		i18n.lang = args[0];

		if (i18n[args[0]] === undefined) {
			args[1] = args[1] !== null && args[1] !== undefined && _typeof(args[1]) === 'object' ? args[1] : {};
			i18n[args[0]] = !(0, _general.isObjectEmpty)(args[1]) ? args[1] : _en.EN;
		} else if (args[1] !== null && args[1] !== undefined && _typeof(args[1]) === 'object') {
			i18n[args[0]] = args[1];
		}
	}

	return i18n.lang;
};

i18n.t = function (message) {
	var pluralParam = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;


	if (typeof message === 'string' && message.length) {

		var str = void 0,
		    pluralForm = void 0;

		var language = i18n.language();

		var _plural = function _plural(input, number, form) {

			if ((typeof input === 'undefined' ? 'undefined' : _typeof(input)) !== 'object' || typeof number !== 'number' || typeof form !== 'number') {
				return input;
			}

			var _pluralForms = function () {
				return [function () {
					return arguments.length <= 1 ? undefined : arguments[1];
				}, function () {
					return (arguments.length <= 0 ? undefined : arguments[0]) === 1 ? arguments.length <= 1 ? undefined : arguments[1] : arguments.length <= 2 ? undefined : arguments[2];
				}, function () {
					return (arguments.length <= 0 ? undefined : arguments[0]) === 0 || (arguments.length <= 0 ? undefined : arguments[0]) === 1 ? arguments.length <= 1 ? undefined : arguments[1] : arguments.length <= 2 ? undefined : arguments[2];
				}, function () {
					if ((arguments.length <= 0 ? undefined : arguments[0]) % 10 === 1 && (arguments.length <= 0 ? undefined : arguments[0]) % 100 !== 11) {
						return arguments.length <= 1 ? undefined : arguments[1];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) !== 0) {
						return arguments.length <= 2 ? undefined : arguments[2];
					} else {
						return arguments.length <= 3 ? undefined : arguments[3];
					}
				}, function () {
					if ((arguments.length <= 0 ? undefined : arguments[0]) === 1 || (arguments.length <= 0 ? undefined : arguments[0]) === 11) {
						return arguments.length <= 1 ? undefined : arguments[1];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) === 2 || (arguments.length <= 0 ? undefined : arguments[0]) === 12) {
						return arguments.length <= 2 ? undefined : arguments[2];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) > 2 && (arguments.length <= 0 ? undefined : arguments[0]) < 20) {
						return arguments.length <= 3 ? undefined : arguments[3];
					} else {
						return arguments.length <= 4 ? undefined : arguments[4];
					}
				}, function () {
					if ((arguments.length <= 0 ? undefined : arguments[0]) === 1) {
						return arguments.length <= 1 ? undefined : arguments[1];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) === 0 || (arguments.length <= 0 ? undefined : arguments[0]) % 100 > 0 && (arguments.length <= 0 ? undefined : arguments[0]) % 100 < 20) {
						return arguments.length <= 2 ? undefined : arguments[2];
					} else {
						return arguments.length <= 3 ? undefined : arguments[3];
					}
				}, function () {
					if ((arguments.length <= 0 ? undefined : arguments[0]) % 10 === 1 && (arguments.length <= 0 ? undefined : arguments[0]) % 100 !== 11) {
						return arguments.length <= 1 ? undefined : arguments[1];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) % 10 >= 2 && ((arguments.length <= 0 ? undefined : arguments[0]) % 100 < 10 || (arguments.length <= 0 ? undefined : arguments[0]) % 100 >= 20)) {
						return arguments.length <= 2 ? undefined : arguments[2];
					} else {
						return [3];
					}
				}, function () {
					if ((arguments.length <= 0 ? undefined : arguments[0]) % 10 === 1 && (arguments.length <= 0 ? undefined : arguments[0]) % 100 !== 11) {
						return arguments.length <= 1 ? undefined : arguments[1];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) % 10 >= 2 && (arguments.length <= 0 ? undefined : arguments[0]) % 10 <= 4 && ((arguments.length <= 0 ? undefined : arguments[0]) % 100 < 10 || (arguments.length <= 0 ? undefined : arguments[0]) % 100 >= 20)) {
						return arguments.length <= 2 ? undefined : arguments[2];
					} else {
						return arguments.length <= 3 ? undefined : arguments[3];
					}
				}, function () {
					if ((arguments.length <= 0 ? undefined : arguments[0]) === 1) {
						return arguments.length <= 1 ? undefined : arguments[1];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) >= 2 && (arguments.length <= 0 ? undefined : arguments[0]) <= 4) {
						return arguments.length <= 2 ? undefined : arguments[2];
					} else {
						return arguments.length <= 3 ? undefined : arguments[3];
					}
				}, function () {
					if ((arguments.length <= 0 ? undefined : arguments[0]) === 1) {
						return arguments.length <= 1 ? undefined : arguments[1];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) % 10 >= 2 && (arguments.length <= 0 ? undefined : arguments[0]) % 10 <= 4 && ((arguments.length <= 0 ? undefined : arguments[0]) % 100 < 10 || (arguments.length <= 0 ? undefined : arguments[0]) % 100 >= 20)) {
						return arguments.length <= 2 ? undefined : arguments[2];
					} else {
						return arguments.length <= 3 ? undefined : arguments[3];
					}
				}, function () {
					if ((arguments.length <= 0 ? undefined : arguments[0]) % 100 === 1) {
						return arguments.length <= 2 ? undefined : arguments[2];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) % 100 === 2) {
						return arguments.length <= 3 ? undefined : arguments[3];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) % 100 === 3 || (arguments.length <= 0 ? undefined : arguments[0]) % 100 === 4) {
						return arguments.length <= 4 ? undefined : arguments[4];
					} else {
						return arguments.length <= 1 ? undefined : arguments[1];
					}
				}, function () {
					if ((arguments.length <= 0 ? undefined : arguments[0]) === 1) {
						return arguments.length <= 1 ? undefined : arguments[1];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) === 2) {
						return arguments.length <= 2 ? undefined : arguments[2];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) > 2 && (arguments.length <= 0 ? undefined : arguments[0]) < 7) {
						return arguments.length <= 3 ? undefined : arguments[3];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) > 6 && (arguments.length <= 0 ? undefined : arguments[0]) < 11) {
						return arguments.length <= 4 ? undefined : arguments[4];
					} else {
						return arguments.length <= 5 ? undefined : arguments[5];
					}
				}, function () {
					if ((arguments.length <= 0 ? undefined : arguments[0]) === 0) {
						return arguments.length <= 1 ? undefined : arguments[1];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) === 1) {
						return arguments.length <= 2 ? undefined : arguments[2];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) === 2) {
						return arguments.length <= 3 ? undefined : arguments[3];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) % 100 >= 3 && (arguments.length <= 0 ? undefined : arguments[0]) % 100 <= 10) {
						return arguments.length <= 4 ? undefined : arguments[4];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) % 100 >= 11) {
						return arguments.length <= 5 ? undefined : arguments[5];
					} else {
						return arguments.length <= 6 ? undefined : arguments[6];
					}
				}, function () {
					if ((arguments.length <= 0 ? undefined : arguments[0]) === 1) {
						return arguments.length <= 1 ? undefined : arguments[1];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) === 0 || (arguments.length <= 0 ? undefined : arguments[0]) % 100 > 1 && (arguments.length <= 0 ? undefined : arguments[0]) % 100 < 11) {
						return arguments.length <= 2 ? undefined : arguments[2];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) % 100 > 10 && (arguments.length <= 0 ? undefined : arguments[0]) % 100 < 20) {
						return arguments.length <= 3 ? undefined : arguments[3];
					} else {
						return arguments.length <= 4 ? undefined : arguments[4];
					}
				}, function () {
					if ((arguments.length <= 0 ? undefined : arguments[0]) % 10 === 1) {
						return arguments.length <= 1 ? undefined : arguments[1];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) % 10 === 2) {
						return arguments.length <= 2 ? undefined : arguments[2];
					} else {
						return arguments.length <= 3 ? undefined : arguments[3];
					}
				}, function () {
					return (arguments.length <= 0 ? undefined : arguments[0]) !== 11 && (arguments.length <= 0 ? undefined : arguments[0]) % 10 === 1 ? arguments.length <= 1 ? undefined : arguments[1] : arguments.length <= 2 ? undefined : arguments[2];
				}, function () {
					if ((arguments.length <= 0 ? undefined : arguments[0]) === 1) {
						return arguments.length <= 1 ? undefined : arguments[1];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) % 10 >= 2 && (arguments.length <= 0 ? undefined : arguments[0]) % 10 <= 4 && ((arguments.length <= 0 ? undefined : arguments[0]) % 100 < 10 || (arguments.length <= 0 ? undefined : arguments[0]) % 100 >= 20)) {
						return arguments.length <= 2 ? undefined : arguments[2];
					} else {
						return arguments.length <= 3 ? undefined : arguments[3];
					}
				}, function () {
					if ((arguments.length <= 0 ? undefined : arguments[0]) === 1) {
						return arguments.length <= 1 ? undefined : arguments[1];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) === 2) {
						return arguments.length <= 2 ? undefined : arguments[2];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) !== 8 && (arguments.length <= 0 ? undefined : arguments[0]) !== 11) {
						return arguments.length <= 3 ? undefined : arguments[3];
					} else {
						return arguments.length <= 4 ? undefined : arguments[4];
					}
				}, function () {
					return (arguments.length <= 0 ? undefined : arguments[0]) === 0 ? arguments.length <= 1 ? undefined : arguments[1] : arguments.length <= 2 ? undefined : arguments[2];
				}, function () {
					if ((arguments.length <= 0 ? undefined : arguments[0]) === 1) {
						return arguments.length <= 1 ? undefined : arguments[1];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) === 2) {
						return arguments.length <= 2 ? undefined : arguments[2];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) === 3) {
						return arguments.length <= 3 ? undefined : arguments[3];
					} else {
						return arguments.length <= 4 ? undefined : arguments[4];
					}
				}, function () {
					if ((arguments.length <= 0 ? undefined : arguments[0]) === 0) {
						return arguments.length <= 1 ? undefined : arguments[1];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) === 1) {
						return arguments.length <= 2 ? undefined : arguments[2];
					} else {
						return arguments.length <= 3 ? undefined : arguments[3];
					}
				}];
			}();

			return _pluralForms[form].apply(null, [number].concat(input));
		};

		if (i18n[language] !== undefined) {
			str = i18n[language][message];
			if (pluralParam !== null && typeof pluralParam === 'number') {
				pluralForm = i18n[language]['mejs.plural-form'];
				str = _plural.apply(null, [str, pluralParam, pluralForm]);
			}
		}

		if (!str && i18n.en) {
			str = i18n.en[message];
			if (pluralParam !== null && typeof pluralParam === 'number') {
				pluralForm = i18n.en['mejs.plural-form'];
				str = _plural.apply(null, [str, pluralParam, pluralForm]);
			}
		}

		str = str || message;

		if (pluralParam !== null && typeof pluralParam === 'number') {
			str = str.replace('%1', pluralParam);
		}

		return (0, _general.escapeHTML)(str);
	}

	return message;
};

_mejs2.default.i18n = i18n;

if (typeof mejsL10n !== 'undefined') {
	_mejs2.default.i18n.language(mejsL10n.language, mejsL10n.strings);
}

exports.default = i18n;

},{"15":15,"27":27,"7":7}],6:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _window = _dereq_(3);

var _window2 = _interopRequireDefault(_window);

var _document = _dereq_(2);

var _document2 = _interopRequireDefault(_document);

var _mejs = _dereq_(7);

var _mejs2 = _interopRequireDefault(_mejs);

var _general = _dereq_(27);

var _media2 = _dereq_(28);

var _renderer = _dereq_(8);

var _constants = _dereq_(25);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MediaElement = function MediaElement(idOrNode, options, sources) {
	var _this = this;

	_classCallCheck(this, MediaElement);

	var t = this;

	sources = Array.isArray(sources) ? sources : null;

	t.defaults = {
		renderers: [],

		fakeNodeName: 'mediaelementwrapper',

		pluginPath: 'build/',

		shimScriptAccess: 'sameDomain'
	};

	options = Object.assign(t.defaults, options);

	t.mediaElement = _document2.default.createElement(options.fakeNodeName);

	var id = idOrNode,
	    error = false;

	if (typeof idOrNode === 'string') {
		t.mediaElement.originalNode = _document2.default.getElementById(idOrNode);
	} else {
		t.mediaElement.originalNode = idOrNode;
		id = idOrNode.id;
	}

	if (t.mediaElement.originalNode === undefined || t.mediaElement.originalNode === null) {
		return null;
	}

	t.mediaElement.options = options;
	id = id || 'mejs_' + Math.random().toString().slice(2);

	t.mediaElement.originalNode.setAttribute('id', id + '_from_mejs');

	var tagName = t.mediaElement.originalNode.tagName.toLowerCase();
	if (['video', 'audio'].indexOf(tagName) > -1 && !t.mediaElement.originalNode.getAttribute('preload')) {
		t.mediaElement.originalNode.setAttribute('preload', 'none');
	}

	t.mediaElement.originalNode.parentNode.insertBefore(t.mediaElement, t.mediaElement.originalNode);

	t.mediaElement.appendChild(t.mediaElement.originalNode);

	var processURL = function processURL(url, type) {
		if (_window2.default.location.protocol === 'https:' && url.indexOf('http:') === 0 && _constants.IS_IOS && _mejs2.default.html5media.mediaTypes.indexOf(type) > -1) {
			var xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function () {
				if (this.readyState === 4 && this.status === 200) {
					var _url = _window2.default.URL || _window2.default.webkitURL,
					    blobUrl = _url.createObjectURL(this.response);
					t.mediaElement.originalNode.setAttribute('src', blobUrl);
					return blobUrl;
				}
				return url;
			};
			xhr.open('GET', url);
			xhr.responseType = 'blob';
			xhr.send();
		}

		return url;
	};

	var mediaFiles = void 0;

	if (sources !== null) {
		mediaFiles = sources;
	} else if (t.mediaElement.originalNode !== null) {

		mediaFiles = [];

		switch (t.mediaElement.originalNode.nodeName.toLowerCase()) {
			case 'iframe':
				mediaFiles.push({
					type: '',
					src: t.mediaElement.originalNode.getAttribute('src')
				});
				break;
			case 'audio':
			case 'video':
				var _sources = t.mediaElement.originalNode.children.length,
				    nodeSource = t.mediaElement.originalNode.getAttribute('src');

				if (nodeSource) {
					var node = t.mediaElement.originalNode,
					    type = (0, _media2.formatType)(nodeSource, node.getAttribute('type'));
					mediaFiles.push({
						type: type,
						src: processURL(nodeSource, type)
					});
				}

				for (var i = 0; i < _sources; i++) {
					var n = t.mediaElement.originalNode.children[i];
					if (n.tagName.toLowerCase() === 'source') {
						var src = n.getAttribute('src'),
						    _type = (0, _media2.formatType)(src, n.getAttribute('type'));
						mediaFiles.push({ type: _type, src: processURL(src, _type) });
					}
				}
				break;
		}
	}

	t.mediaElement.id = id;
	t.mediaElement.renderers = {};
	t.mediaElement.events = {};
	t.mediaElement.promises = [];
	t.mediaElement.renderer = null;
	t.mediaElement.rendererName = null;

	t.mediaElement.changeRenderer = function (rendererName, mediaFiles) {

		var t = _this,
		    media = Object.keys(mediaFiles[0]).length > 2 ? mediaFiles[0] : mediaFiles[0].src;

		if (t.mediaElement.renderer !== undefined && t.mediaElement.renderer !== null && t.mediaElement.renderer.name === rendererName) {
			t.mediaElement.renderer.pause();
			if (t.mediaElement.renderer.stop) {
				t.mediaElement.renderer.stop();
			}
			t.mediaElement.renderer.show();
			t.mediaElement.renderer.setSrc(media);
			return true;
		}

		if (t.mediaElement.renderer !== undefined && t.mediaElement.renderer !== null) {
			t.mediaElement.renderer.pause();
			if (t.mediaElement.renderer.stop) {
				t.mediaElement.renderer.stop();
			}
			t.mediaElement.renderer.hide();
		}

		var newRenderer = t.mediaElement.renderers[rendererName],
		    newRendererType = null;

		if (newRenderer !== undefined && newRenderer !== null) {
			newRenderer.show();
			newRenderer.setSrc(media);
			t.mediaElement.renderer = newRenderer;
			t.mediaElement.rendererName = rendererName;
			return true;
		}

		var rendererArray = t.mediaElement.options.renderers.length ? t.mediaElement.options.renderers : _renderer.renderer.order;

		for (var _i = 0, total = rendererArray.length; _i < total; _i++) {
			var index = rendererArray[_i];

			if (index === rendererName) {
				var rendererList = _renderer.renderer.renderers;
				newRendererType = rendererList[index];

				var renderOptions = Object.assign(newRendererType.options, t.mediaElement.options);
				newRenderer = newRendererType.create(t.mediaElement, renderOptions, mediaFiles);
				newRenderer.name = rendererName;

				t.mediaElement.renderers[newRendererType.name] = newRenderer;
				t.mediaElement.renderer = newRenderer;
				t.mediaElement.rendererName = rendererName;
				newRenderer.show();
				return true;
			}
		}

		return false;
	};

	t.mediaElement.setSize = function (width, height) {
		if (t.mediaElement.renderer !== undefined && t.mediaElement.renderer !== null) {
			t.mediaElement.renderer.setSize(width, height);
		}
	};

	t.mediaElement.generateError = function (message, urlList) {
		message = message || '';
		urlList = Array.isArray(urlList) ? urlList : [];
		var event = (0, _general.createEvent)('error', t.mediaElement);
		event.message = message;
		event.urls = urlList;
		t.mediaElement.dispatchEvent(event);
		error = true;
	};

	var props = _mejs2.default.html5media.properties,
	    methods = _mejs2.default.html5media.methods,
	    addProperty = function addProperty(obj, name, onGet, onSet) {
		var oldValue = obj[name];
		var getFn = function getFn() {
			return onGet.apply(obj, [oldValue]);
		},
		    setFn = function setFn(newValue) {
			oldValue = onSet.apply(obj, [newValue]);
			return oldValue;
		};

		Object.defineProperty(obj, name, {
			get: getFn,
			set: setFn
		});
	},
	    assignGettersSetters = function assignGettersSetters(propName) {
		if (propName !== 'src') {

			var capName = '' + propName.substring(0, 1).toUpperCase() + propName.substring(1),
			    getFn = function getFn() {
				return t.mediaElement.renderer !== undefined && t.mediaElement.renderer !== null && typeof t.mediaElement.renderer['get' + capName] === 'function' ? t.mediaElement.renderer['get' + capName]() : null;
			},
			    setFn = function setFn(value) {
				if (t.mediaElement.renderer !== undefined && t.mediaElement.renderer !== null && typeof t.mediaElement.renderer['set' + capName] === 'function') {
					t.mediaElement.renderer['set' + capName](value);
				}
			};

			addProperty(t.mediaElement, propName, getFn, setFn);
			t.mediaElement['get' + capName] = getFn;
			t.mediaElement['set' + capName] = setFn;
		}
	},
	    getSrc = function getSrc() {
		return t.mediaElement.renderer !== undefined && t.mediaElement.renderer !== null ? t.mediaElement.renderer.getSrc() : null;
	},
	    setSrc = function setSrc(value) {
		var mediaFiles = [];

		if (typeof value === 'string') {
			mediaFiles.push({
				src: value,
				type: value ? (0, _media2.getTypeFromFile)(value) : ''
			});
		} else if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && value.src !== undefined) {
			var _src = (0, _media2.absolutizeUrl)(value.src),
			    _type2 = value.type,
			    media = Object.assign(value, {
				src: _src,
				type: (_type2 === '' || _type2 === null || _type2 === undefined) && _src ? (0, _media2.getTypeFromFile)(_src) : _type2
			});
			mediaFiles.push(media);
		} else if (Array.isArray(value)) {
			for (var _i2 = 0, total = value.length; _i2 < total; _i2++) {

				var _src2 = (0, _media2.absolutizeUrl)(value[_i2].src),
				    _type3 = value[_i2].type,
				    _media = Object.assign(value[_i2], {
					src: _src2,
					type: (_type3 === '' || _type3 === null || _type3 === undefined) && _src2 ? (0, _media2.getTypeFromFile)(_src2) : _type3
				});

				mediaFiles.push(_media);
			}
		}

		var renderInfo = _renderer.renderer.select(mediaFiles, t.mediaElement.options.renderers.length ? t.mediaElement.options.renderers : []),
		    event = void 0;

		if (!t.mediaElement.paused) {
			t.mediaElement.pause();
			event = (0, _general.createEvent)('pause', t.mediaElement);
			t.mediaElement.dispatchEvent(event);
		}
		t.mediaElement.originalNode.src = mediaFiles[0].src || '';

		if (renderInfo === null && mediaFiles[0].src) {
			t.mediaElement.generateError('No renderer found', mediaFiles);
			return;
		}

		return mediaFiles[0].src ? t.mediaElement.changeRenderer(renderInfo.rendererName, mediaFiles) : null;
	},
	    triggerAction = function triggerAction(methodName, args) {
		try {
			if (methodName === 'play' && t.mediaElement.rendererName === 'native_dash') {
				var response = t.mediaElement.renderer[methodName](args);
				if (response && typeof response.then === 'function') {
					response.catch(function () {
						if (t.mediaElement.paused) {
							setTimeout(function () {
								var tmpResponse = t.mediaElement.renderer.play();
								if (tmpResponse !== undefined) {
									tmpResponse.catch(function () {
										if (!t.mediaElement.renderer.paused) {
											t.mediaElement.renderer.pause();
										}
									});
								}
							}, 150);
						}
					});
				}
			} else {
				t.mediaElement.renderer[methodName](args);
			}
		} catch (e) {
			t.mediaElement.generateError(e, mediaFiles);
		}
	},
	    assignMethods = function assignMethods(methodName) {
		t.mediaElement[methodName] = function () {
			for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
				args[_key] = arguments[_key];
			}

			if (t.mediaElement.renderer !== undefined && t.mediaElement.renderer !== null && typeof t.mediaElement.renderer[methodName] === 'function') {
				if (t.mediaElement.promises.length) {
					Promise.all(t.mediaElement.promises).then(function () {
						triggerAction(methodName, args);
					}).catch(function (e) {
						t.mediaElement.generateError(e, mediaFiles);
					});
				} else {
					triggerAction(methodName, args);
				}
			}
			return null;
		};
	};

	addProperty(t.mediaElement, 'src', getSrc, setSrc);
	t.mediaElement.getSrc = getSrc;
	t.mediaElement.setSrc = setSrc;

	for (var _i3 = 0, total = props.length; _i3 < total; _i3++) {
		assignGettersSetters(props[_i3]);
	}

	for (var _i4 = 0, _total = methods.length; _i4 < _total; _i4++) {
		assignMethods(methods[_i4]);
	}

	t.mediaElement.addEventListener = function (eventName, callback) {
		t.mediaElement.events[eventName] = t.mediaElement.events[eventName] || [];

		t.mediaElement.events[eventName].push(callback);
	};
	t.mediaElement.removeEventListener = function (eventName, callback) {
		if (!eventName) {
			t.mediaElement.events = {};
			return true;
		}

		var callbacks = t.mediaElement.events[eventName];

		if (!callbacks) {
			return true;
		}

		if (!callback) {
			t.mediaElement.events[eventName] = [];
			return true;
		}

		for (var _i5 = 0; _i5 < callbacks.length; _i5++) {
			if (callbacks[_i5] === callback) {
				t.mediaElement.events[eventName].splice(_i5, 1);
				return true;
			}
		}
		return false;
	};

	t.mediaElement.dispatchEvent = function (event) {
		var callbacks = t.mediaElement.events[event.type];
		if (callbacks) {
			for (var _i6 = 0; _i6 < callbacks.length; _i6++) {
				callbacks[_i6].apply(null, [event]);
			}
		}
	};

	t.mediaElement.destroy = function () {
		var mediaElement = t.mediaElement.originalNode.cloneNode(true);
		var wrapper = t.mediaElement.parentElement;
		mediaElement.removeAttribute('id');
		mediaElement.remove();
		t.mediaElement.remove();
		wrapper.append(mediaElement);
	};

	if (mediaFiles.length) {
		t.mediaElement.src = mediaFiles;
	}

	if (t.mediaElement.promises.length) {
		Promise.all(t.mediaElement.promises).then(function () {
			if (t.mediaElement.options.success) {
				t.mediaElement.options.success(t.mediaElement, t.mediaElement.originalNode);
			}
		}).catch(function () {
			if (error && t.mediaElement.options.error) {
				t.mediaElement.options.error(t.mediaElement, t.mediaElement.originalNode);
			}
		});
	} else {
		if (t.mediaElement.options.success) {
			t.mediaElement.options.success(t.mediaElement, t.mediaElement.originalNode);
		}

		if (error && t.mediaElement.options.error) {
			t.mediaElement.options.error(t.mediaElement, t.mediaElement.originalNode);
		}
	}

	return t.mediaElement;
};

_window2.default.MediaElement = MediaElement;
_mejs2.default.MediaElement = MediaElement;

exports.default = MediaElement;

},{"2":2,"25":25,"27":27,"28":28,"3":3,"7":7,"8":8}],7:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _window = _dereq_(3);

var _window2 = _interopRequireDefault(_window);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var mejs = {};

mejs.version = '4.2.10';

mejs.html5media = {
	properties: ['volume', 'src', 'currentTime', 'muted', 'duration', 'paused', 'ended', 'buffered', 'error', 'networkState', 'readyState', 'seeking', 'seekable', 'currentSrc', 'preload', 'bufferedBytes', 'bufferedTime', 'initialTime', 'startOffsetTime', 'defaultPlaybackRate', 'playbackRate', 'played', 'autoplay', 'loop', 'controls'],
	readOnlyProperties: ['duration', 'paused', 'ended', 'buffered', 'error', 'networkState', 'readyState', 'seeking', 'seekable'],

	methods: ['load', 'play', 'pause', 'canPlayType'],

	events: ['loadstart', 'durationchange', 'loadedmetadata', 'loadeddata', 'progress', 'canplay', 'canplaythrough', 'suspend', 'abort', 'error', 'emptied', 'stalled', 'play', 'playing', 'pause', 'waiting', 'seeking', 'seeked', 'timeupdate', 'ended', 'ratechange', 'volumechange'],

	mediaTypes: ['audio/mp3', 'audio/ogg', 'audio/oga', 'audio/wav', 'audio/x-wav', 'audio/wave', 'audio/x-pn-wav', 'audio/mpeg', 'audio/mp4', 'video/mp4', 'video/webm', 'video/ogg', 'video/ogv']
};

_window2.default.mejs = mejs;

exports.default = mejs;

},{"3":3}],8:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.renderer = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _mejs = _dereq_(7);

var _mejs2 = _interopRequireDefault(_mejs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Renderer = function () {
	function Renderer() {
		_classCallCheck(this, Renderer);

		this.renderers = {};
		this.order = [];
	}

	_createClass(Renderer, [{
		key: 'add',
		value: function add(renderer) {
			if (renderer.name === undefined) {
				throw new TypeError('renderer must contain at least `name` property');
			}

			this.renderers[renderer.name] = renderer;
			this.order.push(renderer.name);
		}
	}, {
		key: 'select',
		value: function select(mediaFiles) {
			var renderers = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

			var renderersLength = renderers.length;

			renderers = renderers.length ? renderers : this.order;

			if (!renderersLength) {
				var rendererIndicator = [/^(html5|native)/i, /^flash/i, /iframe$/i],
				    rendererRanking = function rendererRanking(renderer) {
					for (var i = 0, total = rendererIndicator.length; i < total; i++) {
						if (rendererIndicator[i].test(renderer)) {
							return i;
						}
					}
					return rendererIndicator.length;
				};

				renderers.sort(function (a, b) {
					return rendererRanking(a) - rendererRanking(b);
				});
			}

			for (var i = 0, total = renderers.length; i < total; i++) {
				var key = renderers[i],
				    _renderer = this.renderers[key];

				if (_renderer !== null && _renderer !== undefined) {
					for (var j = 0, jl = mediaFiles.length; j < jl; j++) {
						if (typeof _renderer.canPlayType === 'function' && typeof mediaFiles[j].type === 'string' && _renderer.canPlayType(mediaFiles[j].type)) {
							return {
								rendererName: _renderer.name,
								src: mediaFiles[j].src
							};
						}
					}
				}
			}

			return null;
		}
	}, {
		key: 'order',
		set: function set(order) {
			if (!Array.isArray(order)) {
				throw new TypeError('order must be an array of strings.');
			}

			this._order = order;
		},
		get: function get() {
			return this._order;
		}
	}, {
		key: 'renderers',
		set: function set(renderers) {
			if (renderers !== null && (typeof renderers === 'undefined' ? 'undefined' : _typeof(renderers)) !== 'object') {
				throw new TypeError('renderers must be an array of objects.');
			}

			this._renderers = renderers;
		},
		get: function get() {
			return this._renderers;
		}
	}]);

	return Renderer;
}();

var renderer = exports.renderer = new Renderer();

_mejs2.default.Renderers = renderer;

},{"7":7}],9:[function(_dereq_,module,exports){
'use strict';

var _window = _dereq_(3);

var _window2 = _interopRequireDefault(_window);

var _document = _dereq_(2);

var _document2 = _interopRequireDefault(_document);

var _i18n = _dereq_(5);

var _i18n2 = _interopRequireDefault(_i18n);

var _player = _dereq_(16);

var _player2 = _interopRequireDefault(_player);

var _constants = _dereq_(25);

var Features = _interopRequireWildcard(_constants);

var _general = _dereq_(27);

var _dom = _dereq_(26);

var _media = _dereq_(28);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

Object.assign(_player.config, {
	usePluginFullScreen: true,

	fullscreenText: null,

	useFakeFullscreen: false
});

Object.assign(_player2.default.prototype, {
	isFullScreen: false,

	isNativeFullScreen: false,

	isInIframe: false,

	isPluginClickThroughCreated: false,

	fullscreenMode: '',

	containerSizeTimeout: null,

	buildfullscreen: function buildfullscreen(player) {
		if (!player.isVideo) {
			return;
		}

		player.isInIframe = _window2.default.location !== _window2.default.parent.location;

		player.detectFullscreenMode();

		var t = this,
		    fullscreenTitle = (0, _general.isString)(t.options.fullscreenText) ? t.options.fullscreenText : _i18n2.default.t('mejs.fullscreen'),
		    fullscreenBtn = _document2.default.createElement('div');

		fullscreenBtn.className = t.options.classPrefix + 'button ' + t.options.classPrefix + 'fullscreen-button';
		fullscreenBtn.innerHTML = '<button type="button" aria-controls="' + t.id + '" title="' + fullscreenTitle + '" aria-label="' + fullscreenTitle + '" tabindex="0"></button>';
		t.addControlElement(fullscreenBtn, 'fullscreen');

		fullscreenBtn.addEventListener('click', function () {
			var isFullScreen = Features.HAS_TRUE_NATIVE_FULLSCREEN && Features.IS_FULLSCREEN || player.isFullScreen;

			if (isFullScreen) {
				player.exitFullScreen();
			} else {
				player.enterFullScreen();
			}
		});

		player.fullscreenBtn = fullscreenBtn;

		t.options.keyActions.push({
			keys: [70],
			action: function action(player, media, key, event) {
				if (!event.ctrlKey) {
					if (typeof player.enterFullScreen !== 'undefined') {
						if (player.isFullScreen) {
							player.exitFullScreen();
						} else {
							player.enterFullScreen();
						}
					}
				}
			}
		});

		t.exitFullscreenCallback = function (e) {
			var key = e.which || e.keyCode || 0;
			if (t.options.enableKeyboard && key === 27 && (Features.HAS_TRUE_NATIVE_FULLSCREEN && Features.IS_FULLSCREEN || t.isFullScreen)) {
				player.exitFullScreen();
			}
		};

		t.globalBind('keydown', t.exitFullscreenCallback);

		t.normalHeight = 0;
		t.normalWidth = 0;

		if (Features.HAS_TRUE_NATIVE_FULLSCREEN) {
			var fullscreenChanged = function fullscreenChanged() {
				if (player.isFullScreen) {
					if (Features.isFullScreen()) {
						player.isNativeFullScreen = true;

						player.setControlsSize();
					} else {
						player.isNativeFullScreen = false;

						player.exitFullScreen();
					}
				}
			};

			player.globalBind(Features.FULLSCREEN_EVENT_NAME, fullscreenChanged);
		}
	},
	cleanfullscreen: function cleanfullscreen(player) {
		player.exitFullScreen();
		player.globalUnbind('keydown', player.exitFullscreenCallback);
	},
	detectFullscreenMode: function detectFullscreenMode() {
		var t = this,
		    isNative = t.media.rendererName !== null && /(native|html5)/i.test(t.media.rendererName);

		var mode = '';

		if (Features.HAS_TRUE_NATIVE_FULLSCREEN && isNative) {
			mode = 'native-native';
		} else if (Features.HAS_TRUE_NATIVE_FULLSCREEN && !isNative) {
			mode = 'plugin-native';
		} else if (t.usePluginFullScreen && Features.SUPPORT_POINTER_EVENTS) {
			mode = 'plugin-click';
		}

		t.fullscreenMode = mode;
		return mode;
	},
	enterFullScreen: function enterFullScreen() {
		var t = this,
		    isNative = t.media.rendererName !== null && /(html5|native)/i.test(t.media.rendererName),
		    containerStyles = getComputedStyle(t.getElement(t.container));

		if (!t.isVideo) {
			return;
		}

		if (t.options.useFakeFullscreen === false && Features.IS_IOS && Features.HAS_IOS_FULLSCREEN && typeof t.media.originalNode.webkitEnterFullscreen === 'function' && t.media.originalNode.canPlayType((0, _media.getTypeFromFile)(t.media.getSrc()))) {
			t.media.originalNode.webkitEnterFullscreen();
			return;
		}

		(0, _dom.addClass)(_document2.default.documentElement, t.options.classPrefix + 'fullscreen');
		(0, _dom.addClass)(t.getElement(t.container), t.options.classPrefix + 'container-fullscreen');

		t.normalHeight = parseFloat(containerStyles.height);
		t.normalWidth = parseFloat(containerStyles.width);

		if (t.fullscreenMode === 'native-native' || t.fullscreenMode === 'plugin-native') {
			Features.requestFullScreen(t.getElement(t.container));

			if (t.isInIframe) {
				setTimeout(function checkFullscreen() {

					if (t.isNativeFullScreen) {
						var percentErrorMargin = 0.002,
						    windowWidth = _window2.default.innerWidth || _document2.default.documentElement.clientWidth || _document2.default.body.clientWidth,
						    screenWidth = screen.width,
						    absDiff = Math.abs(screenWidth - windowWidth),
						    marginError = screenWidth * percentErrorMargin;

						if (absDiff > marginError) {
							t.exitFullScreen();
						} else {
							setTimeout(checkFullscreen, 500);
						}
					}
				}, 1000);
			}
		}

		t.getElement(t.container).style.width = '100%';
		t.getElement(t.container).style.height = '100%';

		t.containerSizeTimeout = setTimeout(function () {
			t.getElement(t.container).style.width = '100%';
			t.getElement(t.container).style.height = '100%';
			t.setControlsSize();
		}, 500);

		if (isNative) {
			t.node.style.width = '100%';
			t.node.style.height = '100%';
		} else {
			var elements = t.getElement(t.container).querySelectorAll('embed, object, video'),
			    _total = elements.length;
			for (var i = 0; i < _total; i++) {
				elements[i].style.width = '100%';
				elements[i].style.height = '100%';
			}
		}

		if (t.options.setDimensions && typeof t.media.setSize === 'function') {
			t.media.setSize(screen.width, screen.height);
		}

		var layers = t.getElement(t.layers).children,
		    total = layers.length;
		for (var _i = 0; _i < total; _i++) {
			layers[_i].style.width = '100%';
			layers[_i].style.height = '100%';
		}

		if (t.fullscreenBtn) {
			(0, _dom.removeClass)(t.fullscreenBtn, t.options.classPrefix + 'fullscreen');
			(0, _dom.addClass)(t.fullscreenBtn, t.options.classPrefix + 'unfullscreen');
		}

		t.setControlsSize();
		t.isFullScreen = true;

		var zoomFactor = Math.min(screen.width / t.width, screen.height / t.height),
		    captionText = t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'captions-text');
		if (captionText) {
			captionText.style.fontSize = zoomFactor * 100 + '%';
			captionText.style.lineHeight = 'normal';
			t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'captions-position').style.bottom = (screen.height - t.normalHeight) / 2 - t.getElement(t.controls).offsetHeight / 2 + zoomFactor + 15 + 'px';
		}
		var event = (0, _general.createEvent)('enteredfullscreen', t.getElement(t.container));
		t.getElement(t.container).dispatchEvent(event);
	},
	exitFullScreen: function exitFullScreen() {
		var t = this,
		    isNative = t.media.rendererName !== null && /(native|html5)/i.test(t.media.rendererName);

		if (!t.isVideo) {
			return;
		}

		clearTimeout(t.containerSizeTimeout);

		if (Features.HAS_TRUE_NATIVE_FULLSCREEN && (Features.IS_FULLSCREEN || t.isFullScreen)) {
			Features.cancelFullScreen();
		}

		(0, _dom.removeClass)(_document2.default.documentElement, t.options.classPrefix + 'fullscreen');
		(0, _dom.removeClass)(t.getElement(t.container), t.options.classPrefix + 'container-fullscreen');

		if (t.options.setDimensions) {
			t.getElement(t.container).style.width = t.normalWidth + 'px';
			t.getElement(t.container).style.height = t.normalHeight + 'px';

			if (isNative) {
				t.node.style.width = t.normalWidth + 'px';
				t.node.style.height = t.normalHeight + 'px';
			} else {
				var elements = t.getElement(t.container).querySelectorAll('embed, object, video'),
				    _total2 = elements.length;
				for (var i = 0; i < _total2; i++) {
					elements[i].style.width = t.normalWidth + 'px';
					elements[i].style.height = t.normalHeight + 'px';
				}
			}

			if (typeof t.media.setSize === 'function') {
				t.media.setSize(t.normalWidth, t.normalHeight);
			}

			var layers = t.getElement(t.layers).children,
			    total = layers.length;
			for (var _i2 = 0; _i2 < total; _i2++) {
				layers[_i2].style.width = t.normalWidth + 'px';
				layers[_i2].style.height = t.normalHeight + 'px';
			}
		}

		if (t.fullscreenBtn) {
			(0, _dom.removeClass)(t.fullscreenBtn, t.options.classPrefix + 'unfullscreen');
			(0, _dom.addClass)(t.fullscreenBtn, t.options.classPrefix + 'fullscreen');
		}

		t.setControlsSize();
		t.isFullScreen = false;

		var captionText = t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'captions-text');
		if (captionText) {
			captionText.style.fontSize = '';
			captionText.style.lineHeight = '';
			t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'captions-position').style.bottom = '';
		}
		var event = (0, _general.createEvent)('exitedfullscreen', t.getElement(t.container));
		t.getElement(t.container).dispatchEvent(event);
	}
});

},{"16":16,"2":2,"25":25,"26":26,"27":27,"28":28,"3":3,"5":5}],10:[function(_dereq_,module,exports){
'use strict';

var _document = _dereq_(2);

var _document2 = _interopRequireDefault(_document);

var _player = _dereq_(16);

var _player2 = _interopRequireDefault(_player);

var _i18n = _dereq_(5);

var _i18n2 = _interopRequireDefault(_i18n);

var _general = _dereq_(27);

var _dom = _dereq_(26);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

Object.assign(_player.config, {
	playText: null,

	pauseText: null
});

Object.assign(_player2.default.prototype, {
	buildplaypause: function buildplaypause(player, controls, layers, media) {
		var t = this,
		    op = t.options,
		    playTitle = (0, _general.isString)(op.playText) ? op.playText : _i18n2.default.t('mejs.play'),
		    pauseTitle = (0, _general.isString)(op.pauseText) ? op.pauseText : _i18n2.default.t('mejs.pause'),
		    play = _document2.default.createElement('div');

		play.className = t.options.classPrefix + 'button ' + t.options.classPrefix + 'playpause-button ' + t.options.classPrefix + 'play';
		play.innerHTML = '<button type="button" aria-controls="' + t.id + '" title="' + playTitle + '" aria-label="' + pauseTitle + '" tabindex="0"></button>';
		play.addEventListener('click', function () {
			if (t.paused) {
				t.play();
        $('.videoPlayer')[0].style.cursor = 'none';
			} else {
				t.pause();
			}
		});

		var playBtn = play.querySelector('button');
		t.addControlElement(play, 'playpause');

		function togglePlayPause(which) {
			if ('play' === which) {
				(0, _dom.removeClass)(play, t.options.classPrefix + 'play');
				(0, _dom.removeClass)(play, t.options.classPrefix + 'replay');
				(0, _dom.addClass)(play, t.options.classPrefix + 'pause');
				playBtn.setAttribute('title', pauseTitle);
				playBtn.setAttribute('aria-label', pauseTitle);
			} else {

				(0, _dom.removeClass)(play, t.options.classPrefix + 'pause');
				(0, _dom.removeClass)(play, t.options.classPrefix + 'replay');
				(0, _dom.addClass)(play, t.options.classPrefix + 'play');
				playBtn.setAttribute('title', playTitle);
				playBtn.setAttribute('aria-label', playTitle);
			}
		}

		togglePlayPause('pse');

		media.addEventListener('loadedmetadata', function () {
			if (media.rendererName.indexOf('flash') === -1) {
				togglePlayPause('pse');
			}
		});
		media.addEventListener('play', function () {
			togglePlayPause('play');
		});
		media.addEventListener('playing', function () {
			togglePlayPause('play');
		});
		media.addEventListener('pause', function () {
			togglePlayPause('pse');
		});
		media.addEventListener('ended', function () {
			if (!player.options.loop) {
				(0, _dom.removeClass)(play, t.options.classPrefix + 'pause');
				(0, _dom.removeClass)(play, t.options.classPrefix + 'play');
				(0, _dom.addClass)(play, t.options.classPrefix + 'replay');
				playBtn.setAttribute('title', playTitle);
				playBtn.setAttribute('aria-label', playTitle);
			}
		});
	}
});

},{"16":16,"2":2,"26":26,"27":27,"5":5}],11:[function(_dereq_,module,exports){
'use strict';

var _document = _dereq_(2);

var _document2 = _interopRequireDefault(_document);

var _player = _dereq_(16);

var _player2 = _interopRequireDefault(_player);

var _i18n = _dereq_(5);

var _i18n2 = _interopRequireDefault(_i18n);

var _constants = _dereq_(25);

var _time = _dereq_(30);

var _dom = _dereq_(26);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

Object.assign(_player.config, {
	enableProgressTooltip: true,

	useSmoothHover: true,

	forceLive: false
});

Object.assign(_player2.default.prototype, {
	buildprogress: function buildprogress(player, controls, layers, media) {

		var lastKeyPressTime = 0,
		    mouseIsDown = false,
		    startedPaused = false;

		var t = this,
		    autoRewindInitial = player.options.autoRewind,
		    tooltip = player.options.enableProgressTooltip ? '<span class="' + t.options.classPrefix + 'time-float">' + ('<span class="' + t.options.classPrefix + 'time-float-current">00:00</span>') + ('<span class="' + t.options.classPrefix + 'time-float-corner"></span>') + '</span>' : '',
		    rail = _document2.default.createElement('div');

		rail.className = t.options.classPrefix + 'time-rail';
		rail.innerHTML = '<span class="' + t.options.classPrefix + 'time-total ' + t.options.classPrefix + 'time-slider">' + ('<span class="' + t.options.classPrefix + 'time-buffering"></span>') + ('<span class="' + t.options.classPrefix + 'time-loaded"></span>') + ('<span class="' + t.options.classPrefix + 'time-current"></span>') + ('<span class="' + t.options.classPrefix + 'time-hovered no-hover"></span>') + ('<span class="' + t.options.classPrefix + 'time-handle"><span class="' + t.options.classPrefix + 'time-handle-content"></span></span>') + ('' + tooltip) + '</span>';

		t.addControlElement(rail, 'progress');

		t.options.keyActions.push({
			keys: [227],
			action: function action(player) {
				if (!isNaN(player.duration) && player.duration > 0) {
					if (player.isVideo) {
						player.showControls();
						player.startControlsTimer();
					}

					player.getElement(player.container).querySelector('.' + _player.config.classPrefix + 'time-total').focus();

					var newTime = Math.max(player.currentTime - player.options.defaultSeekBackwardInterval(player), 0);
					player.setCurrentTime(newTime);
				}
			}
		}, {
			keys: [228],
			action: function action(player) {

				if (!isNaN(player.duration) && player.duration > 0) {
					if (player.isVideo) {
						player.showControls();
						player.startControlsTimer();
					}

					player.getElement(player.container).querySelector('.' + _player.config.classPrefix + 'time-total').focus();

					var newTime = Math.min(player.currentTime + player.options.defaultSeekForwardInterval(player), player.duration);
					player.setCurrentTime(newTime);
				}
			}
		});

		t.rail = controls.querySelector('.' + t.options.classPrefix + 'time-rail');
		t.total = controls.querySelector('.' + t.options.classPrefix + 'time-total');
		t.loaded = controls.querySelector('.' + t.options.classPrefix + 'time-loaded');
		t.current = controls.querySelector('.' + t.options.classPrefix + 'time-current');
		t.handle = controls.querySelector('.' + t.options.classPrefix + 'time-handle');
		t.timefloat = controls.querySelector('.' + t.options.classPrefix + 'time-float');
		t.timefloatcurrent = controls.querySelector('.' + t.options.classPrefix + 'time-float-current');
		t.slider = controls.querySelector('.' + t.options.classPrefix + 'time-slider');
		t.hovered = controls.querySelector('.' + t.options.classPrefix + 'time-hovered');
		t.buffer = controls.querySelector('.' + t.options.classPrefix + 'time-buffering');
		t.newTime = 0;
		t.forcedHandlePause = false;
		t.setTransformStyle = function (element, value) {
			element.style.transform = value;
			element.style.webkitTransform = value;
			element.style.MozTransform = value;
			element.style.msTransform = value;
			element.style.OTransform = value;
		};

		t.buffer.style.display = 'none';

		var handleMouseMove = function handleMouseMove(e) {
			var totalStyles = getComputedStyle(t.total),
			    offsetStyles = (0, _dom.offset)(t.total),
			    width = t.total.offsetWidth,
			    transform = function () {
				if (totalStyles.webkitTransform !== undefined) {
					return 'webkitTransform';
				} else if (totalStyles.mozTransform !== undefined) {
					return 'mozTransform ';
				} else if (totalStyles.oTransform !== undefined) {
					return 'oTransform';
				} else if (totalStyles.msTransform !== undefined) {
					return 'msTransform';
				} else {
					return 'transform';
				}
			}(),
			    cssMatrix = function () {
				if ('WebKitCSSMatrix' in window) {
					return 'WebKitCSSMatrix';
				} else if ('MSCSSMatrix' in window) {
					return 'MSCSSMatrix';
				} else if ('CSSMatrix' in window) {
					return 'CSSMatrix';
				}
			}();

			var percentage = 0,
			    leftPos = 0,
			    pos = 0,
			    x = void 0;

			if (e.originalEvent && e.originalEvent.changedTouches) {
				x = e.originalEvent.changedTouches[0].pageX;
			} else if (e.changedTouches) {
				x = e.changedTouches[0].pageX;
			} else {
				x = e.pageX;
			}

			if (t.getDuration()) {
				if (x < offsetStyles.left) {
					x = offsetStyles.left;
				} else if (x > width + offsetStyles.left) {
					x = width + offsetStyles.left;
				}

				pos = x - offsetStyles.left;
				percentage = pos / width;
				t.newTime = percentage * t.getDuration();

				if (mouseIsDown && t.getCurrentTime() !== null && t.newTime.toFixed(4) !== t.getCurrentTime().toFixed(4)) {
					t.setCurrentRailHandle(t.newTime);
					t.updateCurrent(t.newTime);
				}

				if (!_constants.IS_IOS && !_constants.IS_ANDROID) {
					if (pos < 0) {
						pos = 0;
					}
					if (t.options.useSmoothHover && cssMatrix !== null && typeof window[cssMatrix] !== 'undefined') {
						var matrix = new window[cssMatrix](getComputedStyle(t.handle)[transform]),
						    handleLocation = matrix.m41,
						    hoverScaleX = pos / parseFloat(getComputedStyle(t.total).width) - handleLocation / parseFloat(getComputedStyle(t.total).width);

						t.hovered.style.left = handleLocation + 'px';
						t.setTransformStyle(t.hovered, 'scaleX(' + hoverScaleX + ')');
						t.hovered.setAttribute('pos', pos);

						if (hoverScaleX >= 0) {
							(0, _dom.removeClass)(t.hovered, 'negative');
						} else {
							(0, _dom.addClass)(t.hovered, 'negative');
						}
					}

					if (t.timefloat) {
						var half = t.timefloat.offsetWidth / 2,
						    offsetContainer = mejs.Utils.offset(t.getElement(t.container)),
						    tooltipStyles = getComputedStyle(t.timefloat);

						if (x - offsetContainer.left < t.timefloat.offsetWidth) {
							leftPos = half;
						} else if (x - offsetContainer.left >= t.getElement(t.container).offsetWidth - half) {
							leftPos = t.total.offsetWidth - half;
						} else {
							leftPos = pos;
						}

						if ((0, _dom.hasClass)(t.getElement(t.container), t.options.classPrefix + 'long-video')) {
							leftPos += parseFloat(tooltipStyles.marginLeft) / 2 + t.timefloat.offsetWidth / 2;
						}

            if (t.duration > 3600) {
              leftPos = leftPos - 45;
            }

						t.timefloat.style.left = leftPos + 'px';
						t.timefloatcurrent.innerHTML = (0, _time.secondsToTimeCode)(t.newTime, player.options.alwaysShowHours, player.options.showTimecodeFrameCount, player.options.framesPerSecond, player.options.secondsDecimalLength, player.options.timeFormat);
						t.timefloat.style.display = 'block';
					}
				}
			} else if (!_constants.IS_IOS && !_constants.IS_ANDROID && t.timefloat) {
				leftPos = t.timefloat.offsetWidth + width >= t.getElement(t.container).offsetWidth ? t.timefloat.offsetWidth / 2 : 0;
				t.timefloat.style.left = leftPos + 'px';
				t.timefloat.style.left = leftPos + 'px';
				t.timefloat.style.display = 'block';
			}
		},
		    updateSlider = function updateSlider() {
			var seconds = t.getCurrentTime(),
			    timeSliderText = _i18n2.default.t('mejs.time-slider'),
			    time = (0, _time.secondsToTimeCode)(seconds, player.options.alwaysShowHours, player.options.showTimecodeFrameCount, player.options.framesPerSecond, player.options.secondsDecimalLength, player.options.timeFormat),
			    duration = t.getDuration();

			t.slider.setAttribute('role', 'slider');
			t.slider.tabIndex = 0;

			if (media.paused) {
				t.slider.setAttribute('aria-label', timeSliderText);
				t.slider.setAttribute('aria-valuemin', 0);
				t.slider.setAttribute('aria-valuemax', duration);
				t.slider.setAttribute('aria-valuenow', seconds);
				t.slider.setAttribute('aria-valuetext', time);
			} else {
				t.slider.removeAttribute('aria-label');
				t.slider.removeAttribute('aria-valuemin');
				t.slider.removeAttribute('aria-valuemax');
				t.slider.removeAttribute('aria-valuenow');
				t.slider.removeAttribute('aria-valuetext');
			}
		},
		    restartPlayer = function restartPlayer() {
			if (new Date() - lastKeyPressTime >= 1000) {
				t.play();
			}
		},
		    handleMouseup = function handleMouseup() {
			if (mouseIsDown && t.getCurrentTime() !== null && t.newTime.toFixed(4) !== t.getCurrentTime().toFixed(4)) {
				t.setCurrentTime(t.newTime);
				t.setCurrentRailHandle(t.newTime);
				t.updateCurrent(t.newTime);
			}
			if (t.forcedHandlePause) {
				t.slider.focus();
				t.play();
			}
			t.forcedHandlePause = false;
		};

		t.slider.addEventListener('focus', function () {
			player.options.autoRewind = false;
		});
		t.slider.addEventListener('blur', function () {
			player.options.autoRewind = autoRewindInitial;
		});
		t.slider.addEventListener('keydown', function (e) {
			if (new Date() - lastKeyPressTime >= 1000) {
				startedPaused = t.paused;
			}

			if (t.options.enableKeyboard && t.options.keyActions.length) {

				var keyCode = e.which || e.keyCode || 0,
				    duration = t.getDuration(),
				    seekForward = player.options.defaultSeekForwardInterval(media),
				    seekBackward = player.options.defaultSeekBackwardInterval(media);

				var seekTime = t.getCurrentTime();
				var volume = t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'volume-slider');

				if (keyCode === 38 || keyCode === 40) {
					if (volume) {
						volume.style.display = 'block';
					}
					if (t.isVideo) {
						t.showControls();
						t.startControlsTimer();
					}

					var newVolume = keyCode === 38 ? Math.min(t.volume + 0.1, 1) : Math.max(t.volume - 0.1, 0),
					    mutePlayer = newVolume <= 0;
					t.setVolume(newVolume);
					t.setMuted(mutePlayer);
					return;
				} else {
					if (volume) {
						volume.style.display = 'none';
					}
				}

				switch (keyCode) {
					case 36:
						seekTime = 0;
						break;
					case 35:
						seekTime = duration;
						break;
					case 13:
					case 32:
						if (_constants.IS_FIREFOX) {
							if (t.paused) {
								t.play();
							} else {
								t.pause();
							}
						}
						return;
					default:
						return;
				}

				seekTime = seekTime < 0 ? 0 : seekTime >= duration ? duration : Math.floor(seekTime);
				lastKeyPressTime = new Date();
				if (!startedPaused) {
					player.pause();
				}

				if (seekTime < t.getDuration() && !startedPaused) {
					setTimeout(restartPlayer, 1100);
				}

				t.setCurrentTime(seekTime);
				player.showControls();

				e.preventDefault();
				e.stopPropagation();
			}
		});

		var events = ['mousedown', 'touchstart'];

		t.slider.addEventListener('dragstart', function () {
			return false;
		});

		for (var i = 0, total = events.length; i < total; i++) {
			t.slider.addEventListener(events[i], function (e) {
				t.forcedHandlePause = false;
				if (t.getDuration() !== Infinity) {
					if (e.which === 1 || e.which === 0) {
						if (!t.paused) {
							t.pause();
							t.forcedHandlePause = true;
						}

						mouseIsDown = true;
						handleMouseMove(e);
						var endEvents = ['mouseup', 'touchend'];

						for (var j = 0, totalEvents = endEvents.length; j < totalEvents; j++) {
							t.getElement(t.container).addEventListener(endEvents[j], function (event) {
								var target = event.target;
								if (target === t.slider || target.closest('.' + t.options.classPrefix + 'time-slider')) {
									handleMouseMove(event);
								}
							});
						}
						t.globalBind('mouseup.dur touchend.dur', function () {
							handleMouseup();
							mouseIsDown = false;
							if (t.timefloat) {
								t.timefloat.style.display = 'none';
							}
						});
					}
				}
			}, _constants.SUPPORT_PASSIVE_EVENT && events[i] === 'touchstart' ? { passive: true } : false);
		}
		t.slider.addEventListener('mouseenter', function (e) {
			if (e.target === t.slider && t.getDuration() !== Infinity) {
				t.getElement(t.container).addEventListener('mousemove', function (event) {
					var target = event.target;
					if (target === t.slider || target.closest('.' + t.options.classPrefix + 'time-slider')) {
						handleMouseMove(event);
					}
				});
				if (t.timefloat && !_constants.IS_IOS && !_constants.IS_ANDROID) {
					t.timefloat.style.display = 'block';
				}
				if (t.hovered && !_constants.IS_IOS && !_constants.IS_ANDROID && t.options.useSmoothHover) {
					(0, _dom.removeClass)(t.hovered, 'no-hover');
				}
			}
		});
		t.slider.addEventListener('mouseleave', function () {
			if (t.getDuration() !== Infinity) {
				if (!mouseIsDown) {
					if (t.timefloat) {
						t.timefloat.style.display = 'none';
					}
					if (t.hovered && t.options.useSmoothHover) {
						(0, _dom.addClass)(t.hovered, 'no-hover');
					}
				}
			}
		});

		t.broadcastCallback = function (e) {
			var broadcast = controls.querySelector('.' + t.options.classPrefix + 'broadcast');
			if (!t.options.forceLive && t.getDuration() !== Infinity) {
				if (broadcast) {
					t.slider.style.display = '';
					broadcast.remove();
				}

				player.setProgressRail(e);
				if (!t.forcedHandlePause) {
					player.setCurrentRail(e);
				}
				updateSlider();
			} else if (!broadcast && t.options.forceLive) {
				var label = _document2.default.createElement('span');
				label.className = t.options.classPrefix + 'broadcast';
				label.innerText = _i18n2.default.t('mejs.live-broadcast');
				t.slider.style.display = 'none';
				t.rail.appendChild(label);
			}
		};

		media.addEventListener('progress', t.broadcastCallback);
		media.addEventListener('timeupdate', t.broadcastCallback);
		media.addEventListener('play', function () {
			t.buffer.style.display = 'none';
		});
		media.addEventListener('playing', function () {
			t.buffer.style.display = 'none';
		});
		media.addEventListener('seeking', function () {
			t.buffer.style.display = '';
		});
		media.addEventListener('seeked', function () {
			t.buffer.style.display = 'none';
		});
		media.addEventListener('pause', function () {
			t.buffer.style.display = 'none';
		});
		media.addEventListener('waiting', function () {
			t.buffer.style.display = '';
		});
		media.addEventListener('loadeddata', function () {
			t.buffer.style.display = '';
		});
		media.addEventListener('canplay', function () {
			t.buffer.style.display = 'none';
		});
		media.addEventListener('error', function () {
			t.buffer.style.display = 'none';
		});

		t.getElement(t.container).addEventListener('controlsresize', function (e) {
			if (t.getDuration() !== Infinity) {
				player.setProgressRail(e);
				if (!t.forcedHandlePause) {
					player.setCurrentRail(e);
				}
			}
		});
	},
	cleanprogress: function cleanprogress(player, controls, layers, media) {
		media.removeEventListener('progress', player.broadcastCallback);
		media.removeEventListener('timeupdate', player.broadcastCallback);
		if (player.rail) {
			player.rail.remove();
		}
	},
	setProgressRail: function setProgressRail(e) {
		var t = this,
		    target = e !== undefined ? e.detail.target || e.target : t.media;

		var percent = null;

		if (target && target.buffered && target.buffered.length > 0 && target.buffered.end && t.getDuration()) {
			percent = target.buffered.end(target.buffered.length - 1) / t.getDuration();
		} else if (target && target.bytesTotal !== undefined && target.bytesTotal > 0 && target.bufferedBytes !== undefined) {
				percent = target.bufferedBytes / target.bytesTotal;
			} else if (e && e.lengthComputable && e.total !== 0) {
					percent = e.loaded / e.total;
				}

		if (percent !== null) {
			percent = Math.min(1, Math.max(0, percent));

			if (t.loaded) {
				t.setTransformStyle(t.loaded, 'scaleX(' + percent + ')');
			}
		}
	},
	setCurrentRailHandle: function setCurrentRailHandle(fakeTime) {
		var t = this;
		t.setCurrentRailMain(t, fakeTime);
	},
	setCurrentRail: function setCurrentRail() {
		var t = this;
		t.setCurrentRailMain(t);
	},
	setCurrentRailMain: function setCurrentRailMain(t, fakeTime) {
		if (t.getCurrentTime() !== undefined && t.getDuration()) {
			var nTime = typeof fakeTime === 'undefined' ? t.getCurrentTime() : fakeTime;

			if (t.total && t.handle) {
				var tW = parseFloat(getComputedStyle(t.total).width);

				var newWidth = Math.round(tW * nTime / t.getDuration()),
				    handlePos = newWidth - Math.round(t.handle.offsetWidth / 2);

				handlePos = handlePos < 0 ? 0 : handlePos;
				t.setTransformStyle(t.current, 'scaleX(' + newWidth / tW + ')');
				t.setTransformStyle(t.handle, 'translateX(' + handlePos + 'px)');

				if (t.options.useSmoothHover && !(0, _dom.hasClass)(t.hovered, 'no-hover')) {
					var pos = parseInt(t.hovered.getAttribute('pos'), 10);
					pos = isNaN(pos) ? 0 : pos;

					var hoverScaleX = pos / tW - handlePos / tW;

					t.hovered.style.left = handlePos + 'px';
					t.setTransformStyle(t.hovered, 'scaleX(' + hoverScaleX + ')');

					if (hoverScaleX >= 0) {
						(0, _dom.removeClass)(t.hovered, 'negative');
					} else {
						(0, _dom.addClass)(t.hovered, 'negative');
					}
				}
			}
		}
	}
});

},{"16":16,"2":2,"25":25,"26":26,"30":30,"5":5}],12:[function(_dereq_,module,exports){
'use strict';

var _document = _dereq_(2);

var _document2 = _interopRequireDefault(_document);

var _player = _dereq_(16);

var _player2 = _interopRequireDefault(_player);

var _time = _dereq_(30);

var _dom = _dereq_(26);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

Object.assign(_player.config, {
	duration: 0,

	timeAndDurationSeparator: '<span> | </span>'
});

Object.assign(_player2.default.prototype, {
	buildcurrent: function buildcurrent(player, controls, layers, media) {
		var t = this,
		    time = _document2.default.createElement('div');

		time.className = t.options.classPrefix + 'time';
		time.setAttribute('role', 'timer');
		time.setAttribute('aria-live', 'off');
		time.innerHTML = '<span class="' + t.options.classPrefix + 'currenttime">' + (0, _time.secondsToTimeCode)(0, player.options.alwaysShowHours, player.options.showTimecodeFrameCount, player.options.framesPerSecond, player.options.secondsDecimalLength, player.options.timeFormat) + '</span>';

		t.addControlElement(time, 'current');
		player.updateCurrent();
		t.updateTimeCallback = function () {
			if (t.controlsAreVisible) {
				player.updateCurrent();
			}
		};
		media.addEventListener('timeupdate', t.updateTimeCallback);
	},
	cleancurrent: function cleancurrent(player, controls, layers, media) {
		media.removeEventListener('timeupdate', player.updateTimeCallback);
	},
	buildduration: function buildduration(player, controls, layers, media) {
		var t = this,
		    currTime = controls.lastChild.querySelector('.' + t.options.classPrefix + 'currenttime');

		if (currTime) {
			controls.querySelector('.' + t.options.classPrefix + 'time').innerHTML += t.options.timeAndDurationSeparator + '<span class="' + t.options.classPrefix + 'duration">' + ((0, _time.secondsToTimeCode)(t.options.duration, t.options.alwaysShowHours, t.options.showTimecodeFrameCount, t.options.framesPerSecond, t.options.secondsDecimalLength, t.options.timeFormat) + '</span>');
		} else {
			if (controls.querySelector('.' + t.options.classPrefix + 'currenttime')) {
				(0, _dom.addClass)(controls.querySelector('.' + t.options.classPrefix + 'currenttime').parentNode, t.options.classPrefix + 'currenttime-container');
			}

			var duration = _document2.default.createElement('div');
			duration.className = t.options.classPrefix + 'time ' + t.options.classPrefix + 'duration-container';
			duration.innerHTML = '<span class="' + t.options.classPrefix + 'duration">' + ((0, _time.secondsToTimeCode)(t.options.duration, t.options.alwaysShowHours, t.options.showTimecodeFrameCount, t.options.framesPerSecond, t.options.secondsDecimalLength, t.options.timeFormat) + '</span>');

			t.addControlElement(duration, 'duration');
		}

		t.updateDurationCallback = function () {
			if (t.controlsAreVisible) {
				player.updateDuration();
			}
		};

		media.addEventListener('timeupdate', t.updateDurationCallback);
	},
	cleanduration: function cleanduration(player, controls, layers, media) {
		media.removeEventListener('timeupdate', player.updateDurationCallback);
	},
	updateCurrent: function updateCurrent() {
		var t = this;

		var currentTime = t.getCurrentTime();

		if (isNaN(currentTime)) {
			currentTime = 0;
		}

		var timecode = (0, _time.secondsToTimeCode)(currentTime, t.options.alwaysShowHours, t.options.showTimecodeFrameCount, t.options.framesPerSecond, t.options.secondsDecimalLength, t.options.timeFormat);

		if (timecode.length > 5) {
			(0, _dom.addClass)(t.getElement(t.container), t.options.classPrefix + 'long-video');
		} else {
			(0, _dom.removeClass)(t.getElement(t.container), t.options.classPrefix + 'long-video');
		}

		if (t.getElement(t.controls).querySelector('.' + t.options.classPrefix + 'currenttime')) {
			t.getElement(t.controls).querySelector('.' + t.options.classPrefix + 'currenttime').innerText = timecode;
		}
	},
	updateDuration: function updateDuration() {
		var t = this;

		var duration = t.getDuration();

		if (t.media !== undefined && (isNaN(duration) || duration === Infinity || duration < 0)) {
			t.media.duration = t.options.duration = duration = 0;
		}

		if (t.options.duration > 0) {
			duration = t.options.duration;
		}

		var timecode = (0, _time.secondsToTimeCode)(duration, t.options.alwaysShowHours, t.options.showTimecodeFrameCount, t.options.framesPerSecond, t.options.secondsDecimalLength, t.options.timeFormat);

		if (timecode.length > 5) {
			(0, _dom.addClass)(t.getElement(t.container), t.options.classPrefix + 'long-video');
		} else {
			(0, _dom.removeClass)(t.getElement(t.container), t.options.classPrefix + 'long-video');
		}

		if (t.getElement(t.controls).querySelector('.' + t.options.classPrefix + 'duration') && duration > 0) {
			t.getElement(t.controls).querySelector('.' + t.options.classPrefix + 'duration').innerHTML = timecode;
		}
	}
});

},{"16":16,"2":2,"26":26,"30":30}],13:[function(_dereq_,module,exports){
'use strict';

var _document = _dereq_(2);

var _document2 = _interopRequireDefault(_document);

var _mejs = _dereq_(7);

var _mejs2 = _interopRequireDefault(_mejs);

var _i18n = _dereq_(5);

var _i18n2 = _interopRequireDefault(_i18n);

var _player = _dereq_(16);

var _player2 = _interopRequireDefault(_player);

var _time = _dereq_(30);

var _general = _dereq_(27);

var _dom = _dereq_(26);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

Object.assign(_player.config, {
	startLanguage: '',

	tracksText: null,

	chaptersText: null,

	tracksAriaLive: false,

	hideCaptionsButtonWhenEmpty: true,

	toggleCaptionsButtonWhenOnlyOne: false,

	slidesSelector: ''
});

Object.assign(_player2.default.prototype, {
	hasChapters: false,

	buildtracks: function buildtracks(player, controls, layers, media) {

		this.findTracks();

		if (!player.tracks.length && (!player.trackFiles || !player.trackFiles.length === 0)) {
			return;
		}

		var t = this,
		    attr = t.options.tracksAriaLive ? ' role="log" aria-live="assertive" aria-atomic="false"' : '',
		    tracksTitle = (0, _general.isString)(t.options.tracksText) ? t.options.tracksText : _i18n2.default.t('mejs.captions-subtitles'),
		    chaptersTitle = (0, _general.isString)(t.options.chaptersText) ? t.options.chaptersText : _i18n2.default.t('mejs.captions-chapters'),
		    total = player.trackFiles === null ? player.tracks.length : player.trackFiles.length;

		if (t.domNode.textTracks) {
			for (var i = t.domNode.textTracks.length - 1; i >= 0; i--) {
				t.domNode.textTracks[i].mode = 'hidden';
			}
		}

		t.cleartracks(player);

		player.captions = _document2.default.createElement('div');
		player.captions.className = t.options.classPrefix + 'captions-layer ' + t.options.classPrefix + 'layer';
		player.captions.innerHTML = '<div class="' + t.options.classPrefix + 'captions-position ' + t.options.classPrefix + 'captions-position-hover"' + attr + '>' + ('<span class="' + t.options.classPrefix + 'captions-text"></span>') + '</div>';
		player.captions.style.display = 'none';
		layers.insertBefore(player.captions, layers.firstChild);

		player.captionsText = player.captions.querySelector('.' + t.options.classPrefix + 'captions-text');

		player.captionsButton = _document2.default.createElement('div');
		player.captionsButton.className = t.options.classPrefix + 'button ' + t.options.classPrefix + 'captions-button';
		player.captionsButton.innerHTML = '<button type="button" aria-controls="' + t.id + '" title="' + tracksTitle + '" aria-label="' + tracksTitle + '" tabindex="0"></button>' + ('<div class="' + t.options.classPrefix + 'captions-selector ' + t.options.classPrefix + 'offscreen">') + ('<ul class="' + t.options.classPrefix + 'captions-selector-list">') + ('<li class="' + t.options.classPrefix + 'captions-selector-list-item">') + ('<input type="radio" class="' + t.options.classPrefix + 'captions-selector-input" ') + ('name="' + player.id + '_captions" id="' + player.id + '_captions_none" ') + 'value="none" checked disabled>' + ('<label class="' + t.options.classPrefix + 'captions-selector-label ') + (t.options.classPrefix + 'captions-selected" ') + ('for="' + player.id + '_captions_none">' + _i18n2.default.t('mejs.none') + '</label>') + '</li>' + '</ul>' + '</div>';

		t.addControlElement(player.captionsButton, 'tracks');

		player.captionsButton.querySelector('.' + t.options.classPrefix + 'captions-selector-input').disabled = false;

		player.chaptersButton = _document2.default.createElement('div');
		player.chaptersButton.className = t.options.classPrefix + 'button ' + t.options.classPrefix + 'chapters-button';
		player.chaptersButton.innerHTML = '<button type="button" aria-controls="' + t.id + '" title="' + chaptersTitle + '" aria-label="' + chaptersTitle + '" tabindex="0"></button>' + ('<div class="' + t.options.classPrefix + 'chapters-selector ' + t.options.classPrefix + 'offscreen">') + ('<ul class="' + t.options.classPrefix + 'chapters-selector-list"></ul>') + '</div>';

		var subtitleCount = 0;

		for (var _i = 0; _i < total; _i++) {
			var kind = player.tracks[_i].kind,
			    src = player.tracks[_i].src;
			if (src.trim()) {
				if (kind === 'subtitles' || kind === 'captions') {
					subtitleCount++;
				} else if (kind === 'chapters' && !controls.querySelector('.' + t.options.classPrefix + 'chapter-selector')) {
					player.captionsButton.parentNode.insertBefore(player.chaptersButton, player.captionsButton);
				}
			}
		}

		player.trackToLoad = -1;
		player.selectedTrack = null;
		player.isLoadingTrack = false;

		for (var _i2 = 0; _i2 < total; _i2++) {
			var _kind = player.tracks[_i2].kind;
			if (player.tracks[_i2].src.trim() && (_kind === 'subtitles' || _kind === 'captions')) {
				player.addTrackButton(player.tracks[_i2].trackId, player.tracks[_i2].srclang, player.tracks[_i2].label);
			}
		}

		player.loadNextTrack();

		var inEvents = ['mouseenter', 'focusin'],
		    outEvents = ['mouseleave', 'focusout'];

		if (t.options.toggleCaptionsButtonWhenOnlyOne && subtitleCount === 1) {
			player.captionsButton.addEventListener('click', function (e) {
				var trackId = 'none';
				if (player.selectedTrack === null) {
					trackId = player.tracks[0].trackId;
				}
				var keyboard = e.keyCode || e.which;
				player.setTrack(trackId, typeof keyboard !== 'undefined');
			});
		} else {
			var labels = player.captionsButton.querySelectorAll('.' + t.options.classPrefix + 'captions-selector-label'),
			    captions = player.captionsButton.querySelectorAll('input[type=radio]');

			for (var _i3 = 0, _total = inEvents.length; _i3 < _total; _i3++) {
				player.captionsButton.addEventListener(inEvents[_i3], function () {
					(0, _dom.removeClass)(this.querySelector('.' + t.options.classPrefix + 'captions-selector'), t.options.classPrefix + 'offscreen');
				});
			}

			for (var _i4 = 0, _total2 = outEvents.length; _i4 < _total2; _i4++) {
				player.captionsButton.addEventListener(outEvents[_i4], function () {
					(0, _dom.addClass)(this.querySelector('.' + t.options.classPrefix + 'captions-selector'), t.options.classPrefix + 'offscreen');
				});
			}

			for (var _i5 = 0, _total3 = captions.length; _i5 < _total3; _i5++) {
				captions[_i5].addEventListener('click', function (e) {
					var keyboard = e.keyCode || e.which;
					player.setTrack(this.value, typeof keyboard !== 'undefined');
				});
			}

			for (var _i6 = 0, _total4 = labels.length; _i6 < _total4; _i6++) {
				labels[_i6].addEventListener('click', function (e) {
					var radio = (0, _dom.siblings)(this, function (el) {
						return el.tagName === 'INPUT';
					})[0],
					    event = (0, _general.createEvent)('click', radio);
					radio.dispatchEvent(event);
					e.preventDefault();
				});
			}

			player.captionsButton.addEventListener('keydown', function (e) {
				e.stopPropagation();
			});
		}

		for (var _i7 = 0, _total5 = inEvents.length; _i7 < _total5; _i7++) {
			player.chaptersButton.addEventListener(inEvents[_i7], function () {
				if (this.querySelector('.' + t.options.classPrefix + 'chapters-selector-list').children.length) {
					(0, _dom.removeClass)(this.querySelector('.' + t.options.classPrefix + 'chapters-selector'), t.options.classPrefix + 'offscreen');
				}
			});
		}

		for (var _i8 = 0, _total6 = outEvents.length; _i8 < _total6; _i8++) {
			player.chaptersButton.addEventListener(outEvents[_i8], function () {
				(0, _dom.addClass)(this.querySelector('.' + t.options.classPrefix + 'chapters-selector'), t.options.classPrefix + 'offscreen');
			});
		}

		player.chaptersButton.addEventListener('keydown', function (e) {
			e.stopPropagation();
		});

		if (!player.options.alwaysShowControls) {
			player.getElement(player.container).addEventListener('controlsshown', function () {
				(0, _dom.addClass)(player.getElement(player.container).querySelector('.' + t.options.classPrefix + 'captions-position'), t.options.classPrefix + 'captions-position-hover');
			});

			player.getElement(player.container).addEventListener('controlshidden', function () {
				if (!media.paused) {
					(0, _dom.removeClass)(player.getElement(player.container).querySelector('.' + t.options.classPrefix + 'captions-position'), t.options.classPrefix + 'captions-position-hover');
				}
			});
		} else {
			(0, _dom.addClass)(player.getElement(player.container).querySelector('.' + t.options.classPrefix + 'captions-position'), t.options.classPrefix + 'captions-position-hover');
		}

		media.addEventListener('timeupdate', function () {
			player.displayCaptions();
		});

		if (player.options.slidesSelector !== '') {
			player.slidesContainer = _document2.default.querySelectorAll(player.options.slidesSelector);

			media.addEventListener('timeupdate', function () {
				player.displaySlides();
			});
		}
	},
	cleartracks: function cleartracks(player) {
		if (player) {
			if (player.captions) {
				player.captions.remove();
			}
			if (player.chapters) {
				player.chapters.remove();
			}
			if (player.captionsText) {
				player.captionsText.remove();
			}
			if (player.captionsButton) {
				player.captionsButton.remove();
			}
			if (player.chaptersButton) {
				player.chaptersButton.remove();
			}
		}
	},
	rebuildtracks: function rebuildtracks() {
		var t = this;
		t.findTracks();
		t.buildtracks(t, t.getElement(t.controls), t.getElement(t.layers), t.media);
	},
	findTracks: function findTracks() {
		var t = this,
		    tracktags = t.trackFiles === null ? t.node.querySelectorAll('track') : t.trackFiles,
		    total = tracktags.length;

		t.tracks = [];
		for (var i = 0; i < total; i++) {
			var track = tracktags[i],
			    srclang = track.getAttribute('srclang').toLowerCase() || '',
			    trackId = t.id + '_track_' + i + '_' + track.getAttribute('kind') + '_' + srclang;
			t.tracks.push({
				trackId: trackId,
				srclang: srclang,
				src: track.getAttribute('src'),
				kind: track.getAttribute('kind'),
				label: track.getAttribute('label') || '',
				entries: [],
				isLoaded: false
			});
		}
	},
	setTrack: function setTrack(trackId, setByKeyboard) {

		var t = this,
		    radios = t.captionsButton.querySelectorAll('input[type="radio"]'),
		    captions = t.captionsButton.querySelectorAll('.' + t.options.classPrefix + 'captions-selected'),
		    track = t.captionsButton.querySelector('input[value="' + trackId + '"]');

		for (var i = 0, total = radios.length; i < total; i++) {
			radios[i].checked = false;
		}

		for (var _i9 = 0, _total7 = captions.length; _i9 < _total7; _i9++) {
			(0, _dom.removeClass)(captions[_i9], t.options.classPrefix + 'captions-selected');
		}

		track.checked = true;
		var labels = (0, _dom.siblings)(track, function (el) {
			return (0, _dom.hasClass)(el, t.options.classPrefix + 'captions-selector-label');
		});
		for (var _i10 = 0, _total8 = labels.length; _i10 < _total8; _i10++) {
			(0, _dom.addClass)(labels[_i10], t.options.classPrefix + 'captions-selected');
		}

		if (trackId === 'none') {
			t.selectedTrack = null;
			(0, _dom.removeClass)(t.captionsButton, t.options.classPrefix + 'captions-enabled');
		} else {
			for (var _i11 = 0, _total9 = t.tracks.length; _i11 < _total9; _i11++) {
				var _track = t.tracks[_i11];
				if (_track.trackId === trackId) {
					if (t.selectedTrack === null) {
						(0, _dom.addClass)(t.captionsButton, t.options.classPrefix + 'captions-enabled');
					}
					t.selectedTrack = _track;
					t.captions.setAttribute('lang', t.selectedTrack.srclang);
					t.displayCaptions();
					break;
				}
			}
		}

		var event = (0, _general.createEvent)('captionschange', t.media);
		event.detail.caption = t.selectedTrack;
		t.media.dispatchEvent(event);

		if (!setByKeyboard) {
			setTimeout(function () {
				t.getElement(t.container).focus();
			}, 500);
		}
	},
	loadNextTrack: function loadNextTrack() {
		var t = this;

		t.trackToLoad++;
		if (t.trackToLoad < t.tracks.length) {
			t.isLoadingTrack = true;
			t.loadTrack(t.trackToLoad);
		} else {
			t.isLoadingTrack = false;
			t.checkForTracks();
		}
	},
	loadTrack: function loadTrack(index) {
		var t = this,
		    track = t.tracks[index];

		if (track !== undefined && (track.src !== undefined || track.src !== "")) {
			(0, _dom.ajax)(track.src, 'text', function (d) {
				track.entries = typeof d === 'string' && /<tt\s+xml/ig.exec(d) ? _mejs2.default.TrackFormatParser.dfxp.parse(d) : _mejs2.default.TrackFormatParser.webvtt.parse(d);

				track.isLoaded = true;
				t.enableTrackButton(track);
				t.loadNextTrack();

				if (track.kind === 'slides') {
					t.setupSlides(track);
				} else if (track.kind === 'chapters' && !t.hasChapters) {
						t.drawChapters(track);
						t.hasChapters = true;
					}
			}, function () {
				t.removeTrackButton(track.trackId);
				t.loadNextTrack();
			});
		}
	},
	enableTrackButton: function enableTrackButton(track) {
		var t = this,
		    lang = track.srclang,
		    target = _document2.default.getElementById('' + track.trackId);

		if (!target) {
			return;
		}

		var label = track.label;

		if (label === '') {
			label = _i18n2.default.t(_mejs2.default.language.codes[lang]) || lang;
		}
		target.disabled = false;
		var targetSiblings = (0, _dom.siblings)(target, function (el) {
			return (0, _dom.hasClass)(el, t.options.classPrefix + 'captions-selector-label');
		});
		for (var i = 0, total = targetSiblings.length; i < total; i++) {
			targetSiblings[i].innerHTML = label;
		}

		if (t.options.startLanguage === lang) {
			target.checked = true;
			var event = (0, _general.createEvent)('click', target);
			target.dispatchEvent(event);
		}
	},
	removeTrackButton: function removeTrackButton(trackId) {
		var element = _document2.default.getElementById('' + trackId);
		if (element) {
			var button = element.closest('li');
			if (button) {
				button.remove();
			}
		}
	},
	addTrackButton: function addTrackButton(trackId, lang, label) {
		var t = this;
		if (label === '') {
			label = _i18n2.default.t(_mejs2.default.language.codes[lang]) || lang;
		}

		t.captionsButton.querySelector('ul').innerHTML += '<li class="' + t.options.classPrefix + 'captions-selector-list-item">' + ('<input type="radio" class="' + t.options.classPrefix + 'captions-selector-input" ') + ('name="' + t.id + '_captions" id="' + trackId + '" value="' + trackId + '" disabled>') + ('<label class="' + t.options.classPrefix + 'captions-selector-label"') + ('for="' + trackId + '">' + label + ' (loading)</label>') + '</li>';
	},
	checkForTracks: function checkForTracks() {
		var t = this;

		var hasSubtitles = false;

		if (t.options.hideCaptionsButtonWhenEmpty) {
			for (var i = 0, total = t.tracks.length; i < total; i++) {
				var kind = t.tracks[i].kind;
				if ((kind === 'subtitles' || kind === 'captions') && t.tracks[i].isLoaded) {
					hasSubtitles = true;
					break;
				}
			}

			t.captionsButton.style.display = hasSubtitles ? '' : 'none';
			t.setControlsSize();
		}
	},
	displayCaptions: function displayCaptions() {
		if (this.tracks === undefined) {
			return;
		}

		var t = this,
		    track = t.selectedTrack,
		    sanitize = function sanitize(html) {
			var div = _document2.default.createElement('div');
			div.innerHTML = html;

			var scripts = div.getElementsByTagName('script');
			var i = scripts.length;
			while (i--) {
				scripts[i].remove();
			}

			var allElements = div.getElementsByTagName('*');
			for (var _i12 = 0, n = allElements.length; _i12 < n; _i12++) {
				var attributesObj = allElements[_i12].attributes,
				    attributes = Array.prototype.slice.call(attributesObj);

				for (var j = 0, total = attributes.length; j < total; j++) {
					if (attributes[j].name.startsWith('on') || attributes[j].value.startsWith('javascript')) {
						allElements[_i12].remove();
					} else if (attributes[j].name === 'style') {
						allElements[_i12].removeAttribute(attributes[j].name);
					}
				}
			}
			return div.innerHTML;
		};

		if (track !== null && track.isLoaded) {
			var i = t.searchTrackPosition(track.entries, t.media.currentTime);
			if (i > -1) {
				t.captionsText.innerHTML = sanitize(track.entries[i].text);
				t.captionsText.className = t.options.classPrefix + 'captions-text ' + (track.entries[i].identifier || '');
				t.captions.style.display = '';
				t.captions.style.height = '0px';
				return;
			}
			t.captions.style.display = 'none';
		} else {
			t.captions.style.display = 'none';
		}
	},
	setupSlides: function setupSlides(track) {
		var t = this;
		t.slides = track;
		t.slides.entries.imgs = [t.slides.entries.length];
		t.showSlide(0);
	},
	showSlide: function showSlide(index) {
		var _this = this;

		var t = this;

		if (t.tracks === undefined || t.slidesContainer === undefined) {
			return;
		}

		var url = t.slides.entries[index].text;

		var img = t.slides.entries[index].imgs;

		if (img === undefined || img.fadeIn === undefined) {
			var image = _document2.default.createElement('img');
			image.src = url;
			image.addEventListener('load', function () {
				var self = _this,
				    visible = (0, _dom.siblings)(self, function (el) {
					return visible(el);
				});
				self.style.display = 'none';
				t.slidesContainer.innerHTML += self.innerHTML;
				(0, _dom.fadeIn)(t.slidesContainer.querySelector(image));
				for (var i = 0, total = visible.length; i < total; i++) {
					(0, _dom.fadeOut)(visible[i], 400);
				}
			});
			t.slides.entries[index].imgs = img = image;
		} else if (!(0, _dom.visible)(img)) {
			var _visible = (0, _dom.siblings)(self, function (el) {
				return _visible(el);
			});
			(0, _dom.fadeIn)(t.slidesContainer.querySelector(img));
			for (var i = 0, total = _visible.length; i < total; i++) {
				(0, _dom.fadeOut)(_visible[i]);
			}
		}
	},
	displaySlides: function displaySlides() {
		var t = this;

		if (this.slides === undefined) {
			return;
		}

		var slides = t.slides,
		    i = t.searchTrackPosition(slides.entries, t.media.currentTime);

		if (i > -1) {
			t.showSlide(i);
		}
	},
	drawChapters: function drawChapters(chapters) {
		var t = this,
		    total = chapters.entries.length;

		if (!total) {
			return;
		}

		t.chaptersButton.querySelector('ul').innerHTML = '';

		for (var i = 0; i < total; i++) {
			t.chaptersButton.querySelector('ul').innerHTML += '<li class="' + t.options.classPrefix + 'chapters-selector-list-item" ' + 'role="menuitemcheckbox" aria-live="polite" aria-disabled="false" aria-checked="false">' + ('<input type="radio" class="' + t.options.classPrefix + 'captions-selector-input" ') + ('name="' + t.id + '_chapters" id="' + t.id + '_chapters_' + i + '" value="' + chapters.entries[i].start + '" disabled>') + ('<label class="' + t.options.classPrefix + 'chapters-selector-label"') + ('for="' + t.id + '_chapters_' + i + '">' + chapters.entries[i].text + '</label>') + '</li>';
		}

		var radios = t.chaptersButton.querySelectorAll('input[type="radio"]'),
		    labels = t.chaptersButton.querySelectorAll('.' + t.options.classPrefix + 'chapters-selector-label');

		for (var _i13 = 0, _total10 = radios.length; _i13 < _total10; _i13++) {
			radios[_i13].disabled = false;
			radios[_i13].checked = false;
			radios[_i13].addEventListener('click', function (e) {
				var self = this,
				    listItems = t.chaptersButton.querySelectorAll('li'),
				    label = (0, _dom.siblings)(self, function (el) {
					return (0, _dom.hasClass)(el, t.options.classPrefix + 'chapters-selector-label');
				})[0];

				self.checked = true;
				self.parentNode.setAttribute('aria-checked', true);
				(0, _dom.addClass)(label, t.options.classPrefix + 'chapters-selected');
				(0, _dom.removeClass)(t.chaptersButton.querySelector('.' + t.options.classPrefix + 'chapters-selected'), t.options.classPrefix + 'chapters-selected');

				for (var _i14 = 0, _total11 = listItems.length; _i14 < _total11; _i14++) {
					listItems[_i14].setAttribute('aria-checked', false);
				}

				var keyboard = e.keyCode || e.which;
				if (typeof keyboard === 'undefined') {
					setTimeout(function () {
						t.getElement(t.container).focus();
					}, 500);
				}

				t.media.setCurrentTime(parseFloat(self.value));
				if (t.media.paused) {
					t.media.play();
				}
			});
		}

		for (var _i15 = 0, _total12 = labels.length; _i15 < _total12; _i15++) {
			labels[_i15].addEventListener('click', function (e) {
				var radio = (0, _dom.siblings)(this, function (el) {
					return el.tagName === 'INPUT';
				})[0],
				    event = (0, _general.createEvent)('click', radio);
				radio.dispatchEvent(event);
				e.preventDefault();
			});
		}
	},
	searchTrackPosition: function searchTrackPosition(tracks, currentTime) {
		var lo = 0,
		    hi = tracks.length - 1,
		    mid = void 0,
		    start = void 0,
		    stop = void 0;

		while (lo <= hi) {
			mid = lo + hi >> 1;
			start = tracks[mid].start;
			stop = tracks[mid].stop;

			if (currentTime >= start && currentTime < stop) {
				return mid;
			} else if (start < currentTime) {
				lo = mid + 1;
			} else if (start > currentTime) {
				hi = mid - 1;
			}
		}

		return -1;
	}
});

_mejs2.default.language = {
	codes: {
		af: 'mejs.afrikaans',
		sq: 'mejs.albanian',
		ar: 'mejs.arabic',
		be: 'mejs.belarusian',
		bg: 'mejs.bulgarian',
		ca: 'mejs.catalan',
		zh: 'mejs.chinese',
		'zh-cn': 'mejs.chinese-simplified',
		'zh-tw': 'mejs.chines-traditional',
		hr: 'mejs.croatian',
		cs: 'mejs.czech',
		da: 'mejs.danish',
		nl: 'mejs.dutch',
		en: 'mejs.english',
		et: 'mejs.estonian',
		fl: 'mejs.filipino',
		fi: 'mejs.finnish',
		fr: 'mejs.french',
		gl: 'mejs.galician',
		de: 'mejs.german',
		el: 'mejs.greek',
		ht: 'mejs.haitian-creole',
		iw: 'mejs.hebrew',
		hi: 'mejs.hindi',
		hu: 'mejs.hungarian',
		is: 'mejs.icelandic',
		id: 'mejs.indonesian',
		ga: 'mejs.irish',
		it: 'mejs.italian',
		ja: 'mejs.japanese',
		ko: 'mejs.korean',
		lv: 'mejs.latvian',
		lt: 'mejs.lithuanian',
		mk: 'mejs.macedonian',
		ms: 'mejs.malay',
		mt: 'mejs.maltese',
		no: 'mejs.norwegian',
		fa: 'mejs.persian',
		pl: 'mejs.polish',
		pt: 'mejs.portuguese',
		ro: 'mejs.romanian',
		ru: 'mejs.russian',
		sr: 'mejs.serbian',
		sk: 'mejs.slovak',
		sl: 'mejs.slovenian',
		es: 'mejs.spanish',
		sw: 'mejs.swahili',
		sv: 'mejs.swedish',
		tl: 'mejs.tagalog',
		th: 'mejs.thai',
		tr: 'mejs.turkish',
		uk: 'mejs.ukrainian',
		vi: 'mejs.vietnamese',
		cy: 'mejs.welsh',
		yi: 'mejs.yiddish'
	}
};

_mejs2.default.TrackFormatParser = {
	webvtt: {
		pattern: /^((?:[0-9]{1,2}:)?[0-9]{2}:[0-9]{2}([,.][0-9]{1,3})?) --\> ((?:[0-9]{1,2}:)?[0-9]{2}:[0-9]{2}([,.][0-9]{3})?)(.*)$/,

		parse: function parse(trackText) {
			var lines = trackText.split(/\r?\n/),
			    entries = [];

			var timecode = void 0,
			    text = void 0,
			    identifier = void 0;

			for (var i = 0, total = lines.length; i < total; i++) {
				timecode = this.pattern.exec(lines[i]);

				if (timecode && i < lines.length) {
					if (i - 1 >= 0 && lines[i - 1] !== '') {
						identifier = lines[i - 1];
					}
					i++;

					text = lines[i];
					i++;
					while (lines[i] !== '' && i < lines.length) {
						text = text + '\n' + lines[i];
						i++;
					}
					text = text.trim().replace(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig, "<a href='$1' target='_blank'>$1</a>");
					entries.push({
						identifier: identifier,
						start: (0, _time.convertSMPTEtoSeconds)(timecode[1]) === 0 ? 0.200 : (0, _time.convertSMPTEtoSeconds)(timecode[1]),
						stop: (0, _time.convertSMPTEtoSeconds)(timecode[3]),
						text: text,
						settings: timecode[5]
					});
				}
				identifier = '';
			}
			return entries;
		}
	},

	dfxp: {
		parse: function parse(trackText) {
			trackText = $(trackText).filter('tt');
			var container = trackText.firstChild,
			    lines = container.querySelectorAll('p'),
			    styleNode = trackText.getElementById('' + container.attr('style')),
			    entries = [];

			var styles = void 0;

			if (styleNode.length) {
				styleNode.removeAttribute('id');
				var attributes = styleNode.attributes;
				if (attributes.length) {
					styles = {};
					for (var i = 0, total = attributes.length; i < total; i++) {
						styles[attributes[i].name.split(":")[1]] = attributes[i].value;
					}
				}
			}

			for (var _i16 = 0, _total13 = lines.length; _i16 < _total13; _i16++) {
				var style = void 0,
				    _temp = {
					start: null,
					stop: null,
					style: null,
					text: null
				};

				if (lines.eq(_i16).attr('begin')) {
					_temp.start = (0, _time.convertSMPTEtoSeconds)(lines.eq(_i16).attr('begin'));
				}
				if (!_temp.start && lines.eq(_i16 - 1).attr('end')) {
					_temp.start = (0, _time.convertSMPTEtoSeconds)(lines.eq(_i16 - 1).attr('end'));
				}
				if (lines.eq(_i16).attr('end')) {
					_temp.stop = (0, _time.convertSMPTEtoSeconds)(lines.eq(_i16).attr('end'));
				}
				if (!_temp.stop && lines.eq(_i16 + 1).attr('begin')) {
					_temp.stop = (0, _time.convertSMPTEtoSeconds)(lines.eq(_i16 + 1).attr('begin'));
				}

				if (styles) {
					style = '';
					for (var _style in styles) {
						style += _style + ':' + styles[_style] + ';';
					}
				}
				if (style) {
					_temp.style = style;
				}
				if (_temp.start === 0) {
					_temp.start = 0.200;
				}
				_temp.text = lines.eq(_i16).innerHTML.trim().replace(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig, "<a href='$1' target='_blank'>$1</a>");
				entries.push(_temp);
			}
			return entries;
		}
	}
};

},{"16":16,"2":2,"26":26,"27":27,"30":30,"5":5,"7":7}],14:[function(_dereq_,module,exports){
'use strict';

var _document = _dereq_(2);

var _document2 = _interopRequireDefault(_document);

var _player = _dereq_(16);

var _player2 = _interopRequireDefault(_player);

var _i18n = _dereq_(5);

var _i18n2 = _interopRequireDefault(_i18n);

var _constants = _dereq_(25);

var _general = _dereq_(27);

var _dom = _dereq_(26);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

Object.assign(_player.config, {
	muteText: null,

	unmuteText: null,

	allyVolumeControlText: null,

	hideVolumeOnTouchDevices: true,

	audioVolume: 'horizontal',

	videoVolume: 'vertical',

	startVolume: 0.8
});

Object.assign(_player2.default.prototype, {
	buildvolume: function buildvolume(player, controls, layers, media) {
		if ((_constants.IS_ANDROID || _constants.IS_IOS) && this.options.hideVolumeOnTouchDevices) {
			return;
		}

		var t = this,
		    mode = t.isVideo ? t.options.videoVolume : t.options.audioVolume,
		    muteText = (0, _general.isString)(t.options.muteText) ? t.options.muteText : _i18n2.default.t('mejs.mute'),
		    unmuteText = (0, _general.isString)(t.options.unmuteText) ? t.options.unmuteText : _i18n2.default.t('mejs.unmute'),
		    volumeControlText = (0, _general.isString)(t.options.allyVolumeControlText) ? t.options.allyVolumeControlText : _i18n2.default.t('mejs.volume-help-text'),
		    mute = _document2.default.createElement('div');

		mute.className = t.options.classPrefix + 'button ' + t.options.classPrefix + 'volume-button ' + t.options.classPrefix + 'mute';
		mute.innerHTML = mode === 'horizontal' ? '<button type="button" aria-controls="' + t.id + '" title="' + muteText + '" aria-label="' + muteText + '" tabindex="0"></button>' : '<button type="button" aria-controls="' + t.id + '" title="' + muteText + '" aria-label="' + muteText + '" tabindex="0"></button>' + ('<a href="javascript:void(0);" class="' + t.options.classPrefix + 'volume-slider" ') + ('aria-label="' + _i18n2.default.t('mejs.volume-slider') + '" aria-valuemin="0" aria-valuemax="100" role="slider" ') + 'aria-orientation="vertical">' + ('<span class="' + t.options.classPrefix + 'offscreen">' + volumeControlText + '</span>') + ('<div class="' + t.options.classPrefix + 'volume-total">') + ('<div class="' + t.options.classPrefix + 'volume-current"></div>') + ('<div class="' + t.options.classPrefix + 'volume-handle"></div>') + '</div>' + '</a>';

		t.addControlElement(mute, 'volume');

		t.options.keyActions.push({
			keys: [38],
			action: function action(player) {
				var volumeSlider = player.getElement(player.container).querySelector('.' + _player.config.classPrefix + 'volume-slider');
				if (volumeSlider || player.getElement(player.container).querySelector('.' + _player.config.classPrefix + 'volume-slider').matches(':focus')) {
					volumeSlider.style.display = 'block';
				}
				if (player.isVideo) {
					player.showControls();
					player.startControlsTimer();
				}

				var newVolume = Math.min(player.volume + 0.1, 1);
				player.setVolume(newVolume);
				if (newVolume > 0) {
					player.setMuted(false);
				}
			}
		}, {
			keys: [40],
			action: function action(player) {
				var volumeSlider = player.getElement(player.container).querySelector('.' + _player.config.classPrefix + 'volume-slider');
				if (volumeSlider) {
					volumeSlider.style.display = 'block';
				}

				if (player.isVideo) {
					player.showControls();
					player.startControlsTimer();
				}

				var newVolume = Math.max(player.volume - 0.1, 0);
				player.setVolume(newVolume);

				if (newVolume <= 0.1) {
					player.setMuted(true);
				}
			}
		}, {
			keys: [77],
			action: function action(player) {
				player.getElement(player.container).querySelector('.' + _player.config.classPrefix + 'volume-slider').style.display = 'block';
				if (player.isVideo) {
					player.showControls();
					player.startControlsTimer();
				}
				if (player.media.muted) {
					player.setMuted(false);
				} else {
					player.setMuted(true);
				}
			}
		});

		if (mode === 'horizontal') {
			var anchor = _document2.default.createElement('a');
			anchor.className = t.options.classPrefix + 'horizontal-volume-slider';
			anchor.href = 'javascript:void(0);';
			anchor.setAttribute('aria-label', _i18n2.default.t('mejs.volume-slider'));
			anchor.setAttribute('aria-valuemin', 0);
			anchor.setAttribute('aria-valuemax', 100);
			anchor.setAttribute('aria-valuenow', 100);
			anchor.setAttribute('role', 'slider');
			anchor.innerHTML += '<span class="' + t.options.classPrefix + 'offscreen">' + volumeControlText + '</span>' + ('<div class="' + t.options.classPrefix + 'horizontal-volume-total">') + ('<div class="' + t.options.classPrefix + 'horizontal-volume-current"></div>') + ('<div class="' + t.options.classPrefix + 'horizontal-volume-handle"></div>') + '</div>';
			mute.parentNode.insertBefore(anchor, mute.nextSibling);
		}

		var mouseIsDown = false,
		    mouseIsOver = false,
		    modified = false,
		    updateVolumeSlider = function updateVolumeSlider() {
			var volume = Math.floor(media.volume * 100);
			volumeSlider.setAttribute('aria-valuenow', volume);
			volumeSlider.setAttribute('aria-valuetext', volume + '%');
		};

		var volumeSlider = mode === 'vertical' ? t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'volume-slider') : t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'horizontal-volume-slider'),
		    volumeTotal = mode === 'vertical' ? t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'volume-total') : t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'horizontal-volume-total'),
		    volumeCurrent = mode === 'vertical' ? t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'volume-current') : t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'horizontal-volume-current'),
		    volumeHandle = mode === 'vertical' ? t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'volume-handle') : t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'horizontal-volume-handle'),
		    positionVolumeHandle = function positionVolumeHandle(volume) {

			if (volume === null || isNaN(volume) || volume === undefined) {
				return;
			}

			volume = Math.max(0, volume);
			volume = Math.min(volume, 1);

			if (volume === 0) {
				(0, _dom.removeClass)(mute, t.options.classPrefix + 'mute');
				(0, _dom.addClass)(mute, t.options.classPrefix + 'unmute');
				var button = mute.firstElementChild;
				button.setAttribute('title', unmuteText);
				button.setAttribute('aria-label', unmuteText);
			} else {
				(0, _dom.removeClass)(mute, t.options.classPrefix + 'unmute');
				(0, _dom.addClass)(mute, t.options.classPrefix + 'mute');
				var _button = mute.firstElementChild;
				_button.setAttribute('title', muteText);
				_button.setAttribute('aria-label', muteText);
			}

			var volumePercentage = volume * 100 + '%',
			    volumeStyles = getComputedStyle(volumeHandle);

			if (mode === 'vertical') {
				volumeCurrent.style.bottom = 0;
				volumeCurrent.style.height = volumePercentage;
				volumeHandle.style.bottom = volumePercentage;
				volumeHandle.style.marginBottom = -parseFloat(volumeStyles.height) / 2 + 'px';
			} else {
				volumeCurrent.style.left = 0;
				volumeCurrent.style.width = volumePercentage;
				volumeHandle.style.left = volumePercentage;
				volumeHandle.style.marginLeft = -parseFloat(volumeStyles.width) / 2 + 'px';
			}
		},
		    handleVolumeMove = function handleVolumeMove(e) {
			var totalOffset = (0, _dom.offset)(volumeTotal),
			    volumeStyles = getComputedStyle(volumeTotal);

			modified = true;

			var volume = null;

			if (mode === 'vertical') {
				var railHeight = parseFloat(volumeStyles.height),
				    newY = e.pageY - totalOffset.top;

				volume = (railHeight - newY) / railHeight;

				if (totalOffset.top === 0 || totalOffset.left === 0) {
					return;
				}
			} else {
				var railWidth = parseFloat(volumeStyles.width),
				    newX = e.pageX - totalOffset.left;

				volume = newX / railWidth;
			}

			volume = Math.max(0, volume);
			volume = Math.min(volume, 1);

			positionVolumeHandle(volume);

			t.setMuted(volume === 0);
			t.setVolume(volume);

			e.preventDefault();
			e.stopPropagation();
		},
		    toggleMute = function toggleMute() {
			if (t.muted) {
				positionVolumeHandle(0);
				(0, _dom.removeClass)(mute, t.options.classPrefix + 'mute');
				(0, _dom.addClass)(mute, t.options.classPrefix + 'unmute');
			} else {
				positionVolumeHandle(media.volume);
				(0, _dom.removeClass)(mute, t.options.classPrefix + 'unmute');
				(0, _dom.addClass)(mute, t.options.classPrefix + 'mute');
			}
		};

		player.getElement(player.container).addEventListener('keydown', function (e) {
			var hasFocus = !!e.target.closest('.' + t.options.classPrefix + 'container');
			if (!hasFocus && mode === 'vertical') {
				volumeSlider.style.display = 'none';
			}
		});

		mute.addEventListener('mouseenter', function (e) {
			if (e.target === mute) {
				volumeSlider.style.display = 'block';
				mouseIsOver = true;
				e.preventDefault();
				e.stopPropagation();
			}
		});
		mute.addEventListener('focusin', function () {
			volumeSlider.style.display = 'block';
			mouseIsOver = true;
		});

		mute.addEventListener('focusout', function (e) {
			if ((!e.relatedTarget || e.relatedTarget && !e.relatedTarget.matches('.' + t.options.classPrefix + 'volume-slider')) && mode === 'vertical') {
				volumeSlider.style.display = 'none';
			}
		});
		mute.addEventListener('mouseleave', function () {
			mouseIsOver = false;
			if (!mouseIsDown && mode === 'vertical') {
				volumeSlider.style.display = 'none';
			}
		});
		mute.addEventListener('focusout', function () {
			mouseIsOver = false;
		});
		mute.addEventListener('keydown', function (e) {
			if (t.options.enableKeyboard && t.options.keyActions.length) {
				var keyCode = e.which || e.keyCode || 0,
				    volume = media.volume;

				switch (keyCode) {
					case 38:
						volume = Math.min(volume + 0.1, 1);
						break;
					case 40:
						volume = Math.max(0, volume - 0.1);
						break;
					default:
						return true;
				}

				mouseIsDown = false;
				positionVolumeHandle(volume);
				media.setVolume(volume);

				e.preventDefault();
				e.stopPropagation();
			}
		});
		mute.querySelector('button').addEventListener('click', function () {
			media.setMuted(!media.muted);
			var event = (0, _general.createEvent)('volumechange', media);
			media.dispatchEvent(event);
		});

		volumeSlider.addEventListener('dragstart', function () {
			return false;
		});

		volumeSlider.addEventListener('mouseover', function () {
			mouseIsOver = true;
		});
		volumeSlider.addEventListener('focusin', function () {
			volumeSlider.style.display = 'block';
			mouseIsOver = true;
		});
		volumeSlider.addEventListener('focusout', function () {
			mouseIsOver = false;
			if (!mouseIsDown && mode === 'vertical') {
				volumeSlider.style.display = 'none';
			}
		});
		volumeSlider.addEventListener('mousedown', function (e) {
			handleVolumeMove(e);
			t.globalBind('mousemove.vol', function (event) {
				var target = event.target;
				if (mouseIsDown && (target === volumeSlider || target.closest(mode === 'vertical' ? '.' + t.options.classPrefix + 'volume-slider' : '.' + t.options.classPrefix + 'horizontal-volume-slider'))) {
					handleVolumeMove(event);
				}
			});
			t.globalBind('mouseup.vol', function () {
				mouseIsDown = false;
				if (!mouseIsOver && mode === 'vertical') {
					volumeSlider.style.display = 'none';
				}
			});
			mouseIsDown = true;
			e.preventDefault();
			e.stopPropagation();
		});

		media.addEventListener('volumechange', function (e) {
			if (!mouseIsDown) {
				toggleMute();
			}
			updateVolumeSlider(e);
		});

		var rendered = false;
		media.addEventListener('rendererready', function () {
			if (!modified) {
				setTimeout(function () {
					rendered = true;
					if (player.options.startVolume === 0 || media.originalNode.muted) {
						media.setMuted(true);
						player.options.startVolume = 0;
					}
					media.setVolume(player.options.startVolume);
					t.setControlsSize();
				}, 250);
			}
		});

		media.addEventListener('loadedmetadata', function () {
			setTimeout(function () {
				if (!modified && !rendered) {
					if (player.options.startVolume === 0 || media.originalNode.muted) {
						media.setMuted(true);
					}
					media.setVolume(player.options.startVolume);
					t.setControlsSize();
				}
				rendered = false;
			}, 250);
		});

		if (player.options.startVolume === 0 || media.originalNode.muted) {
			media.setMuted(true);
			player.options.startVolume = 0;
			toggleMute();
		}

		t.getElement(t.container).addEventListener('controlsresize', function () {
			toggleMute();
		});
	}
});

},{"16":16,"2":2,"25":25,"26":26,"27":27,"5":5}],15:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
var EN = exports.EN = {
	'mejs.plural-form': 1,

	'mejs.download-file': 'Download File',

	'mejs.install-flash': 'You are using a browser that does not have Flash player enabled or installed. Please turn on your Flash player plugin or download the latest version from https://get.adobe.com/flashplayer/',

	'mejs.fullscreen': 'Fullscreen',

	'mejs.play': 'Play',
	'mejs.pause': 'Pause',

	'mejs.time-slider': 'Time Slider',
	'mejs.time-help-text': 'Use Left/Right Arrow keys to advance one second, Up/Down arrows to advance ten seconds.',
	'mejs.live-broadcast': 'Live Broadcast',

	'mejs.volume-help-text': 'Use Up/Down Arrow keys to increase or decrease volume.',
	'mejs.unmute': 'Unmute',
	'mejs.mute': 'Mute',
	'mejs.volume-slider': 'Volume Slider',

	'mejs.video-player': 'Video Player',
	'mejs.audio-player': 'Audio Player',

	'mejs.captions-subtitles': 'Captions/Subtitles',
	'mejs.captions-chapters': 'Chapters',
	'mejs.none': 'None',
	'mejs.afrikaans': 'Afrikaans',
	'mejs.albanian': 'Albanian',
	'mejs.arabic': 'Arabic',
	'mejs.belarusian': 'Belarusian',
	'mejs.bulgarian': 'Bulgarian',
	'mejs.catalan': 'Catalan',
	'mejs.chinese': 'Chinese',
	'mejs.chinese-simplified': 'Chinese (Simplified)',
	'mejs.chinese-traditional': 'Chinese (Traditional)',
	'mejs.croatian': 'Croatian',
	'mejs.czech': 'Czech',
	'mejs.danish': 'Danish',
	'mejs.dutch': 'Dutch',
	'mejs.english': 'English',
	'mejs.estonian': 'Estonian',
	'mejs.filipino': 'Filipino',
	'mejs.finnish': 'Finnish',
	'mejs.french': 'French',
	'mejs.galician': 'Galician',
	'mejs.german': 'German',
	'mejs.greek': 'Greek',
	'mejs.haitian-creole': 'Haitian Creole',
	'mejs.hebrew': 'Hebrew',
	'mejs.hindi': 'Hindi',
	'mejs.hungarian': 'Hungarian',
	'mejs.icelandic': 'Icelandic',
	'mejs.indonesian': 'Indonesian',
	'mejs.irish': 'Irish',
	'mejs.italian': 'Italian',
	'mejs.japanese': 'Japanese',
	'mejs.korean': 'Korean',
	'mejs.latvian': 'Latvian',
	'mejs.lithuanian': 'Lithuanian',
	'mejs.macedonian': 'Macedonian',
	'mejs.malay': 'Malay',
	'mejs.maltese': 'Maltese',
	'mejs.norwegian': 'Norwegian',
	'mejs.persian': 'Persian',
	'mejs.polish': 'Polish',
	'mejs.portuguese': 'Portuguese',
	'mejs.romanian': 'Romanian',
	'mejs.russian': 'Russian',
	'mejs.serbian': 'Serbian',
	'mejs.slovak': 'Slovak',
	'mejs.slovenian': 'Slovenian',
	'mejs.spanish': 'Spanish',
	'mejs.swahili': 'Swahili',
	'mejs.swedish': 'Swedish',
	'mejs.tagalog': 'Tagalog',
	'mejs.thai': 'Thai',
	'mejs.turkish': 'Turkish',
	'mejs.ukrainian': 'Ukrainian',
	'mejs.vietnamese': 'Vietnamese',
	'mejs.welsh': 'Welsh',
	'mejs.yiddish': 'Yiddish'
};

},{}],16:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.config = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _window = _dereq_(3);

var _window2 = _interopRequireDefault(_window);

var _document = _dereq_(2);

var _document2 = _interopRequireDefault(_document);

var _mejs = _dereq_(7);

var _mejs2 = _interopRequireDefault(_mejs);

var _mediaelement = _dereq_(6);

var _mediaelement2 = _interopRequireDefault(_mediaelement);

var _default = _dereq_(17);

var _default2 = _interopRequireDefault(_default);

var _i18n = _dereq_(5);

var _i18n2 = _interopRequireDefault(_i18n);

var _constants = _dereq_(25);

var _general = _dereq_(27);

var _time = _dereq_(30);

var _media = _dereq_(28);

var _dom = _dereq_(26);

var dom = _interopRequireWildcard(_dom);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

_mejs2.default.mepIndex = 0;

_mejs2.default.players = {};

var config = exports.config = {
	poster: '',

	showPosterWhenEnded: false,

	showPosterWhenPaused: false,

	defaultVideoWidth: 480,

	defaultVideoHeight: 270,

	videoWidth: -1,

	videoHeight: -1,

	defaultAudioWidth: 400,

	defaultAudioHeight: 40,

	defaultSeekBackwardInterval: function defaultSeekBackwardInterval(media) {
		return media.getDuration() * 0.05;
	},

	defaultSeekForwardInterval: function defaultSeekForwardInterval(media) {
		return media.getDuration() * 0.05;
	},

	setDimensions: true,

	audioWidth: -1,

	audioHeight: -1,

	loop: false,

	autoRewind: true,

	enableAutosize: true,

	timeFormat: '',

	alwaysShowHours: false,

	showTimecodeFrameCount: false,

	framesPerSecond: 25,

	alwaysShowControls: false,

	hideVideoControlsOnLoad: false,

	hideVideoControlsOnPause: false,

	clickToPlayPause: true,

	controlsTimeoutDefault: 1500,

	controlsTimeoutMouseEnter: 2500,

	controlsTimeoutMouseLeave: 1000,

	iPadUseNativeControls: false,

	iPhoneUseNativeControls: false,

	AndroidUseNativeControls: false,

	features: ['playpause', 'current', 'progress', 'duration', 'tracks', 'volume', 'fullscreen'],

	useDefaultControls: false,

	isVideo: true,

	stretching: 'auto',

	classPrefix: 'mejs__',

	enableKeyboard: true,

	pauseOtherPlayers: true,

	secondsDecimalLength: 0,

	customError: null,

	keyActions: [{
		keys: [179],
		action: function action(player) {

			if (!_constants.IS_FIREFOX) {
				if (player.paused || player.ended) {
					player.play();
				} else {
					player.pause();
				}
			}
		}
	}]
};

_mejs2.default.MepDefaults = config;

var MediaElementPlayer = function () {
	function MediaElementPlayer(node, o) {
		_classCallCheck(this, MediaElementPlayer);

		var t = this,
		    element = typeof node === 'string' ? _document2.default.getElementById(node) : node;

		if (!(t instanceof MediaElementPlayer)) {
			return new MediaElementPlayer(element, o);
		}

		t.node = t.media = element;

		if (!t.node) {
			return;
		}

		if (t.media.player) {
			return t.media.player;
		}

		t.hasFocus = false;

		t.controlsAreVisible = true;

		t.controlsEnabled = true;

		t.controlsTimer = null;

		t.currentMediaTime = 0;

		t.proxy = null;

		if (o === undefined) {
			var options = t.node.getAttribute('data-mejsoptions');
			o = options ? JSON.parse(options) : {};
		}

		t.options = Object.assign({}, config, o);

		if (t.options.loop && !t.media.getAttribute('loop')) {
			t.media.loop = true;
			t.node.loop = true;
		} else if (t.media.loop) {
			t.options.loop = true;
		}

		if (!t.options.timeFormat) {
			t.options.timeFormat = 'mm:ss';
			if (t.options.alwaysShowHours) {
				t.options.timeFormat = 'hh:mm:ss';
			}
			if (t.options.showTimecodeFrameCount) {
				t.options.timeFormat += ':ff';
			}
		}

		(0, _time.calculateTimeFormat)(0, t.options, t.options.framesPerSecond || 25);

		t.id = 'mep_' + _mejs2.default.mepIndex++;

		_mejs2.default.players[t.id] = t;

		t.init();

		return t;
	}

	_createClass(MediaElementPlayer, [{
		key: 'getElement',
		value: function getElement(element) {
			return element;
		}
	}, {
		key: 'init',
		value: function init() {
			var t = this,
			    playerOptions = Object.assign({}, t.options, {
				success: function success(media, domNode) {
					t._meReady(media, domNode);
				},
				error: function error(e) {
					t._handleError(e);
				}
			}),
			    tagName = t.node.tagName.toLowerCase();

			t.isDynamic = tagName !== 'audio' && tagName !== 'video' && tagName !== 'iframe';
			t.isVideo = t.isDynamic ? t.options.isVideo : tagName !== 'audio' && t.options.isVideo;
			t.mediaFiles = null;
			t.trackFiles = null;

			if (_constants.IS_IPAD && t.options.iPadUseNativeControls || _constants.IS_IPHONE && t.options.iPhoneUseNativeControls) {
				t.node.setAttribute('controls', true);

				if (_constants.IS_IPAD && t.node.getAttribute('autoplay')) {
					t.play();
				}
			} else if ((t.isVideo || !t.isVideo && (t.options.features.length || t.options.useDefaultControls)) && !(_constants.IS_ANDROID && t.options.AndroidUseNativeControls)) {
				t.node.removeAttribute('controls');
				var videoPlayerTitle = t.isVideo ? _i18n2.default.t('mejs.video-player') : _i18n2.default.t('mejs.audio-player');

				var offscreen = _document2.default.createElement('span');
				offscreen.className = t.options.classPrefix + 'offscreen';
				offscreen.innerText = videoPlayerTitle;
				t.media.parentNode.insertBefore(offscreen, t.media);

				t.container = _document2.default.createElement('div');
				t.getElement(t.container).id = t.id;
				t.getElement(t.container).className = t.options.classPrefix + 'container ' + t.options.classPrefix + 'container-keyboard-inactive ' + t.media.className;
				t.getElement(t.container).tabIndex = 0;
				t.getElement(t.container).setAttribute('role', 'application');
				t.getElement(t.container).setAttribute('aria-label', videoPlayerTitle);
				t.getElement(t.container).innerHTML = '<div class="' + t.options.classPrefix + 'inner">' + ('<div class="' + t.options.classPrefix + 'mediaelement"></div>') + ('<div class="' + t.options.classPrefix + 'layers"></div>') + ('<div class="' + t.options.classPrefix + 'controls"></div>') + '</div>';
				t.getElement(t.container).addEventListener('focus', function (e) {
					if (!t.controlsAreVisible && !t.hasFocus && t.controlsEnabled) {
						t.showControls(true);

						var btnSelector = (0, _general.isNodeAfter)(e.relatedTarget, t.getElement(t.container)) ? '.' + t.options.classPrefix + 'controls .' + t.options.classPrefix + 'button:last-child > button' : '.' + t.options.classPrefix + 'playpause-button > button',
						    button = t.getElement(t.container).querySelector(btnSelector);

						button.focus();
					}
				});
				t.node.parentNode.insertBefore(t.getElement(t.container), t.node);

				if (!t.options.features.length && !t.options.useDefaultControls) {
					t.getElement(t.container).style.background = 'transparent';
					t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'controls').style.display = 'none';
				}

				if (t.isVideo && t.options.stretching === 'fill' && !dom.hasClass(t.getElement(t.container).parentNode, t.options.classPrefix + 'fill-container')) {
					t.outerContainer = t.media.parentNode;

					var wrapper = _document2.default.createElement('div');
					wrapper.className = t.options.classPrefix + 'fill-container';
					t.getElement(t.container).parentNode.insertBefore(wrapper, t.getElement(t.container));
					wrapper.appendChild(t.getElement(t.container));
				}

				if (_constants.IS_ANDROID) {
					dom.addClass(t.getElement(t.container), t.options.classPrefix + 'android');
				}
				if (_constants.IS_IOS) {
					dom.addClass(t.getElement(t.container), t.options.classPrefix + 'ios');
				}
				if (_constants.IS_IPAD) {
					dom.addClass(t.getElement(t.container), t.options.classPrefix + 'ipad');
				}
				if (_constants.IS_IPHONE) {
					dom.addClass(t.getElement(t.container), t.options.classPrefix + 'iphone');
				}
				dom.addClass(t.getElement(t.container), t.isVideo ? t.options.classPrefix + 'video' : t.options.classPrefix + 'audio');

				if (_constants.IS_SAFARI && !_constants.IS_IOS) {

					dom.addClass(t.getElement(t.container), t.options.classPrefix + 'hide-cues');

					var cloneNode = t.node.cloneNode(),
					    children = t.node.children,
					    mediaFiles = [],
					    tracks = [];

					for (var i = 0, total = children.length; i < total; i++) {
						var childNode = children[i];

						(function () {
							switch (childNode.tagName.toLowerCase()) {
								case 'source':
									var elements = {};
									Array.prototype.slice.call(childNode.attributes).forEach(function (item) {
										elements[item.name] = item.value;
									});
									elements.type = (0, _media.formatType)(elements.src, elements.type);
									mediaFiles.push(elements);
									break;
								case 'track':
									childNode.mode = 'hidden';
									tracks.push(childNode);
									break;
								default:
									cloneNode.appendChild(childNode);
									break;
							}
						})();
					}

					t.node.remove();
					t.node = t.media = cloneNode;

					if (mediaFiles.length) {
						t.mediaFiles = mediaFiles;
					}
					if (tracks.length) {
						t.trackFiles = tracks;
					}
				}

				t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'mediaelement').appendChild(t.node);

				t.media.player = t;

				t.controls = t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'controls');
				t.layers = t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'layers');

				var tagType = t.isVideo ? 'video' : 'audio',
				    capsTagName = tagType.substring(0, 1).toUpperCase() + tagType.substring(1);

				if (t.options[tagType + 'Width'] > 0 || t.options[tagType + 'Width'].toString().indexOf('%') > -1) {
					t.width = t.options[tagType + 'Width'];
				} else if (t.node.style.width !== '' && t.node.style.width !== null) {
					t.width = t.node.style.width;
				} else if (t.node.getAttribute('width')) {
					t.width = t.node.getAttribute('width');
				} else {
					t.width = t.options['default' + capsTagName + 'Width'];
				}

				if (t.options[tagType + 'Height'] > 0 || t.options[tagType + 'Height'].toString().indexOf('%') > -1) {
					t.height = t.options[tagType + 'Height'];
				} else if (t.node.style.height !== '' && t.node.style.height !== null) {
					t.height = t.node.style.height;
				} else if (t.node.getAttribute('height')) {
					t.height = t.node.getAttribute('height');
				} else {
					t.height = t.options['default' + capsTagName + 'Height'];
				}

				t.initialAspectRatio = t.height >= t.width ? t.width / t.height : t.height / t.width;

				t.setPlayerSize(t.width, t.height);

				playerOptions.pluginWidth = t.width;
				playerOptions.pluginHeight = t.height;
			} else if (!t.isVideo && !t.options.features.length && !t.options.useDefaultControls) {
					t.node.style.display = 'none';
				}

			_mejs2.default.MepDefaults = playerOptions;

			new _mediaelement2.default(t.media, playerOptions, t.mediaFiles);

			if (t.getElement(t.container) !== undefined && t.options.features.length && t.controlsAreVisible && !t.options.hideVideoControlsOnLoad) {
				var event = (0, _general.createEvent)('controlsshown', t.getElement(t.container));
				t.getElement(t.container).dispatchEvent(event);
			}
		}
	}, {
		key: 'showControls',
		value: function showControls(doAnimation) {
			var t = this;

			doAnimation = doAnimation === undefined || doAnimation;

			if (t.controlsAreVisible || !t.isVideo) {
				return;
			}

			if (doAnimation) {
				(function () {
					dom.fadeIn(t.getElement(t.controls), 200, function () {
						dom.removeClass(t.getElement(t.controls), t.options.classPrefix + 'offscreen');
						var event = (0, _general.createEvent)('controlsshown', t.getElement(t.container));
						t.getElement(t.container).dispatchEvent(event);
					});

					var controls = t.getElement(t.container).querySelectorAll('.' + t.options.classPrefix + 'control');

					var _loop = function _loop(i, total) {
						dom.fadeIn(controls[i], 200, function () {
							dom.removeClass(controls[i], t.options.classPrefix + 'offscreen');
						});
					};

					for (var i = 0, total = controls.length; i < total; i++) {
						_loop(i, total);
					}
				})();
			} else {
				dom.removeClass(t.getElement(t.controls), t.options.classPrefix + 'offscreen');
				t.getElement(t.controls).style.display = '';
				t.getElement(t.controls).style.opacity = 1;

				var controls = t.getElement(t.container).querySelectorAll('.' + t.options.classPrefix + 'control');
				for (var i = 0, total = controls.length; i < total; i++) {
					dom.removeClass(controls[i], t.options.classPrefix + 'offscreen');
					controls[i].style.display = '';
				}

				var event = (0, _general.createEvent)('controlsshown', t.getElement(t.container));
				t.getElement(t.container).dispatchEvent(event);
			}

			t.controlsAreVisible = true;
			t.setControlsSize();
		}
	}, {
		key: 'hideControls',
		value: function hideControls(doAnimation, forceHide) {
			var t = this;

			doAnimation = doAnimation === undefined || doAnimation;

			if (forceHide !== true && (!t.controlsAreVisible || t.options.alwaysShowControls || t.paused && t.readyState === 4 && (!t.options.hideVideoControlsOnLoad && t.currentTime <= 0 || !t.options.hideVideoControlsOnPause && t.currentTime > 0) || t.isVideo && !t.options.hideVideoControlsOnLoad && !t.readyState || t.ended)) {
				return;
			}

			if (doAnimation) {
				(function () {
					dom.fadeOut(t.getElement(t.controls), 200, function () {
						dom.addClass(t.getElement(t.controls), t.options.classPrefix + 'offscreen');
						t.getElement(t.controls).style.display = '';
						var event = (0, _general.createEvent)('controlshidden', t.getElement(t.container));
						t.getElement(t.container).dispatchEvent(event);
					});

					var controls = t.getElement(t.container).querySelectorAll('.' + t.options.classPrefix + 'control');

					var _loop2 = function _loop2(i, total) {
						dom.fadeOut(controls[i], 200, function () {
							dom.addClass(controls[i], t.options.classPrefix + 'offscreen');
							controls[i].style.display = '';
						});
					};

					for (var i = 0, total = controls.length; i < total; i++) {
						_loop2(i, total);
					}
				})();
			} else {
				dom.addClass(t.getElement(t.controls), t.options.classPrefix + 'offscreen');
				t.getElement(t.controls).style.display = '';
				t.getElement(t.controls).style.opacity = 0;

				var controls = t.getElement(t.container).querySelectorAll('.' + t.options.classPrefix + 'control');
				for (var i = 0, total = controls.length; i < total; i++) {
					dom.addClass(controls[i], t.options.classPrefix + 'offscreen');
					controls[i].style.display = '';
				}

				var event = (0, _general.createEvent)('controlshidden', t.getElement(t.container));
				t.getElement(t.container).dispatchEvent(event);
			}

			t.controlsAreVisible = false;
		}
	}, {
		key: 'startControlsTimer',
		value: function startControlsTimer(timeout) {
			var t = this;

			timeout = typeof timeout !== 'undefined' ? timeout : t.options.controlsTimeoutDefault;

			t.killControlsTimer('start');

			t.controlsTimer = setTimeout(function () {
				t.hideControls();
				t.killControlsTimer('hide');
			}, timeout);
		}
	}, {
		key: 'killControlsTimer',
		value: function killControlsTimer() {
			var t = this;

			if (t.controlsTimer !== null) {
				clearTimeout(t.controlsTimer);
				delete t.controlsTimer;
				t.controlsTimer = null;
			}
		}
	}, {
		key: 'disableControls',
		value: function disableControls() {
			var t = this;

			t.killControlsTimer();
			t.controlsEnabled = false;
			t.hideControls(false, true);
		}
	}, {
		key: 'enableControls',
		value: function enableControls() {
			var t = this;

			t.controlsEnabled = true;
			t.showControls(false);
		}
	}, {
		key: '_setDefaultPlayer',
		value: function _setDefaultPlayer() {
			var t = this;
			if (t.proxy) {
				t.proxy.pause();
			}
			t.proxy = new _default2.default(t);
			t.media.addEventListener('loadedmetadata', function () {
				if (t.getCurrentTime() > 0 && t.currentMediaTime > 0) {
					t.setCurrentTime(t.currentMediaTime);
					if (!_constants.IS_IOS && !_constants.IS_ANDROID) {
						t.play();
					}
				}
			});
		}
	}, {
		key: '_meReady',
		value: function _meReady(media, domNode) {
			var t = this,
			    autoplayAttr = domNode.getAttribute('autoplay'),
			    autoplay = !(autoplayAttr === undefined || autoplayAttr === null || autoplayAttr === 'false'),
			    isNative = media.rendererName !== null && /(native|html5)/i.test(t.media.rendererName);

			if (t.getElement(t.controls)) {
				t.enableControls();
			}

			if (t.getElement(t.container) && t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'overlay-play')) {
				t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'overlay-play').style.display = '';
			}

			if (t.created) {
				return;
			}

			t.created = true;
			t.media = media;
			t.domNode = domNode;

			if (!(_constants.IS_ANDROID && t.options.AndroidUseNativeControls) && !(_constants.IS_IPAD && t.options.iPadUseNativeControls) && !(_constants.IS_IPHONE && t.options.iPhoneUseNativeControls)) {
				if (!t.isVideo && !t.options.features.length && !t.options.useDefaultControls) {
					if (autoplay && isNative) {
						t.play();
					}

					if (t.options.success) {

						if (typeof t.options.success === 'string') {
							_window2.default[t.options.success](t.media, t.domNode, t);
						} else {
							t.options.success(t.media, t.domNode, t);
						}
					}

					return;
				}

				t.featurePosition = {};

				t._setDefaultPlayer();

				t.buildposter(t, t.getElement(t.controls), t.getElement(t.layers), t.media);
				t.buildkeyboard(t, t.getElement(t.controls), t.getElement(t.layers), t.media);
				t.buildoverlays(t, t.getElement(t.controls), t.getElement(t.layers), t.media);

				if (t.options.useDefaultControls) {
					var defaultControls = ['playpause', 'current', 'progress', 'duration', 'tracks', 'volume', 'fullscreen'];
					t.options.features = defaultControls.concat(t.options.features.filter(function (item) {
						return defaultControls.indexOf(item) === -1;
					}));
				}

				t.buildfeatures(t, t.getElement(t.controls), t.getElement(t.layers), t.media);

				var event = (0, _general.createEvent)('controlsready', t.getElement(t.container));
				t.getElement(t.container).dispatchEvent(event);

				t.setPlayerSize(t.width, t.height);
				t.setControlsSize();

				if (t.isVideo) {
					t.clickToPlayPauseCallback = function () {

						if (t.options.clickToPlayPause) {
							var button = t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'overlay-button'),
							    pressed = button.getAttribute('aria-pressed');

							if (t.paused && pressed) {
								t.pause();
							} else if (t.paused) {
								t.play();
                $('.videoPlayer')[0].style.cursor = 'none';
							} else {
								t.pause();
							}

							button.setAttribute('aria-pressed', !pressed);
							t.getElement(t.container).focus();
						}
					};

					t.createIframeLayer();

					t.media.addEventListener('click', t.clickToPlayPauseCallback);

					if ((_constants.IS_ANDROID || _constants.IS_IOS) && !t.options.alwaysShowControls) {
						t.node.addEventListener('touchstart', function () {
							if (t.controlsAreVisible) {
								t.hideControls(false);
							} else {
								if (t.controlsEnabled) {
									t.showControls(false);
								}
							}
						}, _constants.SUPPORT_PASSIVE_EVENT ? { passive: true } : false);
					} else {
						t.getElement(t.container).addEventListener('mouseenter', function () {
							if (t.controlsEnabled) {
								if (!t.options.alwaysShowControls) {
									t.killControlsTimer('enter');
									t.showControls();
									t.startControlsTimer(t.options.controlsTimeoutMouseEnter);
								}
							}
						});
						t.getElement(t.container).addEventListener('mousemove', function () {
							if (t.controlsEnabled) {
								if (!t.controlsAreVisible) {
									t.showControls();
								}
								if (!t.options.alwaysShowControls) {
									t.startControlsTimer(t.options.controlsTimeoutMouseEnter);
								}
							}
						});
						t.getElement(t.container).addEventListener('mouseleave', function () {
							if (t.controlsEnabled) {
								if (!t.paused && !t.options.alwaysShowControls) {
									t.startControlsTimer(t.options.controlsTimeoutMouseLeave);
								}
							}
						});
					}

					if (t.options.hideVideoControlsOnLoad) {
						t.hideControls(false);
					}

					if (t.options.enableAutosize) {
						t.media.addEventListener('loadedmetadata', function (e) {
							var target = e !== undefined ? e.detail.target || e.target : t.media;
							if (t.options.videoHeight <= 0 && !t.domNode.getAttribute('height') && !t.domNode.style.height && target !== null && !isNaN(target.videoHeight)) {
								t.setPlayerSize(target.videoWidth, target.videoHeight);
								t.setControlsSize();
								t.media.setSize(target.videoWidth, target.videoHeight);
							}
						});
					}
				}

				t.media.addEventListener('play', function () {
					t.hasFocus = true;

					for (var playerIndex in _mejs2.default.players) {
						if (_mejs2.default.players.hasOwnProperty(playerIndex)) {
							var p = _mejs2.default.players[playerIndex];

							if (p.id !== t.id && t.options.pauseOtherPlayers && !p.paused && !p.ended) {
								p.pause();
								p.hasFocus = false;
							}
						}
					}

					if (!(_constants.IS_ANDROID || _constants.IS_IOS) && !t.options.alwaysShowControls && t.isVideo) {
						t.hideControls();
					}
				});

				t.media.addEventListener('ended', function () {
					if (t.options.autoRewind) {
						try {
							t.setCurrentTime(0);

							setTimeout(function () {
								var loadingElement = t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'overlay-loading');
								if (loadingElement && loadingElement.parentNode) {
									loadingElement.parentNode.style.display = 'none';
								}
							}, 20);
						} catch (exp) {

						}
					}

					if (typeof t.media.renderer.stop === 'function') {
						t.media.renderer.stop();
					} else {
						t.pause();
					}

					if (t.setProgressRail) {
						t.setProgressRail();
					}
					if (t.setCurrentRail) {
						t.setCurrentRail();
					}

					if (t.options.loop) {
						t.play();
					} else if (!t.options.alwaysShowControls && t.controlsEnabled) {
						t.showControls();
					}
				});

				t.media.addEventListener('loadedmetadata', function () {

					(0, _time.calculateTimeFormat)(t.getDuration(), t.options, t.options.framesPerSecond || 25);

					if (t.updateDuration) {
						t.updateDuration();
					}
					if (t.updateCurrent) {
						t.updateCurrent();
					}

					if (!t.isFullScreen) {
						t.setPlayerSize(t.width, t.height);
						t.setControlsSize();
					}
				});

				var duration = null;
				t.media.addEventListener('timeupdate', function () {
					if (!isNaN(t.getDuration()) && duration !== t.getDuration()) {
						duration = t.getDuration();
						(0, _time.calculateTimeFormat)(duration, t.options, t.options.framesPerSecond || 25);

						if (t.updateDuration) {
							t.updateDuration();
						}
						if (t.updateCurrent) {
							t.updateCurrent();
						}

						t.setControlsSize();
					}
				});

				t.getElement(t.container).addEventListener('click', function (e) {
					dom.addClass(e.currentTarget, t.options.classPrefix + 'container-keyboard-inactive');
				});

				t.getElement(t.container).addEventListener('focusin', function (e) {
					dom.removeClass(e.currentTarget, t.options.classPrefix + 'container-keyboard-inactive');
					if (t.isVideo && !_constants.IS_ANDROID && !_constants.IS_IOS && t.controlsEnabled && !t.options.alwaysShowControls) {
						t.killControlsTimer('enter');
						t.showControls();
						t.startControlsTimer(t.options.controlsTimeoutMouseEnter);
					}
				});

				t.getElement(t.container).addEventListener('focusout', function (e) {
					setTimeout(function () {
						if (e.relatedTarget) {
							if (t.keyboardAction && !e.relatedTarget.closest('.' + t.options.classPrefix + 'container')) {
								t.keyboardAction = false;
								if (t.isVideo && !t.options.alwaysShowControls && !t.paused) {
									t.startControlsTimer(t.options.controlsTimeoutMouseLeave);
								}
							}
						}
					}, 0);
				});

				setTimeout(function () {
					t.setPlayerSize(t.width, t.height);
					t.setControlsSize();
				}, 0);

				t.globalResizeCallback = function () {
					if (!(t.isFullScreen || _constants.HAS_TRUE_NATIVE_FULLSCREEN && _document2.default.webkitIsFullScreen)) {
						t.setPlayerSize(t.width, t.height);
					}

					t.setControlsSize();
				};

				t.globalBind('resize', t.globalResizeCallback);
			}

			if (autoplay && isNative) {
				t.play();
			}

			if (t.options.success) {
				if (typeof t.options.success === 'string') {
					_window2.default[t.options.success](t.media, t.domNode, t);
				} else {
					t.options.success(t.media, t.domNode, t);
				}
			}
		}
	}, {
		key: '_handleError',
		value: function _handleError(e, media, node) {
			var t = this,
			    play = t.getElement(t.layers).querySelector('.' + t.options.classPrefix + 'overlay-play');

			if (play) {
				play.style.display = 'none';
			}

			if (t.options.error) {
				t.options.error(e, media, node);
			}

			if (t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'cannotplay')) {
				t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'cannotplay').remove();
			}

			var errorContainer = _document2.default.createElement('div');
			errorContainer.className = t.options.classPrefix + 'cannotplay';
			errorContainer.style.width = '100%';
			errorContainer.style.height = '100%';

			var errorContent = typeof t.options.customError === 'function' ? t.options.customError(t.media, t.media.originalNode) : t.options.customError,
			    imgError = '';

			if (!errorContent) {
				var poster = t.media.originalNode.getAttribute('poster');
				if (poster) {
					imgError = '<img src="' + poster + '" alt="' + _mejs2.default.i18n.t('mejs.download-file') + '">';
				}

				if (e.message) {
					errorContent = '<p>' + e.message + '</p>';
				}

				if (e.urls) {
					for (var i = 0, total = e.urls.length; i < total; i++) {
						var url = e.urls[i];
						errorContent += '<a href="' + url.src + '" data-type="' + url.type + '"><span>' + _mejs2.default.i18n.t('mejs.download-file') + ': ' + url.src + '</span></a>';
					}
				}
			}

			if (errorContent && t.getElement(t.layers).querySelector('.' + t.options.classPrefix + 'overlay-error')) {
				errorContainer.innerHTML = errorContent;
				t.getElement(t.layers).querySelector('.' + t.options.classPrefix + 'overlay-error').innerHTML = '' + imgError + errorContainer.outerHTML;
				t.getElement(t.layers).querySelector('.' + t.options.classPrefix + 'overlay-error').parentNode.style.display = 'block';
			}

			if (t.controlsEnabled) {
				t.disableControls();
			}
		}
	}, {
		key: 'setPlayerSize',
		value: function setPlayerSize(width, height) {
			var t = this;

			if (!t.options.setDimensions) {
				return false;
			}

			if (typeof width !== 'undefined') {
				t.width = width;
			}

			if (typeof height !== 'undefined') {
				t.height = height;
			}

			switch (t.options.stretching) {
				case 'fill':
					if (t.isVideo) {
						t.setFillMode();
					} else {
						t.setDimensions(t.width, t.height);
					}
					break;
				case 'responsive':
					t.setResponsiveMode();
					break;
				case 'none':
					t.setDimensions(t.width, t.height);
					break;

				default:
					if (t.hasFluidMode() === true) {
						t.setResponsiveMode();
					} else {
						t.setDimensions(t.width, t.height);
					}
					break;
			}
		}
	}, {
		key: 'hasFluidMode',
		value: function hasFluidMode() {
			var t = this;

			return t.height.toString().indexOf('%') !== -1 || t.node && t.node.style.maxWidth && t.node.style.maxWidth !== 'none' && t.node.style.maxWidth !== t.width || t.node && t.node.currentStyle && t.node.currentStyle.maxWidth === '100%';
		}
	}, {
		key: 'setResponsiveMode',
		value: function setResponsiveMode() {
			var t = this,
			    parent = function () {

				var parentEl = void 0,
				    el = t.getElement(t.container);

				while (el) {
					try {
						if (_constants.IS_FIREFOX && el.tagName.toLowerCase() === 'html' && _window2.default.self !== _window2.default.top && _window2.default.frameElement !== null) {
							return _window2.default.frameElement;
						} else {
							parentEl = el.parentElement;
						}
					} catch (e) {
						parentEl = el.parentElement;
					}

					if (parentEl && dom.visible(parentEl)) {
						return parentEl;
					}
					el = parentEl;
				}

				return null;
			}(),
			    parentStyles = parent ? getComputedStyle(parent, null) : getComputedStyle(_document2.default.body, null),
			    nativeWidth = function () {
				if (t.isVideo) {
					if (t.node.videoWidth && t.node.videoWidth > 0) {
						return t.node.videoWidth;
					} else if (t.node.getAttribute('width')) {
						return t.node.getAttribute('width');
					} else {
						return t.options.defaultVideoWidth;
					}
				} else {
					return t.options.defaultAudioWidth;
				}
			}(),
			    nativeHeight = function () {
				if (t.isVideo) {
					if (t.node.videoHeight && t.node.videoHeight > 0) {
						return t.node.videoHeight;
					} else if (t.node.getAttribute('height')) {
						return t.node.getAttribute('height');
					} else {
						return t.options.defaultVideoHeight;
					}
				} else {
					return t.options.defaultAudioHeight;
				}
			}(),
			    aspectRatio = function () {
				var ratio = 1;
				if (!t.isVideo) {
					return ratio;
				}

				if (t.node.videoWidth && t.node.videoWidth > 0 && t.node.videoHeight && t.node.videoHeight > 0) {
					ratio = t.height >= t.width ? t.node.videoWidth / t.node.videoHeight : t.node.videoHeight / t.node.videoWidth;
				} else {
					ratio = t.initialAspectRatio;
				}

				if (isNaN(ratio) || ratio < 0.01 || ratio > 100) {
					ratio = 1;
				}

				return ratio;
			}(),
			    parentHeight = parseFloat(parentStyles.height);

			var newHeight = void 0,
			    parentWidth = parseFloat(parentStyles.width);

			if (t.isVideo) {
				if (t.height === '100%') {
					newHeight = parseFloat(parentWidth * nativeHeight / nativeWidth, 10);
				} else {
					newHeight = t.height >= t.width ? parseFloat(parentWidth / aspectRatio, 10) : parseFloat(parentWidth * aspectRatio, 10);
				}
			} else {
				newHeight = nativeHeight;
			}

			if (isNaN(newHeight)) {
				newHeight = parentHeight;
			}

			if (t.getElement(t.container).parentNode.length > 0 && t.getElement(t.container).parentNode.tagName.toLowerCase() === 'body') {
				parentWidth = _window2.default.innerWidth || _document2.default.documentElement.clientWidth || _document2.default.body.clientWidth;
				newHeight = _window2.default.innerHeight || _document2.default.documentElement.clientHeight || _document2.default.body.clientHeight;
			}

			if (newHeight && parentWidth) {
				t.getElement(t.container).style.width = parentWidth + 'px';
				t.getElement(t.container).style.height = newHeight + 'px';

				t.node.style.width = '100%';
				t.node.style.height = '100%';

				if (t.isVideo && t.media.setSize) {
					t.media.setSize(parentWidth, newHeight);
				}

				var layerChildren = t.getElement(t.layers).children;
				for (var i = 0, total = layerChildren.length; i < total; i++) {
					layerChildren[i].style.width = '100%';
					layerChildren[i].style.height = '100%';
				}
			}
		}
	}, {
		key: 'setFillMode',
		value: function setFillMode() {
			var t = this;
			var isIframe = _window2.default.self !== _window2.default.top && _window2.default.frameElement !== null;
			var parent = function () {
				var parentEl = void 0,
				    el = t.getElement(t.container);

				while (el) {
					try {
						if (_constants.IS_FIREFOX && el.tagName.toLowerCase() === 'html' && _window2.default.self !== _window2.default.top && _window2.default.frameElement !== null) {
							return _window2.default.frameElement;
						} else {
							parentEl = el.parentElement;
						}
					} catch (e) {
						parentEl = el.parentElement;
					}

					if (parentEl && dom.visible(parentEl)) {
						return parentEl;
					}
					el = parentEl;
				}

				return null;
			}();
			var parentStyles = parent ? getComputedStyle(parent, null) : getComputedStyle(_document2.default.body, null);

			if (t.node.style.height !== 'none' && t.node.style.height !== t.height) {
				t.node.style.height = 'auto';
			}
			if (t.node.style.maxWidth !== 'none' && t.node.style.maxWidth !== t.width) {
				t.node.style.maxWidth = 'none';
			}

			if (t.node.style.maxHeight !== 'none' && t.node.style.maxHeight !== t.height) {
				t.node.style.maxHeight = 'none';
			}

			if (t.node.currentStyle) {
				if (t.node.currentStyle.height === '100%') {
					t.node.currentStyle.height = 'auto';
				}
				if (t.node.currentStyle.maxWidth === '100%') {
					t.node.currentStyle.maxWidth = 'none';
				}
				if (t.node.currentStyle.maxHeight === '100%') {
					t.node.currentStyle.maxHeight = 'none';
				}
			}

			if (!isIframe && !parseFloat(parentStyles.width)) {
				parent.style.width = t.media.offsetWidth + 'px';
			}

			if (!isIframe && !parseFloat(parentStyles.height)) {
				parent.style.height = t.media.offsetHeight + 'px';
			}

			parentStyles = getComputedStyle(parent);

			var parentWidth = parseFloat(parentStyles.width),
			    parentHeight = parseFloat(parentStyles.height);

			t.setDimensions('100%', '100%');

			var poster = t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'poster>img');
			if (poster) {
				poster.style.display = '';
			}

			var targetElement = t.getElement(t.container).querySelectorAll('object, embed, iframe, video'),
			    initHeight = t.height,
			    initWidth = t.width,
			    scaleX1 = parentWidth,
			    scaleY1 = initHeight * parentWidth / initWidth,
			    scaleX2 = initWidth * parentHeight / initHeight,
			    scaleY2 = parentHeight,
			    bScaleOnWidth = scaleX2 > parentWidth === false,
			    finalWidth = bScaleOnWidth ? Math.floor(scaleX1) : Math.floor(scaleX2),
			    finalHeight = bScaleOnWidth ? Math.floor(scaleY1) : Math.floor(scaleY2),
			    width = bScaleOnWidth ? parentWidth + 'px' : finalWidth + 'px',
			    height = bScaleOnWidth ? finalHeight + 'px' : parentHeight + 'px';

			for (var i = 0, total = targetElement.length; i < total; i++) {
				targetElement[i].style.height = height;
				targetElement[i].style.width = width;
				if (t.media.setSize) {
					t.media.setSize(width, height);
				}

				targetElement[i].style.marginLeft = Math.floor((parentWidth - finalWidth) / 2) + 'px';
				targetElement[i].style.marginTop = 0;
			}
		}
	}, {
		key: 'setDimensions',
		value: function setDimensions(width, height) {
			var t = this;

			width = (0, _general.isString)(width) && width.indexOf('%') > -1 ? width : parseFloat(width) + 'px';
			height = (0, _general.isString)(height) && height.indexOf('%') > -1 ? height : parseFloat(height) + 'px';

			t.getElement(t.container).style.width = width;
			t.getElement(t.container).style.height = height;

			var layers = t.getElement(t.layers).children;
			for (var i = 0, total = layers.length; i < total; i++) {
				layers[i].style.width = width;
				layers[i].style.height = height;
			}
		}
	}, {
		key: 'setControlsSize',
		value: function setControlsSize() {
			var t = this;

			if (!dom.visible(t.getElement(t.container))) {
				return;
			}

			if (t.rail && dom.visible(t.rail)) {
				var totalStyles = t.total ? getComputedStyle(t.total, null) : null,
				    totalMargin = totalStyles ? parseFloat(totalStyles.marginLeft) + parseFloat(totalStyles.marginRight) : 0,
				    railStyles = getComputedStyle(t.rail),
				    railMargin = parseFloat(railStyles.marginLeft) + parseFloat(railStyles.marginRight);

				var siblingsWidth = 0;

				var siblings = dom.siblings(t.rail, function (el) {
					return el !== t.rail;
				}),
				    total = siblings.length;
				for (var i = 0; i < total; i++) {
					siblingsWidth += siblings[i].offsetWidth;
				}

				siblingsWidth += totalMargin + (totalMargin === 0 ? railMargin * 2 : railMargin) + 1;

				t.getElement(t.container).style.minWidth = siblingsWidth + 'px';

				var event = (0, _general.createEvent)('controlsresize', t.getElement(t.container));
				t.getElement(t.container).dispatchEvent(event);
			} else {
				var children = t.getElement(t.controls).children;
				var minWidth = 0;

				for (var _i = 0, _total = children.length; _i < _total; _i++) {
					minWidth += children[_i].offsetWidth;
				}

				t.getElement(t.container).style.minWidth = minWidth + 'px';
			}
		}
	}, {
		key: 'addControlElement',
		value: function addControlElement(element, key) {

			var t = this;

			if (t.featurePosition[key] !== undefined) {
				var child = t.getElement(t.controls).children[t.featurePosition[key] - 1];
				child.parentNode.insertBefore(element, child.nextSibling);
			} else {
				t.getElement(t.controls).appendChild(element);
				var children = t.getElement(t.controls).children;
				for (var i = 0, total = children.length; i < total; i++) {
					if (element === children[i]) {
						t.featurePosition[key] = i;
						break;
					}
				}
			}
		}
	}, {
		key: 'createIframeLayer',
		value: function createIframeLayer() {
			var t = this;

			if (t.isVideo && t.media.rendererName !== null && t.media.rendererName.indexOf('iframe') > -1 && !_document2.default.getElementById(t.media.id + '-iframe-overlay')) {

				var layer = _document2.default.createElement('div'),
				    target = _document2.default.getElementById(t.media.id + '_' + t.media.rendererName);

				layer.id = t.media.id + '-iframe-overlay';
				layer.className = t.options.classPrefix + 'iframe-overlay';
				layer.addEventListener('click', function (e) {
					if (t.options.clickToPlayPause) {
						if (t.paused) {
							t.play();
              $('.videoPlayer')[0].style.cursor = 'none';
						} else {
							t.pause();
						}

						e.preventDefault();
						e.stopPropagation();
					}
				});

				target.parentNode.insertBefore(layer, target);
			}
		}
	}, {
		key: 'resetSize',
		value: function resetSize() {
			var t = this;

			setTimeout(function () {
				t.setPlayerSize(t.width, t.height);
				t.setControlsSize();
			}, 50);
		}
	}, {
		key: 'setPoster',
		value: function setPoster(url) {
			var t = this;

			if (t.getElement(t.container)) {
				var posterDiv = t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'poster');

				if (!posterDiv) {
					posterDiv = _document2.default.createElement('div');
					posterDiv.className = t.options.classPrefix + 'poster ' + t.options.classPrefix + 'layer';
					t.getElement(t.layers).appendChild(posterDiv);
				}

				var posterImg = posterDiv.querySelector('img');

				if (!posterImg && url) {
					posterImg = _document2.default.createElement('img');
					posterImg.className = t.options.classPrefix + 'poster-img';
					posterImg.width = '100%';
					posterImg.height = '100%';
					posterDiv.style.display = '';
					posterDiv.appendChild(posterImg);
				}

				if (url) {
					posterImg.setAttribute('src', url);
					posterDiv.style.backgroundImage = 'url("' + url + '")';
					posterDiv.style.display = '';
				} else if (posterImg) {
					posterDiv.style.backgroundImage = 'none';
					posterDiv.style.display = 'none';
					posterImg.remove();
				} else {
					posterDiv.style.display = 'none';
				}
			} else if (_constants.IS_IPAD && t.options.iPadUseNativeControls || _constants.IS_IPHONE && t.options.iPhoneUseNativeControls || _constants.IS_ANDROID && t.options.AndroidUseNativeControls) {
				t.media.originalNode.poster = url;
			}
		}
	}, {
		key: 'changeSkin',
		value: function changeSkin(className) {
			var t = this;

			t.getElement(t.container).className = t.options.classPrefix + 'container ' + className;
			t.setPlayerSize(t.width, t.height);
			t.setControlsSize();
		}
	}, {
		key: 'globalBind',
		value: function globalBind(events, callback) {
			var t = this,
			    doc = t.node ? t.node.ownerDocument : _document2.default;

			events = (0, _general.splitEvents)(events, t.id);
			if (events.d) {
				var eventList = events.d.split(' ');
				for (var i = 0, total = eventList.length; i < total; i++) {
					eventList[i].split('.').reduce(function (part, e) {
						doc.addEventListener(e, callback, false);
						return e;
					}, '');
				}
			}
			if (events.w) {
				var _eventList = events.w.split(' ');
				for (var _i2 = 0, _total2 = _eventList.length; _i2 < _total2; _i2++) {
					_eventList[_i2].split('.').reduce(function (part, e) {
						_window2.default.addEventListener(e, callback, false);
						return e;
					}, '');
				}
			}
		}
	}, {
		key: 'globalUnbind',
		value: function globalUnbind(events, callback) {
			var t = this,
			    doc = t.node ? t.node.ownerDocument : _document2.default;

			events = (0, _general.splitEvents)(events, t.id);
			if (events.d) {
				var eventList = events.d.split(' ');
				for (var i = 0, total = eventList.length; i < total; i++) {
					eventList[i].split('.').reduce(function (part, e) {
						doc.removeEventListener(e, callback, false);
						return e;
					}, '');
				}
			}
			if (events.w) {
				var _eventList2 = events.w.split(' ');
				for (var _i3 = 0, _total3 = _eventList2.length; _i3 < _total3; _i3++) {
					_eventList2[_i3].split('.').reduce(function (part, e) {
						_window2.default.removeEventListener(e, callback, false);
						return e;
					}, '');
				}
			}
		}
	}, {
		key: 'buildfeatures',
		value: function buildfeatures(player, controls, layers, media) {
			var t = this;

			for (var i = 0, total = t.options.features.length; i < total; i++) {
				var feature = t.options.features[i];
				if (t['build' + feature]) {
					try {
						t['build' + feature](player, controls, layers, media);
					} catch (e) {
						console.error('error building ' + feature, e);
					}
				}
			}
		}
	}, {
		key: 'buildposter',
		value: function buildposter(player, controls, layers, media) {
			var t = this,
			    poster = _document2.default.createElement('div');

			poster.className = t.options.classPrefix + 'poster ' + t.options.classPrefix + 'layer';
			layers.appendChild(poster);

			var posterUrl = media.originalNode.getAttribute('poster');

			if (player.options.poster !== '') {
				if (posterUrl && _constants.IS_IOS) {
					media.originalNode.removeAttribute('poster');
				}
				posterUrl = player.options.poster;
			}

			if (posterUrl) {
				t.setPoster(posterUrl);
			} else if (t.media.renderer !== null && typeof t.media.renderer.getPosterUrl === 'function') {
				t.setPoster(t.media.renderer.getPosterUrl());
			} else {
				poster.style.display = 'none';
			}

			media.addEventListener('play', function () {
				poster.style.display = 'none';
			});

			media.addEventListener('playing', function () {
				poster.style.display = 'none';
			});

			if (player.options.showPosterWhenEnded && player.options.autoRewind) {
				media.addEventListener('ended', function () {
					poster.style.display = '';
				});
			}

			media.addEventListener('error', function () {
				poster.style.display = 'none';
			});

			if (player.options.showPosterWhenPaused) {
				media.addEventListener('pause', function () {
					if (!player.ended) {
						poster.style.display = '';
					}
				});
			}
		}
	}, {
		key: 'buildoverlays',
		value: function buildoverlays(player, controls, layers, media) {

			if (!player.isVideo) {
				return;
			}

			var t = this,
			    loading = _document2.default.createElement('div'),
			    error = _document2.default.createElement('div'),
			    bigPlay = _document2.default.createElement('div');

			loading.style.display = 'none';
			loading.className = t.options.classPrefix + 'overlay ' + t.options.classPrefix + 'layer';
			loading.innerHTML = '<div class="' + t.options.classPrefix + 'overlay-loading">' + ('<span class="' + t.options.classPrefix + 'overlay-loading-bg-img"></span>') + '</div>';
			layers.appendChild(loading);

			error.style.display = 'none';
			error.className = t.options.classPrefix + 'overlay ' + t.options.classPrefix + 'layer';
			error.innerHTML = '<div class="' + t.options.classPrefix + 'overlay-error"></div>';
			layers.appendChild(error);

			bigPlay.className = t.options.classPrefix + 'overlay ' + t.options.classPrefix + 'layer ' + t.options.classPrefix + 'overlay-play';
			bigPlay.innerHTML = '<div class="' + t.options.classPrefix + 'overlay-button" role="button" tabindex="0" ' + ('aria-label="' + _i18n2.default.t('mejs.play') + '" aria-pressed="false"></div>');
			bigPlay.addEventListener('click', function () {
				if (t.options.clickToPlayPause) {

					var button = t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'overlay-button'),
					    pressed = button.getAttribute('aria-pressed');

					if (t.paused) {
						t.play();
            $('.videoPlayer')[0].style.cursor = 'none';
					} else {
						t.pause();
					}

					button.setAttribute('aria-pressed', !!pressed);
					t.getElement(t.container).focus();
				}
			});

			bigPlay.addEventListener('keydown', function (e) {
				var keyPressed = e.keyCode || e.which || 0;

				if (keyPressed === 13 || _constants.IS_FIREFOX && keyPressed === 32) {
					var event = (0, _general.createEvent)('click', bigPlay);
					bigPlay.dispatchEvent(event);
					return false;
				}
			});

			layers.appendChild(bigPlay);

			if (t.media.rendererName !== null && (/(youtube|facebook)/i.test(t.media.rendererName) && !(t.media.originalNode.getAttribute('poster') || player.options.poster || typeof t.media.renderer.getPosterUrl === 'function' && t.media.renderer.getPosterUrl()) || _constants.IS_STOCK_ANDROID || t.media.originalNode.getAttribute('autoplay'))) {
				bigPlay.style.display = 'none';
			}

			var hasError = false;

			media.addEventListener('play', function () {
				bigPlay.style.display = 'none';
				loading.style.display = 'none';
				error.style.display = 'none';
				hasError = false;
			});
			media.addEventListener('playing', function () {
				bigPlay.style.display = 'none';
				loading.style.display = 'none';
				error.style.display = 'none';
				hasError = false;
			});
			media.addEventListener('seeking', function () {
				bigPlay.style.display = 'none';
				loading.style.display = '';
				hasError = false;
			});
			media.addEventListener('seeked', function () {
				bigPlay.style.display = t.paused && !_constants.IS_STOCK_ANDROID ? '' : 'none';
				loading.style.display = 'none';
				hasError = false;
			});
			media.addEventListener('pause', function () {
				loading.style.display = 'none';
				if (!_constants.IS_STOCK_ANDROID && !hasError) {
					bigPlay.style.display = '';
				}
				hasError = false;
			});
			media.addEventListener('waiting', function () {
				loading.style.display = '';
				hasError = false;
			});

			media.addEventListener('loadeddata', function () {
				loading.style.display = '';

				if (_constants.IS_ANDROID) {
					media.canplayTimeout = setTimeout(function () {
						if (_document2.default.createEvent) {
							var evt = _document2.default.createEvent('HTMLEvents');
							evt.initEvent('canplay', true, true);
							return media.dispatchEvent(evt);
						}
					}, 300);
				}
				hasError = false;
			});
			media.addEventListener('canplay', function () {
				loading.style.display = 'none';

				clearTimeout(media.canplayTimeout);
				hasError = false;
			});

			media.addEventListener('error', function (e) {
				t._handleError(e, t.media, t.node);
				loading.style.display = 'none';
				bigPlay.style.display = 'none';
				hasError = true;
			});

			media.addEventListener('loadedmetadata', function () {
				if (!t.controlsEnabled) {
					t.enableControls();
				}
			});

			media.addEventListener('keydown', function (e) {
				t.onkeydown(player, media, e);
				hasError = false;
			});
		}
	}, {
		key: 'buildkeyboard',
		value: function buildkeyboard(player, controls, layers, media) {

			var t = this;

			t.getElement(t.container).addEventListener('keydown', function () {
				t.keyboardAction = true;
			});

			t.globalKeydownCallback = function (event) {
				var container = _document2.default.activeElement.closest('.' + t.options.classPrefix + 'container'),
				    target = t.media.closest('.' + t.options.classPrefix + 'container');
				t.hasFocus = !!(container && target && container.id === target.id);
				return t.onkeydown(player, media, event);
			};

			t.globalClickCallback = function (event) {
				t.hasFocus = !!event.target.closest('.' + t.options.classPrefix + 'container');
			};

			t.globalBind('keydown', t.globalKeydownCallback);

			t.globalBind('click', t.globalClickCallback);
		}
	}, {
		key: 'onkeydown',
		value: function onkeydown(player, media, e) {

			if (player.hasFocus && player.options.enableKeyboard) {
				for (var i = 0, total = player.options.keyActions.length; i < total; i++) {
					var keyAction = player.options.keyActions[i];

					for (var j = 0, jl = keyAction.keys.length; j < jl; j++) {
						if (e.keyCode === keyAction.keys[j]) {
							keyAction.action(player, media, e.keyCode, e);
							e.preventDefault();
							e.stopPropagation();
							return;
						}
					}
				}
			}

			return true;
		}
	}, {
		key: 'play',
		value: function play() {
			this.proxy.play();
		}
	}, {
		key: 'pause',
		value: function pause() {
			this.proxy.pause();
		}
	}, {
		key: 'load',
		value: function load() {
			this.proxy.load();
		}
	}, {
		key: 'setCurrentTime',
		value: function setCurrentTime(time) {
			this.proxy.setCurrentTime(time);
		}
	}, {
		key: 'getCurrentTime',
		value: function getCurrentTime() {
			return this.proxy.currentTime;
		}
	}, {
		key: 'getDuration',
		value: function getDuration() {
			return this.proxy.duration;
		}
	}, {
		key: 'setVolume',
		value: function setVolume(volume) {
			this.proxy.volume = volume;
		}
	}, {
		key: 'getVolume',
		value: function getVolume() {
			return this.proxy.getVolume();
		}
	}, {
		key: 'setMuted',
		value: function setMuted(value) {
			this.proxy.setMuted(value);
		}
	}, {
		key: 'setSrc',
		value: function setSrc(src) {
			if (!this.controlsEnabled) {
				this.enableControls();
			}
			this.proxy.setSrc(src);
		}
	}, {
		key: 'getSrc',
		value: function getSrc() {
			return this.proxy.getSrc();
		}
	}, {
		key: 'canPlayType',
		value: function canPlayType(type) {
			return this.proxy.canPlayType(type);
		}
	}, {
		key: 'remove',
		value: function remove() {
			var t = this,
			    rendererName = t.media.rendererName,
			    src = t.media.originalNode.src;

			for (var featureIndex in t.options.features) {
				var feature = t.options.features[featureIndex];
				if (t['clean' + feature]) {
					try {
						t['clean' + feature](t, t.getElement(t.layers), t.getElement(t.controls), t.media);
					} catch (e) {
						console.error('error cleaning ' + feature, e);
					}
				}
			}

			var nativeWidth = t.node.getAttribute('width'),
			    nativeHeight = t.node.getAttribute('height');

			if (nativeWidth) {
				if (nativeWidth.indexOf('%') === -1) {
					nativeWidth = nativeWidth + 'px';
				}
			} else {
				nativeWidth = 'auto';
			}

			if (nativeHeight) {
				if (nativeHeight.indexOf('%') === -1) {
					nativeHeight = nativeHeight + 'px';
				}
			} else {
				nativeHeight = 'auto';
			}

			t.node.style.width = nativeWidth;
			t.node.style.height = nativeHeight;

			t.setPlayerSize(0, 0);

			if (!t.isDynamic) {
				(function () {
					t.node.setAttribute('controls', true);
					t.node.setAttribute('id', t.node.getAttribute('id').replace('_' + rendererName, '').replace('_from_mejs', ''));
					var poster = t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'poster>img');
					if (poster) {
						t.node.setAttribute('poster', poster.src);
					}

					delete t.node.autoplay;

					t.node.setAttribute('src', '');
					if (t.media.canPlayType((0, _media.getTypeFromFile)(src)) !== '') {
						t.node.setAttribute('src', src);
					}

					if (rendererName && rendererName.indexOf('iframe') > -1) {
						var layer = _document2.default.getElementById(t.media.id + '-iframe-overlay');
						layer.remove();
					}

					var node = t.node.cloneNode();
					node.style.display = '';
					t.getElement(t.container).parentNode.insertBefore(node, t.getElement(t.container));
					t.node.remove();

					if (t.mediaFiles) {
						for (var i = 0, total = t.mediaFiles.length; i < total; i++) {
							var source = _document2.default.createElement('source');
							source.setAttribute('src', t.mediaFiles[i].src);
							source.setAttribute('type', t.mediaFiles[i].type);
							node.appendChild(source);
						}
					}
					if (t.trackFiles) {
						var _loop3 = function _loop3(_i4, _total4) {
							var track = t.trackFiles[_i4];
							var newTrack = _document2.default.createElement('track');
							newTrack.kind = track.kind;
							newTrack.label = track.label;
							newTrack.srclang = track.srclang;
							newTrack.src = track.src;

							node.appendChild(newTrack);
							newTrack.addEventListener('load', function () {
								this.mode = 'showing';
								node.textTracks[_i4].mode = 'showing';
							});
						};

						for (var _i4 = 0, _total4 = t.trackFiles.length; _i4 < _total4; _i4++) {
							_loop3(_i4, _total4);
						}
					}

					delete t.node;
					delete t.mediaFiles;
					delete t.trackFiles;
				})();
			} else {
				t.getElement(t.container).parentNode.insertBefore(t.node, t.getElement(t.container));
			}

			if (t.media.renderer && typeof t.media.renderer.destroy === 'function') {
				t.media.renderer.destroy();
			}

			delete _mejs2.default.players[t.id];

			if (_typeof(t.getElement(t.container)) === 'object') {
				var offscreen = t.getElement(t.container).parentNode.querySelector('.' + t.options.classPrefix + 'offscreen');
				offscreen.remove();
				t.getElement(t.container).remove();
			}
			t.globalUnbind('resize', t.globalResizeCallback);
			t.globalUnbind('keydown', t.globalKeydownCallback);
			t.globalUnbind('click', t.globalClickCallback);

			delete t.media.player;
		}
	}, {
		key: 'paused',
		get: function get() {
			return this.proxy.paused;
		}
	}, {
		key: 'muted',
		get: function get() {
			return this.proxy.muted;
		},
		set: function set(muted) {
			this.setMuted(muted);
		}
	}, {
		key: 'ended',
		get: function get() {
			return this.proxy.ended;
		}
	}, {
		key: 'readyState',
		get: function get() {
			return this.proxy.readyState;
		}
	}, {
		key: 'currentTime',
		set: function set(time) {
			this.setCurrentTime(time);
		},
		get: function get() {
			return this.getCurrentTime();
		}
	}, {
		key: 'duration',
		get: function get() {
			return this.getDuration();
		}
	}, {
		key: 'volume',
		set: function set(volume) {
			this.setVolume(volume);
		},
		get: function get() {
			return this.getVolume();
		}
	}, {
		key: 'src',
		set: function set(src) {
			this.setSrc(src);
		},
		get: function get() {
			return this.getSrc();
		}
	}]);

	return MediaElementPlayer;
}();

_window2.default.MediaElementPlayer = MediaElementPlayer;
_mejs2.default.MediaElementPlayer = MediaElementPlayer;

exports.default = MediaElementPlayer;

},{"17":17,"2":2,"25":25,"26":26,"27":27,"28":28,"3":3,"30":30,"5":5,"6":6,"7":7}],17:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _window = _dereq_(3);

var _window2 = _interopRequireDefault(_window);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DefaultPlayer = function () {
	function DefaultPlayer(player) {
		_classCallCheck(this, DefaultPlayer);

		this.media = player.media;
		this.isVideo = player.isVideo;
		this.classPrefix = player.options.classPrefix;
		this.createIframeLayer = function () {
			return player.createIframeLayer();
		};
		this.setPoster = function (url) {
			return player.setPoster(url);
		};
		return this;
	}

	_createClass(DefaultPlayer, [{
		key: 'play',
		value: function play() {
			this.media.play();
		}
	}, {
		key: 'pause',
		value: function pause() {
			this.media.pause();
		}
	}, {
		key: 'load',
		value: function load() {
			var t = this;

			if (!t.isLoaded) {
				t.media.load();
			}

			t.isLoaded = true;
		}
	}, {
		key: 'setCurrentTime',
		value: function setCurrentTime(time) {
			this.media.setCurrentTime(time);
		}
	}, {
		key: 'getCurrentTime',
		value: function getCurrentTime() {
			return this.media.currentTime;
		}
	}, {
		key: 'getDuration',
		value: function getDuration() {
			return this.media.getDuration();
		}
	}, {
		key: 'setVolume',
		value: function setVolume(volume) {
			this.media.setVolume(volume);
		}
	}, {
		key: 'getVolume',
		value: function getVolume() {
			return this.media.getVolume();
		}
	}, {
		key: 'setMuted',
		value: function setMuted(value) {
			this.media.setMuted(value);
		}
	}, {
		key: 'setSrc',
		value: function setSrc(src) {
			var t = this,
			    layer = document.getElementById(t.media.id + '-iframe-overlay');

			if (layer) {
				layer.remove();
			}

			t.media.setSrc(src);
			t.createIframeLayer();
			if (t.media.renderer !== null && typeof t.media.renderer.getPosterUrl === 'function') {
				t.setPoster(t.media.renderer.getPosterUrl());
			}
		}
	}, {
		key: 'getSrc',
		value: function getSrc() {
			return this.media.getSrc();
		}
	}, {
		key: 'canPlayType',
		value: function canPlayType(type) {
			return this.media.canPlayType(type);
		}
	}, {
		key: 'paused',
		get: function get() {
			return this.media.paused;
		}
	}, {
		key: 'muted',
		set: function set(muted) {
			this.setMuted(muted);
		},
		get: function get() {
			return this.media.muted;
		}
	}, {
		key: 'ended',
		get: function get() {
			return this.media.ended;
		}
	}, {
		key: 'readyState',
		get: function get() {
			return this.media.readyState;
		}
	}, {
		key: 'currentTime',
		set: function set(time) {
			this.setCurrentTime(time);
		},
		get: function get() {
			return this.getCurrentTime();
		}
	}, {
		key: 'duration',
		get: function get() {
			return this.getDuration();
		}
	}, {
		key: 'remainingTime',
		get: function get() {
			return this.getDuration() - this.currentTime();
		}
	}, {
		key: 'volume',
		set: function set(volume) {
			this.setVolume(volume);
		},
		get: function get() {
			return this.getVolume();
		}
	}, {
		key: 'src',
		set: function set(src) {
			this.setSrc(src);
		},
		get: function get() {
			return this.getSrc();
		}
	}]);

	return DefaultPlayer;
}();

exports.default = DefaultPlayer;


_window2.default.DefaultPlayer = DefaultPlayer;

},{"3":3}],18:[function(_dereq_,module,exports){
'use strict';

var _window = _dereq_(3);

var _window2 = _interopRequireDefault(_window);

var _mejs = _dereq_(7);

var _mejs2 = _interopRequireDefault(_mejs);

var _player = _dereq_(16);

var _player2 = _interopRequireDefault(_player);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

if (typeof jQuery !== 'undefined') {
	_mejs2.default.$ = _window2.default.jQuery = _window2.default.$ = jQuery;
} else if (typeof Zepto !== 'undefined') {
	_mejs2.default.$ = _window2.default.Zepto = _window2.default.$ = Zepto;
} else if (typeof ender !== 'undefined') {
	_mejs2.default.$ = _window2.default.ender = _window2.default.$ = ender;
}

(function ($) {
	if (typeof $ !== 'undefined') {
		$.fn.mediaelementplayer = function (options) {
			if (options === false) {
				this.each(function () {
					var player = $(this).data('mediaelementplayer');
					if (player) {
						player.remove();
					}
					$(this).removeData('mediaelementplayer');
				});
			} else {
				this.each(function () {
					$(this).data('mediaelementplayer', new _player2.default(this, options));
				});
			}
			return this;
		};

		$(document).ready(function () {
			$('.' + _mejs2.default.MepDefaults.classPrefix + 'player').mediaelementplayer();
		});
	}
})(_mejs2.default.$);

},{"16":16,"3":3,"7":7}],19:[function(_dereq_,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _window = _dereq_(3);

var _window2 = _interopRequireDefault(_window);

var _mejs = _dereq_(7);

var _mejs2 = _interopRequireDefault(_mejs);

var _renderer = _dereq_(8);

var _general = _dereq_(27);

var _media = _dereq_(28);

var _constants = _dereq_(25);

var _dom = _dereq_(26);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var NativeDash = {

	promise: null,

	load: function load(settings) {
		if (typeof dashjs !== 'undefined') {
			NativeDash.promise = new Promise(function (resolve) {
				resolve();
			}).then(function () {
				NativeDash._createPlayer(settings);
			});
		} else {
			settings.options.path = typeof settings.options.path === 'string' ? settings.options.path : __dirname + '/js/dash.all.min.js';

			NativeDash.promise = NativeDash.promise || (0, _dom.loadScript)(settings.options.path);
			NativeDash.promise.then(function () {
				NativeDash._createPlayer(settings);
			});
		}

		return NativeDash.promise;
	},

	_createPlayer: function _createPlayer(settings) {
		var player = dashjs.MediaPlayer().create();
		_window2.default['__ready__' + settings.id](player);
		return player;
	}
};

var DashNativeRenderer = {
	name: 'native_dash',
	options: {
		prefix: 'native_dash',
		dash: {
			path: __dirname + '/js/dash.all.min.js',
			debug: false,
			drm: {},

			robustnessLevel: ''
		}
	},

	canPlayType: function canPlayType(type) {
		return _constants.HAS_MSE && ['application/dash+xml'].indexOf(type.toLowerCase()) > -1;
	},

	create: function create(mediaElement, options, mediaFiles) {

		var originalNode = mediaElement.originalNode,
		    id = mediaElement.id + '_' + options.prefix,
		    autoplay = originalNode.autoplay,
		    children = originalNode.children;

		var node = null,
		    dashPlayer = null;

		originalNode.removeAttribute('type');
		for (var i = 0, total = children.length; i < total; i++) {
			children[i].removeAttribute('type');
		}

		node = originalNode.cloneNode(true);
		options = Object.assign(options, mediaElement.options);

		var props = _mejs2.default.html5media.properties,
		    events = _mejs2.default.html5media.events.concat(['click', 'mouseover', 'mouseout']).filter(function (e) {
			return e !== 'error';
		}),
		    attachNativeEvents = function attachNativeEvents(e) {
			var event = (0, _general.createEvent)(e.type, mediaElement);
			mediaElement.dispatchEvent(event);
		},
		    assignGettersSetters = function assignGettersSetters(propName) {
			var capName = '' + propName.substring(0, 1).toUpperCase() + propName.substring(1);

			node['get' + capName] = function () {
				return dashPlayer !== null ? node[propName] : null;
			};

			node['set' + capName] = function (value) {
				if (_mejs2.default.html5media.readOnlyProperties.indexOf(propName) === -1) {
					if (propName === 'src') {
						var source = (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && value.src ? value.src : value;
						node[propName] = source;
						if (dashPlayer !== null) {
							dashPlayer.reset();
							for (var _i = 0, _total = events.length; _i < _total; _i++) {
								node.removeEventListener(events[_i], attachNativeEvents);
							}
							dashPlayer = NativeDash._createPlayer({
								options: options.dash,
								id: id
							});

							if (value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && _typeof(value.drm) === 'object') {
								dashPlayer.setProtectionData(value.drm);
								if ((0, _general.isString)(options.dash.robustnessLevel) && options.dash.robustnessLevel) {
									dashPlayer.getProtectionController().setRobustnessLevel(options.dash.robustnessLevel);
								}
							}
							dashPlayer.attachSource(source);
							if (autoplay) {
								dashPlayer.play();
							}
						}
					} else {
						node[propName] = value;
					}
				}
			};
		};

		for (var _i2 = 0, _total2 = props.length; _i2 < _total2; _i2++) {
			assignGettersSetters(props[_i2]);
		}

		_window2.default['__ready__' + id] = function (_dashPlayer) {
			mediaElement.dashPlayer = dashPlayer = _dashPlayer;

			var dashEvents = dashjs.MediaPlayer.events,
			    assignEvents = function assignEvents(eventName) {
				if (eventName === 'loadedmetadata') {
					dashPlayer.getDebug().setLogToBrowserConsole(options.dash.debug);
					dashPlayer.initialize();
					dashPlayer.setScheduleWhilePaused(false);
					dashPlayer.setFastSwitchEnabled(true);
					dashPlayer.attachView(node);
					dashPlayer.setAutoPlay(false);

					if (_typeof(options.dash.drm) === 'object' && !_mejs2.default.Utils.isObjectEmpty(options.dash.drm)) {
						dashPlayer.setProtectionData(options.dash.drm);
						if ((0, _general.isString)(options.dash.robustnessLevel) && options.dash.robustnessLevel) {
							dashPlayer.getProtectionController().setRobustnessLevel(options.dash.robustnessLevel);
						}
					}
					dashPlayer.attachSource(node.getSrc());
				}

				node.addEventListener(eventName, attachNativeEvents);
			};

			for (var _i3 = 0, _total3 = events.length; _i3 < _total3; _i3++) {
				assignEvents(events[_i3]);
			}

			var assignMdashEvents = function assignMdashEvents(e) {
				if (e.type.toLowerCase() === 'error') {
					mediaElement.generateError(e.message, node.src);
					console.error(e);
				} else {
					var _event = (0, _general.createEvent)(e.type, mediaElement);
					_event.data = e;
					mediaElement.dispatchEvent(_event);
				}
			};

			for (var eventType in dashEvents) {
				if (dashEvents.hasOwnProperty(eventType)) {
					dashPlayer.on(dashEvents[eventType], function (e) {
						return assignMdashEvents(e);
					});
				}
			}
		};

		if (mediaFiles && mediaFiles.length > 0) {
			for (var _i4 = 0, _total4 = mediaFiles.length; _i4 < _total4; _i4++) {
				if (_renderer.renderer.renderers[options.prefix].canPlayType(mediaFiles[_i4].type)) {
					node.setAttribute('src', mediaFiles[_i4].src);
					if (typeof mediaFiles[_i4].drm !== 'undefined') {
						options.dash.drm = mediaFiles[_i4].drm;
					}
					break;
				}
			}
		}

		node.setAttribute('id', id);

		originalNode.parentNode.insertBefore(node, originalNode);
		originalNode.autoplay = false;
		originalNode.style.display = 'none';

		node.setSize = function (width, height) {
			node.style.width = width + 'px';
			node.style.height = height + 'px';
			return node;
		};

		node.hide = function () {
			node.pause();
			node.style.display = 'none';
			return node;
		};

		node.show = function () {
			node.style.display = '';
			return node;
		};

		node.destroy = function () {
			if (dashPlayer !== null) {
				dashPlayer.reset();
			}
		};

		var event = (0, _general.createEvent)('rendererready', node);
		mediaElement.dispatchEvent(event);

		mediaElement.promises.push(NativeDash.load({
			options: options.dash,
			id: id
		}));

		return node;
	}
};

_media.typeChecks.push(function (url) {
	return ~url.toLowerCase().indexOf('.mpd') ? 'application/dash+xml' : null;
});

_renderer.renderer.add(DashNativeRenderer);

},{"25":25,"26":26,"27":27,"28":28,"3":3,"7":7,"8":8}],20:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.PluginDetector = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _window = _dereq_(3);

var _window2 = _interopRequireDefault(_window);

var _document = _dereq_(2);

var _document2 = _interopRequireDefault(_document);

var _mejs = _dereq_(7);

var _mejs2 = _interopRequireDefault(_mejs);

var _i18n = _dereq_(5);

var _i18n2 = _interopRequireDefault(_i18n);

var _renderer = _dereq_(8);

var _general = _dereq_(27);

var _constants = _dereq_(25);

var _media = _dereq_(28);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var PluginDetector = exports.PluginDetector = {
	plugins: [],

	hasPluginVersion: function hasPluginVersion(plugin, v) {
		var pv = PluginDetector.plugins[plugin];
		v[1] = v[1] || 0;
		v[2] = v[2] || 0;
		return pv[0] > v[0] || pv[0] === v[0] && pv[1] > v[1] || pv[0] === v[0] && pv[1] === v[1] && pv[2] >= v[2];
	},

	addPlugin: function addPlugin(p, pluginName, mimeType, activeX, axDetect) {
		PluginDetector.plugins[p] = PluginDetector.detectPlugin(pluginName, mimeType, activeX, axDetect);
	},

	detectPlugin: function detectPlugin(pluginName, mimeType, activeX, axDetect) {

		var version = [0, 0, 0],
		    description = void 0,
		    ax = void 0;

		if (_constants.NAV.plugins !== null && _constants.NAV.plugins !== undefined && _typeof(_constants.NAV.plugins[pluginName]) === 'object') {
			description = _constants.NAV.plugins[pluginName].description;
			if (description && !(typeof _constants.NAV.mimeTypes !== 'undefined' && _constants.NAV.mimeTypes[mimeType] && !_constants.NAV.mimeTypes[mimeType].enabledPlugin)) {
				version = description.replace(pluginName, '').replace(/^\s+/, '').replace(/\sr/gi, '.').split('.');
				for (var i = 0, total = version.length; i < total; i++) {
					version[i] = parseInt(version[i].match(/\d+/), 10);
				}
			}
		} else if (_window2.default.ActiveXObject !== undefined) {
			try {
				ax = new ActiveXObject(activeX);
				if (ax) {
					version = axDetect(ax);
				}
			} catch (e) {

			}
		}
		return version;
	}
};

PluginDetector.addPlugin('flash', 'Shockwave Flash', 'application/x-shockwave-flash', 'ShockwaveFlash.ShockwaveFlash', function (ax) {
	var version = [],
	    d = ax.GetVariable("$version");

	if (d) {
		d = d.split(" ")[1].split(",");
		version = [parseInt(d[0], 10), parseInt(d[1], 10), parseInt(d[2], 10)];
	}
	return version;
});

var FlashMediaElementRenderer = {
	create: function create(mediaElement, options, mediaFiles) {

		var flash = {};
		var isActive = false;

		flash.options = options;
		flash.id = mediaElement.id + '_' + flash.options.prefix;
		flash.mediaElement = mediaElement;
		flash.flashState = {};
		flash.flashApi = null;
		flash.flashApiStack = [];

		var props = _mejs2.default.html5media.properties,
		    assignGettersSetters = function assignGettersSetters(propName) {
			flash.flashState[propName] = null;

			var capName = '' + propName.substring(0, 1).toUpperCase() + propName.substring(1);

			flash['get' + capName] = function () {
				if (flash.flashApi !== null) {
					if (typeof flash.flashApi['get_' + propName] === 'function') {
						var value = flash.flashApi['get_' + propName]();

						if (propName === 'buffered') {
							return {
								start: function start() {
									return 0;
								},
								end: function end() {
									return value;
								},
								length: 1
							};
						}
						return value;
					} else {
						return null;
					}
				} else {
					return null;
				}
			};

			flash['set' + capName] = function (value) {
				if (propName === 'src') {
					value = (0, _media.absolutizeUrl)(value);
				}

				if (flash.flashApi !== null && flash.flashApi['set_' + propName] !== undefined) {
					try {
						flash.flashApi['set_' + propName](value);
					} catch (e) {

					}
				} else {
					flash.flashApiStack.push({
						type: 'set',
						propName: propName,
						value: value
					});
				}
			};
		};

		for (var i = 0, total = props.length; i < total; i++) {
			assignGettersSetters(props[i]);
		}

		var methods = _mejs2.default.html5media.methods,
		    assignMethods = function assignMethods(methodName) {
			flash[methodName] = function () {
				if (isActive) {
					if (flash.flashApi !== null) {
						if (flash.flashApi['fire_' + methodName]) {
							try {
								flash.flashApi['fire_' + methodName]();
							} catch (e) {

							}
						} else {

						}
					} else {
						flash.flashApiStack.push({
							type: 'call',
							methodName: methodName
						});
					}
				}
			};
		};
		methods.push('stop');
		for (var _i = 0, _total = methods.length; _i < _total; _i++) {
			assignMethods(methods[_i]);
		}

		var initEvents = ['rendererready'];

		for (var _i2 = 0, _total2 = initEvents.length; _i2 < _total2; _i2++) {
			var event = (0, _general.createEvent)(initEvents[_i2], flash);
			mediaElement.dispatchEvent(event);
		}

		_window2.default['__ready__' + flash.id] = function () {

			flash.flashReady = true;
			flash.flashApi = _document2.default.getElementById('__' + flash.id);

			if (flash.flashApiStack.length) {
				for (var _i3 = 0, _total3 = flash.flashApiStack.length; _i3 < _total3; _i3++) {
					var stackItem = flash.flashApiStack[_i3];

					if (stackItem.type === 'set') {
						var propName = stackItem.propName,
						    capName = '' + propName.substring(0, 1).toUpperCase() + propName.substring(1);

						flash['set' + capName](stackItem.value);
					} else if (stackItem.type === 'call') {
						flash[stackItem.methodName]();
					}
				}
			}
		};

		_window2.default['__event__' + flash.id] = function (eventName, message) {
			var event = (0, _general.createEvent)(eventName, flash);
			if (message) {
				try {
					event.data = JSON.parse(message);
					event.details.data = JSON.parse(message);
				} catch (e) {
					event.message = message;
				}
			}

			flash.mediaElement.dispatchEvent(event);
		};

		flash.flashWrapper = _document2.default.createElement('div');

		if (['always', 'sameDomain'].indexOf(flash.options.shimScriptAccess) === -1) {
			flash.options.shimScriptAccess = 'sameDomain';
		}

		var autoplay = mediaElement.originalNode.autoplay,
		    flashVars = ['uid=' + flash.id, 'autoplay=' + autoplay, 'allowScriptAccess=' + flash.options.shimScriptAccess, 'preload=' + (mediaElement.originalNode.getAttribute('preload') || '')],
		    isVideo = mediaElement.originalNode !== null && mediaElement.originalNode.tagName.toLowerCase() === 'video',
		    flashHeight = isVideo ? mediaElement.originalNode.height : 1,
		    flashWidth = isVideo ? mediaElement.originalNode.width : 1;

		if (mediaElement.originalNode.getAttribute('src')) {
			flashVars.push('src=' + mediaElement.originalNode.getAttribute('src'));
		}

		if (flash.options.enablePseudoStreaming === true) {
			flashVars.push('pseudostreamstart=' + flash.options.pseudoStreamingStartQueryParam);
			flashVars.push('pseudostreamtype=' + flash.options.pseudoStreamingType);
		}

		if (flash.options.streamDelimiter) {
			flashVars.push('streamdelimiter=' + encodeURIComponent(flash.options.streamDelimiter));
		}

		if (flash.options.proxyType) {
			flashVars.push('proxytype=' + flash.options.proxyType);
		}

		mediaElement.appendChild(flash.flashWrapper);
		mediaElement.originalNode.style.display = 'none';

		var settings = [];

		if (_constants.IS_IE || _constants.IS_EDGE) {
			var specialIEContainer = _document2.default.createElement('div');
			flash.flashWrapper.appendChild(specialIEContainer);

			if (_constants.IS_EDGE) {
				settings = ['type="application/x-shockwave-flash"', 'data="' + flash.options.pluginPath + flash.options.filename + '"', 'id="__' + flash.id + '"', 'width="' + flashWidth + '"', 'height="' + flashHeight + '\'"'];
			} else {
				settings = ['classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"', 'codebase="//download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab"', 'id="__' + flash.id + '"', 'width="' + flashWidth + '"', 'height="' + flashHeight + '"'];
			}

			if (!isVideo) {
				settings.push('style="clip: rect(0 0 0 0); position: absolute;"');
			}

			specialIEContainer.outerHTML = '<object ' + settings.join(' ') + '>' + ('<param name="movie" value="' + flash.options.pluginPath + flash.options.filename + '?x=' + new Date() + '" />') + ('<param name="flashvars" value="' + flashVars.join('&amp;') + '" />') + '<param name="quality" value="high" />' + '<param name="bgcolor" value="#000000" />' + '<param name="wmode" value="transparent" />' + ('<param name="allowScriptAccess" value="' + flash.options.shimScriptAccess + '" />') + '<param name="allowFullScreen" value="true" />' + ('<div>' + _i18n2.default.t('mejs.install-flash') + '</div>') + '</object>';
		} else {

			settings = ['id="__' + flash.id + '"', 'name="__' + flash.id + '"', 'play="true"', 'loop="false"', 'quality="high"', 'bgcolor="#000000"', 'wmode="transparent"', 'allowScriptAccess="' + flash.options.shimScriptAccess + '"', 'allowFullScreen="true"', 'type="application/x-shockwave-flash"', 'pluginspage="//www.macromedia.com/go/getflashplayer"', 'src="' + flash.options.pluginPath + flash.options.filename + '"', 'flashvars="' + flashVars.join('&') + '"'];

			if (isVideo) {
				settings.push('width="' + flashWidth + '"');
				settings.push('height="' + flashHeight + '"');
			} else {
				settings.push('style="position: fixed; left: -9999em; top: -9999em;"');
			}

			flash.flashWrapper.innerHTML = '<embed ' + settings.join(' ') + '>';
		}

		flash.flashNode = flash.flashWrapper.lastChild;

		flash.hide = function () {
			isActive = false;
			if (isVideo) {
				flash.flashNode.style.display = 'none';
			}
		};
		flash.show = function () {
			isActive = true;
			if (isVideo) {
				flash.flashNode.style.display = '';
			}
		};
		flash.setSize = function (width, height) {
			flash.flashNode.style.width = width + 'px';
			flash.flashNode.style.height = height + 'px';

			if (flash.flashApi !== null && typeof flash.flashApi.fire_setSize === 'function') {
				flash.flashApi.fire_setSize(width, height);
			}
		};

		flash.destroy = function () {
			flash.flashNode.remove();
		};

		if (mediaFiles && mediaFiles.length > 0) {
			for (var _i4 = 0, _total4 = mediaFiles.length; _i4 < _total4; _i4++) {
				if (_renderer.renderer.renderers[options.prefix].canPlayType(mediaFiles[_i4].type)) {
					flash.setSrc(mediaFiles[_i4].src);
					break;
				}
			}
		}

		return flash;
	}
};

var hasFlash = PluginDetector.hasPluginVersion('flash', [10, 0, 0]);

if (hasFlash) {
	_media.typeChecks.push(function (url) {
		url = url.toLowerCase();

		if (url.startsWith('rtmp')) {
			if (~url.indexOf('.mp3')) {
				return 'audio/rtmp';
			} else {
				return 'video/rtmp';
			}
		} else if (/\.og(a|g)/i.test(url)) {
			return 'audio/ogg';
		} else if (~url.indexOf('.m3u8')) {
			return 'application/x-mpegURL';
		} else if (~url.indexOf('.mpd')) {
			return 'application/dash+xml';
		} else if (~url.indexOf('.flv')) {
			return 'video/flv';
		} else {
			return null;
		}
	});

	var FlashMediaElementVideoRenderer = {
		name: 'flash_video',
		options: {
			prefix: 'flash_video',
			filename: 'mediaelement-flash-video.swf',
			enablePseudoStreaming: false,

			pseudoStreamingStartQueryParam: 'start',

			pseudoStreamingType: 'byte',

			proxyType: '',

			streamDelimiter: ''
		},

		canPlayType: function canPlayType(type) {
			return ~['video/mp4', 'video/rtmp', 'audio/rtmp', 'rtmp/mp4', 'audio/mp4', 'video/flv', 'video/x-flv'].indexOf(type.toLowerCase());
		},

		create: FlashMediaElementRenderer.create

	};
	_renderer.renderer.add(FlashMediaElementVideoRenderer);

	var FlashMediaElementHlsVideoRenderer = {
		name: 'flash_hls',
		options: {
			prefix: 'flash_hls',
			filename: 'mediaelement-flash-video-hls.swf'
		},

		canPlayType: function canPlayType(type) {
			return ~['application/x-mpegurl', 'application/vnd.apple.mpegurl', 'audio/mpegurl', 'audio/hls', 'video/hls'].indexOf(type.toLowerCase());
		},

		create: FlashMediaElementRenderer.create
	};
	_renderer.renderer.add(FlashMediaElementHlsVideoRenderer);

	var FlashMediaElementMdashVideoRenderer = {
		name: 'flash_dash',
		options: {
			prefix: 'flash_dash',
			filename: 'mediaelement-flash-video-mdash.swf'
		},

		canPlayType: function canPlayType(type) {
			return ~['application/dash+xml'].indexOf(type.toLowerCase());
		},

		create: FlashMediaElementRenderer.create
	};
	_renderer.renderer.add(FlashMediaElementMdashVideoRenderer);

	var FlashMediaElementAudioRenderer = {
		name: 'flash_audio',
		options: {
			prefix: 'flash_audio',
			filename: 'mediaelement-flash-audio.swf'
		},

		canPlayType: function canPlayType(type) {
			return ~['audio/mp3'].indexOf(type.toLowerCase());
		},

		create: FlashMediaElementRenderer.create
	};
	_renderer.renderer.add(FlashMediaElementAudioRenderer);

	var FlashMediaElementAudioOggRenderer = {
		name: 'flash_audio_ogg',
		options: {
			prefix: 'flash_audio_ogg',
			filename: 'mediaelement-flash-audio-ogg.swf'
		},

		canPlayType: function canPlayType(type) {
			return ~['audio/ogg', 'audio/oga', 'audio/ogv'].indexOf(type.toLowerCase());
		},

		create: FlashMediaElementRenderer.create
	};
	_renderer.renderer.add(FlashMediaElementAudioOggRenderer);
}

},{"2":2,"25":25,"27":27,"28":28,"3":3,"5":5,"7":7,"8":8}],21:[function(_dereq_,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _window = _dereq_(3);

var _window2 = _interopRequireDefault(_window);

var _mejs = _dereq_(7);

var _mejs2 = _interopRequireDefault(_mejs);

var _renderer = _dereq_(8);

var _general = _dereq_(27);

var _constants = _dereq_(25);

var _media = _dereq_(28);

var _dom = _dereq_(26);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var NativeFlv = {

	promise: null,

	load: function load(settings) {
		if (typeof flvjs !== 'undefined') {
			NativeFlv.promise = new Promise(function (resolve) {
				resolve();
			}).then(function () {
				NativeFlv._createPlayer(settings);
			});
		} else {
			settings.options.path = typeof settings.options.path === 'string' ? settings.options.path : 'https://cdn.jsdelivr.net/npm/flv.js@latest';

			NativeFlv.promise = NativeFlv.promise || (0, _dom.loadScript)(settings.options.path);
			NativeFlv.promise.then(function () {
				NativeFlv._createPlayer(settings);
			});
		}

		return NativeFlv.promise;
	},

	_createPlayer: function _createPlayer(settings) {
		flvjs.LoggingControl.enableDebug = settings.options.debug;
		flvjs.LoggingControl.enableVerbose = settings.options.debug;
		var player = flvjs.createPlayer(settings.options, settings.configs);
		_window2.default['__ready__' + settings.id](player);
		return player;
	}
};

var FlvNativeRenderer = {
	name: 'native_flv',
	options: {
		prefix: 'native_flv',
		flv: {
			path: 'https://cdn.jsdelivr.net/npm/flv.js@latest',

			cors: true,
			debug: false
		}
	},

	canPlayType: function canPlayType(type) {
		return _constants.HAS_MSE && ['video/x-flv', 'video/flv'].indexOf(type.toLowerCase()) > -1;
	},

	create: function create(mediaElement, options, mediaFiles) {

		var originalNode = mediaElement.originalNode,
		    id = mediaElement.id + '_' + options.prefix;

		var node = null,
		    flvPlayer = null;

		node = originalNode.cloneNode(true);
		options = Object.assign(options, mediaElement.options);

		var props = _mejs2.default.html5media.properties,
		    events = _mejs2.default.html5media.events.concat(['click', 'mouseover', 'mouseout']).filter(function (e) {
			return e !== 'error';
		}),
		    attachNativeEvents = function attachNativeEvents(e) {
			var event = (0, _general.createEvent)(e.type, mediaElement);
			mediaElement.dispatchEvent(event);
		},
		    assignGettersSetters = function assignGettersSetters(propName) {
			var capName = '' + propName.substring(0, 1).toUpperCase() + propName.substring(1);

			node['get' + capName] = function () {
				return flvPlayer !== null ? node[propName] : null;
			};

			node['set' + capName] = function (value) {
				if (_mejs2.default.html5media.readOnlyProperties.indexOf(propName) === -1) {
					if (propName === 'src') {
						node[propName] = (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && value.src ? value.src : value;
						if (flvPlayer !== null) {
							var _flvOptions = {};
							_flvOptions.type = 'flv';
							_flvOptions.url = value;
							_flvOptions.cors = options.flv.cors;
							_flvOptions.debug = options.flv.debug;
							_flvOptions.path = options.flv.path;
							var _flvConfigs = options.flv.configs;

							flvPlayer.destroy();
							for (var i = 0, total = events.length; i < total; i++) {
								node.removeEventListener(events[i], attachNativeEvents);
							}
							flvPlayer = NativeFlv._createPlayer({
								options: _flvOptions,
								configs: _flvConfigs,
								id: id
							});
							flvPlayer.attachMediaElement(node);
							flvPlayer.load();
						}
					} else {
						node[propName] = value;
					}
				}
			};
		};

		for (var i = 0, total = props.length; i < total; i++) {
			assignGettersSetters(props[i]);
		}

		_window2.default['__ready__' + id] = function (_flvPlayer) {
			mediaElement.flvPlayer = flvPlayer = _flvPlayer;

			var flvEvents = flvjs.Events,
			    assignEvents = function assignEvents(eventName) {
				if (eventName === 'loadedmetadata') {
					flvPlayer.unload();
					flvPlayer.detachMediaElement();
					flvPlayer.attachMediaElement(node);
					flvPlayer.load();
				}

				node.addEventListener(eventName, attachNativeEvents);
			};

			for (var _i = 0, _total = events.length; _i < _total; _i++) {
				assignEvents(events[_i]);
			}

			var assignFlvEvents = function assignFlvEvents(name, data) {
				if (name === 'error') {
					var message = data[0] + ': ' + data[1] + ' ' + data[2].msg;
					mediaElement.generateError(message, node.src);
				} else {
					var _event = (0, _general.createEvent)(name, mediaElement);
					_event.data = data;
					mediaElement.dispatchEvent(_event);
				}
			};

			var _loop = function _loop(eventType) {
				if (flvEvents.hasOwnProperty(eventType)) {
					flvPlayer.on(flvEvents[eventType], function () {
						for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
							args[_key] = arguments[_key];
						}

						return assignFlvEvents(flvEvents[eventType], args);
					});
				}
			};

			for (var eventType in flvEvents) {
				_loop(eventType);
			}
		};

		if (mediaFiles && mediaFiles.length > 0) {
			for (var _i2 = 0, _total2 = mediaFiles.length; _i2 < _total2; _i2++) {
				if (_renderer.renderer.renderers[options.prefix].canPlayType(mediaFiles[_i2].type)) {
					node.setAttribute('src', mediaFiles[_i2].src);
					break;
				}
			}
		}

		node.setAttribute('id', id);

		originalNode.parentNode.insertBefore(node, originalNode);
		originalNode.autoplay = false;
		originalNode.style.display = 'none';

		var flvOptions = {};
		flvOptions.type = 'flv';
		flvOptions.url = node.src;
		flvOptions.cors = options.flv.cors;
		flvOptions.debug = options.flv.debug;
		flvOptions.path = options.flv.path;
		var flvConfigs = options.flv.configs;

		node.setSize = function (width, height) {
			node.style.width = width + 'px';
			node.style.height = height + 'px';
			return node;
		};

		node.hide = function () {
			if (flvPlayer !== null) {
				flvPlayer.pause();
			}
			node.style.display = 'none';
			return node;
		};

		node.show = function () {
			node.style.display = '';
			return node;
		};

		node.destroy = function () {
			if (flvPlayer !== null) {
				flvPlayer.destroy();
			}
		};

		var event = (0, _general.createEvent)('rendererready', node);
		mediaElement.dispatchEvent(event);

		mediaElement.promises.push(NativeFlv.load({
			options: flvOptions,
			configs: flvConfigs,
			id: id
		}));

		return node;
	}
};

_media.typeChecks.push(function (url) {
	return ~url.toLowerCase().indexOf('.flv') ? 'video/flv' : null;
});

_renderer.renderer.add(FlvNativeRenderer);

},{"25":25,"26":26,"27":27,"28":28,"3":3,"7":7,"8":8}],22:[function(_dereq_,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _window = _dereq_(3);

var _window2 = _interopRequireDefault(_window);

var _mejs = _dereq_(7);

var _mejs2 = _interopRequireDefault(_mejs);

var _renderer = _dereq_(8);

var _general = _dereq_(27);

var _constants = _dereq_(25);

var _media = _dereq_(28);

var _dom = _dereq_(26);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var NativeHls = {

	promise: null,

	load: function load(settings) {
		if (typeof Hls !== 'undefined') {
			NativeHls.promise = new Promise(function (resolve) {
				resolve();
			}).then(function () {
				NativeHls._createPlayer(settings);
			});
		} else {
			settings.options.path = typeof settings.options.path === 'string' ? settings.options.path : 'https://cdn.jsdelivr.net/npm/hls.js@latest';

			NativeHls.promise = NativeHls.promise || (0, _dom.loadScript)(settings.options.path);
			NativeHls.promise.then(function () {
				NativeHls._createPlayer(settings);
			});
		}

		return NativeHls.promise;
	},

	_createPlayer: function _createPlayer(settings) {
		var player = new Hls(settings.options);
		_window2.default['__ready__' + settings.id](player);
		return player;
	}
};

var HlsNativeRenderer = {
	name: 'native_hls',
	options: {
		prefix: 'native_hls',
		hls: {
			path: 'https://cdn.jsdelivr.net/npm/hls.js@latest',

			autoStartLoad: false,
			debug: false
		}
	},

	canPlayType: function canPlayType(type) {
		return _constants.HAS_MSE && ['application/x-mpegurl', 'application/vnd.apple.mpegurl', 'audio/mpegurl', 'audio/hls', 'video/hls'].indexOf(type.toLowerCase()) > -1;
	},

	create: function create(mediaElement, options, mediaFiles) {

		var originalNode = mediaElement.originalNode,
		    id = mediaElement.id + '_' + options.prefix,
		    preload = originalNode.getAttribute('preload'),
		    autoplay = originalNode.autoplay;

		var hlsPlayer = null,
		    node = null,
		    index = 0,
		    total = mediaFiles.length;

		node = originalNode.cloneNode(true);
		options = Object.assign(options, mediaElement.options);
		options.hls.autoStartLoad = preload && preload !== 'none' || autoplay;

		var props = _mejs2.default.html5media.properties,
		    events = _mejs2.default.html5media.events.concat(['click', 'mouseover', 'mouseout']).filter(function (e) {
			return e !== 'error';
		}),
		    attachNativeEvents = function attachNativeEvents(e) {
			var event = (0, _general.createEvent)(e.type, mediaElement);
			mediaElement.dispatchEvent(event);
		},
		    assignGettersSetters = function assignGettersSetters(propName) {
			var capName = '' + propName.substring(0, 1).toUpperCase() + propName.substring(1);

			node['get' + capName] = function () {
				return hlsPlayer !== null ? node[propName] : null;
			};

			node['set' + capName] = function (value) {
				if (_mejs2.default.html5media.readOnlyProperties.indexOf(propName) === -1) {
					if (propName === 'src') {
						node[propName] = (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && value.src ? value.src : value;
						if (hlsPlayer !== null) {
							hlsPlayer.destroy();
							for (var i = 0, _total = events.length; i < _total; i++) {
								node.removeEventListener(events[i], attachNativeEvents);
							}
							hlsPlayer = NativeHls._createPlayer({
								options: options.hls,
								id: id
							});
							hlsPlayer.loadSource(value);
							hlsPlayer.attachMedia(node);
						}
					} else {
						node[propName] = value;
					}
				}
			};
		};

		for (var i = 0, _total2 = props.length; i < _total2; i++) {
			assignGettersSetters(props[i]);
		}

		_window2.default['__ready__' + id] = function (_hlsPlayer) {
			mediaElement.hlsPlayer = hlsPlayer = _hlsPlayer;
			var hlsEvents = Hls.Events,
			    assignEvents = function assignEvents(eventName) {
				if (eventName === 'loadedmetadata') {
					var url = mediaElement.originalNode.src;
					hlsPlayer.detachMedia();
					hlsPlayer.loadSource(url);
					hlsPlayer.attachMedia(node);
				}

				node.addEventListener(eventName, attachNativeEvents);
			};

			for (var _i = 0, _total3 = events.length; _i < _total3; _i++) {
				assignEvents(events[_i]);
			}

			var recoverDecodingErrorDate = void 0,
			    recoverSwapAudioCodecDate = void 0;
			var assignHlsEvents = function assignHlsEvents(name, data) {
				if (name === 'hlsError') {
					console.warn(data);
					data = data[1];

					if (data.fatal) {
						switch (data.type) {
							case 'mediaError':
								var now = new Date().getTime();
								if (!recoverDecodingErrorDate || now - recoverDecodingErrorDate > 3000) {
									recoverDecodingErrorDate = new Date().getTime();
									hlsPlayer.recoverMediaError();
								} else if (!recoverSwapAudioCodecDate || now - recoverSwapAudioCodecDate > 3000) {
									recoverSwapAudioCodecDate = new Date().getTime();
									console.warn('Attempting to swap Audio Codec and recover from media error');
									hlsPlayer.swapAudioCodec();
									hlsPlayer.recoverMediaError();
								} else {
									var message = 'Cannot recover, last media error recovery failed';
									mediaElement.generateError(message, node.src);
									console.error(message);
								}
								break;
							case 'networkError':
								if (data.details === 'manifestLoadError') {
									if (index < total && mediaFiles[index + 1] !== undefined) {
										node.setSrc(mediaFiles[index++].src);
										node.load();
										node.play();
									} else {
										var _message = 'Network error';
										mediaElement.generateError(_message, mediaFiles);
										console.error(_message);
									}
								} else {
									var _message2 = 'Network error';
									mediaElement.generateError(_message2, mediaFiles);
									console.error(_message2);
								}
								break;
							default:
								hlsPlayer.destroy();
								break;
						}
					}
				} else {
					var _event = (0, _general.createEvent)(name, mediaElement);
					_event.data = data;
					mediaElement.dispatchEvent(_event);
				}
			};

			var _loop = function _loop(eventType) {
				if (hlsEvents.hasOwnProperty(eventType)) {
					hlsPlayer.on(hlsEvents[eventType], function () {
						for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
							args[_key] = arguments[_key];
						}

						return assignHlsEvents(hlsEvents[eventType], args);
					});
				}
			};

			for (var eventType in hlsEvents) {
				_loop(eventType);
			}
		};

		if (total > 0) {
			for (; index < total; index++) {
				if (_renderer.renderer.renderers[options.prefix].canPlayType(mediaFiles[index].type)) {
					node.setAttribute('src', mediaFiles[index].src);
					break;
				}
			}
		}

		if (preload !== 'auto' && !autoplay) {
			node.addEventListener('play', function () {
				if (hlsPlayer !== null) {
					hlsPlayer.startLoad();
				}
			});

			node.addEventListener('pause', function () {
				if (hlsPlayer !== null) {
					hlsPlayer.stopLoad();
				}
			});
		}

		node.setAttribute('id', id);

		originalNode.parentNode.insertBefore(node, originalNode);
		originalNode.autoplay = false;
		originalNode.style.display = 'none';

		node.setSize = function (width, height) {
			node.style.width = width + 'px';
			node.style.height = height + 'px';
			return node;
		};

		node.hide = function () {
			node.pause();
			node.style.display = 'none';
			return node;
		};

		node.show = function () {
			node.style.display = '';
			return node;
		};

		node.destroy = function () {
			if (hlsPlayer !== null) {
				hlsPlayer.stopLoad();
				hlsPlayer.destroy();
			}
		};

		var event = (0, _general.createEvent)('rendererready', node);
		mediaElement.dispatchEvent(event);

		mediaElement.promises.push(NativeHls.load({
			options: options.hls,
			id: id
		}));

		return node;
	}
};

_media.typeChecks.push(function (url) {
	return ~url.toLowerCase().indexOf('.m3u8') ? 'application/x-mpegURL' : null;
});

_renderer.renderer.add(HlsNativeRenderer);

},{"25":25,"26":26,"27":27,"28":28,"3":3,"7":7,"8":8}],23:[function(_dereq_,module,exports){
'use strict';

var _window = _dereq_(3);

var _window2 = _interopRequireDefault(_window);

var _document = _dereq_(2);

var _document2 = _interopRequireDefault(_document);

var _mejs = _dereq_(7);

var _mejs2 = _interopRequireDefault(_mejs);

var _renderer = _dereq_(8);

var _general = _dereq_(27);

var _constants = _dereq_(25);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var HtmlMediaElement = {
	name: 'html5',
	options: {
		prefix: 'html5'
	},

	canPlayType: function canPlayType(type) {

		var mediaElement = _document2.default.createElement('video');

		if (_constants.IS_ANDROID && /\/mp(3|4)$/i.test(type) || ~['application/x-mpegurl', 'vnd.apple.mpegurl', 'audio/mpegurl', 'audio/hls', 'video/hls'].indexOf(type.toLowerCase()) && _constants.SUPPORTS_NATIVE_HLS) {
			return 'yes';
		} else if (mediaElement.canPlayType) {
			return mediaElement.canPlayType(type.toLowerCase()).replace(/no/, '');
		} else {
			return '';
		}
	},

	create: function create(mediaElement, options, mediaFiles) {

		var id = mediaElement.id + '_' + options.prefix;
		var isActive = false;

		var node = null;

		if (mediaElement.originalNode === undefined || mediaElement.originalNode === null) {
			node = _document2.default.createElement('audio');
			mediaElement.appendChild(node);
		} else {
			node = mediaElement.originalNode;
		}

		node.setAttribute('id', id);

		var props = _mejs2.default.html5media.properties,
		    assignGettersSetters = function assignGettersSetters(propName) {
			var capName = '' + propName.substring(0, 1).toUpperCase() + propName.substring(1);

			node['get' + capName] = function () {
				return node[propName];
			};

			node['set' + capName] = function (value) {
				if (_mejs2.default.html5media.readOnlyProperties.indexOf(propName) === -1) {
					node[propName] = value;
				}
			};
		};

		for (var i = 0, _total = props.length; i < _total; i++) {
			assignGettersSetters(props[i]);
		}

		var events = _mejs2.default.html5media.events.concat(['click', 'mouseover', 'mouseout']).filter(function (e) {
			return e !== 'error';
		}),
		    assignEvents = function assignEvents(eventName) {
			node.addEventListener(eventName, function (e) {
				if (isActive) {
					var _event = (0, _general.createEvent)(e.type, e.target);
					mediaElement.dispatchEvent(_event);
				}
			});
		};

		for (var _i = 0, _total2 = events.length; _i < _total2; _i++) {
			assignEvents(events[_i]);
		}

		node.setSize = function (width, height) {
			node.style.width = width + 'px';
			node.style.height = height + 'px';
			return node;
		};

		node.hide = function () {
			isActive = false;
			node.style.display = 'none';

			return node;
		};

		node.show = function () {
			isActive = true;
			node.style.display = '';

			return node;
		};

		var index = 0,
		    total = mediaFiles.length;
		if (total > 0) {
			for (; index < total; index++) {
				if (_renderer.renderer.renderers[options.prefix].canPlayType(mediaFiles[index].type)) {
					node.setAttribute('src', mediaFiles[index].src);
					break;
				}
			}
		}

		node.addEventListener('error', function (e) {
			if (e.target.error.code === 4 && isActive) {
				if (index < total && mediaFiles[index + 1] !== undefined) {
					node.src = mediaFiles[index++].src;
					node.load();
					node.play();
				} else {
					mediaElement.generateError('Media error: Format(s) not supported or source(s) not found', mediaFiles);
				}
			}
		});

		var event = (0, _general.createEvent)('rendererready', node);
		mediaElement.dispatchEvent(event);

		return node;
	}
};

_window2.default.HtmlMediaElement = _mejs2.default.HtmlMediaElement = HtmlMediaElement;

_renderer.renderer.add(HtmlMediaElement);

},{"2":2,"25":25,"27":27,"3":3,"7":7,"8":8}],24:[function(_dereq_,module,exports){
'use strict';

var _window = _dereq_(3);

var _window2 = _interopRequireDefault(_window);

var _document = _dereq_(2);

var _document2 = _interopRequireDefault(_document);

var _mejs = _dereq_(7);

var _mejs2 = _interopRequireDefault(_mejs);

var _renderer = _dereq_(8);

var _general = _dereq_(27);

var _media = _dereq_(28);

var _dom = _dereq_(26);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var YouTubeApi = {
	isIframeStarted: false,

	isIframeLoaded: false,

	iframeQueue: [],

	enqueueIframe: function enqueueIframe(settings) {
		YouTubeApi.isLoaded = typeof YT !== 'undefined' && YT.loaded;

		if (YouTubeApi.isLoaded) {
			YouTubeApi.createIframe(settings);
		} else {
			YouTubeApi.loadIframeApi();
			YouTubeApi.iframeQueue.push(settings);
		}
	},

	loadIframeApi: function loadIframeApi() {
		if (!YouTubeApi.isIframeStarted) {
			(0, _dom.loadScript)('https://www.youtube.com/player_api');
			YouTubeApi.isIframeStarted = true;
		}
	},

	iFrameReady: function iFrameReady() {

		YouTubeApi.isLoaded = true;
		YouTubeApi.isIframeLoaded = true;

		while (YouTubeApi.iframeQueue.length > 0) {
			var settings = YouTubeApi.iframeQueue.pop();
			YouTubeApi.createIframe(settings);
		}
	},

	createIframe: function createIframe(settings) {
		return new YT.Player(settings.containerId, settings);
	},

	getYouTubeId: function getYouTubeId(url) {

		var youTubeId = '';

		if (url.indexOf('?') > 0) {
			youTubeId = YouTubeApi.getYouTubeIdFromParam(url);

			if (youTubeId === '') {
				youTubeId = YouTubeApi.getYouTubeIdFromUrl(url);
			}
		} else {
			youTubeId = YouTubeApi.getYouTubeIdFromUrl(url);
		}

		var id = youTubeId.substring(youTubeId.lastIndexOf('/') + 1);
		youTubeId = id.split('?');
		return youTubeId[0];
	},

	getYouTubeIdFromParam: function getYouTubeIdFromParam(url) {

		if (url === undefined || url === null || !url.trim().length) {
			return null;
		}

		var parts = url.split('?'),
		    parameters = parts[1].split('&');

		var youTubeId = '';

		for (var i = 0, total = parameters.length; i < total; i++) {
			var paramParts = parameters[i].split('=');
			if (paramParts[0] === 'v') {
				youTubeId = paramParts[1];
				break;
			}
		}

		return youTubeId;
	},

	getYouTubeIdFromUrl: function getYouTubeIdFromUrl(url) {

		if (url === undefined || url === null || !url.trim().length) {
			return null;
		}

		var parts = url.split('?');
		url = parts[0];
		return url.substring(url.lastIndexOf('/') + 1);
	},

	getYouTubeNoCookieUrl: function getYouTubeNoCookieUrl(url) {
		if (url === undefined || url === null || !url.trim().length || url.indexOf('//www.youtube') === -1) {
			return url;
		}

		var parts = url.split('/');
		parts[2] = parts[2].replace('.com', '-nocookie.com');
		return parts.join('/');
	}
};

var YouTubeIframeRenderer = {
	name: 'youtube_iframe',

	options: {
		prefix: 'youtube_iframe',

		youtube: {
			autoplay: 0,
			controls: 0,
			disablekb: 1,
			end: 0,
			loop: 0,
			modestbranding: 0,
			playsinline: 0,
			rel: 0,
			showinfo: 0,
			start: 0,
			iv_load_policy: 3,

			nocookie: false,

			imageQuality: null
		}
	},

	canPlayType: function canPlayType(type) {
		return ~['video/youtube', 'video/x-youtube'].indexOf(type.toLowerCase());
	},

	create: function create(mediaElement, options, mediaFiles) {

		var youtube = {},
		    apiStack = [],
		    readyState = 4;

		var youTubeApi = null,
		    paused = true,
		    ended = false,
		    youTubeIframe = null,
		    volume = 1;

		youtube.options = options;
		youtube.id = mediaElement.id + '_' + options.prefix;
		youtube.mediaElement = mediaElement;

		var props = _mejs2.default.html5media.properties,
		    assignGettersSetters = function assignGettersSetters(propName) {

			var capName = '' + propName.substring(0, 1).toUpperCase() + propName.substring(1);

			youtube['get' + capName] = function () {
				if (youTubeApi !== null) {
					var value = null;

					switch (propName) {
						case 'currentTime':
							return youTubeApi.getCurrentTime();
						case 'duration':
							return youTubeApi.getDuration();
						case 'volume':
							volume = youTubeApi.getVolume() / 100;
							return volume;
						case 'paused':
							return paused;
						case 'ended':
							return ended;
						case 'muted':
							return youTubeApi.isMuted();
						case 'buffered':
							var percentLoaded = youTubeApi.getVideoLoadedFraction(),
							    duration = youTubeApi.getDuration();
							return {
								start: function start() {
									return 0;
								},
								end: function end() {
									return percentLoaded * duration;
								},
								length: 1
							};
						case 'src':
							return youTubeApi.getVideoUrl();
						case 'readyState':
							return readyState;
					}

					return value;
				} else {
					return null;
				}
			};

			youtube['set' + capName] = function (value) {
				if (youTubeApi !== null) {
					switch (propName) {
						case 'src':
							var url = typeof value === 'string' ? value : value[0].src,
							    _videoId = YouTubeApi.getYouTubeId(url);

							if (mediaElement.originalNode.autoplay) {
								youTubeApi.loadVideoById(_videoId);
							} else {
								youTubeApi.cueVideoById(_videoId);
							}
							break;
						case 'currentTime':
							youTubeApi.seekTo(value);
							break;
						case 'muted':
							if (value) {
								youTubeApi.mute();
							} else {
								youTubeApi.unMute();
							}
							setTimeout(function () {
								var event = (0, _general.createEvent)('volumechange', youtube);
								mediaElement.dispatchEvent(event);
							}, 50);
							break;
						case 'volume':
							volume = value;
							youTubeApi.setVolume(value * 100);
							setTimeout(function () {
								var event = (0, _general.createEvent)('volumechange', youtube);
								mediaElement.dispatchEvent(event);
							}, 50);
							break;
						case 'readyState':
							var event = (0, _general.createEvent)('canplay', youtube);
							mediaElement.dispatchEvent(event);
							break;
						default:

							break;
					}
				} else {
					apiStack.push({ type: 'set', propName: propName, value: value });
				}
			};
		};

		for (var i = 0, total = props.length; i < total; i++) {
			assignGettersSetters(props[i]);
		}

		var methods = _mejs2.default.html5media.methods,
		    assignMethods = function assignMethods(methodName) {
			youtube[methodName] = function () {
				if (youTubeApi !== null) {
					switch (methodName) {
						case 'play':
							paused = false;
							return youTubeApi.playVideo();
						case 'pause':
							paused = true;
							return youTubeApi.pauseVideo();
						case 'load':
							return null;
					}
				} else {
					apiStack.push({ type: 'call', methodName: methodName });
				}
			};
		};

		for (var _i = 0, _total = methods.length; _i < _total; _i++) {
			assignMethods(methods[_i]);
		}

		var errorHandler = function errorHandler(error) {
			var message = '';
			switch (error.data) {
				case 2:
					message = 'The request contains an invalid parameter value. Verify that video ID has 11 characters and that contains no invalid characters, such as exclamation points or asterisks.';
					break;
				case 5:
					message = 'The requested content cannot be played in an HTML5 player or another error related to the HTML5 player has occurred.';
					break;
				case 100:
					message = 'The video requested was not found. Either video has been removed or has been marked as private.';
					break;
				case 101:
				case 105:
					message = 'The owner of the requested video does not allow it to be played in embedded players.';
					break;
				default:
					message = 'Unknown error.';
					break;
			}
			mediaElement.generateError('Code ' + error.data + ': ' + message, mediaFiles);
		};

		var youtubeContainer = _document2.default.createElement('div');
		youtubeContainer.id = youtube.id;

		if (youtube.options.youtube.nocookie) {
			mediaElement.originalNode.src = YouTubeApi.getYouTubeNoCookieUrl(mediaFiles[0].src);
		}

		mediaElement.originalNode.parentNode.insertBefore(youtubeContainer, mediaElement.originalNode);
		mediaElement.originalNode.style.display = 'none';

		var isAudio = mediaElement.originalNode.tagName.toLowerCase() === 'audio',
		    height = isAudio ? '1' : mediaElement.originalNode.height,
		    width = isAudio ? '1' : mediaElement.originalNode.width,
		    videoId = YouTubeApi.getYouTubeId(mediaFiles[0].src),
		    youtubeSettings = {
			id: youtube.id,
			containerId: youtubeContainer.id,
			videoId: videoId,
			height: height,
			width: width,
			playerVars: Object.assign({
				controls: 0,
				rel: 0,
				disablekb: 1,
				showinfo: 0,
				modestbranding: 0,
				html5: 1,
				iv_load_policy: 3
			}, youtube.options.youtube),
			origin: _window2.default.location.host,
			events: {
				onReady: function onReady(e) {
					mediaElement.youTubeApi = youTubeApi = e.target;
					mediaElement.youTubeState = {
						paused: true,
						ended: false
					};

					if (apiStack.length) {
						for (var _i2 = 0, _total2 = apiStack.length; _i2 < _total2; _i2++) {

							var stackItem = apiStack[_i2];

							if (stackItem.type === 'set') {
								var propName = stackItem.propName,
								    capName = '' + propName.substring(0, 1).toUpperCase() + propName.substring(1);

								youtube['set' + capName](stackItem.value);
							} else if (stackItem.type === 'call') {
								youtube[stackItem.methodName]();
							}
						}
					}

					youTubeIframe = youTubeApi.getIframe();

					if (mediaElement.originalNode.muted) {
						youTubeApi.mute();
					}

					var events = ['mouseover', 'mouseout'],
					    assignEvents = function assignEvents(e) {
						var newEvent = (0, _general.createEvent)(e.type, youtube);
						mediaElement.dispatchEvent(newEvent);
					};

					for (var _i3 = 0, _total3 = events.length; _i3 < _total3; _i3++) {
						youTubeIframe.addEventListener(events[_i3], assignEvents, false);
					}

					var initEvents = ['rendererready', 'loadedmetadata', 'loadeddata', 'canplay'];

					for (var _i4 = 0, _total4 = initEvents.length; _i4 < _total4; _i4++) {
						var event = (0, _general.createEvent)(initEvents[_i4], youtube);
						mediaElement.dispatchEvent(event);
					}
				},
				onStateChange: function onStateChange(e) {
					var events = [];

					switch (e.data) {
						case -1:
							events = ['loadedmetadata'];
							paused = true;
							ended = false;
							break;
						case 0:
							events = ['ended'];
							paused = false;
							ended = !youtube.options.youtube.loop;
							if (!youtube.options.youtube.loop) {
								youtube.stopInterval();
							}
							break;
						case 1:
							events = ['play', 'playing'];
							paused = false;
							ended = false;
							youtube.startInterval();
							break;
						case 2:
							events = ['pause'];
							paused = true;
							ended = false;
							youtube.stopInterval();
							break;
						case 3:
							events = ['progress'];
							ended = false;
							break;
						case 5:
							events = ['loadeddata', 'loadedmetadata', 'canplay'];
							paused = true;
							ended = false;
							break;
					}

					for (var _i5 = 0, _total5 = events.length; _i5 < _total5; _i5++) {
						var event = (0, _general.createEvent)(events[_i5], youtube);
						mediaElement.dispatchEvent(event);
					}
				},
				onError: function onError(e) {
					return errorHandler(e);
				}
			}
		};

		if (isAudio || mediaElement.originalNode.hasAttribute('playsinline')) {
			youtubeSettings.playerVars.playsinline = 1;
		}

		if (mediaElement.originalNode.controls) {
			youtubeSettings.playerVars.controls = 1;
		}
		if (mediaElement.originalNode.autoplay) {
			youtubeSettings.playerVars.autoplay = 1;
		}
		if (mediaElement.originalNode.loop) {
			youtubeSettings.playerVars.loop = 1;
		}

		if ((youtubeSettings.playerVars.loop && parseInt(youtubeSettings.playerVars.loop, 10) === 1 || mediaElement.originalNode.src.indexOf('loop=') > -1) && !youtubeSettings.playerVars.playlist && mediaElement.originalNode.src.indexOf('playlist=') === -1) {
			youtubeSettings.playerVars.playlist = YouTubeApi.getYouTubeId(mediaElement.originalNode.src);
		}

		YouTubeApi.enqueueIframe(youtubeSettings);

		youtube.onEvent = function (eventName, player, _youTubeState) {
			if (_youTubeState !== null && _youTubeState !== undefined) {
				mediaElement.youTubeState = _youTubeState;
			}
		};

		youtube.setSize = function (width, height) {
			if (youTubeApi !== null) {
				youTubeApi.setSize(width, height);
			}
		};
		youtube.hide = function () {
			youtube.stopInterval();
			youtube.pause();
			if (youTubeIframe) {
				youTubeIframe.style.display = 'none';
			}
		};
		youtube.show = function () {
			if (youTubeIframe) {
				youTubeIframe.style.display = '';
			}
		};
		youtube.destroy = function () {
			youTubeApi.destroy();
		};
		youtube.interval = null;

		youtube.startInterval = function () {
			youtube.interval = setInterval(function () {
				var event = (0, _general.createEvent)('timeupdate', youtube);
				mediaElement.dispatchEvent(event);
			}, 250);
		};
		youtube.stopInterval = function () {
			if (youtube.interval) {
				clearInterval(youtube.interval);
			}
		};
		youtube.getPosterUrl = function () {
			var quality = options.youtube.imageQuality,
			    resolutions = ['default', 'hqdefault', 'mqdefault', 'sddefault', 'maxresdefault'],
			    id = YouTubeApi.getYouTubeId(mediaElement.originalNode.src);
			return quality && resolutions.indexOf(quality) > -1 && id ? 'https://img.youtube.com/vi/' + id + '/' + quality + '.jpg' : '';
		};

		return youtube;
	}
};

_window2.default.onYouTubePlayerAPIReady = function () {
	YouTubeApi.iFrameReady();
};

_media.typeChecks.push(function (url) {
	return (/\/\/(www\.youtube|youtu\.?be)/i.test(url) ? 'video/x-youtube' : null
	);
});

_renderer.renderer.add(YouTubeIframeRenderer);

},{"2":2,"26":26,"27":27,"28":28,"3":3,"7":7,"8":8}],25:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.cancelFullScreen = exports.requestFullScreen = exports.isFullScreen = exports.FULLSCREEN_EVENT_NAME = exports.HAS_NATIVE_FULLSCREEN_ENABLED = exports.HAS_TRUE_NATIVE_FULLSCREEN = exports.HAS_IOS_FULLSCREEN = exports.HAS_MS_NATIVE_FULLSCREEN = exports.HAS_MOZ_NATIVE_FULLSCREEN = exports.HAS_WEBKIT_NATIVE_FULLSCREEN = exports.HAS_NATIVE_FULLSCREEN = exports.SUPPORTS_NATIVE_HLS = exports.SUPPORT_PASSIVE_EVENT = exports.SUPPORT_POINTER_EVENTS = exports.HAS_MSE = exports.IS_STOCK_ANDROID = exports.IS_SAFARI = exports.IS_FIREFOX = exports.IS_CHROME = exports.IS_EDGE = exports.IS_IE = exports.IS_ANDROID = exports.IS_IOS = exports.IS_IPOD = exports.IS_IPHONE = exports.IS_IPAD = exports.UA = exports.NAV = undefined;

var _window = _dereq_(3);

var _window2 = _interopRequireDefault(_window);

var _document = _dereq_(2);

var _document2 = _interopRequireDefault(_document);

var _mejs = _dereq_(7);

var _mejs2 = _interopRequireDefault(_mejs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var NAV = exports.NAV = _window2.default.navigator;
var UA = exports.UA = NAV.userAgent.toLowerCase();
var IS_IPAD = exports.IS_IPAD = /ipad/i.test(UA) && !_window2.default.MSStream;
var IS_IPHONE = exports.IS_IPHONE = /iphone/i.test(UA) && !_window2.default.MSStream;
var IS_IPOD = exports.IS_IPOD = /ipod/i.test(UA) && !_window2.default.MSStream;
var IS_IOS = exports.IS_IOS = /ipad|iphone|ipod/i.test(UA) && !_window2.default.MSStream;
var IS_ANDROID = exports.IS_ANDROID = /android/i.test(UA);
var IS_IE = exports.IS_IE = /(trident|microsoft)/i.test(NAV.appName);
var IS_EDGE = exports.IS_EDGE = 'msLaunchUri' in NAV && !('documentMode' in _document2.default);
var IS_CHROME = exports.IS_CHROME = /chrome/i.test(UA);
var IS_FIREFOX = exports.IS_FIREFOX = /firefox/i.test(UA);
var IS_SAFARI = exports.IS_SAFARI = /safari/i.test(UA) && !IS_CHROME;
var IS_STOCK_ANDROID = exports.IS_STOCK_ANDROID = /^mozilla\/\d+\.\d+\s\(linux;\su;/i.test(UA);
var HAS_MSE = exports.HAS_MSE = 'MediaSource' in _window2.default;
var SUPPORT_POINTER_EVENTS = exports.SUPPORT_POINTER_EVENTS = function () {
	var element = _document2.default.createElement('x'),
	    documentElement = _document2.default.documentElement,
	    getComputedStyle = _window2.default.getComputedStyle;

	if (!('pointerEvents' in element.style)) {
		return false;
	}

	element.style.pointerEvents = 'auto';
	element.style.pointerEvents = 'x';
	documentElement.appendChild(element);
	var supports = getComputedStyle && (getComputedStyle(element, '') || {}).pointerEvents === 'auto';
	element.remove();
	return !!supports;
}();

var SUPPORT_PASSIVE_EVENT = exports.SUPPORT_PASSIVE_EVENT = function () {
	var supportsPassive = false;
	try {
		var opts = Object.defineProperty({}, 'passive', {
			get: function get() {
				supportsPassive = true;
			}
		});
		_window2.default.addEventListener('test', null, opts);
	} catch (e) {}

	return supportsPassive;
}();

var html5Elements = ['source', 'track', 'audio', 'video'];
var video = void 0;

for (var i = 0, total = html5Elements.length; i < total; i++) {
	video = _document2.default.createElement(html5Elements[i]);
}

var SUPPORTS_NATIVE_HLS = exports.SUPPORTS_NATIVE_HLS = IS_SAFARI || IS_ANDROID && (IS_CHROME || IS_STOCK_ANDROID) || IS_IE && /edge/i.test(UA);

var hasiOSFullScreen = video.webkitEnterFullscreen !== undefined;

var hasNativeFullscreen = video.requestFullscreen !== undefined;

if (hasiOSFullScreen && /mac os x 10_5/i.test(UA)) {
	hasNativeFullscreen = false;
	hasiOSFullScreen = false;
}

var hasWebkitNativeFullScreen = video.webkitRequestFullScreen !== undefined;
var hasMozNativeFullScreen = video.mozRequestFullScreen !== undefined;
var hasMsNativeFullScreen = video.msRequestFullscreen !== undefined;
var hasTrueNativeFullScreen = hasWebkitNativeFullScreen || hasMozNativeFullScreen || hasMsNativeFullScreen;
var nativeFullScreenEnabled = hasTrueNativeFullScreen;
var fullScreenEventName = '';
var isFullScreen = void 0,
    requestFullScreen = void 0,
    cancelFullScreen = void 0;

if (hasMozNativeFullScreen) {
	nativeFullScreenEnabled = _document2.default.mozFullScreenEnabled;
} else if (hasMsNativeFullScreen) {
	nativeFullScreenEnabled = _document2.default.msFullscreenEnabled;
}

if (IS_CHROME) {
	hasiOSFullScreen = false;
}

if (hasTrueNativeFullScreen) {
	if (hasWebkitNativeFullScreen) {
		fullScreenEventName = 'webkitfullscreenchange';
	} else if (hasMozNativeFullScreen) {
		fullScreenEventName = 'mozfullscreenchange';
	} else if (hasMsNativeFullScreen) {
		fullScreenEventName = 'MSFullscreenChange';
	}

	exports.isFullScreen = isFullScreen = function isFullScreen() {
		if (hasMozNativeFullScreen) {
			return _document2.default.mozFullScreen;
		} else if (hasWebkitNativeFullScreen) {
			return _document2.default.webkitIsFullScreen;
		} else if (hasMsNativeFullScreen) {
			return _document2.default.msFullscreenElement !== null;
		}
	};

	exports.requestFullScreen = requestFullScreen = function requestFullScreen(el) {
		if (hasWebkitNativeFullScreen) {
			el.webkitRequestFullScreen();
		} else if (hasMozNativeFullScreen) {
			el.mozRequestFullScreen();
		} else if (hasMsNativeFullScreen) {
			el.msRequestFullscreen();
		}
	};

	exports.cancelFullScreen = cancelFullScreen = function cancelFullScreen() {
		if (hasWebkitNativeFullScreen) {
			_document2.default.webkitCancelFullScreen();
		} else if (hasMozNativeFullScreen) {
			_document2.default.mozCancelFullScreen();
		} else if (hasMsNativeFullScreen) {
			_document2.default.msExitFullscreen();
		}
	};
}

var HAS_NATIVE_FULLSCREEN = exports.HAS_NATIVE_FULLSCREEN = hasNativeFullscreen;
var HAS_WEBKIT_NATIVE_FULLSCREEN = exports.HAS_WEBKIT_NATIVE_FULLSCREEN = hasWebkitNativeFullScreen;
var HAS_MOZ_NATIVE_FULLSCREEN = exports.HAS_MOZ_NATIVE_FULLSCREEN = hasMozNativeFullScreen;
var HAS_MS_NATIVE_FULLSCREEN = exports.HAS_MS_NATIVE_FULLSCREEN = hasMsNativeFullScreen;
var HAS_IOS_FULLSCREEN = exports.HAS_IOS_FULLSCREEN = hasiOSFullScreen;
var HAS_TRUE_NATIVE_FULLSCREEN = exports.HAS_TRUE_NATIVE_FULLSCREEN = hasTrueNativeFullScreen;
var HAS_NATIVE_FULLSCREEN_ENABLED = exports.HAS_NATIVE_FULLSCREEN_ENABLED = nativeFullScreenEnabled;
var FULLSCREEN_EVENT_NAME = exports.FULLSCREEN_EVENT_NAME = fullScreenEventName;
exports.isFullScreen = isFullScreen;
exports.requestFullScreen = requestFullScreen;
exports.cancelFullScreen = cancelFullScreen;


_mejs2.default.Features = _mejs2.default.Features || {};
_mejs2.default.Features.isiPad = IS_IPAD;
_mejs2.default.Features.isiPod = IS_IPOD;
_mejs2.default.Features.isiPhone = IS_IPHONE;
_mejs2.default.Features.isiOS = _mejs2.default.Features.isiPhone || _mejs2.default.Features.isiPad;
_mejs2.default.Features.isAndroid = IS_ANDROID;
_mejs2.default.Features.isIE = IS_IE;
_mejs2.default.Features.isEdge = IS_EDGE;
_mejs2.default.Features.isChrome = IS_CHROME;
_mejs2.default.Features.isFirefox = IS_FIREFOX;
_mejs2.default.Features.isSafari = IS_SAFARI;
_mejs2.default.Features.isStockAndroid = IS_STOCK_ANDROID;
_mejs2.default.Features.hasMSE = HAS_MSE;
_mejs2.default.Features.supportsNativeHLS = SUPPORTS_NATIVE_HLS;
_mejs2.default.Features.supportsPointerEvents = SUPPORT_POINTER_EVENTS;
_mejs2.default.Features.supportsPassiveEvent = SUPPORT_PASSIVE_EVENT;
_mejs2.default.Features.hasiOSFullScreen = HAS_IOS_FULLSCREEN;
_mejs2.default.Features.hasNativeFullscreen = HAS_NATIVE_FULLSCREEN;
_mejs2.default.Features.hasWebkitNativeFullScreen = HAS_WEBKIT_NATIVE_FULLSCREEN;
_mejs2.default.Features.hasMozNativeFullScreen = HAS_MOZ_NATIVE_FULLSCREEN;
_mejs2.default.Features.hasMsNativeFullScreen = HAS_MS_NATIVE_FULLSCREEN;
_mejs2.default.Features.hasTrueNativeFullScreen = HAS_TRUE_NATIVE_FULLSCREEN;
_mejs2.default.Features.nativeFullScreenEnabled = HAS_NATIVE_FULLSCREEN_ENABLED;
_mejs2.default.Features.fullScreenEventName = FULLSCREEN_EVENT_NAME;
_mejs2.default.Features.isFullScreen = isFullScreen;
_mejs2.default.Features.requestFullScreen = requestFullScreen;
_mejs2.default.Features.cancelFullScreen = cancelFullScreen;

},{"2":2,"3":3,"7":7}],26:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.removeClass = exports.addClass = exports.hasClass = undefined;
exports.loadScript = loadScript;
exports.offset = offset;
exports.toggleClass = toggleClass;
exports.fadeOut = fadeOut;
exports.fadeIn = fadeIn;
exports.siblings = siblings;
exports.visible = visible;
exports.ajax = ajax;

var _window = _dereq_(3);

var _window2 = _interopRequireDefault(_window);

var _document = _dereq_(2);

var _document2 = _interopRequireDefault(_document);

var _mejs = _dereq_(7);

var _mejs2 = _interopRequireDefault(_mejs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function loadScript(url) {
	return new Promise(function (resolve, reject) {
		var script = _document2.default.createElement('script');
		script.src = url;
		script.async = true;
		script.onload = function () {
			script.remove();
			resolve();
		};
		script.onerror = function () {
			script.remove();
			reject();
		};
		_document2.default.head.appendChild(script);
	});
}

function offset(el) {
	var rect = el.getBoundingClientRect(),
	    scrollLeft = _window2.default.pageXOffset || _document2.default.documentElement.scrollLeft,
	    scrollTop = _window2.default.pageYOffset || _document2.default.documentElement.scrollTop;
	return { top: rect.top + scrollTop, left: rect.left + scrollLeft };
}

var hasClassMethod = void 0,
    addClassMethod = void 0,
    removeClassMethod = void 0;

if ('classList' in _document2.default.documentElement) {
	hasClassMethod = function hasClassMethod(el, className) {
		return el.classList !== undefined && el.classList.contains(className);
	};
	addClassMethod = function addClassMethod(el, className) {
		return el.classList.add(className);
	};
	removeClassMethod = function removeClassMethod(el, className) {
		return el.classList.remove(className);
	};
} else {
	hasClassMethod = function hasClassMethod(el, className) {
		return new RegExp('\\b' + className + '\\b').test(el.className);
	};
	addClassMethod = function addClassMethod(el, className) {
		if (!hasClass(el, className)) {
			el.className += ' ' + className;
		}
	};
	removeClassMethod = function removeClassMethod(el, className) {
		el.className = el.className.replace(new RegExp('\\b' + className + '\\b', 'g'), '');
	};
}

var hasClass = exports.hasClass = hasClassMethod;
var addClass = exports.addClass = addClassMethod;
var removeClass = exports.removeClass = removeClassMethod;

function toggleClass(el, className) {
	hasClass(el, className) ? removeClass(el, className) : addClass(el, className);
}

function fadeOut(el) {
	var duration = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 400;
	var callback = arguments[2];

	if (!el.style.opacity) {
		el.style.opacity = 1;
    $('.mejs__title').get(0).style.opacity = 1;
	}

	var start = null;
	_window2.default.requestAnimationFrame(function animate(timestamp) {
		start = start || timestamp;
		var progress = timestamp - start;
		var opacity = parseFloat(1 - progress / duration, 2);
		el.style.opacity = opacity < 0 ? 0 : opacity;
    $('.mejs__title').get(0).style.opacity = opacity < 0 ? 0 : opacity;
		if (progress > duration) {
			if (callback && typeof callback === 'function') {
				callback();
			}
		} else {
			_window2.default.requestAnimationFrame(animate);
		}
	});
}

function fadeIn(el) {
	var duration = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 400;
	var callback = arguments[2];

	if (!el.style.opacity) {
		el.style.opacity = 0;
    $('.mejs__title').get(0).style.opacity = 0;
	}

	var start = null;
	_window2.default.requestAnimationFrame(function animate(timestamp) {
		start = start || timestamp;
		var progress = timestamp - start;
		var opacity = parseFloat(progress / duration, 2);
		el.style.opacity = opacity > 1 ? 1 : opacity;
    $('.mejs__title').get(0).style.opacity = opacity;
		if (progress > duration) {
			if (callback && typeof callback === 'function') {
				callback();
			}
		} else {
			_window2.default.requestAnimationFrame(animate);
		}
	});
}

function siblings(el, filter) {
	var siblings = [];
	el = el.parentNode.firstChild;
	do {
		if (!filter || filter(el)) {
			siblings.push(el);
		}
	} while (el = el.nextSibling);
	return siblings;
}

function visible(elem) {
	if (elem.getClientRects !== undefined && elem.getClientRects === 'function') {
		return !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length);
	}
	return !!(elem.offsetWidth || elem.offsetHeight);
}

function ajax(url, dataType, success, error) {
	var xhr = _window2.default.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');

	var type = 'application/x-www-form-urlencoded; charset=UTF-8',
	    completed = false,
	    accept = '*/'.concat('*');

	switch (dataType) {
		case 'text':
			type = 'text/plain';
			break;
		case 'json':
			type = 'application/json, text/javascript';
			break;
		case 'html':
			type = 'text/html';
			break;
		case 'xml':
			type = 'application/xml, text/xml';
			break;
	}

	if (type !== 'application/x-www-form-urlencoded') {
		accept = type + ', */*; q=0.01';
	}

	if (xhr) {
		xhr.open('GET', url, true);
		xhr.setRequestHeader('Accept', accept);
		xhr.onreadystatechange = function () {
			if (completed) {
				return;
			}

			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					completed = true;
					var data = void 0;
					switch (dataType) {
						case 'json':
							data = JSON.parse(xhr.responseText);
							break;
						case 'xml':
							data = xhr.responseXML;
							break;
						default:
							data = xhr.responseText;
							break;
					}
					success(data);
				} else if (typeof error === 'function') {
					error(xhr.status);
				}
			}
		};

		xhr.send();
	}
}

_mejs2.default.Utils = _mejs2.default.Utils || {};
_mejs2.default.Utils.offset = offset;
_mejs2.default.Utils.hasClass = hasClass;
_mejs2.default.Utils.addClass = addClass;
_mejs2.default.Utils.removeClass = removeClass;
_mejs2.default.Utils.toggleClass = toggleClass;
_mejs2.default.Utils.fadeIn = fadeIn;
_mejs2.default.Utils.fadeOut = fadeOut;
_mejs2.default.Utils.siblings = siblings;
_mejs2.default.Utils.visible = visible;
_mejs2.default.Utils.ajax = ajax;
_mejs2.default.Utils.loadScript = loadScript;

},{"2":2,"3":3,"7":7}],27:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.escapeHTML = escapeHTML;
exports.debounce = debounce;
exports.isObjectEmpty = isObjectEmpty;
exports.splitEvents = splitEvents;
exports.createEvent = createEvent;
exports.isNodeAfter = isNodeAfter;
exports.isString = isString;

var _mejs = _dereq_(7);

var _mejs2 = _interopRequireDefault(_mejs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function escapeHTML(input) {

	if (typeof input !== 'string') {
		throw new Error('Argument passed must be a string');
	}

	var map = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;'
	};

	return input.replace(/[&<>"]/g, function (c) {
		return map[c];
	});
}

function debounce(func, wait) {
	var _this = this,
	    _arguments = arguments;

	var immediate = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;


	if (typeof func !== 'function') {
		throw new Error('First argument must be a function');
	}

	if (typeof wait !== 'number') {
		throw new Error('Second argument must be a numeric value');
	}

	var timeout = void 0;
	return function () {
		var context = _this,
		    args = _arguments;
		var later = function later() {
			timeout = null;
			if (!immediate) {
				func.apply(context, args);
			}
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);

		if (callNow) {
			func.apply(context, args);
		}
	};
}

function isObjectEmpty(instance) {
	return Object.getOwnPropertyNames(instance).length <= 0;
}

function splitEvents(events, id) {
	var rwindow = /^((after|before)print|(before)?unload|hashchange|message|o(ff|n)line|page(hide|show)|popstate|resize|storage)\b/;

	var ret = { d: [], w: [] };
	(events || '').split(' ').forEach(function (v) {
		var eventName = '' + v + (id ? '.' + id : '');

		if (eventName.startsWith('.')) {
			ret.d.push(eventName);
			ret.w.push(eventName);
		} else {
			ret[rwindow.test(v) ? 'w' : 'd'].push(eventName);
		}
	});

	ret.d = ret.d.join(' ');
	ret.w = ret.w.join(' ');
	return ret;
}

function createEvent(eventName, target) {

	if (typeof eventName !== 'string') {
		throw new Error('Event name must be a string');
	}

	var eventFrags = eventName.match(/([a-z]+\.([a-z]+))/i),
	    detail = {
		target: target
	};

	if (eventFrags !== null) {
		eventName = eventFrags[1];
		detail.namespace = eventFrags[2];
	}

	return new window.CustomEvent(eventName, {
		detail: detail
	});
}

function isNodeAfter(sourceNode, targetNode) {

	return !!(sourceNode && targetNode && sourceNode.compareDocumentPosition(targetNode) & 2);
}

function isString(value) {
	return typeof value === 'string';
}

_mejs2.default.Utils = _mejs2.default.Utils || {};
_mejs2.default.Utils.escapeHTML = escapeHTML;
_mejs2.default.Utils.debounce = debounce;
_mejs2.default.Utils.isObjectEmpty = isObjectEmpty;
_mejs2.default.Utils.splitEvents = splitEvents;
_mejs2.default.Utils.createEvent = createEvent;
_mejs2.default.Utils.isNodeAfter = isNodeAfter;
_mejs2.default.Utils.isString = isString;

},{"7":7}],28:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.typeChecks = undefined;
exports.absolutizeUrl = absolutizeUrl;
exports.formatType = formatType;
exports.getMimeFromType = getMimeFromType;
exports.getTypeFromFile = getTypeFromFile;
exports.getExtension = getExtension;
exports.normalizeExtension = normalizeExtension;

var _mejs = _dereq_(7);

var _mejs2 = _interopRequireDefault(_mejs);

var _general = _dereq_(27);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var typeChecks = exports.typeChecks = [];

function absolutizeUrl(url) {

	if (typeof url !== 'string') {
		throw new Error('`url` argument must be a string');
	}

	var el = document.createElement('div');
	el.innerHTML = '<a href="' + (0, _general.escapeHTML)(url) + '">x</a>';
	return el.firstChild.href;
}

function formatType(url) {
	var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

	return url && !type ? getTypeFromFile(url) : type;
}

function getMimeFromType(type) {

	if (typeof type !== 'string') {
		throw new Error('`type` argument must be a string');
	}

	return type && type.indexOf(';') > -1 ? type.substr(0, type.indexOf(';')) : type;
}

function getTypeFromFile(url) {

	if (typeof url !== 'string') {
		throw new Error('`url` argument must be a string');
	}

	for (var i = 0, total = typeChecks.length; i < total; i++) {
		var type = typeChecks[i](url);

		if (type) {
			return type;
		}
	}

	var ext = getExtension(url),
	    normalizedExt = normalizeExtension(ext);

	var mime = 'video/mp4';

	if (normalizedExt) {
		if (~['mp4', 'm4v', 'ogg', 'ogv', 'webm', 'flv', 'mpeg', 'mov'].indexOf(normalizedExt)) {
			mime = 'video/' + normalizedExt;
		} else if (~['mp3', 'oga', 'wav', 'mid', 'midi'].indexOf(normalizedExt)) {
			mime = 'audio/' + normalizedExt;
		}
	}

	return mime;
}

function getExtension(url) {

	if (typeof url !== 'string') {
		throw new Error('`url` argument must be a string');
	}

	var baseUrl = url.split('?')[0],
	    baseName = baseUrl.split('\\').pop().split('/').pop();
	return ~baseName.indexOf('.') ? baseName.substring(baseName.lastIndexOf('.') + 1) : '';
}

function normalizeExtension(extension) {

	if (typeof extension !== 'string') {
		throw new Error('`extension` argument must be a string');
	}

	switch (extension) {
		case 'mp4':
		case 'm4v':
			return 'mp4';
		case 'webm':
		case 'webma':
		case 'webmv':
			return 'webm';
		case 'ogg':
		case 'oga':
		case 'ogv':
			return 'ogg';
		default:
			return extension;
	}
}

_mejs2.default.Utils = _mejs2.default.Utils || {};
_mejs2.default.Utils.typeChecks = typeChecks;
_mejs2.default.Utils.absolutizeUrl = absolutizeUrl;
_mejs2.default.Utils.formatType = formatType;
_mejs2.default.Utils.getMimeFromType = getMimeFromType;
_mejs2.default.Utils.getTypeFromFile = getTypeFromFile;
_mejs2.default.Utils.getExtension = getExtension;
_mejs2.default.Utils.normalizeExtension = normalizeExtension;

},{"27":27,"7":7}],29:[function(_dereq_,module,exports){
'use strict';

var _document = _dereq_(2);

var _document2 = _interopRequireDefault(_document);

var _promisePolyfill = _dereq_(4);

var _promisePolyfill2 = _interopRequireDefault(_promisePolyfill);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(function (arr) {
	arr.forEach(function (item) {
		if (item.hasOwnProperty('remove')) {
			return;
		}
		Object.defineProperty(item, 'remove', {
			configurable: true,
			enumerable: true,
			writable: true,
			value: function remove() {
				this.parentNode.removeChild(this);
			}
		});
	});
})([Element.prototype, CharacterData.prototype, DocumentType.prototype]);

(function () {

	if (typeof window.CustomEvent === 'function') {
		return false;
	}

	function CustomEvent(event, params) {
		params = params || { bubbles: false, cancelable: false, detail: undefined };
		var evt = _document2.default.createEvent('CustomEvent');
		evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
		return evt;
	}

	CustomEvent.prototype = window.Event.prototype;
	window.CustomEvent = CustomEvent;
})();

if (typeof Object.assign !== 'function') {
	Object.assign = function (target) {

		if (target === null || target === undefined) {
			throw new TypeError('Cannot convert undefined or null to object');
		}

		var to = Object(target);

		for (var index = 1, total = arguments.length; index < total; index++) {
			var nextSource = arguments[index];

			if (nextSource !== null) {
				for (var nextKey in nextSource) {
					if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
						to[nextKey] = nextSource[nextKey];
					}
				}
			}
		}
		return to;
	};
}

if (!String.prototype.startsWith) {
	String.prototype.startsWith = function (searchString, position) {
		position = position || 0;
		return this.substr(position, searchString.length) === searchString;
	};
}

if (!Element.prototype.matches) {
	Element.prototype.matches = Element.prototype.matchesSelector || Element.prototype.mozMatchesSelector || Element.prototype.msMatchesSelector || Element.prototype.oMatchesSelector || Element.prototype.webkitMatchesSelector || function (s) {
		var matches = (this.document || this.ownerDocument).querySelectorAll(s),
		    i = matches.length - 1;
		while (--i >= 0 && matches.item(i) !== this) {}
		return i > -1;
	};
}

if (window.Element && !Element.prototype.closest) {
	Element.prototype.closest = function (s) {
		var matches = (this.document || this.ownerDocument).querySelectorAll(s),
		    i = void 0,
		    el = this;
		do {
			i = matches.length;
			while (--i >= 0 && matches.item(i) !== el) {}
		} while (i < 0 && (el = el.parentElement));
		return el;
	};
}

(function () {
	var lastTime = 0;
	var vendors = ['ms', 'moz', 'webkit', 'o'];
	for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
		window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
	}

	if (!window.requestAnimationFrame) window.requestAnimationFrame = function (callback) {
		var currTime = new Date().getTime();
		var timeToCall = Math.max(0, 16 - (currTime - lastTime));
		var id = window.setTimeout(function () {
			callback(currTime + timeToCall);
		}, timeToCall);
		lastTime = currTime + timeToCall;
		return id;
	};

	if (!window.cancelAnimationFrame) window.cancelAnimationFrame = function (id) {
		clearTimeout(id);
	};
})();

if (/firefox/i.test(navigator.userAgent)) {
	var getComputedStyle = window.getComputedStyle;
	window.getComputedStyle = function (el, pseudoEl) {
		var t = getComputedStyle(el, pseudoEl);
		return t === null ? { getPropertyValue: function getPropertyValue() {} } : t;
	};
}

if (!window.Promise) {
	window.Promise = _promisePolyfill2.default;
}

(function (constructor) {
	if (constructor && constructor.prototype && constructor.prototype.children === null) {
		Object.defineProperty(constructor.prototype, 'children', {
			get: function get() {
				var i = 0,
				    node = void 0,
				    nodes = this.childNodes,
				    children = [];
				while (node = nodes[i++]) {
					if (node.nodeType === 1) {
						children.push(node);
					}
				}
				return children;
			}
		});
	}
})(window.Node || window.Element);

},{"2":2,"4":4}],30:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.isDropFrame = isDropFrame;
exports.secondsToTimeCode = secondsToTimeCode;
exports.timeCodeToSeconds = timeCodeToSeconds;
exports.calculateTimeFormat = calculateTimeFormat;
exports.convertSMPTEtoSeconds = convertSMPTEtoSeconds;

var _mejs = _dereq_(7);

var _mejs2 = _interopRequireDefault(_mejs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function isDropFrame() {
	var fps = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 25;

	return !(fps % 1 === 0);
}
function secondsToTimeCode(time) {
	var forceHours = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
	var showFrameCount = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
	var fps = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 25;
	var secondsDecimalLength = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
	var timeFormat = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 'hh:mm:ss';


	time = !time || typeof time !== 'number' || time < 0 ? 0 : time;

	var dropFrames = Math.round(fps * 0.066666),
	    timeBase = Math.round(fps),
	    framesPer24Hours = Math.round(fps * 3600) * 24,
	    framesPer10Minutes = Math.round(fps * 600),
	    frameSep = isDropFrame(fps) ? ';' : ':',
	    hours = void 0,
	    minutes = void 0,
	    seconds = void 0,
	    frames = void 0,
	    f = Math.round(time * fps);

	if (isDropFrame(fps)) {

		if (f < 0) {
			f = framesPer24Hours + f;
		}

		f = f % framesPer24Hours;

		var d = Math.floor(f / framesPer10Minutes);
		var m = f % framesPer10Minutes;
		f = f + dropFrames * 9 * d;
		if (m > dropFrames) {
			f = f + dropFrames * Math.floor((m - dropFrames) / Math.round(timeBase * 60 - dropFrames));
		}

		var timeBaseDivision = Math.floor(f / timeBase);

		hours = Math.floor(Math.floor(timeBaseDivision / 60) / 60);
		minutes = Math.floor(timeBaseDivision / 60) % 60;

		if (showFrameCount) {
			seconds = timeBaseDivision % 60;
		} else {
			seconds = Math.floor(f / timeBase % 60).toFixed(secondsDecimalLength);
		}
	} else {
		hours = Math.floor(time / 3600) % 24;
		minutes = Math.floor(time / 60) % 60;
		if (showFrameCount) {
			seconds = Math.floor(time % 60);
		} else {
			seconds = Math.floor(time % 60).toFixed(secondsDecimalLength);
		}
	}
	hours = hours <= 0 ? 0 : hours;
	minutes = minutes <= 0 ? 0 : minutes;
	seconds = seconds <= 0 ? 0 : seconds;

	seconds = seconds === 60 ? 0 : seconds;
	minutes = minutes === 60 ? 0 : minutes;

	var timeFormatFrags = timeFormat.split(':');
	var timeFormatSettings = {};
	for (var i = 0, total = timeFormatFrags.length; i < total; ++i) {
		var unique = '';
		for (var j = 0, t = timeFormatFrags[i].length; j < t; j++) {
			if (unique.indexOf(timeFormatFrags[i][j]) < 0) {
				unique += timeFormatFrags[i][j];
			}
		}
		if (~['f', 's', 'm', 'h'].indexOf(unique)) {
			timeFormatSettings[unique] = timeFormatFrags[i].length;
		}
	}

	var result = forceHours || hours > 0 ? (hours < 10 && timeFormatSettings.h > 1 ? '0' + hours : hours) + ':' : '';
	result += (minutes < 10 && timeFormatSettings.m > 1 ? '0' + minutes : minutes) + ':';
	result += '' + (seconds < 10 && timeFormatSettings.s > 1 ? '0' + seconds : seconds);

	if (showFrameCount) {
		frames = (f % timeBase).toFixed(0);
		frames = frames <= 0 ? 0 : frames;
		result += frames < 10 && timeFormatSettings.f ? frameSep + '0' + frames : '' + frameSep + frames;
	}

	return result;
}

function timeCodeToSeconds(time) {
	var fps = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 25;


	if (typeof time !== 'string') {
		throw new TypeError('Time must be a string');
	}

	if (time.indexOf(';') > 0) {
		time = time.replace(';', ':');
	}

	if (!/\d{2}(\:\d{2}){0,3}/i.test(time)) {
		throw new TypeError('Time code must have the format `00:00:00`');
	}

	var parts = time.split(':');

	var output = void 0,
	    hours = 0,
	    minutes = 0,
	    seconds = 0,
	    frames = 0,
	    totalMinutes = 0,
	    dropFrames = Math.round(fps * 0.066666),
	    timeBase = Math.round(fps),
	    hFrames = timeBase * 3600,
	    mFrames = timeBase * 60;

	switch (parts.length) {
		default:
		case 1:
			seconds = parseInt(parts[0], 10);
			break;
		case 2:
			minutes = parseInt(parts[0], 10);
			seconds = parseInt(parts[1], 10);
			break;
		case 3:
			hours = parseInt(parts[0], 10);
			minutes = parseInt(parts[1], 10);
			seconds = parseInt(parts[2], 10);
			break;
		case 4:
			hours = parseInt(parts[0], 10);
			minutes = parseInt(parts[1], 10);
			seconds = parseInt(parts[2], 10);
			frames = parseInt(parts[3], 10);
			break;
	}

	if (isDropFrame(fps)) {
		totalMinutes = 60 * hours + minutes;
		output = hFrames * hours + mFrames * minutes + timeBase * seconds + frames - dropFrames * (totalMinutes - Math.floor(totalMinutes / 10));
	} else {
		output = (hFrames * hours + mFrames * minutes + fps * seconds + frames) / fps;
	}

	return parseFloat(output.toFixed(3));
}

function calculateTimeFormat(time, options) {
	var fps = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 25;


	time = !time || typeof time !== 'number' || time < 0 ? 0 : time;

	var hours = Math.floor(time / 3600) % 24,
	    minutes = Math.floor(time / 60) % 60,
	    seconds = Math.floor(time % 60),
	    frames = Math.floor((time % 1 * fps).toFixed(3)),
	    lis = [[frames, 'f'], [seconds, 's'], [minutes, 'm'], [hours, 'h']];

	var format = options.timeFormat,
	    firstTwoPlaces = format[1] === format[0],
	    separatorIndex = firstTwoPlaces ? 2 : 1,
	    separator = format.length < separatorIndex ? format[separatorIndex] : ':',
	    firstChar = format[0],
	    required = false;

	for (var i = 0, len = lis.length; i < len; i++) {
		if (~format.indexOf(lis[i][1])) {
			required = true;
		} else if (required) {
			var hasNextValue = false;
			for (var j = i; j < len; j++) {
				if (lis[j][0] > 0) {
					hasNextValue = true;
					break;
				}
			}

			if (!hasNextValue) {
				break;
			}

			if (!firstTwoPlaces) {
				format = firstChar + format;
			}
			format = lis[i][1] + separator + format;
			if (firstTwoPlaces) {
				format = lis[i][1] + format;
			}
			firstChar = lis[i][1];
		}
	}

	options.timeFormat = format;
}

function convertSMPTEtoSeconds(SMPTE) {

	if (typeof SMPTE !== 'string') {
		throw new TypeError('Argument must be a string value');
	}

	SMPTE = SMPTE.replace(',', '.');

	var decimalLen = ~SMPTE.indexOf('.') ? SMPTE.split('.')[1].length : 0;

	var secs = 0,
	    multiplier = 1;

	SMPTE = SMPTE.split(':').reverse();

	for (var i = 0, total = SMPTE.length; i < total; i++) {
		multiplier = 1;
		if (i > 0) {
			multiplier = Math.pow(60, i);
		}
		secs += Number(SMPTE[i]) * multiplier;
	}
	return Number(secs.toFixed(decimalLen));
}

_mejs2.default.Utils = _mejs2.default.Utils || {};
_mejs2.default.Utils.secondsToTimeCode = secondsToTimeCode;
_mejs2.default.Utils.timeCodeToSeconds = timeCodeToSeconds;
_mejs2.default.Utils.calculateTimeFormat = calculateTimeFormat;
_mejs2.default.Utils.convertSMPTEtoSeconds = convertSMPTEtoSeconds;

},{"7":7}]},{},[29,6,5,15,23,20,19,21,22,24,16,18,17,9,10,11,12,13,14]);
