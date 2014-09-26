// RequireJS configuration
/*global requirejs */
requirejs.config({
	waitSeconds: 0,
	paths: {
		jquery: 'bower-libs/jquery/jquery',
		underscore: 'bower-libs/underscore/underscore',
		crel: 'bower-libs/crel/crel',
		mousetrap: 'bower-libs/mousetrap/mousetrap',
		bootstrap: 'bower-libs/bootstrap/dist/js/bootstrap',
		requirejs: 'bower-libs/requirejs/require',
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
		bootstrap: [
			'jquery'
		],
		pagedown: [
			'libs/Markdown.Converter'
		]
	}
});

require([
	"jquery",
	"rangy",
	"core",
	"classes/Provider",
	"rangy-cssclassapplier"
], function($, rangy, core) {

	$(function() {
		rangy.init();

		// Here, all the modules are loaded and the DOM is ready
		core.onReady();
	});
});
