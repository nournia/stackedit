/*globals Markdown, requirejs */
define([
	"jquery",
	"underscore",
	"editor",
	"layout",
	"constants",
	"utils",
	"storage",
	"eventMgr",
	"storage",
	'pagedown'
], function($, _, editor, layout, constants, utils, storage, eventMgr) {

	var core = {};

	// Used for periodic tasks
	var intervalId;

	// Used to detect user activity
	var isUserReal = false;
	var userActive = false;
	var windowUnique = true;
	var userLastActivity = 0;

	function setUserActive() {
		isUserReal = true;
		userActive = true;
		var currentTime = utils.currentTime;
		if(currentTime > userLastActivity + 1000) {
			userLastActivity = currentTime;
			eventMgr.onUserActive();
		}
	}

	function isUserActive() {
		if(utils.currentTime - userLastActivity > constants.USER_IDLE_THRESHOLD) {
			userActive = false;
		}
		return userActive && windowUnique;
	}

	// Used to only have 1 window of the application in the same browser
	var windowId;

	function checkWindowUnique() {
		if(isUserReal === false || windowUnique === false) {
			return;
		}
		if(windowId === undefined) {
			windowId = utils.randomString();
			storage.frontWindowId = windowId;
		}
		var frontWindowId = storage.frontWindowId;
		if(frontWindowId != windowId) {
			windowUnique = false;
			if(intervalId !== undefined) {
				clearInterval(intervalId);
			}
			$(".modal").modal("hide");
			$('.modal-non-unique').modal("show");
			// Attempt to close the window
			window.close();
		}
	}

	// Offline management
	var isOffline = false;
	var offlineTime = utils.currentTime;
	core.setOffline = function() {
		offlineTime = utils.currentTime;
		if(isOffline === false) {
			isOffline = true;
			eventMgr.onOfflineChanged(true);
		}
	};
	function setOnline() {
		if(isOffline === true) {
			isOffline = false;
			eventMgr.onOfflineChanged(false);
		}
	}

	function checkOnline() {
		// Try to reconnect if we are offline but we have some network
		if(isOffline === true && navigator.onLine === true && offlineTime + constants.CHECK_ONLINE_PERIOD < utils.currentTime) {
			offlineTime = utils.currentTime;
			// Try to download anything to test the connection
			$.ajax({
				url: "//www.google.com/jsapi",
				timeout: constants.AJAX_TIMEOUT,
				dataType: "script"
			}).done(function() {
				setOnline();
			});
		}
	}

	// Load settings in settings dialog
	var $themeInputElt;

	// Create the PageDown editor
	var pagedownEditor;
	var fileDesc;
	core.initEditor = function(fileDescParam) {
		if(fileDesc !== undefined) {
			eventMgr.onFileClosed(fileDesc);
		}
		fileDesc = fileDescParam;

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
			utils.resetModalInputs();
			$(".modal-insert-link").modal();
			return true;
		});
		// Custom insert image dialog
		pagedownEditor.hooks.set("insertImageDialog", function(callback) {
			core.insertLinkCallback = callback;
			if(core.catchModal) {
				return true;
			}
			utils.resetModalInputs();
			$(".modal-insert-image").modal();
			return true;
		});

		eventMgr.onPagedownConfigure(pagedownEditor);
		pagedownEditor.hooks.chain("onPreviewRefresh", eventMgr.onAsyncPreview);
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

	// Initialize multiple things and then fire eventMgr.onReady
	core.onReady = function() {
		// Add RTL class
		document.body.className += ' rtl';

		// Initialize utils library
		utils.init();

		// listen to online/offline events
		$(window).on('offline', core.setOffline);
		$(window).on('online', setOnline);
		if(navigator.onLine === false) {
			core.setOffline();
		}

		// Detect user activity
		$(document).mousemove(setUserActive).keypress(setUserActive);

		layout.init();
		editor.init();

		// Do periodic tasks
		intervalId = window.setInterval(function() {
			utils.updateCurrentTime();
			checkWindowUnique();
			if(isUserActive() === true || window.viewerMode === true) {
				eventMgr.onPeriodicRun();
				checkOnline();
			}
		}, 1000);

		eventMgr.onReady();
	};

	var $alerts = $();

	function isSponsor(payments) {
		var result = payments && payments.app == appId && (
			(payments.chargeOption && payments.chargeOption.alias == 'once') ||
			(payments.subscriptionOption && payments.subscriptionOption.alias == 'yearly'));
		eventMgr.isSponsor = result;
		return result;
	}

	function removeAlerts() {
		$alerts.remove();
		$alerts = $();
	}

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
			// Revert to current theme when settings modal is closed
			applyTheme(window.theme);
		}).on('keyup', '.modal', function(e) {
			// Handle enter key in modals
			if(e.which == 13 && !$(e.target).is("textarea")) {
				$(this).find(".modal-footer a:last").click();
			}
		});

		// Click events on "insert link" and "insert image" dialog buttons
		$(".action-insert-link").click(function(e) {
			var value = utils.getInputTextValue($("#input-insert-link"), e);
			if(value !== undefined) {
				core.insertLinkCallback(value);
				core.insertLinkCallback = undefined;
			}
		});
		$(".action-insert-image").click(function(e) {
			var value = utils.getInputTextValue($("#input-insert-image"), e);
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

		// Hot theme switcher in the settings
		var currentTheme = window.theme;

		function applyTheme(theme) {
			theme = theme || 'default';
			if(currentTheme != theme) {
				var themeModule = "less!themes/" + theme;
				if(window.baseDir.indexOf('-min') !== -1) {
					themeModule = "css!themes/" + theme;
				}
				// Undefine the module in RequireJS
				requirejs.undef(themeModule);
				// Then reload the style
				require([
					themeModule
				]);
				currentTheme = theme;
			}
		}

		// Reset inputs
		$(".action-reset-input").click(function() {
			utils.resetModalInputs();
		});

		utils.createTooltip(".tooltip-lazy-rendering", 'Disable preview rendering while typing in order to offload CPU. Refresh preview after 500 ms of inactivity.');
		utils.createTooltip(".tooltip-default-content", [
			'Thanks for supporting StackEdit by adding a backlink in your documents!<br/><br/>',
			'<b class="text-danger">NOTE: Backlinks in Stack Exchange Q/A are not welcome.</b>'
		].join(''));

		// Avoid dropdown panels to close on click
		$("div.dropdown-menu").click(function(e) {
			e.stopPropagation();
		});

		// Non unique window dialog
		$('.modal-non-unique').modal({
			backdrop: "static",
			keyboard: false,
			show: false
		});

		// Load images
		_.each(document.querySelectorAll('img'), function(imgElt) {
			var $imgElt = $(imgElt);
			var src = $imgElt.data('stackeditSrc');
			if(src) {
				$imgElt.attr('src', window.baseDir + '/img/' + src);
			}
		});
	});

	return core;
});
