let sliderHandler = function(options)
{
	var path = "/assets/images/slider/";
	var slider = document.getElementById("slider");
	var images = [
		"purple-building.small.jpg",
		"fisheye-building.small.jpg",
		"mountain-of-madness.small.jpg",
		"pink-forest.small.jpg",
		"screw.small.jpg",
		"white-forest.small.jpg",
		"milan.small.jpg",
		"squirrel.small.jpg",
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

let postOffset = function()
{
	const items = document.querySelectorAll('.post-container a');
	const maxOffset = 100; // px
	const mq = window.matchMedia('only screen and (max-width: 720px)');

	function update() {
		if (mq.matches) {
			items.forEach(li => li.style.transform = '');
			return;
		}
		const vh = window.innerHeight;
		items.forEach(a => {
			const r = a.getBoundingClientRect();
			const center = r.top + r.height / 2;
			const t = 1 - center / vh; // 0 = top, 1 = bottom
			const x = t * maxOffset;
			a.style.transform = `translateX(${x}px)`;
		});
	}

	window.addEventListener('resize', update);
	update();
};

(function() {
	new sliderHandler({duration: 2.0, transitionDuration: 5000});
	new postOffset();
})();
