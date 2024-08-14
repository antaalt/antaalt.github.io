let scrollHandler = function()
{
	let headerHeight = 60; // Must fit CSS value
	let heightTriggeringMenu = window.innerHeight / 3;
	let selectedClassName = 'selected';

	let setMenuBarMinimization = function() {
		let windowScroll = window.scrollY;
		let menu = document.getElementById("menu");
		if(windowScroll >= heightTriggeringMenu ){
			menu.classList.add("minimize");
		}else {
			menu.classList.remove("minimize");
		}
	};

	let setCurrentMenuItemAsSelected = function(_id) {
		let menuLinks = document.querySelectorAll('a[href^="/#"].smooth-scroll');
		Array.prototype.forEach.call(menuLinks, function(menuLink) {
			if(menuLink.getAttribute("id") == _id)
			{
				menuLink.classList.add(selectedClassName);
			}
			else
			{
				menuLink.classList.remove(selectedClassName);
			}
		});
	};
	let findAndSetCurrentMenuItem = function() {
		var scrollPosition = window.scrollY;
		var idPosition;
		let sections = document.getElementsByClassName("section");
		Array.prototype.forEach.call(sections, function(section) {
			var position = section.offsetTop - headerHeight - 20;
			if(position < scrollPosition)
			{
				idPosition = section.getAttribute('id') + "-link";
			}
		});
		setCurrentMenuItemAsSelected(idPosition);
	};

	let handleScroll = function() {
		setMenuBarMinimization();
		findAndSetCurrentMenuItem();
	};

	let home = document.getElementById("home");
	if (home.length != 0)
	{
		handleScroll();
		window.addEventListener("scroll", handleScroll);
	}
};

let mailHandler = function()
{
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
    form.addEventListener("submit", handleSubmit);
};

let sliderHandler = function(options)
{
	var path = "/assets/images/slider/";
	var slider = document.getElementById("slider");
	var images = [
		"purple-building.small.jpg",
		"fisheye-building.small.jpg",
		"mountain-of-madness.small.jpg",
		"hanami.small.jpg",
		"colorfulNeko.small.jpg",
		"screw.small.jpg",
		"window.small.jpg",
		"pink-forest.small.jpg",
		"white-forest.small.jpg",
	];
	var downloaded = [];
	var nb = 0;

	let shuffleArray = function(array) {
	    var j, x, i;
	    for (i = array.length - 1; i > 0; i--) {
	        j = Math.floor(Math.random() * (i + 1));
	        x = array[i];
	        array[i] = array[j];
	        array[j] = x;
	    }
	}

	let manageTransition = function() {
		var actual = document.getElementById("slide"+nb);
		var next = document.getElementById("slide"+((nb+1)%images.length));
		if(next == undefined)
			return;
		actual.classList.add("hidden");
		nb = (nb + 1) % images.length;

		next.classList.remove("hidden");
	}

	let onLoad = function() {
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
	// Check if slider is present in image.
	if(slider == undefined)
		return;
	// Shuffle array
	shuffleArray(images);
	// Load first image
	downloaded[0] = new Image();
	downloaded[0].index = 0;
	downloaded[0].onload = function() {
		onLoad();
		// When loaded, load others in background
		images.forEach(function(value, index) {
			if(index != 0) {
				downloaded[index] = new Image();
				downloaded[index].index = index;
				downloaded[index].onload = onLoad;
				downloaded[index].src = path + value;
			}
		});
		setInterval(manageTransition, options.transitionDuration);
	};
	downloaded[0].src = path + images[0];
};

(function() {
	new scrollHandler();
	new mailHandler();
	new sliderHandler({duration: 2.0, transitionDuration: 5000});
})();