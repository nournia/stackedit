define([
	"jquery",
	"underscore",
	"storage",
	"crel"
], function($, _, storage, crel) {

	var utils = {};

	utils.msie = (function() {
		/**
		 * IE 11 changed the format of the UserAgent string.
		 * See http://msdn.microsoft.com/en-us/library/ms537503.aspx
		 */
		var msie = parseInt((/msie (\d+)/.exec(navigator.userAgent.toLowerCase()) || [])[1], 10);
		if (isNaN(msie)) {
			msie = parseInt((/trident\/.*; rv:(\d+)/.exec(navigator.userAgent.toLowerCase()) || [])[1], 10);
		}
		return msie;
	})();

	utils.urlResolve = (function() {
		var urlParsingNode = document.createElement("a");
		return function urlResolve(url) {
			var href = url;

			if (utils.msie) {
				// Normalize before parse.  Refer Implementation Notes on why this is
				// done in two steps on IE.
				urlParsingNode.setAttribute("href", href);
				href = urlParsingNode.href;
			}

			urlParsingNode.setAttribute('href', href);

			// urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
			return {
				href: urlParsingNode.href,
				protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
				host: urlParsingNode.host,
				search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
				hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
				hostname: urlParsingNode.hostname,
				port: urlParsingNode.port,
				pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
					urlParsingNode.pathname : '/' + urlParsingNode.pathname
			};
		};
	})();

	// Faster than setTimeout (see http://dbaron.org/log/20100309-faster-timeouts)
	utils.defer = (function() {
		var timeouts = [];
		var messageName = "deferMsg";
		window.addEventListener("message", function(evt) {
			if(evt.source == window && evt.data == messageName) {
				evt.stopPropagation();
				if(timeouts.length > 0) {
					timeouts.shift()();
				}
			}
		}, true);
		return function(fn) {
			timeouts.push(fn);
			window.postMessage(messageName, "*");
		};
	})();

	// Implements underscore debounce using our defer function
	utils.debounce = function(func, context) {
		var isExpected = false;

		function later() {
			isExpected = false;
			func.call(context);
		}

		return function() {
			if(isExpected === true) {
				return;
			}
			isExpected = true;
			utils.defer(later);
		};
	};

	// Generates a 24 chars length random string (should be enough to prevent collisions)
	utils.randomString = (function() {
		var max = Math.pow(36, 6);

		function s6() {
			// Linear [0-9a-z]{6} random string
			return ('000000' + (Math.random() * max | 0).toString(36)).slice(-6);
		}

		return function() {
			return [
				s6(),
				s6(),
				s6(),
				s6()
			].join('');
		};
	})();

	// Return a parameter from the URL
	utils.getURLParameter = function(name) {
		// Parameter can be either a search parameter (&name=...) or a hash fragment parameter (#!name=...)
		var regex = new RegExp("(?:\\?|\\#\\!|&)" + name + "=(.+?)(?:&|\\#|$)");
		try {
			return decodeURIComponent(regex.exec(location.search + location.hash)[1]);
		}
		catch(e) {
			return undefined;
		}
	};

	// Transform a selector into a jQuery object
	function jqElt(element) {
		if(_.isString(element) || !element.val) {
			return $(element);
		}
		return element;
	}

	// For input control
	function inputError(element, event) {
		if(event !== undefined) {
			element.stop(true, true).addClass("error").delay(3000).queue(function() {
				$(this).removeClass("error");
				$(this).dequeue();
			});
			event.stopPropagation();
		}
	}

	// Return input value
	utils.getInputValue = function(element) {
		element = jqElt(element);
		return element.val();
	};

	// Set input value
	utils.setInputValue = function(element, value) {
		element = jqElt(element);
		element.val(value);
	};

	// Return input text value
	utils.getInputTextValue = function(element, event, validationRegex) {
		element = jqElt(element);
		var value = element.val();
		if(value === undefined) {
			inputError(element, event);
			return undefined;
		}
		// trim
		value = utils.trim(value);
		if((value.length === 0) || (validationRegex !== undefined && !value.match(validationRegex))) {
			inputError(element, event);
			return undefined;
		}
		return value;
	};

	// Return input number value
	function getInputNumValue(isFloat, element, event, min, max) {
		element = jqElt(element);
		var value = utils.getInputTextValue(element, event);
		if(value === undefined) {
			return undefined;
		}
		value = isFloat ? parseFloat(value) : parseInt(value, 10);
		if(isNaN(value) || (min !== undefined && value < min) || (max !== undefined && value > max)) {
			inputError(element, event);
			return undefined;
		}
		return value;
	}

	// Return input integer value
	utils.getInputIntValue = _.partial(getInputNumValue, false);

	// Return input float value
	utils.getInputFloatValue = _.partial(getInputNumValue, true);

	// Return input value and check that it's a valid RegExp
	utils.getInputRegExpValue = function(element, event) {
		element = jqElt(element);
		var value = utils.getInputTextValue(element, event);
		if(value === undefined) {
			return undefined;
		}
		try {
			new RegExp(value);
		}
		catch(e) {
			inputError(element, event);
			return undefined;
		}
		return value;
	};

	// Return input value and check that it's a valid JavaScript object
	utils.getInputJsValue = function(element, event) {
		element = jqElt(element);
		var value = utils.getInputTextValue(element, event);
		if(value === undefined) {
			return undefined;
		}
		try {
			/*jshint evil:true */
			eval("var test=" + value);
			/*jshint evil:false */
		}
		catch(e) {
			inputError(element, event);
			return undefined;
		}
		return value;
	};

	// Return input value and check that it's a valid JSON
	utils.getInputJSONValue = function(element, event) {
		element = jqElt(element);
		var value = utils.getInputTextValue(element, event);
		if(value === undefined) {
			return undefined;
		}
		try {
			JSON.parse(value);
		}
		catch(e) {
			inputError(element, event);
			return undefined;
		}
		return value;
	};

	// Return checkbox boolean value
	utils.getInputChecked = function(element) {
		element = jqElt(element);
		return element.prop("checked");
	};

	// Set checkbox state
	utils.setInputChecked = function(element, checked) {
		element = jqElt(element);
		element.prop("checked", checked).change();
	};

	// Get radio button value
	utils.getInputRadio = function(name) {
		return $("input:radio[name=" + name + "]:checked").prop("value");
	};

	// Set radio button value
	utils.setInputRadio = function(name, value) {
		$("input:radio[name=" + name + "][value=" + value + "]").prop("checked", true).change();
	};

	// Reset input control in all modals
	utils.resetModalInputs = function() {
		$(".modal input[type=text]:not([disabled]), .modal input[type=password], .modal textarea").val("");
		$(".modal input[type=checkbox]").prop("checked", false).change();
	};

	// Basic trim function
	utils.trim = function(str) {
		return $.trim(str);
	};

	// Slug function
	utils.slugify = function(text) {
		return text.toLowerCase().replace(/\s/g, '-') // Replace spaces with -
			.replace(/\-\-+/g, '-') // Replace multiple - with single -
			.replace(/^-+/, '') // Trim - from start of text
			.replace(/-+$/, ''); // Trim - from end of text
	};

	// Check an URL
	utils.checkUrl = function(url, addSlash) {
		if(!url) {
			return url;
		}
		if(url.indexOf("http") !== 0) {
			url = "http://" + url;
		}
		if(addSlash && url.indexOf("/", url.length - 1) === -1) {
			url += "/";
		}
		return url;
	};

	// Create the modal element and add to the body
	utils.addModal = function(id, content) {
		var modal = crel('div', {
			class: 'modal ' + id
		});
		modal.innerHTML = content;
		document.body.appendChild(modal);
	};

	// Create a backdrop and add to the body
	utils.createBackdrop = function(parent) {
		var result = crel('div', {
			'class': 'modal-backdrop fade'
		});
		parent = parent || document.body;
		parent.appendChild(result);
		result.offsetWidth; // force reflow
		result.className = result.className + ' in';
		result.removeBackdrop = function() {
			result.className = 'modal-backdrop fade';
			setTimeout(function() {
				result.parentNode.removeChild(result);
			}, 150);
		};
		return result;
	};

	// Create an centered popup window
	utils.popupWindow = function(url, title, width, height) {
		var left = (screen.width / 2) - (width / 2);
		var top = (screen.height / 2) - (height / 2);
		return window.open(url, title, [
			'toolbar=no, ',
			'location=no, ',
			'directories=no, ',
			'status=no, ',
			'menubar=no, ',
			'scrollbars=no, ',
			'resizable=no, ',
			'copyhistory=no, ',
			'width=' + width + ', ',
			'height=' + height + ', ',
			'top=' + top + ', ',
			'left=' + left
		].join(""));
	};

	// Shows a dialog to force the user to click a button before opening oauth popup
	var redirectCallbackConfirm;
	var redirectCallbackCancel;
	utils.redirectConfirm = function(message, callbackConfirm, callbackCancel) {
		redirectCallbackConfirm = callbackConfirm;
		redirectCallbackCancel = callbackCancel;
		$('.modal-redirect-confirm .redirect-msg').html(message);
		$('.modal-redirect-confirm').modal("show");
	};

	utils.init = function() {
		$('.action-redirect-confirm').click(function() {
			redirectCallbackCancel = undefined;
			redirectCallbackConfirm();
		});
		$('.modal-redirect-confirm').on('hidden.bs.modal', function() {
			_.defer(function() {
				redirectCallbackCancel && redirectCallbackCancel();
			});
		});
	};

	var entityMap = {
		"&": "&amp;",
		"<": "&lt;",
		//">": "&gt;",
		'"': '&quot;',
		"'": '&#39;',
		"/": '&#x2F;',
		"\u00a0": ' '
	};

	// Escape HTML entities
	utils.escape = function(str) {
		return String(str).replace(/[&<"'\/\u00a0]/g, function(s) {
			return entityMap[s];
		});
	};

	// Time shared by others modules
	utils.updateCurrentTime = function() {
		utils.currentTime = Date.now();
	};
	utils.updateCurrentTime();

	// Serialize sync/publish attributes and store it in the storage
	utils.storeAttributes = function(attributes) {
		var storeIndex = attributes.syncIndex || attributes.publishIndex;
		// Don't store sync/publish index
		var storedAttributes = _.omit(attributes, "syncIndex", "publishIndex", "provider");
		// Store providerId instead of provider
		storedAttributes.provider = attributes.provider.providerId;
		storage[storeIndex] = JSON.stringify(storedAttributes);
	};

	// Retrieve/parse an index array from storage
	utils.retrieveIndexArray = function(storeIndex) {
		try {
			return _.compact(storage[storeIndex].split(";"));
		}
		catch(e) {
			storage[storeIndex] = ";";
			return [];
		}
	};

	// Append an index to an array in storage
	utils.appendIndexToArray = function(storeIndex, index) {
		storage[storeIndex] += index + ";";
	};

	// Remove an index from an array in storage
	utils.removeIndexFromArray = function(storeIndex, index) {
		storage[storeIndex] = storage[storeIndex].replace(";" + index + ";", ";");
	};

	// Retrieve/parse an object from storage. Returns undefined if error.
	utils.retrieveIgnoreError = function(storeIndex) {
		try {
			return JSON.parse(storage[storeIndex]);
		}
		catch(e) {
			return undefined;
		}
	};

	var eventList = [];
	utils.logValue = function(value) {
		eventList.unshift(value);
		if(eventList.length > 5) {
			eventList.pop();
		}
	};
	utils.logStackTrace = function() {
		if(eventList.length > 5) {
			eventList.pop();
		}
	};
	utils.formatEventList = function() {
		var result = [];
		_.each(eventList, function(event) {
			result.push("\n");
			if(_.isString(event)) {
				result.push(event);
			}
			else if(_.isArray(event)) {
				result.push(event[5] || "");
				result.push(event[6] || "");
			}
		});
		return result.join("");
	};

	window.perfTest = function(cb) {
		var startTime = Date.now();
		for(var i = 0; i < 10000; i++) {
			cb();
		}
		console.log('Run 10,000 times in ' + (Date.now() - startTime) + 'ms');
	};

	return utils;
});
