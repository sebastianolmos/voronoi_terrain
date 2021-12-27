import {module as noise} from './perlin.js'

let canvas = document.getElementsByTagName('canvas')[0];
canvas.width = 768;
canvas.height = 768;
let ctx = canvas.getContext('2d');

// Parameters
let seed = 2,
	drawheight = 0.01,
	gradValue = 1.0,
	radius = 0.5,
	noiseScale = 100;

function updateCanvas() {
	ctx.clearRect(0,0,canvas.width,canvas.height);
  	noise.seed(seed);
  	let image = ctx.createImageData(canvas.width, canvas.height);
  	let data = image.data;
  	let center_x = canvas.width/2;
  	let center_y = canvas.height/2;
  	let drawParts  = true;
  	for (var x = 0; x < canvas.width; x++) {
    	for (var y = 0; y < canvas.height; y++) {
			let value;
      		value = (noise.perlin2(x / noiseScale, y / noiseScale) + 1) /2;
      		var dx = center_x - x,
          		dy = center_y - y;   
      		var dist = Math.sqrt(dx*dx +dy*dy); 
      		var c_value = (dist /(canvas.width * radius)) * gradValue;
			value -= c_value;
			if (drawParts) {
				if (value >= drawheight) {
				value = 1;
				} else {
				value = 0;
				}
			}
			value *= 256;
			var cell = (x + y * canvas.width) * 4;
			data[cell] = value;
			data[cell+1] = value;
			data[cell+2] = value;
			data[cell + 3] = 255; // alpha.
      
    	}
	}
	ctx.fillColor = 'black';
	ctx.fillRect(0, 0, 100, 100);
	ctx.putImageData(image, 0, 0);
}

//document.getElementById('drawMode').onclick = updateCanvas;

// Connect sliders and texts
let sSlider = document.getElementById("seedSlider");
let sValue = document.getElementById("seedValue");
sValue.innerHTML = (sSlider.value / 1000).toString(); // Display the default slider value
// Update the current slider value (each time you drag the slider handle)
sSlider.oninput = function() {
	seed = this.value / 1000;
	sValue.innerHTML = seed.toString();
	updateCanvas();
}

let dhSlider = document.getElementById("drawheightSlider");
let dhValue = document.getElementById("drawheightValue");
dhValue.innerHTML = (dhSlider.value / 1000).toString(); // Display the default slider value
// Update the current slider value (each time you drag the slider handle)
dhSlider.oninput = function() {
	drawheight = this.value / 1000;
	dhValue.innerHTML = drawheight.toString();
	updateCanvas();
}

let gvSlider = document.getElementById("gradValueSlider");
let gvValue = document.getElementById("gradValueValue");
gvValue.innerHTML = (gvSlider.value / 100).toString(); // Display the default slider value
// Update the current slider value (each time you drag the slider handle)
gvSlider.oninput = function() {
	gradValue = this.value / 100;
	gvValue.innerHTML = gradValue.toString();
	updateCanvas();
}

let rSlider = document.getElementById("radiusSlider");
let rValue = document.getElementById("radiusValue");
rValue.innerHTML = (rSlider.value / 1000).toString(); // Display the default slider value
// Update the current slider value (each time you drag the slider handle)
rSlider.oninput = function() {
	radius = this.value / 1000;
	rValue.innerHTML = radius.toString();
	updateCanvas();
}

let nsSlider = document.getElementById("noiseScaleSlider");
let nsValue = document.getElementById("noiseScaleValue");
nsValue.innerHTML = (nsSlider.value).toString(); // Display the default slider value
// Update the current slider value (each time you drag the slider handle)
nsSlider.oninput = function() {
	noiseScale = this.value;
	nsValue.innerHTML = noiseScale.toString();
	updateCanvas();
}


updateCanvas();