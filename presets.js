function preset0() { // sun only
	const sun = new Sphere("sun", 200, Color.yellow);
	setFocus("sun");
	env.playback.paused = true;
}

function preset1() {
	const sun = new Sphere("sun", 100, Color.yellow);
	setFocus(sun);
	
	const earth = new Sphere("earth", 10, Color.green);
	earth.position = [200, 0];
	earth.velocity = [0, 20];
	
	const mars = new Sphere("mars", 7, Color.red);
	mars.position = [0, -300];
	mars.velocity = [20, 0];
	
	const pluto = new Sphere("pluto", 3, Color.cyan);
	pluto.position = [200, -200];
	pluto.velocity = [22, 0];
}

function preset2() { // yeeter
	new Sphere("red", 5, Color.red, [0, -20], [1, 0]);
	new Sphere("blue", 5, Color.blue, [0, 20], [-1, 0]);
	new Sphere("green", 10, Color.green, [0, 0], [0, 0.0001]);
}

function preset3() {
	const sun = new Sphere("sun", 350, Color.yellow);
	const earth = new Sphere("earth", 20, Color.green, [1500, 0], [0, 50]);
	const moon = new Sphere("moon", 5, Color.gray, [1460, 0], [0, 55]);
	setFocus("sun");
	env.playback.paused = true;
}

function preset4() {
	const sun = new Sphere("sun", 100, Color.yellow);
	setFocus("sun");
	
	const f = env.model.gravity * sun.getMass();
	let r, q, x, y;
	
	const planet = new Sphere("planet", 10, Color.green, [200,-200]);
	r = norm(planet.position);
	q = Math.sqrt(2*f/(r ** 3) - f*f/(r ** 6)) - (7/r);
	[x,y] = planet.position;
	planet.velocity = [-q*y, q*x];
	
	const planet2 = new Sphere("planet2", 15, Color.orange, [-350, 200]);
	r = norm(planet2.position);
	q = Math.sqrt(2*f/(r ** 3) - f*f/(r ** 6)) - (6/r);
	[x,y] = planet2.position;
	planet2.velocity = [-q*y, q*x];
	
	const planet3 = new Sphere("planet3", 8, Color.pink, [-400, -380]);
	r = norm(planet3.position);
	q = Math.sqrt(2*f/(r ** 3) - f*f/(r ** 6)) - (5/r);
	[x,y] = planet3.position;
	planet3.velocity = [-q*y, q*x];
	
	env.playback.paused = true;
}

function preset5() { // dust cloud
	// const sun = new Sphere("sun", 200, "yellow");
	// setFocus("sun");s
	
	const numberOfPlanets = onMobile() ? 500 : 5000;
	const minRadius = 2;
	const maxRadius = 5;
	const minOrbit = 5;
	const maxOrbit = 1000;
	const maxSpeed = 5;
	
	for (let i = 1; i <= numberOfPlanets; i++) {
		const color = Color.gray;
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
		const [u,v] = vecMul(speed, vecMul(0.001, [-y, x]));
		
		new Sphere("planet" + i, radius, color, [x,y], [u,v]);
	}
	
	setFocus("auto");
	
	// env.playback.paused = true;
}

function randomBetween(a, b) {
	return a + Math.random() * (b - a);
}

function onMobile() {
	return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}