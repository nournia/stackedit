/*globals Markdown, requirejs */
define([
	"jquery",
	"underscore",
	"editor",
	"eventMgr",
	"mousetrap",
	"pagedown"
], function($, _, editor, eventMgr, mousetrap) {

	var core = {};

	// Create the PageDown editor
	var pagedownEditor;
	core.initEditor = function() {
		if(pagedownEditor !== undefined) {
			// If the editor is already created
			editor.undoMgr.init();
			return pagedownEditor.uiManager.setUndoRedoButtonStates();
		}

		// Create the converter and the editor
		var converter = new Markdown.Converter();
		var options = {
			_DoItalicsAndBold: function(text) {
				// Restore original markdown implementation
				text = text.replace(/(\*\*|__)(?=\S)(.+?[*_]*)(?=\S)\1/g,
					"<strong>$2</strong>");
				text = text.replace(/(\*|_)(?=\S)(.+?)(?=\S)\1/g,
					"<em>$2</em>");
				return text;
			}
		};
		converter.setOptions(options);
		pagedownEditor = new Markdown.Editor(converter, undefined, {
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

		eventMgr.onPagedownConfigure(pagedownEditor);
		pagedownEditor.run();
		editor.undoMgr.init();

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

	// Modal state
	var isModalShown = false;
	$(document.body).on('show.bs.modal', '.modal', function() {
		isModalShown = true;
	}).on('hidden.bs.modal', '.modal', function() {
		isModalShown = false;
	});

	// Initialize multiple things and then fire eventMgr.onReady
	core.onReady = function() {
		// Configure Mousetrap
		mousetrap.stopCallback = function() {
			return isModalShown;
		};

		editor.init();
		eventMgr.onReady();
		core.initEditor();
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
