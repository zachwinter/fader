/*
 * 
 *	fader.js v1.0 (c) 2014
 *	Expandable jQuery Content Fader
 * 
 *	@author:  Zach Winter (contact@zachwinter.com)
 *	@license: MIT (http://www.opensource.org/licenses/mit-license.php)
 *
 */

;(function( $, window, document, undefined ) {
'use strict';

	var defaults = {
		baseIndex   : 0,
		fadeSpeed   : 1500,
		swapDelay   : 7500,
		autoSwap    : true,
		keyboard    : true,
		bullets     : false,
		fixedAspect : false,
		previous    : false,
		next        : false,
		breakout    : false,
		resizePause : true,
		userDisable : true,
		changeStart : function (data) {},
		changeEnd   : function (data) {}
  };

 	function AnimationQueue ($el) {
		var self = this;
		self.queue = [];
		self.active = 0;
		self.add = function (method) {
			self.queue.push(method);
		};
		self.reset = function () {
			self.queue  = [];
			self.active = 0;
		};
		self.next = function ($el) {
			self.active++;
			setTimeout(function () {
				if ( typeof(self.queue[self.active]) === 'function' ) {
					self.queue[self.active]($el);
				}
			}, 20);
		};
		self.start = function ($el) {
			self.queue[0]($el);
		};
	}

	function Fader ( container, options ) {

		var self = this;

		self.container     = $(container);
		self.options       = $.extend({}, defaults, options);
		self.timer         = null;
		self.active        = 1;
		self.changing      = false;
		self.autoDisabled  = false;
		self.transitions   = false;
		self.vendorPrefix  = null;
		self.transitionEnd = null;
 
		self.els = {

			slides   : self.container.find('> *'),
			previous : $(self.options.previous),
			next     : $(self.options.next),
			bullets  : $(self.options.bullets),
			breakout : $(self.options.breakout),

			init     : {

				container : function () {
					var pos = self.container.css('position');
					if (pos !== "absolute" && pos !== "relative" && pos !== "fixed") {
						self.container.css('position', 'relative');
					}
					self.container.css('overflow', 'hidden');
				},

				slides : function () {
					self.els.slides.each( function () {
						$(this).attr('data-slide', $(this).index() + 1);
					});
					self.els.slides.css({
						'display'  : 'none',
						'position' : 'absolute',
						'top'      : 0,
						'width'    : '100%',
						'height'   : '100%'
					});
					self.els.slides.eq(0).css({
						'position' : 'relative',
						'display'  : 'block'
					});
				},

				bullets : function () {
					for (var i=0; i<self.els.slides.length; i++) {
						self.els.bullets.append('<li><a href="#" data-target="' + ( i + 1 ) + '">&nbsp;</a></li>');
					}
					self.els.bullets.find('li:first-child a').addClass('active');
					self.bind.bullets();
				},

				breakout : function () {
					self.els.breakout.find('> *').each( function () {
						$(this).attr('data-breakout', $(this).index() + 1);
					});
				}

			}

		};

		self.bind = {

			bullets : function () {
				$(document).on('click', self.els.bullets.selector, function (e) {
					var clicked = $(this),
					    target  = $(this).attr('data-target');
					if ( !clicked.hasClass('active') && self.changing === false ) {
						self.els.bullets.find('a').removeClass('active');
						clicked.addClass('active');
						self.selectSlide(target);
					}
					if ( self.options.userDisable === true ) {
						self.options.autoSwap = false;
						self.autoDisabled     = true;
					}
					e.preventDefault();
				});
			},

			keyboard : function () {
				$(document).on('keydown', function (e) {
					if ( e.keyCode === 37 && self.changing === false ) {
						self.selectSlide('previous');
						if ( self.options.userDisable === true ) {
							self.options.autoSwap = false;
							self.autoDisabled     = true;
						}
					}
					if ( e.keyCode === 39 && self.changing === false ) {
						self.selectSlide('next');
						if ( self.options.userDisable === true) {
							self.options.autoSwap = false;
							self.autoDisabled     = true;
						}
					}
				});
			},

			previous : function () {
				$(document).on('click', self.els.previous.selector, function (e) {
					if ( self.changing === false ) {
						self.selectSlide('previous');
						if ( self.options.userDisable === true ) {
							self.options.autoSwap = false;
							self.autoDisabled     = true;
						}
					}	
					e.preventDefault();
				});
			},

			next : function () {
				$(document).on('click', self.els.next.selector, function (e) {
					if ( self.changing === false ) {
						self.selectSlide('next');
						if ( self.options.userDisable === true ) {
							self.options.autoSwap = false;
							self.autoDisabled     = true;
						}
					}	
					e.preventDefault();
				});
			}

		};

		self.selectSlide = function (slide) {
			var next = null;
			self.changing = true;
			if ( slide === 'previous' ) {
				if ( self.active === 1 ) {
					next = self.els.slides.length;
				} else {
					next = self.active - 1;
				}
			}
			if ( slide === 'next' ) {
				if ( self.active === self.els.slides.length ) {
					next = 1;
				} else {
					next = self.active + 1;
				}
			}
			if ( self.options.bullets !== false ) {
				self.els.bullets.find('a').removeClass('active');
				self.els.bullets.find('[data-target="' + next + '"]').addClass('active');
			}
			self.swapSlide(next);
		};

		self.swapSlide = function (slide) {
			var currentSlide = $('[data-slide="' + self.active + '"]'),
			    nextSlide    = $('[data-slide="' + slide       + '"]');
			self.options.changeStart({
				instance      : self,
				currentSlide  : self.active,
				targetSlide   : slide,
				totalSlides   : self.els.slides.length,
				options       : self.options
			});
			self.container.css('height', self.container.height());
			currentSlide.css({
				'position' : 'absolute',
				'z-index'  : self.options.baseIndex
			});
			nextSlide.css({
				'z-index' : self.options.baseIndex + 10
			});
			self.fadeIn(nextSlide, function () {
				nextSlide.css('position', 'relative');
				currentSlide.hide();
				self.active = slide;
				self.changing = false;
				self.container.css('height', 'auto');
				if ( self.options.autoSwap === true && self.autoDisabled === false ) {
					self.autoSwap();
				}		
			});
		};

		self.autoSwap = function () {
			clearTimeout(self.timer);
			self.timer = setTimeout( function () {
				if ( self.changing === false ) {
					self.selectSlide('next');
				}
			}, self.options.swapDelay);
		};

		self.resizePause = function () {
			var resizeTimeout = null;
			$(window).on('resize', function () {
				if ( resizeTimeout !== false ) {
					clearTimeout(resizeTimeout);
				}
				self.changing = true;
				resizeTimeout = setTimeout(function () {
					self.changing = false;
					if ( self.options.autoSwap === true ) {
						self.autoSwap();
					}
				}, 300);
			});
		};

		self.fadeIn = function ($el, callback) {
			if ( self.transitions === true ) {
				$el.Q = new AnimationQueue($el);
				$el.Q.add(function () {
					$el.css(self.vendorPrefix + 'transition', 'none');
					$el.css({
						'display' : 'block',
						'opacity' : '0'
					});
					$el.css(self.vendorPrefix + 'transition', 'opacity ' + self.options.fadeSpeed / 1000 + 's ease');
					$el.Q.next();
				});
				$el.Q.add(function () {
					$el.on(self.transitionEnd, function(e) {
						e.stopPropagation();
						$el.off(self.transitionEnd).css({
							'display' : 'block',
							'opacity' : '1'
						});
						$el.removeAttr('data-transition');
						if (typeof(callback) === "function") callback();
					});
					$el.Q.next();
				});
				$el.Q.add(function () {
					$el.attr('data-transition', 'fadeIn').css('opacity', '1');
					$el.Q.next();
				});
				$el.Q.start();
			}
			else {
				$el.fadeIn(self.options.fadeSpeed, callback);
			}
		},

		self.determineTransitions = function () {
			var div = document.createElement("div").style,
			styles = [
				div.transition,
				div.WebkitTransition,
				div.MozTransition,
				div.msTransition,
				div.oTransition
			],
			prefix = [
				'',
				'-webkit-',
				'-moz-',
				'-ms-',
				'-o-'
			],
			event = [
				'transitionend',
				'webkitTransitionEnd',
				'transitionend',
				'msTransitionEnd',
				'oTransitionEnd'
			];
			for (var i=0; i<styles.length; i++) {
				if (styles[i] !== undefined) {
					self.transitions   = true;
					self.vendorPrefix  = prefix[i];
					self.transitionEnd = event[i];
					break;
				}
			}
		},

		self.init = function () {
			var _ = self,
			   _o = _.options;
			_.determineTransitions();
			_.els.init.container();
			_.els.init.slides();
			if ( _o.breakout    !== false ) { _.els.init.breakout(); }
			if ( _o.bullets     !== false ) { _.els.init.bullets();  }
			if ( _o.keyboard    === true  ) { _.bind.keyboard();     }
			if ( _o.previous    !== false ) { _.bind.previous();     }
			if ( _o.next        !== false ) { _.bind.next();         }
			if ( _o.autoSwap    === true  ) { _.autoSwap();          }
			if ( _o.resizePause === true  ) { _.resizePause();       } 
		};

		if (self) {
			self.init();
		}

	}

	$.fn.fader = function (options) {
		return this.each(function () {
			if (!$.data(this, 'plugin_fader')) {
				$.data(this, 'plugin_fader', new Fader(this, options));
			}
		});
	};

})( jQuery, window, document ); 