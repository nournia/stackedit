define([
	"jquery",
	"underscore"
], function($, _) {

	var eventMgr = {};
	// Returns a function that calls every listeners with the specified name from all enabled extensions
	var eventListenerListMap = {};

	function createEventHook(eventName) {
		eventListenerListMap[eventName] = [];
		return function() {
			var eventArguments = arguments;
			_.each(eventListenerListMap[eventName], function(listener) {
				// Use try/catch in case userCustom listener contains error
				try {
					listener.apply(null, eventArguments);
				}
				catch(e) {
					console.error(_.isObject(e) ? e.stack : e);
				}
			});
		};
	}

	// Declare an event Hook in the eventMgr that we can fire using eventMgr.eventName()
	function addEventHook(eventName) {
		eventMgr[eventName] = createEventHook(eventName);
	}

	// Used by external modules (not extensions) to listen to events
	eventMgr.addListener = function(eventName, listener) {
		try {
			eventListenerListMap[eventName].push(listener);
		}
		catch(e) {
			console.error('No event listener called ' + eventName);
		}
	};

	var onReady = createEventHook("onReady");
	eventMgr.onReady = function() {
		onReady();
	};

	return eventMgr;
});
