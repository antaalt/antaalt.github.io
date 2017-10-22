(function(scrollFollower, sendMail, slider, projectSelector) {
	$('document').ready(function() {
		new scrollFollower();
		new sendMail();
		new slider({duration: 2.0, transitionDuration: 5000});
		new projectSelector();
	});
})(function() {

	var _this = this;

	_this.options = {
		headerHeight : 45,
		fixedLimit: 0,
		selected:'selected',
	};

	_this.init = function(){
		_this.options.fixedLimit = $(window).height()-100;

		_this.$menu = $('#menu');
		_this.$section = $('.section');
		_this.$menuLink = $('a[href^="#"].smooth-scroll');

		_this.build();
	};

	// --- BUILDING ---
	_this.build = function(){
		_this.buildScroll();
		_this.buildLink();
		//_this.buildMobileMenu();
		$(window).resize(function(){
			_this.options.fixedLimit = $(window).height() - 100;
		});
	};

	_this.buildScroll = function(){
		_this.menuScroll();
		_this.detectPosition();
		$(window).scroll(function(event){
			_this.menuScroll();
			_this.detectPosition();
		});
	};

	//_this.buildMobileMenu = function() {
	//	var $scroll = $('#scroll');
	//	$('#menuMobile').on('click', function(){
	//		$scroll.hasClass('closed') ? $scroll.removeClass('closed') : $scroll.addClass('closed');
	//	});
	//};

	_this.buildLink = function(){
		_this.$menuLink.click(function(){
			var dest = $(this.hash).offset().top - _this.options.headerHeight;
			$('#scroll').addClass('closed'); // CLOSE MENU MOBILE
			$('html, body').animate({
				scrollTop:dest
			}, 'slow');
			return false;
		});
	};

	// --- MENU ---
	_this.menuScroll = function(){
		var windowScroll = $(window).scrollTop();
		if(windowScroll >= _this.options.fixedLimit ){
			_this.$menu.addClass("minimize");
		}else {
			_this.$menu.removeClass("minimize");
		}
	};

	_this.detectPosition = function(){
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
		_this.displayScroll(idPosition);
	};

	_this.displayScroll = function(_id){
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
		_this.$form.on('submit', _this.handleSend);
	};

	_this.handleSend = function(event) {
		event.preventDefault();
		var $check = $('#check');
		var $send = $('#send');
		$send.removeClass("error sending");
		$send.val('Envoi...');
		if($("#hello-data").val() != "")
			_this.error($send, $check);
		$.ajax({
			dataType: "jsonp",
			url : "https://getsimpleform.com/messages/ajax?form_api_token=1db4df38e9b6a087372743c70051b0e4",
			data : $('#formMail').serialize(),
			beforeSend: function(){
				$send.text('Envoi...').removeClass('error').addClass('sending');
				$check.css('background-color', '#e7e7e7');
			},
			success : function(data, textStatus, jqXHR){
				if(data.success)
					_this.success($send, $check);
				else
					_this.error($send, $check);
			},
			error : function(jqXHR, textStatus, errorThrown){
				_this.error($send, $check);
			}
		});
	};

	_this.success = function($send, $check) {
		$send.text('Envoyé !').addClass('sent').removeClass('sending');
		$check.css('background-color', '#e7e7e7');
	};

	_this.error = function($send, $check) {
		$send.text('Erreur...').addClass('error').removeClass('sending');
		$check.css('background-color', '#e7e7e7');
	};

	_this.init();
}, function(options) {
	var _this = this;

	var path = "./assets/images/slider/";
	var slider = document.getElementById("slider");
	var images = [
		"hanami.small.jpg",
		"colorfulNeko.small.jpg",
		"train.small.jpg",
		"densha.small.jpg",
		"river.small.jpg",
		"screw.small.jpg",
		"window.small.jpg"
	];
	var downloaded = [];
	var nb = 0;

	_this.init = function() {
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
			//slider.onclick = _this.manageTransition;
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
		document.getElementById("slide"+nb).classList.add("hidden");
		nb = (nb + 1) % images.length;
		document.getElementById("slide"+nb).classList.remove("hidden");
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

}, function() {
	// project selector
	var _this = this;
	var $buttons;
	var current = "1";
	_this.init = function() {
		$buttons = $("article.project-button");
		$buttons.each(function(index) {
			$(this).on("click", _this.click);
		});
	};

	_this.click = function() {
		var lastEl = this.id.substr(this.id.length - 1);
		if(lastEl == current)
			return;
		$("#project"+ lastEl).removeClass("hidden");
		$("#project"+current).addClass("hidden");
		$("#project-button" + lastEl).addClass("selected");
		$("#project-button" + current).removeClass("selected");
		current = lastEl;
	}

	_this.init();
});
