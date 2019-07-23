// UTILS  

var ik_utils = ik_utils || {};

ik_utils.keys =  {
	'tab': 9,
	'enter': 13,
	'esc': 27,
	'space': 32,
	'end': 35,
	'home': 36,
	'left': 37,
	'up': 38,
	'right': 39,
	'down':  40
}
ik_utils.getTransitionEventName = function(){
	var $elem, events, t, name;
	
	$elem = $('<div/>');
	events = {
		'transition': 'transitionend',
		'OTransition': 'oTransitionEnd',
		'MozTransition': 'transitionend',
		'WebkitTransition': 'webkitTransitionEnd'
	};
	
	for (t in events){
		if ($elem.css(t) !== undefined){
			name = events[t];
		}
	}
	
	return name;
}

// ACCORDION

;(function ( $, window, document, undefined ) {
 	
	var pluginName = 'ik_accordion',
		defaults = { // set default parameters
			autoCollapse: false,
			animationSpeed: 200
		};
	 
	/**
	 * @constructs Plugin
	 * @param {Object} element - Current DOM element from selected collection.
	 * @param {Object} [options] - Configuration options.
	 * @param {boolean} [options.autoCollapse] - Automatically collapse inactive panels.
	 * @param {number} [options.animationSpeed] - Panel toggle speed in milliseconds.
	 */
	function Plugin( element, options ) {
		
		this._name = pluginName;
		this._defaults = defaults;
		this.element = $(element);
		this.options = $.extend( {}, defaults, options) ; // override default parameters if setup object is present
		
		this.init();
	}
	
	/** Initializes plugin. */
	Plugin.prototype.init = function () {
		
		var id, $elem, plugin;
		
		id = 'acc' + $('.ik_accordion').length; // create unique id
		$elem = this.element;
		plugin = this;
		
		$elem.attr({
			'id': id,
			'role': 'presentation' // prevent accordion from being recognized as data list
		}).addClass('ik_accordion');
		
		$elem.attr({'aria-multiselectable': !this.options.autoCollapse}); // define if more than one panel can be expanded
		
		this.headers = $elem.children('dt')
			.attr({'role': 'heading'}); // set heading role for each accordion header
		
		this.headers.each(function(i, el) {
			var $me, $btn;
			
			$me = $(el);
			
			$btn = $('<div/>').attr({
				'id': id + '_btn_' + i,
				'role': 'button',
				'aria-controls': id + '_panel_' + i, // associate button with corresponding panel
				'aria-expanded': false, // toggle expanded state
				'tabindex': 0
			})
			.addClass('button')
			.html($me.html())
			.on('keydown', {'plugin': plugin}, plugin.onKeyDown) // enable keyboard navigation
			.on('click', {'plugin': plugin}, plugin.togglePanel);
			$me.empty().append($btn); // wrap content of each header in an element with role button
		});
		
		this.panels = $elem.children('dd').each(function(i, el) {
			var $me = $(this), id = $elem.attr('id') + '_panel_' + i;
			$me.attr({
				'id': id, 
				'role': 'region', // add role region to each panel
				'aria-hidden': true, // mark all panels as hidden
				'tabindex': 0 // add panels into the tab order
			});
		}).hide();
		
	};
	
	/** 
	 * Handles kedown event on header button.
	 * 
	 * @param {Object} event - Keyboard event.
	 * @param {object} event.data - Event data.
	 * @param {object} event.data.plugin - Reference to plugin.
	 */
	Plugin.prototype.onKeyDown = function (event) {
		
		var $me, $header, plugin, $elem, $current, ind;
		
		$me = $(event.target);
		$header = $me.parent('dt');
		plugin = event.data.plugin;
		$elem = $(plugin.element);
		
		switch (event.keyCode) {
			
			// toggle panel by pressing enter key, or spacebar
			case ik_utils.keys.enter:
			case ik_utils.keys.space:
				event.preventDefault();
				event.stopPropagation();
				plugin.togglePanel(event);
				break;
			
			// use up arrow to jump to the previous header
			case ik_utils.keys.up:
				ind = plugin.headers.index($header);
				if (ind > 0) {
					plugin.headers.eq(--ind).find('.button').focus();
				}
				break;
			
			// use down arrow to jump to the next header
			case ik_utils.keys.down:
				ind = plugin.headers.index($header);
				if (ind < plugin.headers.length - 1) {
					plugin.headers.eq(++ind).find('.button').focus();
				}
				break;
		}
	};
	
	/** 
	 * Toggles accordion panel.
	 *
	 * @param {Object} event - Keyboard or mouse event.
	 * @param {object} event.data - Event data.
	 * @param {object} event.data.plugin - Reference to plugin.
	 */
	Plugin.prototype.togglePanel = function (event) {
		
		var plugin, $elem, $panel, $me, isVisible;
		
		plugin = event.data.plugin;
		$elem = $(plugin.element);
		$me = $(event.target);
		$panel = $me.parent('dt').next();
		
		// toggle current panel
		
		isVisible = !!$panel.is(':visible');
		if(isVisible) {
			$me.attr({'aria-expanded': false}).removeClass('expanded');
		} else {
			$me.attr({'aria-expanded': true}).addClass('expanded');
		}
		$panel.slideToggle({ duration: plugin.options.animationSpeed, done: function() { 
				$panel.attr({'aria-hidden': isVisible});
			}
		});
		
		if(plugin.options.autoCollapse) { // collapse all other panels
			
			plugin.headers.each(function(i, el) {
				var $hdr, $btn; 
				
				$hdr = $(el);
				$btn = $hdr.find('.button');
				
				if($btn[0] != $(event.currentTarget)[0]) { 
					$btn.attr({'aria-expanded': false}).removeClass('expanded');
					$hdr.next().attr({'aria-hidden': 'true'}).slideUp(plugin.options.animationSpeed);
				}
			});
			
		}
		
	};
	
	$.fn[pluginName] = function ( options ) {
		
		return this.each(function () {
			
			if ( !$.data(this, pluginName )) {
				$.data( this, pluginName,
				new Plugin( this, options ));
			}
			
		});
		
	}
 
})( jQuery, window, document );

// CAROUSEL

;(function ( $, window, document, undefined ) {
	
	var pluginName = 'ik_carousel',
		defaults = { // default settings
			'instructions': 'Carousel widget. Use left and reight arrows to navigate between slides.',
			'animationSpeed' : 3000
		};
	 
	/**
	 * @constructs Plugin
	 * @param {Object} element - Current DOM element from selected collection.
	 * @param {Object} options - Configuration options.
	 * @param {string} options.instructions - Custom instructions for screen reader users.
	 * @param {number} options.animationSpeed - Slide transition speed in milliseconds.
	 */
	function Plugin( element, options ) {
		
		this._name = pluginName;
		this._defaults = defaults;
		this.element = $(element);
		this.options = $.extend( {}, defaults, options) ;
		
		this.init();
	
	};
	
	/** Initializes plugin. */
	Plugin.prototype.init = function () {
		
		var id, plugin, $elem, $image, $controls, $navbar;
		
		plugin = this;
		id = 'carousel' + $('.ik_carousel').length; 
		$elem = plugin.element;
		
		$elem
			.attr({
				'id': id,
				'role': 'region', // assign region rols
				'tabindex': 0, // add into the tab order
				'aria-describedby': id + '_instructions' // associate with instructions
			})
			.addClass('ik_carousel')
			.on('keydown', {'plugin': plugin}, plugin.onKeyDown)
			.on('focusin mouseenter', {'plugin': plugin}, plugin.stopTimer)
			.on('focusout mouseleave', {'plugin': plugin}, plugin.startTimer)
		
		$controls = $('<div/>')
			.attr({
				'aria-hidden': 'true' // hide controls from screen readers
			})
			.addClass('ik_controls')
			.appendTo($elem);
				
		$('<div/>')
			.addClass('ik_button ik_prev')
			.on('click', {'plugin': plugin, 'slide': 'left'}, plugin.gotoSlide)
			.appendTo($controls);
		
		$('<div/>')
			.addClass('ik_button ik_next')
			.on('click', {'plugin': plugin, 'slide': 'right'}, plugin.gotoSlide)
			.appendTo($controls);
		
		$navbar = $('<ul/>')
			.addClass('ik_navbar')
			.appendTo($controls);
			
		plugin.slides = $elem
			.children('figure')
			.each(function(i, el) {
				var $me, $src;
				
				$me = $(el);
				$src = $me.find('img').remove().attr('src');
				
				$me.attr({
						'aria-hidden': 'true' // hide images from screen readers
					})
					.css({
						'background-image': 'url(' + $src + ')'
					});	
				
				$('<li/>')
					.on('click', {'plugin': plugin, 'slide': i}, plugin.gotoSlide)
					.appendTo($navbar);
			});
		
		plugin.navbuttons = $navbar.children('li');
		
		plugin.slides.first().addClass('active');
		plugin.navbuttons.first().addClass('active');
		
		$('<div/>') // add instructions for screen reader users
				.attr({
					'id': id + '_instructions',
					'aria-hidden': 'true'
				})
				.text(this.options.instructions)
				.addClass('ik_readersonly')
				.appendTo($elem);
		
		
		
		plugin.startTimer({'data':{'plugin': plugin}});
		
	};
	
	/** 
	 * Starts carousel timer. 
	 * Reference to plugin must be passed with event data.
	 * 
	 * @param {object} event - Mouse or focus event.
	 */
	Plugin.prototype.startTimer = function (event) {
		
		var plugin;
		
		$elem = $(this);
		plugin = event.data.plugin;
		
		if (event.type === 'focusout') {
			plugin.element.removeAttr('aria-live');
		}
		
		if(plugin.timer) {
			clearInterval(plugin.timer);
			plugin.timer = null;
		}
		
		plugin.timer = setInterval(plugin.gotoSlide, plugin.options.animationSpeed, {'data':{'plugin': plugin, 'slide': 'right'}});
		
	};
	
	/** 
	 * Stops carousel timer. 
	 * 
	 * @param {object} event - Mouse or focus event.
	 * @param {object} event.data - Event data.
	 * @param {object} event.data.plugin - Reference to plugin.
	 */
	Plugin.prototype.stopTimer = function (event) {
		
		var plugin = event.data.plugin;
		
		if (event.type === 'focusin') {
			plugin.element.attr({'aria-live': 'polite'});
		}
		
		clearInterval(plugin.timer);
		plugin.timer = null;
		
	};
	
	/** 
	 * Goes to specified slide. 
	 * 
	 * @param {object} event - Mouse or focus event.
	 * @param {object} event.data - Event data.
	 * @param {object} event.data.plugin - Reference to plugin.
	 * @param {(number|string)} event.data.slide - Index of the slide to show.
	 */
	Plugin.prototype.gotoSlide = function (event) {
		
		var plugin, n, $elem, $active, $next, index, direction, transevent;
		
		plugin = event.data.plugin;
		n = event.data.slide;
		$elem = plugin.element;
		$active = $elem.children('.active');
		index = $active.index();
		
		if (typeof n === 'string') {
			
			if(n === 'left') {
				direction = 'left';
				n = index == 0 ? plugin.slides.length - 1 : --index;
			} else {
				direction = 'right'
				n = index == plugin.slides.length - 1 ? 0 : ++index;
			}
			
		} else {
			if (index < n || (index == 0 && n == plugin.slides.length - 1)) {
				direction = 'left';
			} else {
				direction = 'right';
			}
		}
		
		$next = plugin.slides.eq(n).addClass('next');
		transevent = ik_utils.getTransitionEventName();
		$active.addClass(direction).on(transevent, {'next': $next, 'dir': direction}, function(event) {
			
			var active, next, dir;
			
			active = $(this);
			next = event.data.next;
			dir = event.data.dir;
			
			active.attr({
					'aria-hidden': 'true'
				})
				.off( ik_utils.getTransitionEventName() )
				.removeClass(direction + ' active');
				
			next.attr({
					'aria-hidden': 'false'
				})
				.removeClass('next')
				.addClass('active');
			
		});
		
		plugin.navbuttons.removeClass('active').eq(n).addClass('active');
		
	}
	
	/** 
	 * Handles kedown event on header button.
	 * 
	 * @param {object} event - Keyboard event.
	 * @param {object} event.data - Event data.
	 * @param {object} event.data.plugin - Reference to plugin.
	 */
	Plugin.prototype.onKeyDown = function (event) {
		
		var plugin = event.data.plugin;
		
		switch (event.keyCode) {
			
			case ik_utils.keys.left:
				event.data = {'plugin': plugin, 'slide': 'left'};
				plugin.gotoSlide(event);
				break;
			case ik_utils.keys.right:
				event.data = {'plugin': plugin, 'slide': 'right'};
				plugin.gotoSlide(event);
				break;
			case ik_utils.keys.esc:
				plugin.element.blur();
				break;
		}
	}
	
	$.fn[pluginName] = function ( options ) {
		
		return this.each(function () {
			
			if ( !$.data(this, pluginName )) {
				$.data( this, pluginName,
				new Plugin( this, options ));
			}
			
		});
		
	}
	
})( jQuery, window, document );

// PROGRESSBAR

;(function ( $, window, document, undefined ) {
	
	var pluginName = 'ik_progressbar',
		defaults = { // values can be overitten by passing configuration options to plugin constructor 
			'instructions': 'Press spacebar, or Enter to get progress',
			'max': 100
		};
	
	/**
	 * @constructs Plugin
	 * @param {Object} element - Current DOM element from selected collection.
	 * @param {Object} options - Configuration options.
	 * @param {string} options.instructions - Custom instructions for screen reader users.
	 * @param {number} options.max - End value.
	 */ 
	function Plugin( element, options ) {
		
		this._name = pluginName;
		this._defaults = defaults;
		this.element = $(element);
		this.options = $.extend( {}, defaults, options) ;
		
		this.init();
	
	}
	
	/** Initializes plugin. */
	Plugin.prototype.init = function () { // initialization function
		
		var id = 'pb' + $('.ik_progressbar').length;
				
		this.element
			.attr({
				'id': id,
				'tabindex': -1, // add current element to tab oder
				'aria-describedby': id + '_instructions' // add aria-describedby attribute 
			})
			.addClass('ik_progressbar')
			.on('keydown.ik', {'plugin': this}, this.onKeyDown);
		
		this.fill = $('<div/>')
			.addClass('ik_fill');
			
		this.notification = $('<div/>') // add div element to be used to notify about the status of download
			.attr({
				'aria-role': 'region', // make it a live region
				'aria-live': 'assertive', // set notofocation priority to high
				'aria-atomic': 'additions' // notify only about newly added text
			})
			.addClass('ik_readersonly')
			.appendTo(this.element);
		
		$('<div/>') // add div element to be used with aria-described attribute of the progressbar
			.text(this.options.instructions) // get instruction text from plugin options
			.addClass('ik_readersonly') // hide element from visual display
			.attr({
				'id': id + '_instructions', 
				'aria-hidden': 'true'  // hide element from screen readers to prevent it from being read twice
			})
			.appendTo(this.element);
			
		$('<div/>')
			.addClass('ik_track')
			.append(this.fill)
			.appendTo(this.element);
		
	};
	
	/** 
	 * Handles kedown event on progressbar element. 
	 *
	 * @param {Object} event - Keyboard event.
	 * @param {object} event.data - Event data.
	 * @param {object} event.data.plugin - Reference to plugin.
	 */
	Plugin.prototype.onKeyDown = function(event) {
		
		switch(event.keyCode) {
			
			case ik_utils.keys.space:
			case ik_utils.keys.enter:
				event.preventDefault();
				event.stopPropagation();
				event.data.plugin.notify();
				break;
		}
		
		
	};
	
	/** 
	 * Gets the current value of progressbar. 
	 *
	 * @returns {number} 
	 */
	Plugin.prototype.getValue = function() {
		
		var value;
		
		value = Number( this.element.data('value') );
				
		return parseInt( value );
		
	};
	
	/** 
	 * Gets the current value of progressbar. 
	 *
	 * @returns {number} 
	 */
	Plugin.prototype.getPercent = function() {
		
		var percent = this.getValue() / this.options.max * 100;
		
		return parseInt( percent );
		
	};
	
	/** 
	 * Sets the current value of progressbar. 
	 *
	 * @param {number} n - The current value. 
	 */
	Plugin.prototype.setValue = function(n) {
		
		var $el, val, isComplete = false;
		
		$el = $(this.element);
				
		if (n >= this.options.max) {
			val = this.options.max;
			$el.attr({
					'tabindex': -1
				});
			this.notification.text('Loading complete');
		} else {
			val = n;
		}
		
		this.element
			.data({
				'value': parseInt(val) 
			});
		
		this.updateDisplay();
		
	};
	
	/** Updates visual display. */
	Plugin.prototype.updateDisplay = function() {
		
		this.fill.css({
			'transform': 'scaleX(' + this.getPercent() / 100 + ')'
		});
	
	};
	
	/** Updates text in live region to notify about current status. */
	Plugin.prototype.notify = function() {
		
		this.notification.text(  this.getPercent() + '%' );
		
	};
	
	/** Resets progressbar. */
	Plugin.prototype.reset = function() {
		
		this.setValue(0);
		this.updateDisplay();
		this.notify();
	
	};
	
	$.fn[pluginName] = function ( options ) {
		
		return this.each(function () {
			
			if ( !$.data(this, pluginName )) {
				$.data( this, pluginName,
				new Plugin( this, options ));
			}
			
		});
		
	}
	
})( jQuery, window, document );

// SLIDER

;(function ( $, window, document, undefined ) {
	
	var pluginName = 'ik_slider',
		defaults = {
			'instructions': 'Use left and right arrow keys to change the value by one increment, home and end keys to set value to minimum and maximum values correspondingly.',
			'minValue': 0,
			'maxValue': 100,
			'nowValue': 0,
			'step': 1
		};
	 
	/**
	 * @constructs Plugin
	 * @param {object} element - Current DOM element from selected collection.
	 * @param {object} options - Configuration options.
	 * @param {string} options.instructions - Custom instructions for screen reader users.
	 * @param {number} options.minValue - Slider minimum value.
	 * @param {number} options.maxValue - Slider maximum value.
	 * @param {number} options.nowValue - Slider current value.
	 * @param {number} options.step - Slider increment value.
	 */
	function Plugin( element, options ) {
		
		this._name = pluginName;
		this._defaults = defaults;
		this.element = $(element);
		this.options = $.extend( {}, defaults, options) ;
		
		this.init();
	
	}
	
	/** Initializes plugin. */
	Plugin.prototype.init = function () {
		
		var id, plugin;
		
		plugin = this;
		id = 'slider' + $('.ik_slider').length; // generate unique id
		
		plugin.textfield = plugin.element;
		
		if( !plugin.textfield.is(':text') ) {
			
			throw( plugin._name + ' plugin must be used only with text input elements.');
		
		} else {
		
			plugin.textfield
				.attr({
					'readonly': '',
					'tabindex': -1
				})
				.addClass('ik_value')
				.wrap('<div></div>'); // wrap initial element in a div
			
			plugin.element = plugin.textfield.parent('div').addClass('ik_slider')
				.on('mousedown', function(event){ event.preventDefault(); })
				.on('mouseleave', {'plugin': plugin}, plugin.onMouseUp);
			
			plugin.fill = $('<div/>')
				.addClass('ik_fill');
			
			plugin.knob = $('<div/>')
				.attr({
					'id': id,
					'tabindex': 0, // add this element to tab order
					'role': 'slider', // assign role slider
					'aria-valuemin': plugin.options.minValue, // set slider minimum value
					'aria-valuemax': plugin.options.maxValue, // set slider maximum value
					'aria-valuenow': plugin.options.minValue, // set slider current value
					'aria-labelledby': id + '_instructions' // add description
				})
				.addClass('ik_knob')
				.on('keydown.ik', {'plugin': plugin}, plugin.onKeyDown)
				.on('mousedown.ik', {'plugin': plugin}, plugin.onMouseDown)
				.on('mousemove.ik', {'plugin': plugin}, plugin.onMouseMove)
				.on('mouseup.ik', {'plugin': plugin}, plugin.onMouseUp)
				.on('mouseleave.ik', function(){ setTimeout(plugin.onMouseUp, 100, { 'data': {'plugin': plugin} }) });
			
			$('<div/>') // add instructions for screen reader users
				.attr({
					'id': id + '_instructions'
				})
				.text(plugin.options.instructions)
				.addClass('ik_readersonly')
				.appendTo(this.element);
			
			$('<div/>') // add slider track
				.addClass('ik_track')
				.append(this.fill, this.knob)
				.prependTo(this.element);
			
			this.setValue(plugin.options.minValue); // update current value
		
		}
					
	};
	
	/** 
	 * Sets current value. 
	 * 
	 * @param {number} n - Current value.
	 */
	Plugin.prototype.setValue = function (n) {
		
		this.textfield.val(n);
		this.options.nowValue = n;
		this.knob
			.attr({
				'aria-valuenow': n
			});	
		this.updateDisplay(n); // update display
	};
	
	/** 
	 * Updates display. 
	 * 
	 * @param {number} n - Current value.
	 */
	Plugin.prototype.updateDisplay = function (n) {
		
		var percent; 
		
		percent = (n - this.options.minValue) / (this.options.maxValue - this.options.minValue);
			
		this.fill
			.css({
				'transform':'scaleX(' + percent + ')' 
			});
		
		this.knob
			.css({
				'left': percent * 100 + '%'
			});
		
	};
	
	/** 
	 * Keyboard event handler. 
	 * 
	 * @param {object} event - Keyboard event.
	 * @param {object} event.data - Event data.
	 * @param {object} event.data.plugin - Reference to plugin.
	 */
	Plugin.prototype.onKeyDown = function (event) {
		
		var $elem, plugin, value;
		
		$elem = $(this);
		plugin = event.data.plugin;
		
		switch (event.keyCode) {
			
			case ik_utils.keys.right:
				
				value = parseInt($elem.attr('aria-valuenow')) + plugin.options.step;
				value = value < plugin.options.maxValue ? value : plugin.options.maxValue;		
				plugin.setValue(value);
				break;
				
			case ik_utils.keys.end:
				plugin.setValue(plugin.options.maxValue);
				break;
			
			case ik_utils.keys.left:
				
				value = parseInt($elem.attr('aria-valuenow')) - plugin.options.step;
				value = value > plugin.options.minValue ? value : plugin.options.minValue
				plugin.setValue(value);
				break;
			
			case ik_utils.keys.home:
				plugin.setValue(plugin.options.minValue);
				break;
				
		}
		
	};
	
	/** 
	 * Mousedown event handler. 
	 * 
	 * @param {object} event - Keyboard event.
	 * @param {object} event.data - Event data.
	 * @param {object} event.data.plugin - Reference to plugin.
	 */
	Plugin.prototype.onMouseDown = function (event) {
		
		var plugin = event.data.plugin;
		plugin.dragging = true;
		plugin.element.addClass('dragging');
		plugin.knob.focus();
		
	};
	
	/** 
	 * Mousemove event handler. 
	 * 
	 * @param {object} event - Keyboard event.
	 * @param {object} event.data - Event data.
	 * @param {object} event.data.plugin - Reference to plugin.
	 */
	Plugin.prototype.onMouseMove = function (event) {
		
		var $elem, plugin, $parent, min, max, step, value, percent, diff, mod, test;
		
		event.preventDefault();
		event.stopPropagation();
		
		$me = $(this);
		$parent = $me.parent();
		plugin = event.data.plugin;
		
		if(event.data.plugin.dragging) { 
			
			min = plugin.options.minValue;
			max = plugin.options.maxValue
			step = plugin.options.step;
			
			percent = (event.pageX - $parent.offset().left) / $parent.width();
			value = percent <= 0 ? min : percent >= 1 ? max : min + Math.floor( (max - min) * percent );
			mod = (value - min) % step;
						
			if (mod < step / 1.5) {	
				plugin.setValue(value - mod);
			} else {
				plugin.setValue(value - mod + step);
			}
			plugin.updateDisplay(value);
			
		}
		
	};
	
	/** 
	 * Mouseup event handler.
	 * 
	 * @param {object} event - Keyboard event.
	 * @param {object} event.data - Event data.
	 * @param {object} event.data.plugin - Reference to plugin.
	 */
	Plugin.prototype.onMouseUp = function (event) {
		
		var plugin = event.data.plugin;
		plugin.dragging = false;
		plugin.element.removeClass('dragging');
		plugin.setValue(plugin.options.nowValue);
		
	};
	
	$.fn[pluginName] = function ( options ) {
		
		return this.each(function () {
			
			if ( !$.data(this, pluginName )) {
				$.data( this, pluginName,
				new Plugin( this, options ));
			}
			
		});
		
	}
	
})( jQuery, window, document );

// SORTABLE LIST

;(function ( $, window, document, undefined ) {
 
var pluginName = "ik_sortable",
	modifier = navigator.platform.indexOf('Mac') > -1 ? 'Command' : 'Control',
	defaults = {
		'instructions': 'Use arrow keys to select a list item,  ' + modifier + ' + arrow keys to move it to a new position.'
	};
	 
	function Plugin( element, options ) {
		
		this.element = $(element);
		this.options = $.extend( {}, defaults, options);
		this._defaults = defaults;
		this._name = pluginName;
		
		this.init();
	}
	
	console.log(navigator.platform.indexOf('Mac'));
	 
	Plugin.prototype.init = function () {
		
		var $elem, plugin, id, total;
		
		plugin = this;
		id = 'sortable_' + $('.ik_sortable').length;
		$elem = this.element.attr({
			'role': 'list',
			'id': id,
			'tabindex': 0,
			'aria-labelledby': id + '_instructions'
		})
		.wrap('<div class="ik_sortable"></div>').before(plugin.temp);
		
		$('<div/>') // add div element to be used with aria-describedby attribute of the menu
			.text(plugin.options.instructions) // get instruction text from plugin options
			.addClass('ik_readersonly') // hide element from visual display
			.attr({
				'id': id + '_instructions', 
				'aria-hidden': 'true'  // hide element from screen readers to prevent it from being read twice
			})
			.appendTo($elem);
			
		total = $elem.children('li').length;
			
		plugin.items = $elem.children('li').each( function(i, el) {
			
			$(el).attr({
				'role': 'listitem',
				'draggable': true,
				'aria-label': $(el).text() + ' ' + (i + 1) + ' of ' + total + ' movable',
				'id': id + '_' + i,
				'tabindex': i > 0 ? -1 : 0
			});
		})
		.on('dragstart', {'plugin': plugin}, plugin.onDragStart)
		.on('drop', {'plugin': plugin}, plugin.onDrop)
		.on('dragend', {'plugin': plugin}, plugin.onDragEnd)
		.on('dragenter', {'plugin': plugin}, plugin.onDragEnter)
		.on('dragover', {'plugin': plugin}, plugin.onDragOver)
		.on('dragleave', {'plugin': plugin}, plugin.onDragLeave)
		.on('keydown', {'plugin': plugin}, plugin.onKeyDown);
		
		
	};
	
	// dragged item
	
	Plugin.prototype.onDragStart = function (event) {
		
		var plugin, $me;
				
		plugin = event.data.plugin;
		event = event.originalEvent || event;
		$me = $(event.currentTarget);
		
		event.dataTransfer.effectAllowed = 'move';
		event.dataTransfer.setData('text', $me.attr('id'));
		
	};
	
	Plugin.prototype.onDrop = function (event) {
		
		var source_id, $me;
		
		event = event.originalEvent || event;
		event.preventDefault();
		event.stopPropagation();
		$me = $(event.currentTarget);
		
		source_id = event.dataTransfer.getData('text');
		
		if(source_id != $me.attr('id')) {
			
			if ($me.hasClass('dropafter')) {
				$me.after($('#' + source_id));
			} else {
				$me.before($('#' + source_id));
			}
			
		}
		
		
	};
	
	Plugin.prototype.onDragEnd = function (event) {
		
		var plugin;
				
		plugin = event.data.plugin;
		plugin.element.find('.dragover').removeClass('dragover');
		
	};
	
	// drop target
	
	Plugin.prototype.onDragEnter = function (event) {
		
		$(event.currentTarget).addClass('dragover');
		
	};
	
	Plugin.prototype.onDragOver = function (event) {
		
		var $me, y, h;
		
		event = event.originalEvent || event;
		event.preventDefault();
		event.dataTransfer.dropEffect = 'move';
		
		$me = $(event.currentTarget);
		
		y = event.pageY - $me.offset().top;
		h = $me.outerHeight();
		
		$me.toggleClass('dropafter', y > h / 2);
		
	};
	
	Plugin.prototype.onDragLeave = function (event) {
		
		$(event.currentTarget).removeClass('dragover');
		
	};
	
	Plugin.prototype.onKeyDown = function (event) {
		
		var plugin, $me, currIndex, nextIndex;
		
		plugin = event.data.plugin;
		$me = $(event.currentTarget);
		currentIndex = plugin.items.index(event.currentTarget);
			
		switch (event.keyCode) {
			
			case ik_utils.keys.down:
				
				plugin.items.attr({'tabindex': -1});
				
				if(currentIndex < plugin.items.length - 1) {
					if(event.ctrlKey || event.metaKey) { // move item down
						$me.insertAfter( $me.next() );
						$me.attr({'tabindex': 0}).focus();
						plugin.resetNumbering(plugin);
					} else { // move focus to the next item
						$me.next().attr({'tabindex': 0}).focus();
					}
				}
				
				break;
			
			case ik_utils.keys.up:
				
				plugin.items.attr({'tanindex': -1});
				
				if(currentIndex > 0) {
					if(event.ctrlKey || event.metaKey) { // move item up
						$me.insertBefore( $me.prev() );
						$me.attr({'tabindex': 0}).focus();
						plugin.resetNumbering(plugin);
					} else { // move focus to the previous item
						$me.prev().attr({'tabindex': 0}).focus();
					}
				}
				
				break;
			
		}
		
	};
	
	Plugin.prototype.resetNumbering = function (plugin) {
		
		plugin.items = plugin.element.children('li');
		
		plugin.items.each( function(i, el) {
			var $me = $(el);
			$me.attr({
				'aria-label': $me.text() + ' ' + (i + 1) + ' of ' + plugin.items.length + ' movable'
			});
		});
		
	}

	$.fn[pluginName] = function ( options ) {
		
		return this.each(function () {
			
			if ( !$.data(this, pluginName )) {
				$.data( this, pluginName,
				new Plugin( this, options ));
			}
			
		});
		
	}
 
})( jQuery, window, document );

// SUGGESTION BOX

;(function ( $, window, document, undefined ) {
 
var pluginName = "ik_suggest",
	defaults = {
		'instructions': "As you start typing the application might suggest similar search terms. Use up and down arrow keys to select a suggested search string.",
		'minLength': 2,
		'maxResults': 10,
		'source': []
		
	};
	
	/**
	 * @constructs Plugin
	 * @param {Object} element - Current DOM element from selected collection.
	 * @param {Object} options - Configuration options.
	 * @param {string} options.instructions - Custom instructions for screen reader users.
	 * @param {number} options.minLength - Mininmum string length before sugestions start showing.
	 * @param {number} options.maxResults - Maximum number of shown suggestions.
	 */
	function Plugin( element, options ) { 
		
		this.element = $(element);
		this.options = $.extend( {}, defaults, options);
		this._defaults = defaults;
		this._name = pluginName;
		
		this.init();
	}
	
	/** Initializes plugin. */
	Plugin.prototype.init = function () {
		
		var $elem, plugin;
		
		plugin = this;
		
		plugin.notify = $('<div/>') // add hidden live region to be used by screen readers
			.addClass('ik_readersonly')
			.attr({
				'role': 'region',
				'aria-live': 'polite'
			});
		
		$elem = plugin.element
			.attr({
				'autocomplete': 'off'
			})
			.wrap('<span class="ik_suggest"></span>') 
			.on('focus', {'plugin': plugin}, plugin.onFocus)
			.on('keydown', {'plugin': plugin}, plugin.onKeyDown) // add keydown event
			.on('keyup', {'plugin': plugin}, plugin.onKeyUp) // add keyup event
			.on('focusout', {'plugin': plugin}, plugin.onFocusOut);  // add focusout event
		
		plugin.list = $('<ul/>').addClass('suggestions');
		
		$elem.after(plugin.notify, plugin.list);
				
	};
	
	/** 
	 * Handles focus event on text field.
	 * 
	 * @param {object} event - Keyboard event.
	 * @param {object} event.data - Event data.
	 * @param {object} event.data.plugin - Reference to plugin.
	 */
	Plugin.prototype.onFocus = function (event) {
		
		var plugin;
		
		plugin = event.data.plugin;
		plugin.notify.text(plugin.options.instructions);

	};
	
	/** 
	 * Handles kedown event on text field.
	 * 
	 * @param {object} event - Keyboard event.
	 * @param {object} event.data - Event data.
	 * @param {object} event.data.plugin - Reference to plugin.
	 */
	Plugin.prototype.onKeyDown = function (event) {
		
		var plugin, selected;
		
		plugin = event.data.plugin;
		
		switch (event.keyCode) {
			
			case ik_utils.keys.tab:
			case ik_utils.keys.esc:
								
				plugin.list.empty().hide(); // empty list and hide suggestion box
					
				break;
			
			case ik_utils.keys.enter:
				
				selected = plugin.list.find('.selected');
				plugin.element.val( selected.text() ); // set text field value to the selected option
				plugin.list.empty().hide(); // empty list and hide suggestion box
				
				break;
				
		}
		
	};
	
	/** 
	 * Handles keyup event on text field.
	 * 
	 * @param {object} event - Keyboard event.
	 * @param {object} event.data - Event data.
	 * @param {object} event.data.plugin - Reference to plugin.
	 */
	Plugin.prototype.onKeyUp = function (event) {
		
		var plugin, $me, suggestions, selected, msg;
		
		plugin = event.data.plugin;
		$me = $(event.currentTarget);
			
		switch (event.keyCode) {
			
			case ik_utils.keys.down: // select next suggestion from list
				
				selected = plugin.list.find('.selected');
				
				if(selected.length) {
					msg = selected.removeClass('selected').next().addClass('selected').text();
				} else {
					msg = plugin.list.find('li:first').addClass('selected').text();
				}
				plugin.notify.text(msg); // add suggestion text to live region to be read by screen reader
				
				break;
			
			case ik_utils.keys.up: // select previous suggestion from list
				
				selected = plugin.list.find('.selected');
				
				if(selected.length) {
					msg = selected.removeClass('selected').prev().addClass('selected').text();
				}
				plugin.notify.text(msg);  // add suggestion text to live region to be read by screen reader
							
				break;
			
			default: // get suggestions based on user input
				
				plugin.list.empty();
				
				suggestions = plugin.getSuggestions(plugin.options.source, $me.val());
				
				if (suggestions.length > 1) {
					for(var i = 0, l = suggestions.length; i < l; i++) {
						$('<li/>').html(suggestions[i])
						.on('click', {'plugin': plugin}, plugin.onOptionClick) // add click event handler
						.appendTo(plugin.list);
					}
					plugin.list.show();
				} else {
					plugin.list.hide();
				}
				
				break;
		}
	};
	
	/** 
	 * Handles fosucout event on text field.
	 * 
	 * @param {object} event - Focus event.
	 * @param {object} event.data - Event data.
	 * @param {object} event.data.plugin - Reference to plugin.
	 */
	Plugin.prototype.onFocusOut = function (event) {
		
		var plugin = event.data.plugin;
		
		setTimeout(function() { plugin.list.empty().hide(); }, 200);
		
	};
	
	/** 
	 * Handles click event on suggestion box list item.
	 * 
	 * @param {object} event - Keyboard event.
	 * @param {object} event.data - Event data.
	 * @param {object} event.data.plugin - Reference to plugin.
	 */
	Plugin.prototype.onOptionClick = function (event) {
		
		var plugin, $option;
		
		event.preventDefault();
		event.stopPropagation();
		
		plugin = event.data.plugin;
		$option = $(event.currentTarget);
		plugin.element.val( $option.text() );
		plugin.list.empty().hide();
		
	};
	
	/** 
	 * Gets a list of suggestions.
	 * 
	 * @param {array} arr - Source array.
	 * @param {string} str - Search string.
	 */
	Plugin.prototype.getSuggestions = function (arr, str) {
		
		var r, pattern, regex, len, limit;
		
		r = [];
		pattern = '(\\b' + str + ')';
		regex = new RegExp(pattern, 'gi');
		len = this.options.minLength;
		limit = this.options.maxResults;
			
		if (str.length >= len) {
			for (var i = 0, l = arr.length; i < l ; i++) {
				if (r.length > limit ) {
					break;
				}
				if ( regex.test(arr[i]) ) {
					r.push(arr[i].replace(regex, '<span>$1</span>'));
				}
			}
		}
		if (r.length > 1) { // add instructions to hidden live area
			this.notify.text('Suggestions are available for this field. Use up and down arrows to select a suggestion and enter key to use it.'); 
		}
		return r;
		
	};

	$.fn[pluginName] = function ( options ) {
		
		return this.each(function () {
			
			if ( !$.data(this, pluginName )) {
				$.data( this, pluginName,
				new Plugin( this, options ));
			}
			
		});
		
	}
 
})( jQuery, window, document );

// TAB PANELS

;(function ( $, window, document, undefined ) {
	 
	var pluginName = 'ik_tabs',
		defaults = {
			tabLocation: 'top',
			selectedIndex: 0
		};
	
	/**
	 * @constructs Plugin
	 * @param {Object} element - Current DOM element from selected collection.
	 * @param {Object} [options] - Configuration options.
	 * @param {number} [options.tabLocation='top'] - Tab location (currently supports only top).
	 * @param {number} [options.selectedIndex] - Initially selected tab.
	 */
	function Plugin( element, options ) {
		
		this._name = pluginName;
		this._defaults = defaults;
		this.element = $(element);
		this.options = $.extend( {}, defaults, options) ;
		
		this.init();
	}
	
	/** Initializes plugin. */
	Plugin.prototype.init = function () {
		
		var id, $elem, $tabbar, pad;
		
		plugin = this;
		id = 'tabs' + $('.ik_tabs').length; // create unique id
		$elem = this.element.addClass('ik_tabs');
		
		$tabbar = $('<ul/>') // create ul element to hold all tabs
			.addClass('ik_tabbar cf')
			.attr({
				'role': 'tablist' // add tablistr role 
			})
			.prependTo($elem);
		
		plugin.panels = $elem // initialize panels and create tabs
			.children('div')
			.each( function(i, el) {
				
				var $tab, $panel, lbl;
				
				$panel = $(el).attr({
					'id': id + '_panel' + i, // add unique id for a panel
					'role': 'tabpanel', // add tabpanel role
					'aria-hidden': true, // initially hide from screen readers
					'tabindex': 0 // add to tab order
				})
				.addClass('ik_tabpanel')
				.hide();
				
				lbl = $panel.attr('title'); // get tab label from panel title
				
				$panel.removeAttr('title');
				
				$tab = $('<li/>').attr({
					'id': id + '_tab' + i, // create unique id for a tab
					'role': 'tab', // assign tab role
					'aria-controls': 'panel' + i // define which panel it controls
				})
				.text(lbl > '' ? lbl : 'Tab ' + (i + 1))
				.on('keydown', {'plugin': plugin, 'index': i}, plugin.onKeyDown) // add keyboard event handler
				.on('click', {'plugin': plugin, 'index': i}, plugin.selectTab) // add mouse event handler
				.appendTo($tabbar);
			});
		
		plugin.tabs = $tabbar.find('li');
		
		plugin.selectTab({ // select a pre-defined tab / panel 
			data:{
				'plugin': plugin, 
				'index': plugin.options.selectedIndex
			}
		});
	};
	
	/** 
	 * Selects specified tab.
	 * 
	 * @param {Object} [event] - Keyboard event (optional).
	 * @param {object} event.data - Event data.
	 * @param {object} event.data.plugin - Reference to plugin.
	 * @param {object} event.data.index - Index of a tab to be selected.
	 */
	Plugin.prototype.selectTab = function (event) {
		
		var plugin = event.data.plugin, 
			ind = event.data.index, 
			$tabs, 
			$panels;
		
		$elem = plugin.element;
		$tabs = plugin.tabs;
		$panels = plugin.panels;
		
		$tabs // deselect all tabs
			.removeClass('selected')
			.attr({
				'aria-selected': false, 
				'tabindex': -1 // remove them from tab order
			})
			.blur();
		
		$($tabs[ind]) // select specified tab
			.addClass('selected')
			.attr({
				'aria-selected': true, 
				tabindex: 0
			})
			.focus();
		
		if (event.type) $($tabs[ind]).focus(); // move focus to current tab if reached by mouse or keyboard
		
		$panels // hide all panels
			.attr({
				'aria-hidden': true
			})
			.hide(); 
		
		$($panels[ind]) // show current panel
			.attr({
				'aria-hidden': false
			})
			.show(); 
		
	}
	
	/** 
	 * Handles kedown event on header button.
	 * 
	 * @param {Object} event - Keyboard event.
	 * @param {object} event.data - Event data.
	 * @param {object} event.data.plugin - Reference to plugin.
	 */
	Plugin.prototype.onKeyDown = function (event) {
		var plugin = event.data.plugin, 
			ind = event.data.index,
			$tabs, 
			$panels, 
			next;
			
		$elem = plugin.element;
		$tabs = plugin.tabs;
		$panels = plugin.panels;
		
		switch (event.keyCode) {
			case ik_utils.keys.left:
				next = ind > 0 ? --ind : 0;
				plugin.selectTab({data:{'plugin': plugin, 'index': next}});
				break;
			case ik_utils.keys.home:
				next = 0;
				plugin.selectTab({data:{'plugin': plugin, 'index': next}});
				break;
			case ik_utils.keys.right:
				next = ind < $tabs.length - 1 ? ++ind : $tabs.length - 1;
				plugin.selectTab({data:{'plugin': plugin, 'index': next}});
				break;
			case ik_utils.keys.end:
				next = $tabs.length - 1;
				plugin.selectTab({data:{'plugin': plugin, 'index': next}});
				break;
			case ik_utils.keys.space:
				event.preventDefault();
				event.stopPropagation();
				return false;
		}
	}
	
	$.fn[pluginName] = function ( options ) {
		
		return this.each(function () {
			
			if ( !$.data(this, pluginName )) {
				$.data( this, pluginName,
				new Plugin( this, options ));
			}
			
		});
		
	}
 
})( jQuery, window, document );

// TOOLTIP

;(function ( $, window, document, undefined ) {
 
	var pluginName = 'ik_tooltip',
		defaults = {
			'position': 'top'
		};
	 
	/**
	 * @constructs Plugin
	 * @param {Object} element - Current DOM element from selected collection.
	 * @param {Object} [options] - Configuration options.
	 * @param {number} [options.position='top'] - Tooltip location (currently supports only top).
	 */
	function Plugin( element, options ) {
		
		this._name = pluginName;
		this._defaults = defaults;
		this.element = $(element);
		this.options = $.extend( {}, defaults, options) ;
		
		this.init();
	}
	
	/** Initializes plugin. */
	Plugin.prototype.init = function () {
		
		var id, $elem, $tooltip, tip;
		
		id = 'tip' + $('.ik_tooltip').length; // generate unique id
		
		$elem = this.element;
		tip = $elem.attr('title'); // get text from element title attribute (required)
		
		if(tip.length > 0) {
			
			$tooltip = $('<span/>') // create tooltip
				.text(tip)
				.addClass('ik_tooltip')
				.attr({
					'id': id,
					'role': 'tooltip', // assign tooltip role
					'aria-hidden': 'true', // hide it from screen reader to prevent it from been read twice
					'aria-live': 'polite' // make it live region
				});
			
			$elem.attr({
					'tabindex': 0 // add tab order
				})
				.css('position', 'relative')
				.removeAttr('title') // remove title to prevent it from being read
				.after($tooltip)
				.on('mouseover focus', function(event) {
					
					var y, x;
					
					y = $elem.position().top - $tooltip.height() - 20;
					x = $elem.position().left;
					
					if(!$elem.is(':focus')) { // remove focus from a focused element
						$(':focus').blur();
					}
					
					$('.ik_tooltip').removeClass('mouseover'); // remove mouseover class from all tooltips
					
					if (event.type === 'mouseover') {
						$tooltip.addClass('mouseover'); // add mouseover class when mouse moves over the current element
					}
					
					$tooltip // position and show tooltip
						.attr({
							'aria-hidden': 'false'
						})
						.css({
							'top': y, 
							'left': x
						})
						.addClass('visible');
				})
				.on('mouseout', function(event) {
					
					if (!$(event.currentTarget).is(':focus') ) { // hide tooltip if current element is not focused
						
						$tooltip
							.attr({
								'aria-hidden': 'true'
							})
							.removeClass('visible mouseover');
					
					}
										
				})
				.on('blur', function(event) {
					
					if (!$tooltip.hasClass('mouseover') ) { // hide tooltip if mouse is not over the current element
						
						$tooltip
							.attr({
								'aria-hidden': 'true'
							})
							.removeClass('visible');
					
					}
										
				})
				.on('keyup', function(event) {
					
					if(event.keyCode == ik_utils.keys.esc) { // hide when escape key is pressed
						$tooltip
							.attr({
								'aria-hidden': 'true'
							})
							.removeClass('visible');
					}
					
				});
		}
	};
	
	$.fn[pluginName] = function ( options ) {
		
		return this.each(function () {
			
			if ( !$.data(this, pluginName )) {
				$.data( this, pluginName,
				new Plugin( this, options ));
			}
			
		});
		
	}
 
})( jQuery, window, document );

// TREE MENU

;(function ( $, window, document, undefined ) {
 
	var pluginName = 'ik_treemenu',
		defaults = {
			'instructions': 'Use up or down arrows to move through menu items, and Enter or Spacebar to toggle submenus open and closed.',
			'menuTitle': 'Breakfast Menu',
			'expandAll': true
		};
	 
	/**
	 * @constructs Plugin
	 * @param {Object} element - Current DOM element from selected collection.
	 * @param {Object} [options] - Configuration options.
	 * @param {number} [options.menuTitle] - Menu title appers above the tree.
	 * @param {number} [options.expandAll] - Expands all tree branches when true.
	 */
	function Plugin( element, options ) {
		
		this._name = pluginName;
		this._defaults = defaults;
		this.element = $(element);
		this.options = $.extend( {}, defaults, options) ;
		
		this.init();
	}
	
	/** Initializes plugin. */
	Plugin.prototype.init = function () {
		
		var id, $elem, plugin;
		
		plugin = this;
		$elem = plugin.element;
		id = 'tree' + $('.ik_treemenu').length; // create unique id
				
		$elem
			.addClass('ik_treemenu')
			.attr({
				'tabindex': 0,
				'aria-labelledby': id + '_instructions'
			});
		
		$('<div/>') // add div element to be used with aria-labelledby attribute of the menu
			.text(plugin.options.instructions) // get instruction text from plugin options
			.addClass('ik_readersonly') // hide element from visual display
			.attr({
				'id': id + '_instructions', 
				'aria-hidden': 'true'  // hide element from screen readers to prevent it from being read twice
			})
			.appendTo($elem);
		
		$('<div/>') // add menu title
			.addClass('title')
			.text( this.options.menuTitle )
			.attr({ 
				'id': id + '_title'
			})
			.prependTo($elem);
		
		$elem 
			.find('ul:first')  // set topmost ul element as a tree container
			.attr({
				'id': id,
				'role': 'tree', // assign tree role
				'aria-labelledby': id + '_title' // label with tree title
			});
		
		$elem // set all li elements as tree folders and items
			.find('li')
			.css({ 'list-style': 'none' })
			.each(function(i, el) {
				
				var $me;
				
				$me = $(el); 
				
				$me.attr({
					'id': id + '_menuitem_' + i,
					'role': 'treeitem', // assign treeitem role
					'tabindex': -1, // remove from tab order
					'aria-level': $me.parents('ul').length, // add tree level
					'aria-setsize': $me.siblings().length + 1, // define number of treeitems on the current level 
					'aria-posinset': $me.parent().children().index($me) + 1 // define position of the current element on the current level 
				});
				
				$($me.contents()[0]).wrap('<span></span>'); // wrap text element of each treitem with span element
				
				if ($me.children('ul').length) {  // if the current treeitem has submenu
					
					if (plugin.options.expandAll) { // expand or collapse all tree levels based on configuration
						$me.attr({
							'aria-expanded': true
						});
					} else {
						$me.attr({
							'aria-expanded': false
						}).addClass('collapsed');
					}
					
					$me
						.attr({
							'aria-label': $me.children('span:first').text()
						})
						.children('span')
						.addClass('folder')
						.attr({
							'role': 'presentation'
						});
					
				} else {
					
					$me.attr({'aria-selected': false});
					
				}
			
			})
			.on('click', {'plugin': plugin}, plugin.onClick)
			.on('keydown', {'plugin': plugin}, plugin.onKeyDown);
		
		$elem // make the first treeitem focusable
			.find('li:first')
			.attr({
				'tabindex': 0
			});
		
	};
	
	/** 
	 * Selects treeitem.
	 * 
	 * @param {object} $item - jQuery object containing treeitem to select.
	 * @param {object} plugin - reference to plugin.
	 */
	Plugin.prototype.selectItem = function($item, plugin) {
		var $elem = plugin.element;
		
		$elem.find('[aria-selected=true]') // remove previous selection
			.attr({ 
				'tabindex': -1,
				'aria-selected': false
			});
		
		$elem.find('.focused') // remove highlight form previousely selected treeitem
			.removeClass('focused');
		
		$elem.find('li').attr({ // remove all treeitems from tab order
			'tabindex': -1
		})
		
		$item.attr({ // select specified treeitem
			'tabindex': 0, // add selected treeitem to tab order
			'aria-selected': true
		});
		
		if ($item.children('ul').length) { // highlight selected treeitem
			$item.children('span').addClass('focused');
		} else {
			$item.addClass('focused');
		}
		
		$item.focus();
	};
	
	/** 
	 * Toggles submenu.
	 * 
	 * @param {object} $item - jQuery object containing treeitem with submenu.
	 */
	Plugin.prototype.toggleSubmenu = function($item) {
		
		if($item.children('ul').length) { // check if the treeitem contains submenu
			
			if ($item.hasClass('collapsed')) {  // expand if collapsed
				$item.attr({
					'aria-expanded': true
				}).removeClass('collapsed');
			} else { 							// otherwise collapse
				$item.attr({
					'aria-expanded': false
				}).addClass('collapsed');
			}
		}
	}
	
	/** 
	 * Handles mouseover event on header button.
	 * 
	 * @param {Object} event - Event object.
	 * @param {object} event.data - Event data.
	 * @param {object} event.data.plugin - Reference to plugin.
	 */
	Plugin.prototype.onMouseOver = function (event) {
		
		var plugin = event.data.plugin,
			$me = $(event.currentTarget);
		
		event.stopPropagation();
		
		plugin.element // remove highlight form previous treeitem
			.find('.mouseover')
			.removeClass('mouseover');
		
		$me.children('span') // add highlight to currently selected treeitem
			.addClass('mouseover'); 
		
	}
	
	/** 
	 * Handles click event on header button.
	 * 
	 * @param {Object} event - Event object.
	 * @param {object} event.data - Event data.
	 * @param {object} event.data.plugin - Reference to plugin.
	 */
	Plugin.prototype.onClick = function (event) {
		
		var plugin = event.data.plugin,
			$me = $(event.currentTarget);
		
		event.preventDefault();
		event.stopPropagation();
		
		plugin.toggleSubmenu($me);
		plugin.selectItem($me, plugin);
	};
	
	/** 
	 * Handles kedown event on header button.
	 * 
	 * @param {Object} event - Event object.
	 * @param {object} event.data - Event data.
	 * @param {object} event.data.plugin - Reference to plugin.
	 */
	Plugin.prototype.onKeyDown = function (event) {
		
		var plugin, $elem, $me, $visibleitems, curindex, newindex;
		
		plugin = event.data.plugin;
		$elem = plugin.element;
		$me = $(event.currentTarget);
		
		switch (event.keyCode) {
			case ik_utils.keys.down:
				event.preventDefault();
				event.stopPropagation();
				
				$visibleitems = $elem.find('[role=treeitem]:visible');
				newindex = $visibleitems.index($me) + 1;
				
				if (newindex < $visibleitems.length) {
					plugin.selectItem( $($visibleitems[newindex]), plugin );
				}
				break;
			case ik_utils.keys.up:
				event.preventDefault();
				event.stopPropagation();
				
				$visibleitems = $elem.find('[role=treeitem]:visible');
				newindex = $visibleitems.index($me) - 1;
				
				if (newindex > -1) {
					plugin.selectItem( $($visibleitems[newindex]), plugin );
				}
				break;
			case ik_utils.keys.right:
				event.preventDefault();
				event.stopPropagation();
				
				if($me.attr('aria-expanded') == 'false') {
					plugin.toggleSubmenu($me);
				}
				break;
			case ik_utils.keys.left:
				event.preventDefault();
				event.stopPropagation();
				
				if($me.attr('aria-expanded') == 'true') {
					plugin.toggleSubmenu($me);
				}
				break;
			case ik_utils.keys.enter:
			case ik_utils.keys.space:
				event.preventDefault();
				event.stopPropagation();
				
				plugin.toggleSubmenu($me);
				
				return false;
		}
		
	}
	
	$.fn[pluginName] = function ( options ) {
		
		return this.each(function () {
			
			if ( !$.data(this, pluginName )) {
				$.data( this, pluginName,
				new Plugin( this, options ));
			}
			
		});
		
	}
 
})( jQuery, window, document );

// MENU BAR

;(function ( $, window, document, undefined ) {
 
	var pluginName = 'ik_menu',
		defaults = {
			'instructions': 'Use arrow keys to navigate between menuitems, spacebar to expand submenus, escape key to close submenus, enter to activate menuitems.'
		};
	 
	/**
	 * @constructs Plugin
	 * @param {Object} element - Current DOM element from selected collection.
	 * @param {Object} [options] - Configuration options.
	 */
	function Plugin( element, options ) {
		
		this._name = pluginName;
		this._defaults = defaults;
		this.element = $(element);
		this.options = $.extend( {}, defaults, options) ;
		
		this.init();
	}
	
	/** Initializes plugin. */
	Plugin.prototype.init = function () {
		
		var id, $elem, plugin;
		
		plugin = this;
		id = 'menu' + $('.ik_menu').length; // generate unique id
		$elem = plugin.element;
		
		$elem.addClass('ik_menu')
			.attr({
				'id': id
			});
		
		$('<div/>') // add div element to be used with aria-described attribute of the menu
			.text(plugin.options.instructions) // get instruction text from plugin options
			.addClass('ik_readersonly') // hide element from visual display
			.attr({
				'id': id + '_instructions', 
				'aria-hidden': 'true'  // hide element from screen readers to prevent it from being read twice
			})
			.appendTo(this.element);
			
		$elem.find('ul:eq(0)')
			.attr({
				'id': id,
				'role': 'menubar', // assign menubar role to the topmost ul element
				'tabindex': 0,
				'aria-labelledby': id + '_instructions'
			});
		
		$elem.find('li>ul').attr({
			'role': 'menu',
			'aria-hidden': true // hide submenus from screen reader
		});
		
		plugin.menuitems = $elem.find('li') // setup menuitems
			.css({ 'list-style': 'none' })
			.each(function(i, el) {
				
				var $me, $link;
				
				$me = $(this);
				$link = $me.find('>a').attr({ // disable links
					'tabindex': -1, 
					'aria-hidden': true
				});
				
				$me.attr({ 
					'role': 'menuitem', // assign menuitem rols
					'tabindex': -1,  // remove from tab order
					'aria-label': $link.text() // label with link text
				});
				
				$me.has('ul').attr({ // setup submenus
					'aria-haspopup': true,
					'aria-expanded': false
				}).addClass('expandable');
			});
		
		plugin.selected = plugin.menuitems // setup selected menuitem
			.find('.selected')
			.attr({
				'tabindex': 0, 
				'aria-selected': true
			});
		
		if (!plugin.selected.length) {
			
			plugin.menuitems
				.eq(0)
				.attr({
					'tabindex': 0
				});
			
		} else {
			
			plugin.selected
				.parentsUntil('nav', 'li')
				.attr({
					'tabindex': 0
				});
			
		}
		
		plugin.menuitems // setup event handlers
			.on('mouseenter', plugin.showSubmenu)
			.on('mouseleave', plugin.hideSubmenu)
			.on('click', {'plugin': plugin}, plugin.activateMenuItem)
			.on("keydown", {'plugin': plugin}, plugin.onKeyDown);
			
		$(window).on('resize', function(){ plugin.collapseAll(plugin); } ); // collapse all submenues when window is resized
		
	};
	
	/** 
	 * Shows submenu.
	 * 
	 * @param {object} event - Mouse event.
	 */
	Plugin.prototype.showSubmenu = function(event) {
		
		var $elem, $submenu;
		
		$elem = $(event.currentTarget);
		$submenu = $elem.children('ul');
		
		if ($submenu.length) {
			$elem
				.addClass('expanded')
				.attr({
					'aria-expanded': true, 
					'tabindex': -1
				});
				
			$submenu
				.attr({
					'aria-hidden': false
				});
		}
	};
	
	/** 
	 * Hides submenu.
	 * 
	 * @param {object} event - Mouse event.
	 */
	Plugin.prototype.hideSubmenu = function(event) {
		
		var $elem, $submenu;
		
		$elem = $(event.currentTarget);
		$submenu = $elem.children('ul');
		
		if ($submenu.length) {
			$elem.removeClass('expanded').attr({'aria-expanded': false});
			$submenu.attr({'aria-hidden': true});
			$submenu.children('li').attr({'tabindex': -1});
		}
	}
	
	/** 
	 * Collapses all submenus. Whem element is specified collapses all sumbenus inside that element.
	 * 
	 * @param {object} plugin - Reference to plugin.
	 * @param {object} [$elem] - jQuery object containing element (optional).
	 */
	Plugin.prototype.collapseAll = function(plugin, $elem) {
		
		$elem = $elem || plugin.element;
		
		$elem.find('[aria-hidden=false]').attr({'aria-hidden': true});
		$elem.find('.expanded').removeClass('expanded').attr({'aria-expanded': false});
		$elem.find('li').attr({'tabindex': -1}).eq(0).attr({'tabindex': 0});
		
	};
	
	/** 
	 * Activates menu selected menuitem.
	 * 
	 * @param {Object} event - Keyboard or mouse event.
	 * @param {object} event.data - Event data.
	 * @param {object} event.data.plugin - Reference to plugin.
	 */
	Plugin.prototype.activateMenuItem = function(event) {
		
		var plugin, $elem;
		
		event.stopPropagation();
		
		plugin = event.data.plugin;
		$elem = $(event.currentTarget);
		
		plugin.collapseAll(plugin);
	
		if ($elem.has('a').length) {
			alert('Menu item ' + $elem.find('>a').text() + ' selected');
		}
		
	};
	
	/** 
	 * Selects specified tab.
	 * 
	 * @param {Object} event - Keyboard event.
	 * @param {object} event.data - Event data.
	 * @param {object} event.data.plugin - Reference to plugin.
	 * @param {object} event.data.index - Index of a tab to be selected.
	 */
	Plugin.prototype.onKeyDown = function (event) {
		
		var plugin, $elem, $current, $next, $parent, $submenu, $selected;
		
		plugin = event.data.plugin;
		$elem = $(plugin.element);
		$current = $(plugin.element).find(':focus');
		$submenu = $current.children('ul');
		$parentmenu = $($current.parent('ul'));
		$parentitem = $parentmenu.parent('li');
			
		switch (event.keyCode) {
			
			case ik_utils.keys.right:
				
				event.preventDefault();
				
				if ($current.parents('ul').length == 1) {
					$current.attr({'tabindex': -1}).next('li').attr({'tabindex': 0}).focus();
				}
				
				break;
			
			case ik_utils.keys.left:
				
				event.preventDefault();
				
				if ($current.parents('ul').length == 1) {
					$current.attr({'tabindex': -1}).prev('li').attr({'tabindex': 0}).focus();
				}
				
				break;
				
			case ik_utils.keys.up:
				
				event.preventDefault();
				event.stopPropagation();
				
				if ($current.parents('ul').length > 1) {
					$current.attr({'tabindex': -1}).prev('li').attr({'tabindex': 0}).focus();
				}
				
				break;
			
			case ik_utils.keys.down:
				
				event.preventDefault();
				event.stopPropagation();
				
				if($current.parents('ul').length > 1) {
					$current.attr({'tabindex': -1}).next('li').attr({'tabindex': 0}).focus();
				}
				
				break;
				
			case ik_utils.keys.space:
				
				event.preventDefault();
				event.stopPropagation();
				
				if($submenu.length) {
					plugin.showSubmenu(event);
					$submenu.children('li:eq(0)').attr({'tabindex': 0}).focus();
				}
				break;
			
			case ik_utils.keys.esc:
				
				event.stopPropagation();
				
				if ($parentitem.hasClass('expandable')) {
					
					$parentitem.removeClass('expanded').attr({
						'tabindex': 0,
						'aria-expanded': false
					}).focus();
					plugin.collapseAll(plugin, $parentitem);
				}
				break;
			
			case ik_utils.keys.enter:
				
				plugin.activateMenuItem(event);
				
				break;
			
			case ik_utils.keys.tab:
				
				plugin.collapseAll(plugin);
				
				break;
		}
	}
	
	$.fn[pluginName] = function ( options ) {
		
		return this.each(function () {
			
			if ( !$.data(this, pluginName )) {
				$.data( this, pluginName,
				new Plugin( this, options ));
			}
			
		});
		
	}
 
})( jQuery, window, document );

// TOGGLE BUTTON

;(function ( $, window, document, undefined ) {
 
	var pluginName = 'ik_togglebutton',
		defaults = {
			"label": "toggle button",
			"isPressed": false,
			"onToggle": function() { console.log('toggle action is undefined'); }
		};
	 
	/**
	 * @constructs Plugin
	 * @param {Object} element - Current DOM element from selected collection.
	 * @param {Object} [options] - Configuration options.
	 */
	function Plugin( element, options ) {
		
		this._name = pluginName;
		this._defaults = defaults;
		this.element = $(element);
		this.options = $.extend( {}, defaults, options) ;
		
		this.init();
	}
	
	/** Initializes plugin. */
	Plugin.prototype.init = function () {
		
		var plugin, id, $elem;
		
		plugin = this;
		id = 'toggle' + $('.ik_togglebutton').length; // generate unique id
		$elem = this.element
			.attr({
				"id": id,
				"tabindex": 0,
				"role": "button",
				"aria-label": plugin.options.label,
				"aria-pressed": false
			});
		
		plugin.options.onToggle = plugin.options.onToggle.bind(plugin);
		
		$elem
			.on('click', {plugin: plugin}, plugin.onActivate)
			.on('keydown', {plugin: plugin}, plugin.onActivate);
		
	};
	
	/** 
	 * Triggers button's action.
	 * 
	 * @param {Object} event - Keydown or click event.
	 * @param {object} event.data - Event data.
	 * @param {object} event.data.plugin - Reference to plugin.
	 */
	Plugin.prototype.onActivate = function (event) {
		
		var plugin, $me;
		
		if (event.type === 'click' || event.keyCode === ik_utils.keys.enter || event.keyCode === ik_utils.keys.space) {
			
			event.stopPropagation();
			
			plugin = event.data.plugin;
			$me = plugin.element;
			
			if (plugin.options.isPressed) {
				$me
					.removeClass('pressed')
					.attr({
						"aria-pressed": false
					});
				plugin.options.isPressed = false;
			} else {
				$me
					.addClass('pressed')
					.attr({
						"aria-pressed": true
					});
				plugin.options.isPressed = true;
			}
			
			plugin.options.onToggle();
		}
		
	};
	
	$.fn[pluginName] = function ( options ) {
		
		return this.each(function () {
			
			if ( !$.data(this, pluginName )) {
				$.data( this, pluginName,
				new Plugin( this, options ));
			}
			
		});
		
	}
 
})( jQuery, window, document );

