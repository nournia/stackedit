// RequireJS configuration
/*global requirejs */
requirejs.config({
	waitSeconds: 0,
	packages: [
		{
			name: 'less',
			location: 'bower-libs/require-less',
			main: 'less'
		}
	],
	paths: {
		jquery: 'bower-libs/jquery/jquery',
		underscore: 'bower-libs/underscore/underscore',
		crel: 'bower-libs/crel/crel',
		mousetrap: 'bower-libs/mousetrap/mousetrap',
		'mousetrap-record': 'bower-libs/mousetrap/plugins/record/mousetrap-record',
		text: 'bower-libs/requirejs-text/text',
		bootstrap: 'bower-libs/bootstrap/dist/js/bootstrap',
		requirejs: 'bower-libs/requirejs/require',
		highlightjs: 'libs/highlight/highlight.pack',
		'requirejs-text': 'bower-libs/requirejs-text/text',
		'pagedown-extra': 'bower-libs/pagedown-extra/node-pagedown-extra',
		pagedownExtra: 'bower-libs/pagedown-extra/Markdown.Extra',
		pagedown: 'libs/Markdown.Editor',
		prism: 'bower-libs/prism/prism',
		'prism-core': 'bower-libs/prism/components/prism-core',
		rangy: 'bower-libs/rangy/rangy-core',
		'rangy-cssclassapplier': 'bower-libs/rangy/rangy-cssclassapplier',
		diff_match_patch: 'bower-libs/google-diff-match-patch-js/diff_match_patch',
		diff_match_patch_uncompressed: 'bower-libs/google-diff-match-patch-js/diff_match_patch_uncompressed',
		jsondiffpatch: 'bower-libs/jsondiffpatch/build/bundle',
	},
	shim: {
		underscore: {
			exports: '_'
		},
		diff_match_patch_uncompressed: {
			exports: 'diff_match_patch'
		},
		jsondiffpatch: [
			'diff_match_patch_uncompressed'
		],
		rangy: {
			exports: 'rangy'
		},
		'rangy-cssclassapplier': [
			'rangy'
		],
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
		'bootstrap-record': [
			'mousetrap'
		],
		FileSaver: {
			exports: 'saveAs'
		},
		highlightjs: {
			exports: 'hljs'
		},
		bootstrap: [
			'jquery'
		],
		pagedown: [
			'libs/Markdown.Converter'
		],
		pagedownExtra: [
			'libs/Markdown.Converter'
		]
	}
});

// Check browser compatibility
try {
	var test = 'seLocalStorageCheck';
	localStorage.setItem(test, test);
	localStorage.removeItem(test);
	var obj = {};
	Object.defineProperty(obj, 'prop', {
		get: function() {
		},
		set: function() {
		}
	});
}
catch(e) {
	alert('Your browser is not supported, sorry!');
	throw e;
}

// Viewer mode is deduced from the body class
window.viewerMode = /(^| )viewer($| )/.test(document.body.className);

// Keep the theme in a global variable
window.theme = localStorage.themeV4 || 'default';
var themeModule = "less!themes/" + window.theme;

require([
	"jquery",
	"rangy",
	"core",
	"eventMgr",
	"constants",
	"classes/Provider",
	"rangy-cssclassapplier",
	themeModule
], function($, rangy, core, eventMgr) {

	if(window.noStart) {
		return;
	}

	$(function() {
		rangy.init();

		// Here, all the modules are loaded and the DOM is ready
		core.onReady();

		// If browser has detected a new application cache.
		if(window.applicationCache) {
			window.applicationCache.addEventListener('updateready', function() {
				if(window.applicationCache.status === window.applicationCache.UPDATEREADY) {
					window.applicationCache.swapCache();
					eventMgr.onMessage('New version available!\nJust refresh the page to upgrade.');
				}
			}, false);
		}
	});

});
