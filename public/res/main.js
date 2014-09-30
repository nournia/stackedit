// RequireJS configuration
/*global requirejs */
requirejs.config({
	waitSeconds: 0,
	paths: {
		jquery: 'bower-libs/jquery/jquery',
		underscore: 'bower-libs/underscore/underscore',
		mousetrap: 'bower-libs/mousetrap/mousetrap',
		bootstrap: 'bower-libs/bootstrap/dist/js/bootstrap',
		requirejs: 'bower-libs/requirejs/require',
		pagedown: 'libs/Markdown.Editor',
		prism: 'bower-libs/prism/prism',
		'prism-core': 'bower-libs/prism/components/prism-core',
		diff_match_patch_uncompressed: 'bower-libs/google-diff-match-patch-js/diff_match_patch_uncompressed',
	},
	shim: {
		underscore: {
			exports: '_'
		},
		diff_match_patch_uncompressed: {
			exports: 'diff_match_patch'
		},
		mousetrap: {
			exports: 'Mousetrap'
		},
		'prism-core': {
			exports: 'Prism'
		},
		'bower-libs/prism/components/prism-markup': [
			'prism-core'
		],
		'libs/prism-latex': [
			'prism-core'
		],
		'libs/prism-markdown': [
			'bower-libs/prism/components/prism-markup',
			'libs/prism-latex'
		],
		bootstrap: [
			'jquery'
		]
	}
});

require([
	"jquery",
	"core",
	"editor",
	"eventMgr",
	"mousetrap",
	"pagedown",
	"bootstrap"
], function($, core, editor, eventMgr, mousetrap) {

	$(function() {

		// Modal state
		var isModalShown = false;
		$(document.body).on('show.bs.modal', '.modal', function() {
			isModalShown = true;
		}).on('hidden.bs.modal', '.modal', function() {
			isModalShown = false;
		});

		// Configure Mousetrap
		mousetrap.stopCallback = function() {
			return isModalShown;
		};

		editor.init();
		eventMgr.onReady();
		core.initEditor();
	});
});
