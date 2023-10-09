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
	var form = document.getElementById("mail-form");
	var timeout;
	
	var onSuccess = function() {
		var button = document.getElementById("mail-send-button");
		button.innerHTML = button.dataset.sent;
		button.classList.remove('error');
		button.classList.add('sent');
		button.classList.remove('sending');
		clearTimeout(timeout);
		timeout = setTimeout(() => {
			// Restore button & text.
			button.innerHTML = button.dataset.send;
			button.classList.remove('sent');
		}, 5000);
	};

	var onFailure = function(errors) {
		var button = document.getElementById("mail-send-button");
		button.innerHTML = button.dataset.error + " (" + errors.map(error => error["message"]).join(", ") + ")";
		button.classList.remove('sent');
		button.classList.add('error');
		button.classList.remove('sending');
		clearTimeout(timeout);
		timeout = setTimeout(() => {
			// Restore button & text.
			button.innerHTML = button.dataset.send;
			button.classList.remove('error');
		}, 5000);
	};
    
    async function handleSubmit(event) {
		event.preventDefault();
		var status = document.getElementById("my-form-status");
		var data = new FormData(event.target);
		console.log(data);
		console.log(form.method);
		fetch(event.target.action, {
			method: form.method,
			body: data,
			headers: {
				'Accept': 'application/json'
			}
		}).then(response => {
			if (response.ok) {
				onSuccess();
				form.reset()
			} else {
				response.json().then(data => {
					if (Object.hasOwn(data, 'errors')) {
						onFailure(data["errors"]);
						console.error(data["errors"]);
					} else {
						onFailure(["Error"]);
					}
				})
			}
		}).catch(error => {
			status.innerHTML = "Oops! There was a problem submitting your form"
		});
	}
    form.addEventListener("submit", handleSubmit)
}, function(options) {
	var _this = this;

	var path = "/assets/images/slider/";
	var slider = document.getElementById("slider");
	var images = [
		"purple-building.small.jpg",
		"fisheye-building.small.jpg",
		"metro.small.jpg",
		"hanami.small.jpg",
		"colorfulNeko.small.jpg",
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
