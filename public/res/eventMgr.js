define([
	"jquery",
	"underscore",
	"mousetrap",
	"classes/Extension",
	"extensions/markdownSectionParser",
	"extensions/shortcuts"
], function($, _, mousetrap, Extension) {

	var eventMgr = {};

	// Create a list of extensions from module arguments
	var extensionList = _.chain(arguments).map(function(argument) {
		return argument instanceof Extension && argument;
	}).compact().value();

	// Configure extensions
	var extensionSettings = {};
	_.each(extensionList, function(extension) {
		// Set the extension.config attribute from settings or default
		// configuration
		extension.config = _.extend({}, extension.defaultConfig, extensionSettings[extension.extensionId]);
		if(window.viewerMode === true && extension.disableInViewer === true) {
			// Skip enabling the extension if we are in the viewer and extension
			// doesn't support it
			extension.enabled = false;
		}
		else {
			// Enable the extension if it's not optional or it has not been
			// disabled by the user
			extension.enabled = !extension.isOptional || extension.config.enabled === undefined || extension.config.enabled === true;
		}
	});

	// Returns all listeners with the specified name that are implemented in the
	// enabled extensions
	function getExtensionListenerList(eventName) {
		return _.chain(extensionList).map(function(extension) {
			return extension.enabled && extension[eventName];
		}).compact().value();
	}

	// Returns a function that calls every listeners with the specified name
	// from all enabled extensions
	var eventListenerListMap = {};

	function createEventHook(eventName) {
		eventListenerListMap[eventName] = getExtensionListenerList(eventName);
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

	// Call every onInit listeners (enabled extensions only)
	createEventHook("onInit")();

	addEventHook("onError");

	// To access modules that are loaded after extensions
	addEventHook("onEditorCreated");
	addEventHook("onEventMgrCreated");

	// Operations on files
	addEventHook("onContentChanged");

	// Operations on editor
	addEventHook("onPagedownConfigure");
	addEventHook("onSectionsCreated");

	var onReady = createEventHook("onReady");
	eventMgr.onReady = function() {
		onReady();
	};

	// For extensions that need to call other extensions
	eventMgr.onEventMgrCreated(eventMgr);
	return eventMgr;
});
