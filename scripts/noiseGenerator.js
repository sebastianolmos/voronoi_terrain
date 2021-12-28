import {module as noise} from './perlin.js'

export function genNoise(
    size, 
    seed,
    drawheight,
    gradValue,
    radius,
    noiseScale) 
    {
    let image = [];
    noise.seed(seed);
    let center = size/2;
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            let value;
            let noiseValue = size / noiseScale;
            value = (noise.perlin2(x / noiseValue, y / noiseValue) + 1) /2;
            let dx = center - x,
          		dy = center - y;   
			let dist = Math.sqrt(dx*dx +dy*dy); 
      		let c_value = (dist /(size* radius)) * gradValue;
			value = Math.min(Math.max((value-c_value), 0.0), 1.0);
            if (value >= drawheight) {
				value = 1;
			} else {
				value = 0;
			}
            let cell = (x + y * size);
			image[cell] = value;
        }
    }
    return image;
}