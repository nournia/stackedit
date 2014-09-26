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

	var wrapperL1, wrapperL2, wrapperL3;
	var navbar, editor;

	var animate = false;

	function startAnimation() {
		animate = true;
		wrapperL1.$elt.addClass('layout-animate');
	}

	function endAnimation() {
		animate = false;
		wrapperL1.$elt.removeClass('layout-animate');
	}

	function DomObject(selector) {
		this.selector = selector;
		this.elt = document.querySelector(selector);
		this.$elt = $(this.elt);
	}

	var transitionEndTimeoutId;
	var transitionEndCallbacks = [];

	function onTransitionEnd(evt) {
		if(!evt ||
			evt.target === wrapperL1.elt ||
			evt.target === wrapperL2.elt
			) {
			transitionEndCallbacks.forEach(function(callback) {
				callback();
			});
			endAnimation();
			transitionEndCallbacks.length !== 0 && onResize();
			transitionEndCallbacks = [];
		}
	}

	DomObject.prototype.applyCss = function() {

		// Top/left/Bottom/Right
		this.top !== undefined && (this.elt.style.top = this.top + 'px');
		this.left !== undefined && (this.elt.style.left = this.left + 'px');
		this.bottom !== undefined && (this.elt.style.bottom = this.bottom + 'px');
		this.right !== undefined && (this.elt.style.right = this.right + 'px');

		// Translate
		if(this.x !== undefined || this.y !== undefined) {
			this.x = this.x || 0;
			this.y = this.y || 0;
			this.elt.style['-webkit-transform'] = 'translate(' + this.x + 'px, ' + this.y + 'px)';
			this.elt.style['-ms-transform'] = 'translate(' + this.x + 'px, ' + this.y + 'px)';
			this.elt.style.transform = 'translate(' + this.x + 'px, ' + this.y + 'px)';
		}

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

		// Just in case transitionEnd event doesn't happen
		clearTimeout(transitionEndTimeoutId);
		animate && (transitionEndTimeoutId = setTimeout(onTransitionEnd, 800));
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
		wrapperL1.width = windowSize.width;
		wrapperL1.elt.style.width = wrapperL1.width + 'px';
	}

	function resizeAll() {
		windowSize = {
			width: window.innerWidth,
			height: window.innerHeight
		};

		while(true) {
			// Layout wrapper level 1
			wrapperL1.y = navbar.isOpen ? 0 : -navbarHeight;
			wrapperL1.x = 0;
			wrapperL1.width = windowSize.width;
			wrapperL1.height = windowSize.height - wrapperL1.y;

			// Layout wrapper level 2
			wrapperL2.left = 0;
			wrapperL2.width = windowSize.width;
			wrapperL2.height = wrapperL1.height;

			// Layout wrapper level 3
			wrapperL3.top = navbarHeight;
			wrapperL3.width = windowSize.width;
			wrapperL3.height = wrapperL1.height - navbarHeight;

			wrapperL1.applyCss();
			wrapperL2.applyCss();
			wrapperL3.applyCss();

			if(window.viewerMode) {
				return onResize();
			}

			if(navbar.isOpen && wrapperL3.height < editorMinSize.height + resizerSize) {
				navbar.isOpen = false;
				navbar.$elt.trigger('hide.layout.toggle').trigger('hidden.layout.toggle');
				continue;
			}

			editor.height = wrapperL3.height;
			editor.width = wrapperL3.width;
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

		wrapperL1 = new DomObject('.layout-wrapper-l1');
		wrapperL2 = new DomObject('.layout-wrapper-l2');
		wrapperL3 = new DomObject('.layout-wrapper-l3');
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
			wrapperL1.elt,
			wrapperL2.elt,
			wrapperL3.elt
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

		wrapperL1.$elt.toggleClass('layout-vertical', isVertical);
		wrapperL1.$elt.on("webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend", onTransitionEnd);

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
