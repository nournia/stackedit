define([
	"jquery",
	"underscore",
	"mousetrap"
], function($, _, mousetrap) {

	var eventMgr = {};


	/* markdownSectionParser */
	// Regexp to look for section delimiters
	var regexp = '^.+[ \\t]*\\n=+[ \\t]*\\n+|^.+[ \\t]*\\n-+[ \\t]*\\n+|^\\#{1,6}[ \\t]*.+?[ \\t]*\\#*\\n+'; // Title delimiters
	regexp = '^```.*\\n[\\s\\S]*?\\n```|' + regexp; // Fenced block delimiters
	regexp = new RegExp(regexp, 'gm');

	var sectionList = [];
	var sectionCounter = 0;

	eventMgr.onContentChanged = function(content) {
		var text = content;
		var tmpText = text + "\n\n";
		function addSection(startOffset, endOffset) {
			var sectionText = tmpText.substring(offset, endOffset);
			sectionList.push({
				id: ++sectionCounter,
				text: sectionText,
				textWithFrontMatter: sectionText
			});
		}
		sectionList = [];
		var offset = 0;
		// Look for delimiters
		tmpText.replace(regexp, function(match, matchOffset) {
			// Create a new section with the text preceding the delimiter
			addSection(offset, matchOffset);
			offset = matchOffset;
		});
		// Last section
		addSection(offset, text.length);
		eventMgr.onSectionsCreated(sectionList);
	}
	/* markdownSectionParser */


	/* shortcuts */
	var shortcuts = {extensionId: "shortcuts"};
	shortcuts.settingsBlock = '';
	shortcuts.defaultConfig = {
		mapping: {
			'mod+b': bindPagedownButton('bold'),
			'mod+i': bindPagedownButton('italic'),
			'mod+l': bindPagedownButton('link'),
			'mod+q': bindPagedownButton('quote'),
			'mod+k': bindPagedownButton('code'),
			'mod+g': bindPagedownButton('image'),
			'mod+o': bindPagedownButton('olist'),
			'mod+u': bindPagedownButton('ulist'),
			'mod+h': bindPagedownButton('heading'),
			'mod+r': bindPagedownButton('hr'),
			'mod+z': bindPagedownButton('undo'),
			'mod+y': bindPagedownButton('redo'),
			'mod+shift+z': bindPagedownButton('redo')
		}
	};
	_.each(shortcuts.defaultConfig.mapping, function(func, shortcut) {
		mousetrap.bind(shortcut, func);
	});

	var pagedownEditor;
	function bindPagedownButton(buttonName) {
		return function(evt) {
			pagedownEditor.uiManager.doClick(pagedownEditor.uiManager.buttons[buttonName]);
			evt.preventDefault();
		};
	}
	/* shortcuts */


	var extensionList = [shortcuts];

	// Returns all listeners with the specified name that are implemented in the 	enabled extensions
	function getExtensionListenerList(eventName) {
		return _.chain(extensionList).map(function(extension) {
			return extension[eventName];
		}).compact().value();
	}

	// Returns a function that calls every listeners with the specified name from all enabled extensions
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

	// Operations on editor
	addEventHook("onPagedownConfigure");
	addEventHook("onSectionsCreated");

	var onReady = createEventHook("onReady");
	eventMgr.onReady = function() {
		onReady();
	};

	eventMgr.addListener('onPagedownConfigure', function(pagedownEditorParam) {
		pagedownEditor = pagedownEditorParam;
	});

	return eventMgr;
});
