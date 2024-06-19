const V3 = {
	create(x, y, z) {
		return { x: x, y: y, z: z };
	},
	
	add(a, b) {
		a.x = a.x + b.x;
		a.y = a.y + b.y;
		a.z = a.z + b.z;
	},
	
	subtract(a, b) {
		a.x = a.x - b.x;
		a.y = a.y - b.y;
		a.z = a.z - b.z;
	},
	
	dot(a, b) {
		return a.x * b.x + a.y * b.y + a.z * b.z;
	},
	
	newScale(v, a) {
		return {
			x: v.x * a,
			y: v.y * a,
			z: v.z * a
		};
	}
};