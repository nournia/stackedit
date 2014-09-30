define([
	"jquery",
	"underscore",
	"mousetrap"
], function($, _, mousetrap) {

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

	var eventMgr;
	var pagedownEditor;
	shortcuts.onEventMgrCreated = function(eventMgrParameter) {
		eventMgr = eventMgrParameter;
		eventMgr.addListener('onPagedownConfigure', function(pagedownEditorParam) {
			pagedownEditor = pagedownEditorParam;
		});
	};

	/*jshint unused:false */
	function bindPagedownButton(buttonName) {
		return function(evt) {
			pagedownEditor.uiManager.doClick(pagedownEditor.uiManager.buttons[buttonName]);
			evt.preventDefault();
		};
	}

	shortcuts.onInit = function() {
		var shortcutMap = shortcuts.config.mapping;
		_.each(shortcutMap, function(func, shortcut) {
			mousetrap.bind(shortcut, func);
		});
	};

	return shortcuts;
});
