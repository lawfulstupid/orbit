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