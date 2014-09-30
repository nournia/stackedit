/*globals Markdown, requirejs */
define([
	"jquery",
	"editor",
	"eventMgr",
	"mousetrap"
], function($, editor, eventMgr, mousetrap) {

	var core = {};

	// Shortcuts mapping
	function bindPagedownButton(buttonName) {
		return function(evt) {
			pagedownEditor.uiManager.doClick(pagedownEditor.uiManager.buttons[buttonName]);
			evt.preventDefault();
		};
	}
	shortcutsMapping = {
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
	};

	// Create the PageDown editor
	var pagedownEditor;
	core.initEditor = function() {
		if(pagedownEditor !== undefined) {
			// If the editor is already created
			editor.undoMgr.init();
			return pagedownEditor.uiManager.setUndoRedoButtonStates();
		}

		// Create the converter and the editor
		pagedownEditor = new Markdown.Editor(undefined, {
			undoManager: editor.undoMgr
		});

		// Custom insert link dialog
		pagedownEditor.hooks.set("insertLinkDialog", function(callback) {
			core.insertLinkCallback = callback;
			$(".modal input[type=text]").val("");
			$(".modal-insert-link").modal();
			return true;
		});
		// Custom insert image dialog
		pagedownEditor.hooks.set("insertImageDialog", function(callback) {
			core.insertLinkCallback = callback;
			$(".modal input[type=text]").val("");
			$(".modal-insert-image").modal();
			return true;
		});


		pagedownEditor.run();
		editor.undoMgr.init();

		// Set shortcuts
		_.each(shortcutsMapping, function(func, shortcut) {
			mousetrap.bind(shortcut, func);
		});

		// Hide default buttons
		$(".wmd-button-row li").addClass("btn btn-success").css("left", 0).find("span").hide();

		// Add customized buttons
		var $btnGroupElt = $('.wmd-button-group1');
		$("#wmd-bold-button").append($('<span class="glyphicon glyphicon-bold">')).appendTo($btnGroupElt);
		$("#wmd-italic-button").append($('<span class="glyphicon glyphicon-italic">')).appendTo($btnGroupElt);
		$btnGroupElt = $('.wmd-button-group2');
		$("#wmd-link-button").append($('<span class="glyphicon glyphicon-link">')).appendTo($btnGroupElt);
		$("#wmd-quote-button").append($('<span class="glyphicon glyphicon-indent-right">')).appendTo($btnGroupElt);
		$("#wmd-code-button").append($('<span class="glyphicon glyphicon-align-justify">')).appendTo($btnGroupElt);
		$("#wmd-image-button").append($('<span class="glyphicon glyphicon-picture">')).appendTo($btnGroupElt);
		$btnGroupElt = $('.wmd-button-group3');
		$("#wmd-olist-button").append($('<span class="glyphicon glyphicon-list">')).appendTo($btnGroupElt);
		$("#wmd-ulist-button").append($('<span class="glyphicon glyphicon-list">')).appendTo($btnGroupElt);
		$("#wmd-heading-button").append($('<span class="glyphicon glyphicon-text-height">')).appendTo($btnGroupElt);
		$("#wmd-hr-button").append($('<span class="glyphicon glyphicon-minus">')).appendTo($btnGroupElt);
		$btnGroupElt = $('.wmd-button-group5');
		$("#wmd-undo-button").append($('<span class="glyphicon glyphicon-arrow-left">')).appendTo($btnGroupElt);
		$("#wmd-redo-button").append($('<span class="glyphicon glyphicon-arrow-right">')).appendTo($btnGroupElt);
	};

	// Other initialization that are not prioritary
	eventMgr.addListener("onReady", function() {

		$(document.body).on('shown.bs.modal', '.modal', function() {
			var $elt = $(this);
			setTimeout(function() {
				// When modal opens focus on the first button
				$elt.find('.btn:first').focus();
				// Or on the first link if any
				$elt.find('button:first').focus();
				// Or on the first input if any
				$elt.find("input:enabled:visible:first").focus();
			}, 50);
		}).on('hidden.bs.modal', '.modal', function() {
			// Focus on the editor when modal is gone
			editor.focus();
		}).on('keyup', '.modal', function(e) {
			// Handle enter key in modals
			if(e.which == 13 && !$(e.target).is("textarea")) {
				$(this).find(".modal-footer a:last").click();
			}
		});

		// Click events on "insert link" and "insert image" dialog buttons
		$(".action-insert-link").click(function(e) {
			var value = $("#input-insert-link").val();
			if(value !== undefined) {
				core.insertLinkCallback(value);
				core.insertLinkCallback = undefined;
			}
		});
		$(".action-insert-image").click(function(e) {
			var value = $("#input-insert-image").val();
			if(value !== undefined) {
				core.insertLinkCallback(value);
				core.insertLinkCallback = undefined;
			}
		});

		// Hide events on "insert link" and "insert image" dialogs
		$(".modal-insert-link, .modal-insert-image").on('hidden.bs.modal', function() {
			if(core.insertLinkCallback !== undefined) {
				core.insertLinkCallback(null);
				core.insertLinkCallback = undefined;
			}
		});
	});

	return core;
});
