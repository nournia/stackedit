define([
	"jquery",
	"underscore",
	"utils",
	"mousetrap",
	"classes/Extension"
], function($, _, utils, mousetrap, Extension) {

	var shortcuts = new Extension("shortcuts", "Shortcuts", true, true);
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

	var eventMgr;
	var pagedownEditor;
	shortcuts.onEventMgrCreated = function(eventMgrParameter) {
		eventMgr = eventMgrParameter;
		eventMgr.addListener('onPagedownConfigure', function(pagedownEditorParam) {
			pagedownEditor = pagedownEditorParam;
		});
	};

	shortcuts.onLoadSettings = function() {
		utils.setInputValue("#textarea-shortcuts-mapping", shortcuts.config.mapping);
	};

	shortcuts.onSaveSettings = function(newConfig, event) {
		newConfig.code = utils.getInputValue("#textarea-shortcuts-mapping");
		try {
			/*jshint evil: true */
			eval('var test = ' + newConfig.code);
		}
		catch(e) {
			eventMgr.onError(e);
			// Mark the textarea as error
			utils.getInputTextValue("#textarea-shortcuts-mapping", event, /^$/);
		}
	};

	/*jshint unused:false */
	function bindPagedownButton(buttonName) {
		return function(evt) {
			pagedownEditor.uiManager.doClick(pagedownEditor.uiManager.buttons[buttonName]);
			evt.preventDefault();
		};
	}

	function expand(text, replacement) {
		utils.defer(function() {
			require('editor').replacePreviousText(text, replacement);
		});
	}

	/*jshint unused:true */
	shortcuts.onInit = function() {
		try {
			/*jshint evil: true */
			var shortcutMap;
			eval('shortcutMap = ' + shortcuts.config.mapping);
			_.each(shortcutMap, function(func, shortcut) {
				mousetrap.bind(shortcut, func);
			});
		}
		catch(e) {
			console.error(e);
		}
	};

	return shortcuts;
});
