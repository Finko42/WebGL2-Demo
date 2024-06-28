const V3 = {
	add(a, b) {
		a[0] = a[0] + b[0];
		a[1] = a[1] + b[1];
		a[2] = a[2] + b[2];
	},
	
	subtract(a, b) {
		a[0] = a[0] - b[0];
		a[1] = a[1] - b[1];
		a[2] = a[2] - b[2];
	},
	
	dot(a, b) {
		return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
	},
	
	newScale(v, a) {
		return [v[0] * a, v[1] * a, v[2] * a];
	}
};
