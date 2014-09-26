define([
	'jquery',
	'underscore',
	'utils',
	'mousetrap'
], function($, _, utils, mousetrap) {
	var layout = {};

	var resizerSize = 32;
	var togglerSize = 60;
	var navbarHeight = 50;
	var editorMinSize = {
		width: 250,
		height: 140
	};
	var titleMinWidth = 200;
	var windowSize;

	var wrapper;
	var navbar, editor;

	var animate = false;

	function startAnimation() {
		animate = true;
		wrapper.$elt.addClass('layout-animate');
	}

	function endAnimation() {
		animate = false;
		wrapper.$elt.removeClass('layout-animate');
	}

	function DomObject(selector) {
		this.selector = selector;
		this.elt = document.querySelector(selector);
		this.$elt = $(this.elt);
	}

	var transitionEndTimeoutId;
	var transitionEndCallbacks = [];

	DomObject.prototype.applyCss = function() {

		// Top/left/Bottom/Right
		this.top !== undefined && (this.elt.style.top = this.top + 'px');
		this.left !== undefined && (this.elt.style.left = this.left + 'px');
		this.bottom !== undefined && (this.elt.style.bottom = this.bottom + 'px');
		this.right !== undefined && (this.elt.style.right = this.right + 'px');

		// Width (deferred when animate if new width is smaller)
		if(animate && this.width < this.oldWidth) {
			transitionEndCallbacks.push(_.bind(function() {
				this.elt.style.width = this.width + 'px';
			}, this));
		}
		else {
			this.width !== undefined && (this.elt.style.width = this.width + 'px');
		}
		this.oldWidth = this.width;

		// Height (deferred when animate if new height is smaller)
		if(animate && this.height < this.oldHeight) {
			transitionEndCallbacks.push(_.bind(function() {
				this.elt.style.height = this.height + 'px';
			}, this));
		}
		else {
			this.height !== undefined && (this.elt.style.height = this.height + 'px');
		}
		this.oldHeight = this.height;
	};

	var maxWidthMap = [
		{ screenWidth: 0, maxWidth: 600 },
		{ screenWidth: 1000, maxWidth: 700 },
		{ screenWidth: 1200, maxWidth: 800 },
		{ screenWidth: 1400, maxWidth: 900 }
	];
	var maxWidthMapReversed = maxWidthMap.slice(0).reverse();

	function getMaxWidth() {
		return _.find(maxWidthMapReversed, function(value) {
			return windowSize.width > value.screenWidth;
		}).maxWidth;
	}

	var editorContentElt;
	var navbarInnerElt;
	var navbarDropdownElt;
	var $navbarDropdownBtnElt;
	var navbarTitleContainerElt;
	var $navbarTitleElt;
	var navbarBtnGroups = [];
	var navbarBtnGroupsWidth = [
		80,
		80,
		160,
		160,
		80,
		40
	].map(function(width) {
			return width + 18; // Add margin
		});
	var navbarMarginWidth = 18 * 2 + 25 + 25;
	var buttonsDropdownWidth = 40;
	var viewerButtonGroupWidth = 100;
	var workingIndicatorWidth = 18 + 70;

	function onResize() {
		var maxWidth = navbarMarginWidth + workingIndicatorWidth + titleMinWidth + buttonsDropdownWidth;
		if(window.viewerMode) {
			maxWidth = navbarMarginWidth + workingIndicatorWidth + titleMinWidth + viewerButtonGroupWidth;
		}
		var titleWidth = windowSize.width - maxWidth + titleMinWidth;
		navbarBtnGroups.forEach(function(group, index) {
			maxWidth += group.width;
			index === navbarBtnGroups.length - 1 && (maxWidth -= buttonsDropdownWidth);
			if(windowSize.width < maxWidth) {
				navbarDropdownElt.appendChild(group.elt);
			}
			else {
				navbarInnerElt.insertBefore(group.elt, navbarTitleContainerElt);
				titleWidth = windowSize.width - maxWidth + titleMinWidth;
			}
		});
		$navbarTitleElt.css({
			maxWidth: titleWidth
		});
		$navbarDropdownBtnElt.toggleClass('hide', navbarDropdownElt.children.length === 0);
	}

	var isVertical = false;

	function fixViewportScrolling() {
		// Fix a weird viewport behavior using pageup/pagedown in Webkit
		wrapper.width = windowSize.width;
		wrapper.elt.style.width = wrapper.width + 'px';
	}

	function resizeAll() {
		windowSize = {
			width: window.innerWidth,
			height: window.innerHeight
		};

		while(true) {
			// Layout wrapper level 1
			wrapper.y = navbar.isOpen ? 0 : -navbarHeight;
			wrapper.x = 0;
			wrapper.width = windowSize.width;
			wrapper.height = windowSize.height - wrapper.y;

			wrapper.applyCss();

			if(window.viewerMode) {
				return onResize();
			}

			if(navbar.isOpen) {
				navbar.isOpen = false;
				navbar.$elt.trigger('hide.layout.toggle').trigger('hidden.layout.toggle');
				continue;
			}

			editor.height = wrapper.height;
			editor.width = wrapper.width;
			break;
		}

		editor.applyCss();
		fixViewportScrolling();
		onResize();
	}

	layout.init = function() {

		var isModalShown = false;
		$(document.body).on('show.bs.modal', '.modal', function() {
			isModalShown = true;
		}).on('hidden.bs.modal', '.modal', function() {
			isModalShown = false;
		});

		// Tweak the body element
		(function(bodyStyle) {
			bodyStyle.position = 'absolute';
			bodyStyle.top = 0;
			bodyStyle.left = 0;
			bodyStyle.bottom = 0;
			bodyStyle.right = 0;
			bodyStyle.overflow = 'hidden';
		})(document.body.style);
		document.documentElement.style.overflow = 'hidden';

		wrapper = new DomObject('.layout-wrapper');
		navbar = new DomObject('.navbar');
		editor = new DomObject('#wmd-input');

		editorContentElt = editor.elt.querySelector('.editor-content');
		navbarInnerElt = navbar.elt.querySelector('.navbar-inner');
		navbarDropdownElt = navbar.elt.querySelector('.buttons-dropdown .dropdown-menu');
		$navbarDropdownBtnElt = navbar.$elt.find('.buttons-dropdown');
		navbarTitleContainerElt = navbar.elt.querySelector('.title-container');
		$navbarTitleElt = navbar.$elt.find('.file-title-navbar, .input-file-title');

		// Fix a weird viewport behavior using pageup/pagedown in Webkit
		$([
			wrapper.elt
		]).on('scroll', function() {
			this.scrollLeft = 0;
		});

		_.each(navbar.elt.querySelectorAll('.right-buttons'), function(btnGroupElt) {
			navbarBtnGroups.push({
				elt: btnGroupElt,
				width: navbarBtnGroupsWidth.shift()
			});
		});
		_.each(navbar.elt.querySelectorAll('.left-buttons'), function(btnGroupElt) {
			navbarBtnGroups.push({
				elt: btnGroupElt,
				width: navbarBtnGroupsWidth.shift()
			});
		});

		wrapper.$elt.toggleClass('layout-vertical', isVertical);

		navbar.isOpen = true;

		// Configure Mousetrap
		mousetrap.stopCallback = function() {
			return isModalShown;
		};

		$(window).resize(resizeAll);
		resizeAll();
	};

	return layout;
});
