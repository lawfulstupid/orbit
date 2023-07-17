
function init() {
	init5();
}

function init0() { // sun only
	const sun = new Sphere("sun", 200, "yellow");
	setFocus("sun");
	env.playback.paused = true;
}

function init1() {
	const sun = new Sphere("sun", 100, "yellow");
	setFocus(sun);
	
	const earth = new Sphere("earth", 10, "green");
	earth.position = [200, 0];
	earth.velocity = [0, 20];
	
	const mars = new Sphere("mars", 7, "red");
	mars.position = [0, -300];
	mars.velocity = [20, 0];
	
	const pluto = new Sphere("pluto", 3, "cyan");
	pluto.position = [200, -200];
	pluto.velocity = [22, 0];
}

function init2() { // yeeter
	new Sphere("red", 5, "red", [0, -20], [1, 0]);
	new Sphere("blue", 5, "blue", [0, 20], [-1, 0]);
	new Sphere("green", 10, "green", [0, 0], [0, 0.0001]);
}

function init3() {
	const sun = new Sphere("sun", 350, "yellow");
	const earth = new Sphere("earth", 20, "green", [1500, 0], [0, 50]);
	const moon = new Sphere("moon", 5, "grey", [1460, 0], [0, 55]);
	setFocus("sun");
	env.playback.paused = true;
	
	earth.trailLength = 200;
}

function init4() {
	const sun = new Sphere("sun", 100, "yellow");
	setFocus("sun");
	
	const f = env.model.gravity * sun.getMass();
	let r, q, x, y;
	
	const planet = new Sphere("planet", 10, "green", [200,-200]);
	r = norm(planet.position);
	q = Math.sqrt(2*f/(r ** 3) - f*f/(r ** 6)) - (7/r);
	[x,y] = planet.position;
	planet.velocity = [-q*y, q*x];
	
	const planet2 = new Sphere("planet2", 15, "orange", [-350, 200]);
	r = norm(planet2.position);
	q = Math.sqrt(2*f/(r ** 3) - f*f/(r ** 6)) - (6/r);
	[x,y] = planet2.position;
	planet2.velocity = [-q*y, q*x];
	
	const planet3 = new Sphere("planet3", 8, "pink", [-400, -380]);
	r = norm(planet3.position);
	q = Math.sqrt(2*f/(r ** 3) - f*f/(r ** 6)) - (5/r);
	[x,y] = planet3.position;
	planet3.velocity = [-q*y, q*x];
	
	env.playback.paused = true;
}

function init5() { // dust cloud
	// const sun = new Sphere("sun", 200, "yellow");
	// setFocus("sun");s
	
	const numberOfPlanets = 1000;
	const minRadius = 2;
	const maxRadius = 5;
	const minOrbit = 5;
	const maxOrbit = 1000;
	const maxSpeed = 8;
	
	for (let i = 1; i <= numberOfPlanets; i++) {
		const color = new Color("gray");
		const radius = randomBetween(minRadius, maxRadius);
		const orbit = randomBetween(minOrbit, maxOrbit);
		const speed = randomBetween(0, maxSpeed);
		
		const posAngle = randomBetween(0, 360);
		const x = orbit * Math.cos(posAngle);
		const y = orbit * Math.sin(posAngle);
		
		// Random direction velocity
		// const velAngle = randomBetween(0, 360);
		// const u = speed * Math.cos(velAngle);
		// const v = speed * Math.sin(velAngle);
		
		// Clockwise velocity
		const [u,v] = vecMul(speed, unit([-y, x]));
		
		new Sphere("planet" + i, radius, color.toString(), [x,y], [u,v]);
	}
	
	setFocus("auto");
	
	// env.playback.paused = true;
}

function randomBetween(a, b) {
	return a + Math.random() * (b - a);
}

const constants = {
	playback: {
		speed: {
			default: 8,
			min: 1,
			max: 64,
			factor: 2
		}
	},
	screen: {
		scale: {
			default: 1,
			factor: 1.5
		}
	}
}

const env = {
	model: {
		spheres: {},
		gravity: 0.1, // gravitational constant
		collision: true
	},
	playback: {
		time: 0,
		speed: constants.playback.speed.default,
		paused: false,
		focus: null,
		autofocus: false
	},
	screen: {
		centre: [0, 0],
		scale: constants.screen.scale.default // >1 => zoomed in1, <1 => zoomed out
	}
}


/* CONTROLS */
function setFocus(sphere) {
	env.playback.autofocus = false;
	if (sphere === "auto") {
		env.playback.autofocus = true;
	} else if (!sphere) {
		env.playback.focus = null;
	} else if (sphere !== "manual") {
		env.playback.focus = getSphere(sphere).name;
	}
	updateButtons();
}

function playPause() {
	env.playback.paused = !env.playback.paused;
	updateButtons();
}

function alterSpeed(dir) {
	if (dir === 0) {
		env.playback.speed = constants.playback.speed.default;
	} else {
		env.playback.speed *= constants.playback.speed.factor ** dir;
		env.playback.speed = Math.max(constants.playback.speed.min, env.playback.speed);
		env.playback.speed = Math.min(constants.playback.speed.max, env.playback.speed);
	}
	updateButtons();
}

function alterZoom(dir) {
	if (dir === 0) {
		env.screen.scale = constants.screen.scale.default;0
	} else {
		env.screen.scale *= constants.screen.scale.factor ** dir;
	}
	forEachSphere(sphere => sphere.setElementRadius());
	updateButtons();
}


/* OBJECTS */

class Drawable {
	position;
	element;
	
	constructor() {}
	
	getCornerCoords() {
		return vecMul(env.screen.scale, this.position);
	}
	
	draw() {
		// draw on creation
		const [left, top] = vecAdd(env.screen.centre, this.getCornerCoords());
		this.element.style.left = left + "px";
		this.element.style.top = top + "px";
	}
}

class Sphere extends Drawable {
	name;
	radius;
	color;
	
	position;
	velocity;
	acceleration = [0, 0];
	
	trail = [];
	trailLength = 0;
	
	element;
	successor = undefined;
	
	constructor(name, radius, color, position, velocity) {
		super();
		
		// Set params
		this.name = name;
		this.radius = radius;
		this.color = new Color(color || "gray");
		this.position = position || [0, 0];
		this.velocity = velocity || [0, 0];
		
		env.model.spheres[this.name] = this;
	}
	
	registerInDOM() {
		this.element = document.createElement("div");
		this.element.id = name;
		this.element.setAttribute("class", "sphere");
		
		this.setElementRadius();
		this.element.style.zIndex = 10000 - Math.floor(this.radius);
		this.element.style.backgroundColor = this.color.toString();
		
		this.element.onclick = () => {
			if (env.playback.focus === this.name) {
				playPause();
			} else {
				setFocus(this);
			}
		};
		
		document.getElementById("canvas").appendChild(this.element);
	}
	
	setElementRadius() {
		const diameter = (this.radius || 50) * 2 * env.screen.scale;
		this.element.style.width = diameter + "px";
		this.element.style.height = diameter + "px";
	}
	
	remove() {
		delete env.model.spheres[this.name];
		if (this.element) document.getElementById("canvas").removeChild(this.element);
	}
	
	getMass() {
		return this.radius ** 3;
	}
	
	getCornerCoords() {
		const radArr = vecMul(env.screen.scale, [this.radius, this.radius]);
		return vecSub(super.getCornerCoords(), radArr);
	}
	
	getScreenPosition() {
		return super.getCornerCoords();
	}
	
	getUltimateSuccessor() {
		if (!this.successor) {
			return this;
		} else {
			return this.successor.getUltimateSuccessor();
		}
	}
	
}

class TrailMarker extends Drawable {
	constructor(sphere, centre) {
		super();
		
		this.position = sphere.position;
		
		this.element = document.createElement("div");
		this.element.setAttribute("class", "trail");
		this.element.style.width = "2px";
		this.element.style.height = "2px";
		this.element.style.backgroundColor = sphere.color;
		document.getElementById("canvas").appendChild(this.element);
		sphere.trail.push(this);
		
		while (sphere.trail.length > sphere.trailLength) {
			document.getElementById("canvas").removeChild(sphere.trail[0].element);
			sphere.trail = sphere.trail.slice(1);
		}
		
		this.draw();
	}
}

function getSphere(sphere) {
	if (typeof sphere === "string") {
		return env.model.spheres[sphere];
	} else {
		return sphere;
	}
}

function getFocus() {
	if (focus) {
		return env.model.spheres[env.playback.focus];
	} else {
		return null;
	}
}


/* VECTOR ARTIHMETIC */

function vecAdd(u, v) {
	return [u[0] + v[0], u[1] + v[1]];
}

function vecSub(u, v) {
	return [u[0] - v[0], u[1] - v[1]];
}

function vecMul(a, v) {
	return [a * v[0], a * v[1]];
}

function norm(v) {
	const [x,y] = v;
	return Math.sqrt(x**2 + y**2);
}

function dist(u, v) {
	return norm(vecSub(u, v));
}

function unit(v) {
	const n = norm(v);
	return vecMul(1/n, v);
}


/* COLORS */

class Color {
	r = 0;
	g = 0;
	b = 0;
	
	constructor(c, g, b) {
		if (!c) {
			this.r = randomBetween(0, 255);
			this.g = randomBetween(0, 255);
			this.b = randomBetween(0, 255);
		} else if (c instanceof Color) {
			this.r = c.r;
			this.g = c.g;
			this.b = c.b;
		} else if (g !== undefined && b !== undefined) {
			this.r = c;
			this.g = g;
			this.b = b;
		} else if (c[0] === '#') {
			this.r = parseInt(c.slice(1,3), 16);
			this.g = parseInt(c.slice(3,5), 16);
			this.b = parseInt(c.slice(5,7), 16);
		} else if (c.slice(0,3) === 'rgb') {
			c = c.slice(4);
			this.r = parseFloat(c);
			c = c.slice(c.indexOf(",")+1);
			this.g = parseFloat(c);
			c = c.slice(c.indexOf(",")+1);
			this.b = parseFloat(c);
		} else {
			const color = new Color(colorDict[c.toLowerCase()]);
			this.r = color.r;
			this.g = color.g;
			this.b = color.b;
		}
	}
	
	toString() {
		return "rgb(" + this.r + "," + this.g + "," + this.b + ")";
	}
	
	equals(color) {
		return this.r === color.r && this.g === color.g && this.b === color.b;
	}
}

const colorDict = {
	"aliceblue": "#f0f8ff",
	"antiquewhite": "#faebd7",
	"aqua": "#00ffff",
	"aquamarine": "#7fffd4",
	"azure": "#f0ffff",
	"beige": "#f5f5dc",
	"bisque": "#ffe4c4",
	"black": "#000000",
	"blanchedalmond": "#ffebcd",
	"blue": "#0000ff",
	"blueviolet": "#8a2be2",
	"brown": "#a52a2a",
	"burlywood": "#deb887",
	"cadetblue": "#5f9ea0",
	"chartreuse": "#7fff00",
	"chocolate": "#d2691e",
	"coral": "#ff7f50",
	"cornflowerblue": "#6495ed",
	"cornsilk": "#fff8dc",
	"crimson": "#dc143c",
	"cyan": "#00ffff",
	"darkblue": "#00008b",
	"darkcyan": "#008b8b",
	"darkgoldenrod": "#b8860b",
	"darkgray": "#a9a9a9",
	"darkgreen": "#006400",
	"darkkhaki": "#bdb76b",
	"darkmagenta": "#8b008b",
	"darkolivegreen": "#556b2f",
	"darkorange": "#ff8c00",
	"darkorchid": "#9932cc",
	"darkred": "#8b0000",
	"darksalmon": "#e9967a",
	"darkseagreen": "#8fbc8f",
	"darkslateblue": "#483d8b",
	"darkslategray": "#2f4f4f",
	"darkturquoise": "#00ced1",
	"darkviolet": "#9400d3",
	"deeppink": "#ff1493",
	"deepskyblue": "#00bfff",
	"dimgray": "#696969",
	"dodgerblue": "#1e90ff",
	"firebrick": "#b22222",
	"floralwhite": "#fffaf0",
	"forestgreen": "#228b22",
	"fuchsia": "#ff00ff",
	"gainsboro": "#dcdcdc",
	"ghostwhite": "#f8f8ff",
	"gold": "#ffd700",
	"goldenrod": "#daa520",
	"gray": "#808080",
	"green": "#008000",
	"greenyellow": "#adff2f",
	"honeydew": "#f0fff0",
	"hotpink": "#ff69b4",
	"indianred ": "#cd5c5c",
	"indigo": "#4b0082",
	"ivory": "#fffff0",
	"khaki": "#f0e68c",
	"lavender": "#e6e6fa",
	"lavenderblush": "#fff0f5",
	"lawngreen": "#7cfc00",
	"lemonchiffon": "#fffacd",
	"lightblue": "#add8e6",
	"lightcoral": "#f08080",
	"lightcyan": "#e0ffff",
	"lightgoldenrodyellow": "#fafad2",
	"lightgrey": "#d3d3d3",
	"lightgreen": "#90ee90",
	"lightpink": "#ffb6c1",
	"lightsalmon": "#ffa07a",
	"lightseagreen": "#20b2aa",
	"lightskyblue": "#87cefa",
	"lightslategray": "#778899",
	"lightsteelblue": "#b0c4de",
	"lightyellow": "#ffffe0",
	"lime": "#00ff00",
	"limegreen": "#32cd32",
	"linen": "#faf0e6",
	"magenta": "#ff00ff",
	"maroon": "#800000",
	"mediumaquamarine": "#66cdaa",
	"mediumblue": "#0000cd",
	"mediumorchid": "#ba55d3",
	"mediumpurple": "#9370d8",
	"mediumseagreen": "#3cb371",
	"mediumslateblue": "#7b68ee",
	"mediumspringgreen": "#00fa9a",
	"mediumturquoise": "#48d1cc",
	"mediumvioletred": "#c71585",
	"midnightblue": "#191970",
	"mintcream": "#f5fffa",
	"mistyrose": "#ffe4e1",
	"moccasin": "#ffe4b5",
	"navajowhite": "#ffdead",
	"navy": "#000080",
	"oldlace": "#fdf5e6",
	"olive": "#808000",
	"olivedrab": "#6b8e23",
	"orange": "#ffa500",
	"orangered": "#ff4500",
	"orchid": "#da70d6",
	"palegoldenrod": "#eee8aa",
	"palegreen": "#98fb98",
	"paleturquoise": "#afeeee",
	"palevioletred": "#d87093",
	"papayawhip": "#ffefd5",
	"peachpuff": "#ffdab9",
	"peru": "#cd853f",
	"pink": "#ffc0cb",
	"plum": "#dda0dd",
	"powderblue": "#b0e0e6",
	"purple": "#800080",
	"red": "#ff0000",
	"rosybrown": "#bc8f8f",
	"royalblue": "#4169e1",
	"saddlebrown": "#8b4513",
	"salmon": "#fa8072",
	"sandybrown": "#f4a460",
	"seagreen": "#2e8b57",
	"seashell": "#fff5ee",
	"sienna": "#a0522d",
	"silver": "#c0c0c0",
	"skyblue": "#87ceeb",
	"slateblue": "#6a5acd",
	"slategray": "#708090",
	"snow": "#fffafa",
	"springgreen": "#00ff7f",
	"steelblue": "#4682b4",
	"tan": "#d2b48c",
	"teal": "#008080",
	"thistle": "#d8bfd8",
	"tomato": "#ff6347",
	"turquoise": "#40e0d0",
	"violet": "#ee82ee",
	"wheat": "#f5deb3",
	"white": "#ffffff",
	"whitesmoke": "#f5f5f5",
	"yellow": "#ffff00",
	"yellowgreen": "#9acd32"
};

function blend(c1, c2, w1 = 1, w2 = 1) {
	const black = new Color("black");
	if (c1.equals(black) || c2.equals(black)) return black;
	const r = weightedAverage(c1.r, c2.r, w1, w2);
	const g = weightedAverage(c1.g, c2.g, w1, w2);
	const b = weightedAverage(c1.b, c2.b, w1, w2);
	return new Color(r, g, b);
}


/* FUNCTIONALITY */

function forEachSphere(fn) {
	for (var sphere of Object.values(env.model.spheres)) {
		fn(sphere);
	}
}

function updateAccelerations() {
	// Reset all accelerations
	forEachSphere(sphere => {
		sphere.acceleration = [0,0];
	});
	
	for (var subject of Object.values(env.model.spheres)) {
		for (var object of Object.values(env.model.spheres)) {
			if (subject.name <= object.name) continue;
			
			const dir = vecSub(object.position, subject.position);
			const baseVec = vecMul(env.model.gravity / (norm(dir) ** 3), dir);
			
			const acc1 = vecMul(object.getMass(), baseVec);
			subject.acceleration = vecAdd(subject.acceleration, acc1);
			
			const acc2 = vecMul(-subject.getMass(), baseVec);
			object.acceleration = vecAdd(object.acceleration, acc2);
		}
	}
}

function updateVelocities() {
	forEachSphere(sphere => {
		const vel = sphere.velocity;
		const acc = sphere.acceleration;
		const new_vel = vecAdd(vel, acc);
		sphere.velocity = new_vel;
	});
}

function updatePositions() {
	forEachSphere(sphere => {
		const pos = sphere.position;
		const vel = sphere.velocity;
		const new_pos = vecAdd(pos, vel);
		sphere.position = new_pos;
	});
}

function checkCollisions() {
	const currentSpheres = Object.values(env.model.spheres);
	
	currentSpheres.forEach(a => {
		currentSpheres.forEach(b => {
			if (a.name >= b.name) return;
			const sphereA = a.getUltimateSuccessor();
			const sphereB = b.getUltimateSuccessor();
			if (sphereA.name === sphereB.name) return;
			
			const r = dist(sphereA.position, sphereB.position);
			if (r >= sphereA.radius && r >= sphereB.radius) return;
			
			combine(sphereA, sphereB);
		});
	});
}

function weightedAverage(x, y, wx, wy) {
	return (x * wx + y * wy) / (wx + wy);
}

function combine(a, b) {
	const colorBlend = blend(a.color, b.color, a.getMass(), b.getMass());
	const color = blend(colorBlend, new Color("yellow"), Object.keys(env.model.spheres).length, 1);
	const x = weightedAverage(a.position[0], b.position[0], a.getMass(), b.getMass());
	const y = weightedAverage(a.position[1], b.position[1], a.getMass(), b.getMass());
	const u = weightedAverage(a.velocity[0], b.velocity[0], a.getMass(), b.getMass());
	const v = weightedAverage(a.velocity[1], b.velocity[1], a.getMass(), b.getMass());
	const radius = Math.sqrt(a.radius * a.radius + b.radius * b.radius); // grow by area
	const name = hashCode(a.name + "+" + b.name);
	
	a.remove();
	b.remove();
	const newSphere = new Sphere(name, radius, color, [x,y], [u,v]);
	a.successor = newSphere;
	b.successor = newSphere;
	
	if (env.playback.focus === a.name || env.playback.focus === b.name) {
		env.playback.focus = name;
	}
	
	return newSphere;
}

function hashCode(s) {
	return s.split('').reduce((a,b) => {
		a = ((a<<5) - a) + b.charCodeAt(0);
		return a & a
	}, 0);
}


/* APPLICATION */

function getScreenCentre() {
	return [window.innerWidth / 2, window.innerHeight / 2];
}

function step() {
	if (env.model.collision) checkCollisions();
	updateAccelerations();
	updateVelocities();
	updatePositions();
}

function checkFocus() {
	if (!env.playback.autofocus) return;
	env.playback.focus = getAutoFocusTarget();
}

function getAutoFocusTarget() {
	const bigSpheres = Object.values(env.model.spheres).reduce((acc, sphere) => {
		if (acc.length === 0 || acc[0].radius < sphere.radius) {
			return [sphere];
		} else if (acc[0].radius === sphere.radius) {
			return acc.concat([sphere]);
		} else {
			return acc;
		}
	}, []);
	
	if (bigSpheres.length > 0) {
		return bigSpheres[0].name;
	}
}

function draw() {
	let centre = getScreenCentre();
	
	if (env.playback.focus) {
		const focus = getFocus();
		centre = vecSub(centre, focus.getScreenPosition());
	}
	
	if (env.screen.centre !== centre) {
		env.screen.centre = centre;
		forEachSphere(sphere => {
			sphere.trail.forEach(marker => {
				marker.draw();
			})
		});
	}
	
	forEachSphere(sphere => {
		if (!sphere.element) sphere.registerInDOM();
		sphere.draw();
		if (sphere.trailLength) new TrailMarker(sphere, centre);
	});
}

function main() {
	if (env.playback.speed && env.playback.time % env.playback.speed === 0 && !env.playback.paused) {
		step();
	}
	checkFocus();
	draw();
	env.playback.time += 1;
}

document.addEventListener("DOMContentLoaded", () => {
	init();
	draw();
	updateButtons();
	setInterval(main, 1);
});



var timer = function(name) {
    var start = new Date();
    return {
        stop: function() {
            var end  = new Date();
            var time = end.getTime() - start.getTime();
            console.log('Timer:', name, 'finished in', time, 'ms');
        }
    }
};

function benchmark(fn) {
	var t = timer('Benchmark');
	fn();
	t.stop();
}

function updateButtons() {
	document.getElementById("pauseButton").style.display = env.playback.paused ? "none" : "";
	document.getElementById("playButton").style.display = env.playback.paused ? "" : "none";
	document.getElementById("stepButton").setAttribute("disabled", env.playback.paused === false);
	document.getElementById("fastButton").setAttribute("disabled", env.playback.speed === constants.playback.speed.min);
	document.getElementById("resetSpeedButton").setAttribute("disabled", env.playback.speed === constants.playback.speed.default);
	document.getElementById("slowButton").setAttribute("disabled", env.playback.speed === constants.playback.speed.max);
	document.getElementById("autoFocusButton").style.display = env.playback.autofocus ? "none" : "";
	document.getElementById("manualFocusButton").style.display = env.playback.autofocus ? "" : "none";
	document.getElementById("resetZoomButton").setAttribute("disabled", env.screen.scale === constants.screen.scale.default);
}