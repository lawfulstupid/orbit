/* INITIALISATION */

document.addEventListener("DOMContentLoaded", () => {
	init();
	draw();
	updateButtons();
	setInterval(main, 0);
});

function init() {
	preset5();
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
		const idx = constants.playback.speed.array.findIndex(speed => speed === env.playback.speed);
		const oldSpeed = env.playback.speed;
		env.playback.speed = constants.playback.speed.array.at(idx + dir);
		if (env.playback.speed === undefined) env.playback.speed = oldSpeed;
	}
	updateButtons();
}

function alterZoom(dir) {
	if (dir === 0) {
		env.screen.scale = constants.screen.scale.default;
	} else {
		env.screen.scale *= constants.screen.scale.factor ** dir;
	}
	forEachSphere(sphere => sphere.updateElement());
	updateButtons();
}

function setCollisions(bool) {
	env.model.collision = bool;
	updateButtons();
}

function alterTrailLength(diff) {
	env.model.trailLength += diff;
	env.model.trailLength = Math.max(0, env.model.trailLength);
	updateButtons();
}


/* MODEL */

const constants = {
	playback: {
		speed: {
			default: 10,
			min: 0,
			max: 500,
			array: [0,1,2,5,10,20,50,100,200,500]
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
		numSpheres: 0,
		gravity: 0.1, // gravitational constant
		collision: true,
		trailLength: 0,
		processLimit: 1000
	},
	playback: {
		time: 0,
		step: 0,
		stepInProgress: false,
		lastStepTime: 0,
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

class Drawable {
	position;
	element;
	
	getCornerCoords() {
		return vecMul(env.screen.scale, this.position);
	}
	
	getScreenPosition() {
		return vecAdd(env.screen.centre, this.getCornerCoords());
	}
	
	getElementWidth() {
		return 0;
	}
	
	getElementHeight() {
		return 0;
	}
	
	getBoundingRect() {
		const [left, top] = this.getScreenPosition();
		return {
			left: left,
			right: left + this.getElementWidth(),
			top: top,
			bottom: top + this.getElementHeight()
		};
	}
	
	makeElement() {
		throw new Error("not implemented");
	}
	
	registerInDOM() {
		if (!this.element) {
			this.makeElement();
			document.getElementById("canvas").appendChild(this.element);		
		}
	}
	
	draw() {
		const bounds = this.getBoundingRect();
		const doDraw = 0 <= bounds.right && bounds.left <= window.innerWidth
			&& 0 <= bounds.bottom && bounds.top <= window.innerHeight;
		
		if (doDraw) {
			this.registerInDOM();
			this.element.style.left = bounds.left + "px";
			this.element.style.top = bounds.top + "px";
		} else {
			this.deregister();
		}
	}
	
	deregister() {
		if (this.element) {
			this.element.remove();
			this.element = undefined;
		}
	}
	
}

class Sphere extends Drawable {
	name;
	radius;
	color;
	
	velocity;
	acceleration = [0, 0];
	
	trail = [];
	
	successor = undefined;
	
	constructor(name, radius, color, position, velocity) {
		super();
		
		// Set params
		this.name = name;
		this.radius = radius;
		this.color = color || Color.gray;
		this.position = position || [0, 0];
		this.velocity = velocity || [0, 0];
		
		env.model.spheres[this.name] = this;
		env.model.numSpheres++;
	}
	
	makeElement() {
		this.element = document.createElement("div");
		this.element.id = name;
		this.element.setAttribute("class", "sphere");
		this.updateElement();
		
		this.element.onclick = () => {
			if (env.playback.focus === this.name) {
				playPause();
			} else {
				setFocus(this);
			}
		};
	}
	
	updateElement() {
		if (this.element) {
			const diameter = this.getElementDiameter();
			this.element.style.width = diameter + "px";
			this.element.style.height = diameter + "px";			
			this.element.style.zIndex = 10000 - Math.floor(this.radius);
			this.element.style.backgroundColor = this.color.toString();			
		}
	}
	
	getElementDiameter() {
		return (this.radius || 50) * 2 * env.screen.scale;
	}
	
	getElementWidth() {
		return this.getElementDiameter();
	}
	
	getElementHeight() {
		return this.getElementDiameter();
	}
	
	remove() {
		super.deregister();
		delete env.model.spheres[this.name];
		env.model.numSpheres--;
	}
	
	getMass() {
		return this.radius ** 3;
	}
	
	getCornerCoords() {
		const radArr = vecMul(env.screen.scale, [this.radius, this.radius]);
		return vecSub(super.getCornerCoords(), radArr);
	}
	
	getCentre() {
		return super.getCornerCoords();
	}
	
	getUltimateSuccessor() {
		if (!this.successor) {
			return this;
		} else {
			return this.successor.getUltimateSuccessor();
		}
	}
	
	draw() {
		super.draw();
		
		// Draw/update trail
		this.trail = this.trail.filter(marker => {
			if (marker.birthStep < env.playback.step - env.model.trailLength) {
				marker.deregister();
				return false;
			} else {
				marker.draw();
				return true;
			}
		});
	}
	
}

class TrailMarker extends Drawable {
	
	static SIZE = 2;
	sphere;
	birthStep = env.playback.step;
	
	constructor(sphere) {
		super();
		this.sphere = sphere;
		this.position = sphere.position;
		sphere.trail.push(this);
	}
	
	makeElement() {
		this.element = document.createElement("div");
		this.element.setAttribute("class", "trail");
		this.element.style.width = TrailMarker.SIZE + "px";
		this.element.style.height = TrailMarker.SIZE + "px";
		this.element.style.backgroundColor = this.sphere.color.toString();
	}
	
	getElementWidth() {
		return TrailMarker.SIZE;
	}
	
	getElementHeight() {
		return TrailMarker.SIZE;
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


/* BUSINESS LOGIC */

function forEachSphere(fn) {
	for (var sphere of Object.values(env.model.spheres)) {
		fn(sphere);
	}
}

// processor: (bin, region) => ()
function binByLocation(binWidth, processor) {
	const bins = {};
	
	forEachSphere(sphere => {
		const bx = Math.floor(sphere.position[0] / binWidth);
		const by = Math.floor(sphere.position[1] / binWidth);
		if (bins[[bx,by]] === undefined) {
			bins[[bx,by]] = [];
		}
		bins[[bx,by]].push(sphere);
	});
	
	for (const key in bins) {
		const [bx,by] = key.split(',').map(x => +x);
		const bin = bins[[bx,by]];
		const region = [...bin];
		// group adjacent bins into region so bin-edge-spanning collisions aren't missed
		for (let i = -1; i <= 1; i++) {
			for (let j = -1; j <= 1; j++) {
				if (i || j) {
					region.push(...(bins[[bx+i,by+j]] || []));					
				}
			}
		}
		processor(bin, region);
	}
}

function updateAccelerations() {
	const list = Object.values(env.model.spheres).sort(sortOn(s => -s.radius));
	const pairsLimit = numPairs(env.model.processLimit);
	const bound = revNumPairs(list.length, pairsLimit);
	
	for (let subjectIdx = 0; subjectIdx < bound; subjectIdx++) {
		const subject = list[subjectIdx];
		if (subjectIdx === 0) subject.acceleration = [0,0]; // reset acceleration on first pass
		
		for (let objectIdx = subjectIdx + 1; objectIdx < list.length; objectIdx++) {
			const object = list[objectIdx];
			if (subjectIdx === 0) object.acceleration = [0,0]; // reset acceleration on first pass
			
			const dir = vecSub(object.position, subject.position);
			const baseVec = vecMul(env.model.gravity / (norm(dir) ** 3), dir);
			
			const acc1 = vecMul(object.getMass(), baseVec);
			subject.acceleration = vecAdd(subject.acceleration, acc1);
			
			const acc2 = vecMul(-subject.getMass(), baseVec);
			object.acceleration = vecAdd(object.acceleration, acc2);
		}
	}
}

// Returns the number of iterations in the following loop system:
// for (let i = 0; i < k; i++)
// 	for (let j = i+1; j < n; j++)
function numPairs(n, k = n) {
	if (n === 0) return 0;
	return (n-1) * n / 2 - numPairs(n-k);
}

// Returns greatest k such that numPairs(n, k) <= p
function revNumPairs(n, p) {
	const a = 2*n-1;
	const r = a**2 - 8*p;
	if (r < 0) return n-1;
	return Math.floor(0.5 * (a - Math.sqrt(a**2 - 8*p)));
}

// Doing array.sort(sortOn(fn)) will sort the array by fn(item)
function sortOn(fn) {
	return (a,b) => fn(a) - fn(b);
}

function updatePositions() {
	forEachSphere(sphere => {
		sphere.velocity = vecAdd(sphere.velocity, sphere.acceleration);
		sphere.position = vecAdd(sphere.position, sphere.velocity);
		if (env.model.trailLength) new TrailMarker(sphere);
	});
}

function checkCollisions() {
	const binWidth = getAutoFocusTarget().radius + 1; // use largest radius for bin size
	const keepList = new Set();
	const killList = new Set();
	
	binByLocation(binWidth, (bin, region) => {
		// We need to compare the inside of the bin to itself and to it's neighbours
		// but we don't need to compare neighbours to themselves or other neighbours, that'll be done in a separate bin
		for (let idxA = 0; idxA < bin.length - 1; idxA++) {
			for (let idxB = idxA + 1; idxB < region.length; idxB++) {
				const sphereA = region[idxA].getUltimateSuccessor();
				const sphereB = region[idxB].getUltimateSuccessor();
				if (sphereA.name === sphereB.name) continue;
				
				const r = dist(sphereA.position, sphereB.position);
				if (r < Math.max(sphereA.radius, sphereB.radius)) {
					const [keep,kill] = combine(sphereA, sphereB);
					keepList.add(keep);
					killList.add(kill);
				}
			}
		}
	});
	
	killList.forEach(sphere => {
		sphere.remove();
		keepList.delete(sphere);
	});
	
	keepList.forEach(sphere => {
		sphere.updateElement();
	});
}

function combine(a, b) {
	if (a.radius < b.radius) {
		return combine(b, a);
	}
	
	let color = blend(a.color, b.color, a.getMass(), b.getMass());
	color = blend(color, Color.yellow, env.model.numSpheres, 1);
	const x = weightedAverage(a.position[0], b.position[0], a.getMass(), b.getMass());
	const y = weightedAverage(a.position[1], b.position[1], a.getMass(), b.getMass());
	const u = weightedAverage(a.velocity[0], b.velocity[0], a.getMass(), b.getMass());
	const v = weightedAverage(a.velocity[1], b.velocity[1], a.getMass(), b.getMass());
	
	a.radius = Math.cbrt(a.getMass() + b.getMass()); // grow by volume
	a.color = color;
	a.position = [x,y];
	a.velocity = [u,v];
	a.trail.push(...b.trail); // combine trails
	
	b.successor = a;
	
	if (env.playback.focus === b.name) {
		env.playback.focus = a.name;
	}
	
	return [a,b];
}


/* APPLICATION */

function getScreenCentre() {
	return [window.innerWidth / 2, window.innerHeight / 2];
}

function step() {
	env.playback.stepInProgress = true;
	updateStepButtons();
	
	setTimeout(() => {
		env.playback.lastStepTime = env.playback.time;
		if (env.model.collision) checkCollisions();
		updateAccelerations();
		updatePositions();
		env.playback.step += 1;
		
		env.playback.stepInProgress = false;
		updateStepButtons();
	}, 0);
}

function checkFocus() {
	if (env.playback.autofocus) {
		env.playback.focus = getAutoFocusTarget().name;
	}
}

function getAutoFocusTarget() {
	return Object.values(env.model.spheres).reduce((largestSphere, sphere) => {
		return largestSphere.radius < sphere.radius ? sphere : largestSphere;
	}, {radius: 0});
}

function draw() {
	let centre = getScreenCentre();
	
	if (env.playback.focus) {
		const focus = getFocus();
		centre = vecSub(centre, focus.getCentre());
	}
	
	if (env.screen.centre !== centre) {
		env.screen.centre = centre;
	}
	
	forEachSphere(sphere => {
		sphere.draw();
	});
}

function main() {
	if (!env.playback.paused && !env.playback.stepInProgress && env.playback.lastStepTime + env.playback.speed <= env.playback.time) {
		step();
	}
	checkFocus();
	draw();
	env.playback.time += 1;
}

function updateButtons() {
	updateStepButtons();
	document.getElementById("pauseButton").setAttribute("hidden", env.playback.paused);
	document.getElementById("playButton").setAttribute("hidden", !env.playback.paused);
	document.getElementById("fastButton").setAttribute("disabled", env.playback.speed === constants.playback.speed.min);
	document.getElementById("resetSpeedButton").setAttribute("disabled", env.playback.speed === constants.playback.speed.default);
	document.getElementById("slowButton").setAttribute("disabled", env.playback.speed === constants.playback.speed.max);
	document.getElementById("autoFocusButton").setAttribute("hidden", env.playback.autofocus);
	document.getElementById("manualFocusButton").setAttribute("hidden", !env.playback.autofocus);
	document.getElementById("resetZoomButton").setAttribute("disabled", env.screen.scale === constants.screen.scale.default);
	document.getElementById("enableCollisionsButton").setAttribute("hidden", env.model.collision);
	document.getElementById("disableCollisionsButton").setAttribute("hidden", !env.model.collision);
	document.getElementById("decreaseTrailButton").setAttribute("disabled", env.model.trailLength === 0);
	document.getElementById("trailLength").innerHTML = env.model.trailLength;
}

function updateStepButtons() {
	document.getElementById("playButton").setAttribute("disabled", env.playback.stepInProgress);
	document.getElementById("stepButton").setAttribute("disabled", !env.playback.paused || env.playback.stepInProgress);
}


/* DEBUGGING */

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