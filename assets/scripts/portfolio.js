(function(scrollFollower, sendMail) {
	$('document').ready(function() {
		new scrollFollower();
		new sendMail();
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

	/* - BUILDING - */
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

	/*_this.buildMobileMenu = function() {
		var $scroll = $('#scroll');
		$('#menuMobile').on('click', function(){
			$scroll.hasClass('closed') ? $scroll.removeClass('closed') : $scroll.addClass('closed');
		});
	};*/

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

	/* - MENU - */
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
		var url = _this.$form[0].action;
		if($check.val() == 16){
			$send.val('Envoi...');
			$.ajax({
				url : url,
				type : 'POST',
				data : $('#formMail').serialize(),
				beforeSend: function(){
					$send.text('Envoi...').removeClass('error').addClass('sending');
					$check.css('background-color', '#e7e7e7');
				},
				success : function(data, textStatus, jqXHR){
					if(data.code == 200 && data.status == 'OK')
						_this.success($send, $check);
					else
						_this.error($send, $check);
				},
				error : function(jqXHR, textStatus, errorThrown){
					_this.error($send, $check);
				}
			});
		}else{
			$check.css('background-color', '#cd2829');
		}
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
});
