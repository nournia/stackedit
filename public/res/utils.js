define([
	"jquery",
	"underscore"
], function($, _) {

	var utils = {};

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

	// Reset input control in all modals
	utils.resetModalInputs = function() {
		$(".modal input[type=text]:not([disabled]), .modal input[type=password], .modal textarea").val("");
		$(".modal input[type=checkbox]").prop("checked", false).change();
	};

	// Basic trim function
	utils.trim = function(str) {
		return $.trim(str);
	};

	return utils;
});
