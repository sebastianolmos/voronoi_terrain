import {module as noise} from './perlin.js'

var canvas = document.getElementsByTagName('canvas')[0];
canvas.width = 768;
canvas.height = 768;
var ctx = canvas.getContext('2d');
function toggleDrawMode()
{
  ctx.clearRect(0,0,canvas.width,canvas.height);
noise.seed(Math.random());
var image = ctx.createImageData(canvas.width, canvas.height);
var data = image.data;
console.log(image);
var start = Date.now();
var center_x = canvas.width/2;
var center_y = canvas.height/2;
var drawParts  = true;
var drawheigth = 0.01;
for (var x = 0; x < canvas.width; x++) {
  //if (x % 100 == 0) {
  //  noise.seed(Math.random());
  //}
  for (var y = 0; y < canvas.height; y++) {
    var value;
    value = (noise.perlin2(x / 100, y / 100) + 1) /2;
    var dx = center_x - x,
        dy = center_y - y;   
    var dist = Math.sqrt(dx*dx +dy*dy); 
    var c_value = dist /center_x;
    
    value -= c_value;
    if (drawParts) {
      if (value >= drawheigth) {
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

document.getElementById('drawMode').onclick = toggleDrawMode;

toggleDrawMode();