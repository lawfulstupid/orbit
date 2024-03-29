/* INITIALISATION */

document.addEventListener("DOMContentLoaded", () => {
	init();
	updateButtons();
	beforeMain();
	window.requestAnimationFrame(main);
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
		env.playback.speed = 0;
	} else {
		env.playback.speed += dir
		if (Math.abs(env.playback.speed) > constants.playback.speed.limit) {
			env.playback.speed = Math.sign(env.playback.speed) * constants.playback.speed.limit;
		}
	}
	
	env.playback.stepsPerUpdate = Math.max(1, Math.ceil(constants.playback.speed.factor ** env.playback.speed));
	env.playback.framesPerUpdate = Math.max(1, Math.ceil(constants.playback.speed.factor ** -env.playback.speed));
	
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

function scheduleStep() {
	env.playback.step.queue();
	updateStepButtons();
}

function updateButtons() {
	updateStepButtons();
	document.getElementById("pauseButton").setAttribute("hidden", env.playback.paused);
	document.getElementById("playButton").setAttribute("hidden", !env.playback.paused);
	document.getElementById("slowButton").setAttribute("disabled", env.playback.speed === -constants.playback.speed.limit);
	document.getElementById("resetSpeedButton").setAttribute("disabled", env.playback.speed === 0);
	document.getElementById("fastButton").setAttribute("disabled", env.playback.speed === constants.playback.speed.limit);
	document.getElementById("autoFocusButton").setAttribute("hidden", env.playback.autofocus);
	document.getElementById("manualFocusButton").setAttribute("hidden", !env.playback.autofocus);
	document.getElementById("resetZoomButton").setAttribute("disabled", env.screen.scale === constants.screen.scale.default);
	document.getElementById("enableCollisionsButton").setAttribute("hidden", env.model.collision);
	document.getElementById("disableCollisionsButton").setAttribute("hidden", !env.model.collision);
	document.getElementById("decreaseTrailButton").setAttribute("disabled", env.model.trailLength === 0);
	document.getElementById("trailLength").innerHTML = env.model.trailLength;
}

function updateStepButtons() {
	document.getElementById("playButton").setAttribute("disabled", !env.playback.step.canQueue());
	document.getElementById("stepButton").setAttribute("disabled", !env.playback.paused || !env.playback.step.canQueue());
}


/* MODEL */

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
		env.model.totalMass += this.mass;
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
	
	get mass() {
		return this.radius ** 3;
	}
	
	set mass(newMass) {
		this.radius = Math.cbrt(newMass);
	}
	
	getWeightedPosition() {
		return vecMul(this.mass, this.position);
	}
	
	getWeightedVelocity() {
		return vecMul(this.mass, this.velocity);
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
			if (marker.birthStep < env.playback.step.index - env.model.trailLength) {
				marker.deregister();
				return false;
			} else {
				marker.draw();
				return true;
			}
		});
	}
}

class QuadTree {
	left;
	top;
	size;
	totalMass;
	totalWeightedPosition;
	quadrants;
	
	constructor(spheres, left, top, size) {
		if (left === undefined) {
			left = -QuadTree.getMaxDist(spheres);
			top = left;
			size = -2 * left;
		}
		
		this.left = left;
		this.top = top;
		this.size = size;
		if (spheres.length <= 1) {
			this.totalMass = totalMass(spheres);
			this.totalWeightedPosition = totalWeightedPosition(spheres);
		} else {
			const midSize = size/2;
			const xMid = left + midSize;
			const yMid = top + midSize;
			
			const northWest = [];
			const northEast = [];
			const southWest = [];
			const southEast = [];
			
			spheres.forEach(sphere => {
				if (sphere.position[0] <= xMid) { // west
					if (sphere.position[1] <= yMid) { // north
						northWest.push(sphere);
					} else { // south
						southWest.push(sphere);
					}
				} else { // east
					if (sphere.position[1] <= yMid) { // north
						northEast.push(sphere);
					} else { // south
						southEast.push(sphere);
					}
				}
			});
			
			this.quadrants = [
				new QuadTree(northWest, left, top, midSize),
				new QuadTree(northEast, xMid, top, midSize),
				new QuadTree(southWest, left, yMid, midSize),
				new QuadTree(southEast, xMid, yMid, midSize)
			];
			
			this.totalMass = totalMass(this.quadrants);
			this.totalWeightedPosition = totalWeightedPosition(this.quadrants);
		}
	}
	
	static getMaxDist(spheres) {
		const maxDist = spheres.reduce((md,sphere) => {
			return Math.max(md, Math.abs(sphere.position[0]), Math.abs(sphere.position[1]));
		}, 0);
		return Math.ceil(maxDist) + 1; // to combat off-by-one errors
	}
	
	get mass() {
		return this.totalMass;
	}
	
	get position() {
		if (this.isEmpty()) {
			return [0,0];
		} else {
			return vecMul(1/this.totalMass, this.totalWeightedPosition);
		}
	}
	
	getWeightedPosition() {
		return this.totalWeightedPosition;
	}
	
	isTerminal() {
		return this.quadrants === undefined;
	}
	
	isEmpty() {
		return this.totalMass === 0;
	}
	
	contains(sphere) {
		const right = this.left + this.size;
		const bottom = this.top + this.size;
		const [x,y] = sphere.position;
		return this.left <= x && x <= right && this.top <= y && y <= bottom;
	}
}

class TrailMarker extends Drawable {
	static SIZE = 2;
	sphere;
	birthStep = env.playback.step.index;
	
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

class TimeUnit {
	static ROLLING_AVG_PERIOD = 5;
	
	index = 0;
	inProgress = false;
	delay = undefined;
	lastStart = 0;
	durations = [];
	
	get lastDuration() {
		return this.durations[this.durations.length - 1];
	}
	
	set lastDuration(dur) {
		this.durations.push(dur);
		if (this.durations.length > TimeUnit.ROLLING_AVG_PERIOD) {
			this.durations.splice(0, 1);
		}
	}
	
	get avgDuration() {
		return this.durations.reduce((s,x) => s + x, 0) / this.durations.length;
	}
	
	start() {
		this.inProgress = true;
		this.delay = undefined;
		this.index++;
		this.lastStart = window.performance.now();
	}
	
	end() {
		this.lastDuration = window.performance.now() - this.lastStart;
		this.inProgress = false;
	}
	
	queue() {
		this.delay = 1;
	}
	
	checkQueue() {
		if (this.delay === undefined) {
			return false;
		} else {
			return this.delay-- === 0;
		}
	}
	
	canQueue() {
		return (this.delay === undefined) && !this.inProgress;
	}
}

const ApproximationStrategy = {
	None: 'none',
	ProcessLimiting: 'processLimit',
	QuadTree: 'quadTree'
}

/*
 * None:
 * When no approximation strategy is employed, forces between all pairs of 
 * spheres is computed.
 * Complexity: O(N^2)
 *
 * Process Limiting:
 * `processLimit` represents how many spheres the system could comfortably handle
 * this is used to limit how many pairs of spheres will have their forces calculated
 * e.g. if processLimit = 100, that would mean a limit of 4950 comparisons.
 * Complexity: O(processLimit^2)
 *
 * QuadTree:
 * Implementation of the Barnes-Hut algorithm,
 * using env.approximation.barnesHutThreshold as the theta-value.
 * Complexity: O(N log N)
 */

const constants = {
	approximation: {
		processLimit: {
			min: () => Math.floor(2 * Math.sqrt(env.model.numSpheres)),
			max: () => env.model.numSpheres,
			factor: 1.5
		},
		barnesHutThreshold: {
			min: 0,
			max: 2
		}
	},
	playback: {
		speed: {
			limit: 8,
			factor: 1.666
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
		totalMass: 0,
		gravity: 0.1, // gravitational constant
		collision: true,
		cullEscapees: true,
		trailLength: 0,
		autoAdjust: true
	},
	playback: {
		step: new TimeUnit(),
		update: new TimeUnit(),
		frame: new TimeUnit(),
		speed: 0, // === stepsPerUpdate - framesPerUpdate
		stepsPerUpdate: 1,
		framesPerUpdate: 1,
		paused: false,
		focus: null,
		autofocus: false
	},
	screen: {
		centre: [0, 0],
		scale: constants.screen.scale.default // >1 => zoomed in1, <1 => zoomed out
	},
	approximation: {
		strategy: ApproximationStrategy.QuadTree,
		processLimit: 1000,
		barnesHutThreshold: 0.5
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

function totalMass(spheres = []) {
	return spheres.map(sphere => sphere.mass).reduce((a,b) => a+b, 0)
}

function totalWeightedPosition(spheres = []) {
	return spheres.map(sphere => sphere.getWeightedPosition()).reduce(vecAdd, [0,0])
}


/* BUSINESS LOGIC */

function forEachSphere(fn) {
	for (const key in env.model.spheres) {
		fn(env.model.spheres[key]);
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
	switch (env.approximation.strategy) {
		case ApproximationStrategy.None:
			env.approximation.processLimit = env.model.numSpheres;
			updateAccelerationsProcessLimited();
			break;
		case ApproximationStrategy.ProcessLimit:
			updateAccelerationsProcessLimited();
			break;
		case ApproximationStrategy.QuadTree:
			updateAccelerationsQuadTree();
			break;
	}
}

function updateAccelerationsProcessLimited() {
	const list = Object.values(env.model.spheres).sort(sortOn(s => -s.radius + Math.random())); // add a small (0-1) random number to mix things up
	const pairsLimit = numPairs(env.approximation.processLimit);
	const bound = revNumPairs(list.length, pairsLimit);
	
	for (let subjectIdx = 0; subjectIdx < bound; subjectIdx++) {
		const subject = list[subjectIdx];
		if (subjectIdx === 0) subject.acceleration = [0,0]; // reset acceleration on first pass
		
		for (let objectIdx = subjectIdx + 1; objectIdx < list.length; objectIdx++) {
			const object = list[objectIdx];
			if (subjectIdx === 0) object.acceleration = [0,0]; // reset acceleration on first pass
			
			updateAcceleration(subject, object);
		}
	}
}

function updateAccelerationsQuadTree() {
	const tree = new QuadTree(Object.values(env.model.spheres));
	
	forEachSphere(sphere => {
		sphere.acceleration = [0,0];
		traverseTree(sphere, tree);
	});
}

function traverseTree(sphere, treeNode) {
	if (treeNode.isEmpty()) return;
	
	/*
	FAR vs NEAR: whether the treeNode passes the threshold test
	TERM(INAL) vs NT (NONTERMINAL)
	IN(SIDE) vs OUT(SIDE): if the treeNode contains the sphere or not
	
	FAR  + NT   + IN  = resolve    // I thought this should be expand but resolve works better
	FAR  + NT   + OUT = resolve
	FAR  + TERM + IN  = impossible // won't happen so allow any action
	FAR  + TERM + OUT = resolve
	NEAR + NT   + IN  = expand
	NEAR + NT   + OUT = expand
	NEAR + TERM + IN  = pass
	NEAR + TERM + OUT = resolve
	*/
	
	const distanceQuotient = treeNode.size / dist(sphere.position, treeNode.position);
	const sufficientlyFar = distanceQuotient < env.approximation.barnesHutThreshold;
	
	let action;
	if (sufficientlyFar) {
		action = 'resolve';
	} else if (!treeNode.isTerminal()) {
		action = 'expand';
	} else if (treeNode.contains(sphere)) {
		action = 'pass';
	} else {
		action = 'resolve';
	}
	
	if (action === 'resolve') {
		updateAcceleration(treeNode, sphere, false);
	} else if (action === 'expand') {
		treeNode.quadrants.forEach(quad => {
			traverseTree(sphere, quad);
		});
	}
	// do nothing if action === 'pass'
}

// Generally assumes subject is bigger than object (relevant if mutual = false)
function updateAcceleration(subject, object, mutual = true) {
	const dir = vecSub(object.position, subject.position);
	const baseVec = vecMul(env.model.gravity / (norm(dir) ** 3), dir);
	
	if (mutual) {
		const acc1 = vecMul(object.mass, baseVec);
		subject.acceleration = vecAdd(subject.acceleration, acc1);
	}
	
	const acc2 = vecMul(-subject.mass, baseVec);
	object.acceleration = vecAdd(object.acceleration, acc2);
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
		for (let idxA = 0; idxA < bin.length; idxA++) {
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
	
	let color = blend(a.color, b.color, a.mass, b.mass);
	color = blend(color, Color.yellow, env.model.numSpheres, 1);
	const weightedPosition = vecAdd(a.getWeightedPosition(), b.getWeightedPosition());
	const weightedVelocity = vecAdd(a.getWeightedVelocity(), b.getWeightedVelocity());
	
	a.mass += b.mass; // grow by volume
	a.color = color;
	a.position = vecMul(1/a.mass, weightedPosition);
	a.velocity = vecMul(1/a.mass, weightedVelocity);
	a.trail.push(...b.trail); // combine trails
	
	b.successor = a;
	
	if (env.playback.focus === b.name) {
		env.playback.focus = a.name;
	}
	
	return [a,b];
}

function checkEscapees() {
	const totalPos = Object.values(env.model.spheres)
		.map(sphere => sphere.getWeightedPosition())
		.reduce(vecAdd, [0,0]);
	const totalMass = env.model.totalMass;
	
	forEachSphere(sphere => {
		if (sphere.element) return; // only remove if off-screen
		const centralMass = totalMass - sphere.mass;
		const centralPos = vecMul(1/centralMass, vecSub(totalPos, sphere.getWeightedPosition()));
		const d = dist(centralPos, sphere.position);
		const escapeVelocity = Math.sqrt(2 * env.model.gravity * centralMass / d);
		if (norm(sphere.velocity) > 2 * escapeVelocity) {
			sphere.remove();
			env.model.totalMass = centralMass;
			// Append trail to something else so it gets cleaned up
			getAutoFocusTarget().trail.push(...sphere.trail);
		}
	});
}

function adjustParameters() {
	switch (env.approximation.strategy) {
		case ApproximationStrategy.ProcessLimiting:
			adjustProcessLimit();
			break;
		case ApproximationStrategy.QuadTree:
			adjustBarnesHutThreshold();
			break;
	}
}

function adjustProcessLimit() {
	const q = env.playback.update.lastDuration / (1000 / 60);
	let newLimit = env.approximation.processLimit;
	
	if (q >= 1) {
		newLimit = Math.max(constants.approximation.processLimit.min(), Math.floor(env.approximation.processLimit / constants.approximation.processLimit.factor));
	} else if (q < 0.5) {
		newLimit = Math.min(constants.approximation.processLimit.max(), Math.floor(env.approximation.processLimit * constants.approximation.processLimit.factor));
	}
	
	if (newLimit !== env.approximation.processLimit) {
		console.log('New Process Limit:', newLimit);
		env.approximation.processLimit = newLimit;
	}
}

function adjustBarnesHutThreshold() {
	const q = env.playback.update.lastDuration / (1000 / 60);
	let newThreshold = env.approximation.barnesHutThreshold;
	
	if (q >= 1) {
		newThreshold = (env.approximation.barnesHutThreshold + constants.approximation.barnesHutThreshold.max) / 2;
	} else if (q < 0.5) {
		newThreshold = (env.approximation.barnesHutThreshold + constants.approximation.barnesHutThreshold.min) / 2;
	}
	
	if (newThreshold !== env.approximation.barnesHutThreshold) {
		console.log('New Threshold:', newThreshold);
		env.approximation.barnesHutThreshold = newThreshold;
	}
}


/* APPLICATION */

function beforeMain() {
	if (env.model.collision) checkCollisions();
	checkFocus();
	draw();
}

function main(timestamp) {
	env.playback.frame.start();
	
	if (env.playback.paused && env.playback.step.checkQueue()) {
		step();
	} else if (!env.playback.paused && !env.playback.update.inProgress && env.playback.frame.index % env.playback.framesPerUpdate === 0) {
		update();
	}
	
	checkFocus();
	draw();
	updateStepButtons();
	
	window.requestAnimationFrame(ts => {
		env.playback.frame.end();
		main(ts);
	});
}

function update() {
	env.playback.update.start();
	for (let i = 0; i < env.playback.stepsPerUpdate; i++) {
		step();
	}
	env.playback.update.end();
	if (env.model.autoAdjust) adjustParameters();
}

function step() {
	env.playback.step.start();
	updateAccelerations();
	updatePositions();
	if (env.model.collision) checkCollisions();
	if (env.model.cullEscapees) checkEscapees();
	env.playback.step.end();
}

function getScreenCentre() {
	return [window.innerWidth / 2, window.innerHeight / 2];
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
	
	document.getElementById("fpsDisplay").innerHTML = Math.round(1000 / env.playback.frame.avgDuration);
}


/* DEBUGGING */

function timer(name) {
    const start = window.performance.now();
    return {
        stop: function() {
            const end = window.performance.now();
            const time = end - start;
            console.log('Timer:', name, 'finished in', time, 'ms');
				return time;
        }
    }
};

function benchmark(fn) {
	var t = timer('Benchmark');
	fn();
	t.stop();
}