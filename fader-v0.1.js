/*
 * 
 *	fader.js v0.1 (c) 2014
 *	Expandable jQuery Content Fader
 * 
 *	@author:  Zach Winter (contact@zachwinter.com)
 *	@license: MIT (http://www.opensource.org/licenses/mit-license.php)
 *
 */

; (function($){

	$.fn.fader = function(options){
		


		//
		//
		// Variables
		//
		//



		// Object passed to plugin.
		var container = this;
				
		// Adjustable options.
		var settings = $.extend({
			fadeSpeed: 1500,
			swapDelay: 7500,
			autoSwap: true,
			keyboard: true,
			baseIndex: 0,
			bullets: false,
			fixedAspect: false,
			prevButton: false,
			nextButton: false,
			breakout: false,
			disableOnResize: true,
			changeStart: function(data){},
			changeEnd: function(data){}
		}, options);
		
		// Global.
		var active   = 1,
		    slides   = container.find('> *'),
		    first    = container.find('> *:first-child'),
		    changing = false,
		    timer;
		
		// Check CSS Transition support; use Modernizr if available.
		var transitionSupport = false;
		if (typeof Modernizr != 'undefined' && typeof Modernizr.csstransitions != 'undefined') {
			transitionSupport = Modernizr.csstransitions;
		} else {
			var doc        = document.createElement("div").style,
			    properties = [ doc.transition, doc.WebkitTransition, doc.MozTransition ];
			for (var i=0; i<properties.length; i++) {
				if (properties[i] != undefined) {
					transitionSupport = true;
					break;
				} 
			}
		}



		//
		//
		// Functions
		//
		//



		// Bullet click bind.
		var bulletBind = function(){
			settings.bullets.find('a').on('click', function(e){
				var clicked = $(this);
				if (!clicked.hasClass('active') && changing == false) {
					settings.bullets.find('a').removeClass('active');
					clicked.addClass('active');
					swapSlide(parseInt(clicked.attr('data-target')));
				}
				e.preventDefault();
			});
		}
		
		// Keyboard bind (left/right).
		var keyboardBind = function(){
			var doc = $(document);
			doc.on('keydown', function(e){
				if ( e.keyCode == 37 && changing == false ) {
					updateActive(false);
				}
				if ( e.keyCode == 39 && changing == false ) {
					updateActive(true);
				}
			});
		}

		// Bind previous+next buttons.
		var prevNextBind = function(){
			if (settings.prevButton != false) {
				settings.prevButton.on('click', function(e){
					if (changing != true) {
						updateActive(false);
					}	
					e.preventDefault();
				});
			}
			if (settings.nextButton != false) {
				settings.nextButton.on('click', function(e){
					if (changing != true) {
						updateActive(true);
					}	
					e.preventDefault();
				});
			}
		}
		
		// Update active slide ("active" variable) and active bullet.
		var updateActive = function(next){
			if (settings.bullets != false) {
				settings.bullets.find('a').removeClass('active');
			}
			if (next == true) {
				if (active == slides.length) {
					if (settings.bullets != false) {
						settings.bullets.find('[data-target="1"]').addClass('active');
					}
					swapSlide(1);
				} else {
					if (settings.bullets != false) {
						settings.bullets.find('[data-target="'+(active+1)+'"]').addClass('active');
					}
					swapSlide(active+1);
				}
			} else {
				if (active == 1) {
					if (settings.bullets != false) {
						settings.bullets.find('[data-target="'+slides.length+'"]').addClass('active');
					}
					swapSlide(slides.length);
				} else {
					if (settings.bullets != false) {
						settings.bullets.find('[data-target="'+(active-1)+'"]').addClass('active');
					}
					swapSlide(active-1);
				}
			}
		}
			
		// Slide swapping.
		var swapSlide = function(slide){
			
			var self          = this,
			    currentSlide  = $('[data-slide="'+active+'"]'),
			    upcomingSlide = $('[data-slide="'+slide+'"]');
			
			// Diable swapping slides during animation.
			changing = true;
			
			// Events + Functions
			container.trigger('slidechangestart');
			settings.changeStart({
				event: 'slidechangestart',
				container: container,
				currentSlide: active,
				upcomingSlide: slide,
				totalSlides: slides.length,
				settings: settings
			});

			// Temporarily set height of container to preserve layout.
			if (settings.fixedAspect == false) {
				container.css('height', container.height());
			}

			// Position current slide so upcoming slide can appear above it.
			currentSlide.css({
				position: "absolute",
				zIndex: settings.baseIndex
			});
			
			// Swap slides with CSS Transitions.
			self.cssAnimation = function(){
				upcomingSlide.one('transitionend webkitTransitionEnd', function(){
					self.finishUp();
					currentSlide.css({
						opacity: 0,
						webkitTransition: "none",
						mozTransition: "none",
						transition: "none",
						zIndex: settings.baseIndex
					});
				}).css({
					zIndex: settings.baseIndex+1,
					opacity: 1,
					webkitTransition: "opacity "+(settings.fadeSpeed/1000)+"s ease",
					mozTransition: "opacity "+(settings.fadeSpeed/1000)+"s ease",
					transition: "opacity "+(settings.fadeSpeed/1000)+"s ease"
				});
			}

			// Swap slides with jQuery fades; fallback for browsers without CSS Transition support.
			self.jQueryAnimation = function(){
				upcomingSlide.css({
					zIndex: settings.baseIndex+1
				}).fadeIn(settings.fadeSpeed, function(){
					self.finishUp();
					currentSlide.hide();
				});
			}

			// Shared function for both rendering methods. 
			self.finishUp = function(){
				upcomingSlide.css('position', 'relative');
				if (settings.fixedAspect == false) {
					container.css('height', 'auto');
				}
				active   = slide;
				changing = false;
				container.trigger('slidechangeend');
				settings.changeEnd({
					event: 'slidechangeend',
					container: container,
					currentSlide: active,
					totalSlides: slides.length,
					settings: settings
				});
				if (settings.autoSwap == true) {
					auto();
				}		
			}

			// Call rendering method based on CSS Transition support.
			if (transitionSupport == true) {
				self.cssAnimation();
			} else {
				self.jQueryAnimation();
			}
			
		}
		
		// Auto swapping.
		var auto = function(){
			clearTimeout(timer);
			timer = setTimeout(function(){
				if (changing == false) {
					updateActive(true);
				}
			}, settings.swapDelay);
		}

		// Preventing slides from changing during window resize.
		var resizeDisable = function(){
			var self     = this,
			    viewport = $(window),
			    timeout  = false;
			self.trigger = function(){
				changing = false;
				if (settings.autoSwap == true) {
					auto();
				}
			}
			viewport.on('resize', function(){
				if (timeout != false) {
					clearTimeout(timeout);
				}
				changing = true;
				timeout  = setTimeout(self.trigger, 300);
			});
		}

		



		//
		//
		// Initializations
		//
		//





		if (container.length) {

			// Container initialization.
			var containerPosition = container.css('position');
			if (containerPosition != "absolute" || containerPosition != "relative" || containerPosition != "fixed") {
				container.css('position', 'relative');
			}
			container.css('overflow', 'hidden');
			if (settings.fixedAspect != false) {
				container.css({
					height: 0,
					paddingBottom: settings.fixedAspect+'%'
				})
			}
	
			// Slide initialization based on transition support.
			if (transitionSupport == true) {
				slides.css({
					display: 'block',
					position: 'absolute',
					top: 0,
					opacity: 0,
					width: '100%',
					height: '100%'
				});
				slides.eq(0).css({
					opacity: 1,
					zIndex: settings.baseIndex+1,
					position: 'relative'
				});
			} else {
				slides.css({
					display: 'none',
					position: 'absolute',
					top: 0,
					width: '100%',
					height: '100%'
				});
				slides.eq(0).css({
					position: 'relative',
					display: 'block'
				});
			}
	
			// Add data attributes to slides.
			slides.each(function(){
				$(this).attr('data-slide', ($(this).index()+1));
			});
	
			// Add data attributes to breakout content.
			if (settings.breakout != false) {
				settings.breakout.find('> *').each(function(){
					$(this).attr('data-breakout', ($(this).index()+1));
				});
			}
		
			// Bullet creation.
			if (settings.bullets != false) {
				for (var i=0; i<slides.length; i++) {
					settings.bullets.append('<li><a href="#" data-target="'+(i+1)+'">&nbsp;</a></li>');
				}
				settings.bullets.find('li:first-child a').addClass('active');
				bulletBind();
			}
			
			// Bind keyboard.
			if (settings.keyboard == true) {
				keyboardBind();	
			}
	
			// Bind prev/next buttons.
			if (settings.prevButton != false || settings.nextButton != false) {
				prevNextBind();
			}
	
			// Start automatic slide swapping.
			if (settings.autoSwap == true) {
				auto();
			}
	
			// Enable the prevention of slides changing during window resize.
			if (settings.disableOnResize == true) {
				resizeDisable();
			}
		
		}
			
	}
	
})(jQuery);