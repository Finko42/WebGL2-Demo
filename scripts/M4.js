// Column-major
const M4 = {
	// Returns new translation matrix
	translation(x, y, z) {
		return new Float32Array([
			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			x, y, z, 1]
		);
	},

	// All rotation functions assume angle in radians
	xRotate(m, a) {
		const c = Math.cos(a), s = Math.sin(a);
		
		const m4 = m[4], m8 = m[8];
		const m5 = m[5], m9 = m[9];
		const m6 = m[6], m10 = m[10];
		const m7 = m[7], m11 = m[11];
		
		m[4] = m4 * c + m8 * s;  m[8] = m8 * c - m4 * s;
		m[5] = m5 * c + m9 * s;  m[9] = m9 * c - m5 * s;
		m[6] = m6 * c + m10 * s; m[10] = m10 * c - m6 * s;
		m[7] = m7 * c + m11 * s; m[11] = m11 * c - m7 * s;
	},
	
	yRotate(m, a) {
		const c = Math.cos(a), s = Math.sin(a);
		
		const m0 = m[0], m8 = m[8];
		const m1 = m[1], m9 = m[9];
		const m2 = m[2], m10 = m[10];
		const m3 = m[3], m11 = m[11];
		
		m[0] = m0 * c - m8 * s;  m[8] = m8 * c + m0 * s;
		m[1] = m1 * c - m9 * s;  m[9] = m9 * c + m1 * s;
		m[2] = m2 * c - m10 * s; m[10] = m10 * c + m2 * s;
		m[3] = m3 * c - m11 * s; m[11] = m11 * c + m3 * s;
	},
	
	zRotate(m, a) {
		const c = Math.cos(a), s = Math.sin(a);
		
		const m0 = m[0], m4 = m[4];
		const m1 = m[1], m5 = m[5];
		const m2 = m[2], m6 = m[6];
		const m3 = m[3], m7 = m[7];
		
		m[0] = m0 * c + m4 * s; m[4] = m4 * c - m0 * s;
		m[1] = m1 * c + m5 * s; m[5] = m5 * c - m1 * s;
		m[2] = m2 * c + m6 * s; m[6] = m6 * c - m2 * s;
		m[3] = m3 * c + m7 * s; m[7] = m7 * c - m3 * s;
	}
}