(function(scrollFollower, sendMail, slider) {
	$('document').ready(function() {
		new scrollFollower();
		new sendMail();
		new slider({duration: 2.0, transitionDuration: 5000});
	});
})(function() {

	var _this = this;

	_this.options = {
		headerHeight : 60, // Must fit CSS value
		heightTriggeringMenu : 600, // Default value, before querying window.height / 3 
		selected:'selected',
	};

	_this.init = function(){
		_this.options.heightTriggeringMenu = $(window).height() / 3;
		_this.$menu = $('#menu');
		if(_this.$menu == undefined)
			return;
		_this.$section = $('.section');
		_this.$menuLink = $('a[href^="/#"].smooth-scroll');

		_this.build();
	};

	// --- BUILDING ---
	_this.build = function(){
		// We only need these callback in home page.
		if ($("#home").length != 0)
		{
			_this.createMenuBarScrollCallback();
			$(window).scroll(function(event){
				_this.createMenuBarScrollCallback();
			});
			setInterval(function() {
				_this.createMenuBarScrollCallback();
			}, 500);
		}
	};

	_this.createMenuBarScrollCallback = function(){
		_this.setMenuBarMinimization();
		_this.findAndSetCurrentMenuItem();
	};

	// --- MENU ---
	_this.setMenuBarMinimization = function(){
		var windowScroll = $(window).scrollTop();
		if(windowScroll >= _this.options.heightTriggeringMenu ){
			_this.$menu.addClass("minimize");
		}else {
			_this.$menu.removeClass("minimize");
		}
	};

	_this.findAndSetCurrentMenuItem = function(){
		var scrollPosition = $(window).scrollTop();
		var idPosition;
		_this.$section.each(function() {
			var position = $(this).position().top - _this.options.headerHeight - 20;
			if(position < scrollPosition){
				idPosition = $(this).attr('id') + "-link";
			}else{
				return;
			}
		});
		_this.setCurrentMenuItemAsSelected(idPosition);
	};

	_this.setCurrentMenuItemAsSelected = function(_id){
		_this.$menuLink.each(function() {
			if($(this).attr('id') == _id){
				$(this).addClass(_this.options.selected);
			}else{
				$(this).removeClass(_this.options.selected);
			}
		});
	};

	_this.init();
}, function() {
	var _this = this;

	_this.init = function() {
		_this.$form = $('#formMail');
		if(_this.$form == undefined)
			return;
		_this.$form.on('submit', _this.handleSend);
	};

	_this.handleSend = function(event) {
		event.preventDefault();
		var $send = $('#send');
		$send.removeClass("error sending");

		$send.val($send.data("sending"));

		if($("#hello-data").val() != "")
			_this.error($send, $check);
		$.ajax({
			dataType: "jsonp",
			url : "https://getsimpleform.com/messages/ajax?form_api_token=1db4df38e9b6a087372743c70051b0e4",
			data : $('#formMail').serialize(),
			beforeSend: function(){
				$send.text($send.data("sending")).removeClass('error').addClass('sending');
			},
			success : function(data, textStatus, jqXHR){
				if(data.success)
					_this.success($send);
				else
					_this.error($send);
			},
			error : function(jqXHR, textStatus, errorThrown){
				_this.error($send);
			}
		});
	};

	_this.success = function($send) {
		$send.text($send.data("sent")).addClass('sent').removeClass('sending');
	};

	_this.error = function($send) {
		$send.text($send.data("error")).addClass('error').removeClass('sending');
	};

	_this.init();
}, function(options) {
	var _this = this;

	var path = "/assets/images/slider/";
	var slider = document.getElementById("slider");
	var images = [
		"mountain.small.jpg",
		"city.small.jpg",
		"metro.small.jpg",
		"hanami.small.jpg",
		"colorfulNeko.small.jpg",
		"densha.small.jpg",
		"river.small.jpg",
		"screw.small.jpg",
		"window.small.jpg"
	];
	var downloaded = [];
	var nb = 0;

	_this.init = function() {
		if(slider == undefined)
			return;
		// Shuffle array
		_this.shuffleArray(images);
		// Load first image
		downloaded[0] = new Image();
		downloaded[0].index = 0;
		downloaded[0].onload = function() {
			_this.onLoad();
			// When loaded, load others in background
			images.forEach(function(value, index) {
				if(index != 0) {
					downloaded[index] = new Image();
					downloaded[index].index = index;
					downloaded[index].onload = _this.onLoad;
					downloaded[index].src = path + value;
				}
			});
			setInterval(_this.manageTransition, options.transitionDuration);
		};
		downloaded[0].src = path + images[0];
	};

	_this.shuffleArray = function(array) {
	    var j, x, i;
	    for (i = array.length - 1; i > 0; i--) {
	        j = Math.floor(Math.random() * (i + 1));
	        x = array[i];
	        array[i] = array[j];
	        array[j] = x;
	    }
	}

	_this.manageTransition = function() {
		var actual = document.getElementById("slide"+nb);
		var next = document.getElementById("slide"+((nb+1)%images.length));
		if(next == undefined)
			return;
		actual.classList.add("hidden");
		nb = (nb + 1) % images.length;

		next.classList.remove("hidden");
	}

	_this.onLoad = function() {
		var container = document.createElement("div");
		var index = (this.index == undefined) ? 0 : this.index;
		container.classList.add("slide");
		if(index != 0)
			container.classList.add("hidden");
		container.id = "slide"+index;
		container.style.transition = "opacity " + options.duration + "s";
		container.style.backgroundImage = "url(" + downloaded[index].src + ")";
		slider.appendChild(container);
	};

	_this.init();

});
