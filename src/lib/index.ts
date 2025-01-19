interface Point {
	x: number;
	y: number;
}

export function normalize(vector: Point): Point {
	const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);

	if (length === 0) {
		return { x: 0, y: 0 };
	}

	return {
		x: vector.x / length,
		y: vector.y / length
	};
}

function subtractPoints(a: Point, b: Point): Point {
	return {
		x: a.x - b.x,
		y: a.y - b.y
	};
}

function multiplyVector(vector: Point, scalar: number): Point {
	return {
		x: vector.x * scalar,
		y: vector.y * scalar
	};
}

function addPoints(a: Point, b: Point): Point {
	return {
		x: a.x + b.x,
		y: a.y + b.y
	};
}

export function constrainDistance(point: Point, anchor: Point, distance: number): Point {
	const vector = subtractPoints(point, anchor);
	const normalizedVector = normalize(vector);
	const scaledVector = multiplyVector(normalizedVector, distance);
	return addPoints(anchor, scaledVector);
}
