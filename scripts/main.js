"use strict";

@insert(scripts/V3.js)
@insert(scripts/M4.js)

function makeShader(gl, type, source) {
	const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

function main() {
	// Try to initialize WebGL2
	const gl = document.querySelector("#c").getContext("webgl2");

	if (!gl) {
		alert(
			"Unable to initialize WebGL2. Your browser or machine may not support it."
		);
		return;
	}
	
	// Since we're flat shading, use first vertex as provoking
	const epv = gl.getExtension("WEBGL_provoking_vertex");
  if (epv) {
    epv.provokingVertexWEBGL(epv.FIRST_VERTEX_CONVENTION_WEBGL);
  }

	// Vertex shader source code
	const vsSrc = `#version 300 es
  in vec4 pos;
	in vec2 aTexCoord;
	in vec3 aNormal;
	in mat4 model;

	uniform mat4 view;
	uniform vec3 lightPos;
	uniform float invAspectRatio;
	
	out vec2 vTexCoord;
	out vec3 vNormal;
	out vec3 surfaceToLight;
	
	#define FOV_Y  60.0
	#define Z_NEAR 0.1
	#define Z_FAR  50.0

  void main() {
		const float F = 1.0/tan(radians(FOV_Y)*0.5);
		const float DEPTH = Z_FAR - Z_NEAR;

		vec4 vertexWorldPos = model * pos;
		gl_Position = view * vertexWorldPos;
		
		// Multiply by perspective matrix
		gl_Position.x *= invAspectRatio * F;
		gl_Position.y *= F;
		float z = gl_Position.z;
		gl_Position.z = (Z_FAR + Z_NEAR) / DEPTH * z +
		                -2.0 * Z_FAR * Z_NEAR / DEPTH * gl_Position.w;
		gl_Position.w = z;

		vTexCoord = aTexCoord;
		vNormal = mat3(model) * aNormal;
		surfaceToLight = lightPos - vertexWorldPos.xyz;
  }`;
  // Fragment shader source code
	const fsSrc = `#version 300 es
	// OpenGL ES 3.0 doesn't define default float precision for frag shaders
	precision highp float;
	
	in vec2 vTexCoord;
	in vec3 vNormal;
	in vec3 surfaceToLight;
	
	uniform sampler2D uTexture;

	out vec4 outColor;

	void main() {
		outColor = texture(uTexture, vTexCoord);
		outColor.rgb *= 0.175 + max(0.0, dot(normalize(vNormal), normalize(surfaceToLight)));
	}`;

	// Don't check shader compile status as it is synchronous
	const vertexShader = makeShader(gl, gl.VERTEX_SHADER, vsSrc);
	const fragmentShader = makeShader(gl, gl.FRAGMENT_SHADER, fsSrc);

	const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		console.error(`Link failed: ${gl.getProgramInfoLog(shaderProgram)}`);
		console.error(`Vertex shader info-log: ${gl.getShaderInfoLog(vertexShader)}`);
		console.error(`Fragment shader info-log: ${gl.getShaderInfoLog(fragmentShader)}`);
		gl.deleteShader(vertexShader);
		gl.deleteShader(fragmentShader);
		gl.deleteProgram(shaderProgram);
    return;
  }
	
	gl.deleteShader(vertexShader);
	gl.deleteShader(fragmentShader);
	
	gl.useProgram(shaderProgram);

	const texture = gl.createTexture();
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, 256, 256);
 
	// Asynchronously load an image
	const image = new Image();
	image.onload = () => {
		// Now that the image has loaded copy it to the texture
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 256, 256,
			gl.RGBA, gl.UNSIGNED_BYTE, image);
		gl.generateMipmap(gl.TEXTURE_2D);
	};
	image.src = "data:image/jpg;base64,@base64(assets/ObamaSquare.jpg)";

	// Get location of uniforms
	const invAspectUniformLocation =
		gl.getUniformLocation(shaderProgram, "invAspectRatio");
	const viewMatrixUniformLocation =
		gl.getUniformLocation(shaderProgram, "view");
	const lightPositionLocation =
    gl.getUniformLocation(shaderProgram, "lightPos");

	// Set light position
	gl.uniform3fv(lightPositionLocation, new Float32Array([0, 1, 8]));

	// Create buffer for vertex positions
	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

	// Cube vertex data
	gl.bufferData(
		gl.ARRAY_BUFFER,
    new Float32Array([
    -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1, // Front face
    -1, -1, 1, -1, 1, 1, 1, 1, 1, 1, -1, 1,     // Back face
    -1, 1, 1, -1, 1, -1, 1, 1, -1, 1, 1, 1,     // Top face
    -1, -1, 1, 1, -1, 1, 1, -1, -1, -1, -1, -1, // Bottom face
    1, -1, 1, 1, 1, 1, 1, 1, -1, 1, -1, -1,     // Right face
    -1, -1, 1, -1, -1, -1, -1, 1, -1, -1, 1, 1] // Left face
		),
    gl.STATIC_DRAW);

	// Tell WebGL how to pull out the positions from the position
	// buffer into the vertexPosition attribute.
	const vertexPositionAttribLocation =
		gl.getAttribLocation(shaderProgram, "pos");
  gl.vertexAttribPointer(vertexPositionAttribLocation,
	                       3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vertexPositionAttribLocation);

	// Create index buffer
	const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint8Array([
			0, 1, 2, 0, 2, 3,       // Front
			4, 5, 6, 4, 6, 7,       // Back
			8, 9, 10, 8, 10, 11,    // Top
			12, 13, 14, 12, 14, 15, // Bottom
			16, 17, 18, 16, 18, 19, // Right
			20, 21, 22, 20, 22, 23] // Left
		),
    gl.STATIC_DRAW);

	// Create buffer for texture coordinates
	const texCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
	
	// Cube texture data
	gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
			0, 1, 1, 1, 1, 0, 0, 0, // Front
			1, 1, 1, 0, 0, 0, 0, 1, // Back
			0, 0, 0, 1, 1, 1, 1, 0, // Top
			0, 1, 1, 1, 1, 0, 0, 0, // Bottom
			1, 1, 1, 0, 0, 0, 0, 1, // Right
			0, 1, 1, 1, 1, 0, 0, 0] // Left
		),
    gl.STATIC_DRAW);

	const texCoordAttribLocation =
		gl.getAttribLocation(shaderProgram, "aTexCoord");
	gl.vertexAttribPointer(texCoordAttribLocation, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(texCoordAttribLocation);
	
	const modelData = new Float32Array(48);
	// Create model matrix buffer
	const modelBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, modelBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, modelData.byteLength, gl.DYNAMIC_DRAW);
	
	const modelMatrixAttribLocation =
		gl.getAttribLocation(shaderProgram, "model");
	
	for (let i = 0; i < 4; ++i) {
		const loc = modelMatrixAttribLocation + i;
		gl.enableVertexAttribArray(loc);
		// Note the stride and offset
		gl.vertexAttribPointer(
				loc,      // location
				4,        // size (num values to pull from buffer per iteration)
				gl.FLOAT, // type of data in buffer
				false,    // normalize
				64,       // stride, num bytes to advance to get to next set of values
				i * 16,   // offset in buffer (4 floats per row, 4 bytes per float)
		);
		// This line says this attribute only changes for each 1 instance
		gl.vertexAttribDivisor(loc, 1);
	}
	
	// Create a buffer for normals
	const normalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);

	gl.bufferData(
		gl.ARRAY_BUFFER,
		new Float32Array([
			0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, // Front
			0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,     // Back
			0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,     // Top
			0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, // Bottom
			1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,     // Right
			-1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0] // Left
		),
		gl.STATIC_DRAW);
	
	const normalAttribLocation = gl.getAttribLocation(shaderProgram, "aNormal");
	gl.enableVertexAttribArray(normalAttribLocation);
	gl.vertexAttribPointer(normalAttribLocation, 3, gl.FLOAT, false, 0, 0);
	
	// Set cubes in their place
	const modelMatrices = [
		M4.translation(0, 0, 6),
		M4.translation(-6, 2, 10),
		M4.translation(6, 2, 10)
	];

	// Set drawing settings
	gl.clearColor(0.8, 1, 1, 1);
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);

	function resizeCanvas() {
		const glC = gl.canvas;

		// Lookup the size the browser is displaying the canvas in CSS pixels
		const displayWidth  = glC.clientWidth;
		const displayHeight = glC.clientHeight;
 
		// Check if the canvas is not the same size
		if (glC.width  !== displayWidth ||
				glC.height !== displayHeight) {
			// Make the canvas the same size
			glC.width  = displayWidth;
			glC.height = displayHeight;
		}

		gl.viewport(0, 0, glC.width, glC.height);

		// Update shaders with new aspect ratio
		gl.uniform1fv(invAspectUniformLocation,
			new Float32Array([displayHeight / displayWidth]));
	}

	resizeCanvas();

	let timeout = null;
	// Debounced window resize callback
	window.addEventListener("resize", () => {
		clearTimeout(timeout);
		timeout = setTimeout(resizeCanvas, 80);
	});
	
	// invPos is how much the world needs to move
	// for the camera to be in the right place.
	// Camera direction is in spherical coordinates
	const camera = {
		invPos: [0, 0, 0],
		yaw: 0,
		pitch: 0
	};

	const MAX_PITCH = 89 * Math.PI / 180;
	const TWO_PI = 2 * Math.PI;

	// On mouse movement, update camera direction
	function mouseMove(event) {
		// movementX increases to the right
		camera.yaw += event.movementX * 0.0025;
		while (camera.yaw < -TWO_PI) {
			camera.yaw += TWO_PI;
		}
		while (camera.yaw > TWO_PI) {
			camera.yaw -= TWO_PI;
		}
		// movementY increases down
		camera.pitch -= event.movementY * 0.0025;
		if (camera.pitch > MAX_PITCH) {
			camera.pitch = MAX_PITCH;
		} else if (camera.pitch < -MAX_PITCH) {
			camera.pitch = -MAX_PITCH;
		}
	}
	
	const keyPressed = {
		"KeyA": false,
		"KeyD": false,
		"KeyS": false,
		"KeyW": false,
		"Space": false,
		"ShiftLeft": false
	};

	function keyDown(event) { keyPressed[event.code] = true; }
	function keyUp(event) { keyPressed[event.code] = false; }
	
	// When pointer lock changes
	document.onpointerlockchange = (event) => {
		if (document.pointerLockElement) {
			document.addEventListener("mousemove", mouseMove);
			document.addEventListener("keydown", keyDown);
			document.addEventListener("keyup", keyUp);
		} else {
			document.removeEventListener("keydown", keyDown);
			document.removeEventListener("mousemove", mouseMove);
			document.removeEventListener("keyup", keyUp);
		}
	};
	
	// Lock mouse and turn off mouse acceleration
	document.body.onclick = async () => {
		await document.body.requestPointerLock({ unadjustedMovement: true });
	};
	
	let cubeRotationDelta = 0;

	// requestCallTime is the time requestAnimationFrame was last called
	function nextFrame(requestCallTime) {
		// Update and set matrices for drawing
		M4.xRotate(modelMatrices[0], cubeRotationDelta);
		M4.yRotate(modelMatrices[1], cubeRotationDelta);
		M4.zRotate(modelMatrices[2], cubeRotationDelta);
		
		for (let i = 0; i < 3; ++i) {
			for (let j = 0; j < 16; ++j) {
				modelData[i*16+j] = modelMatrices[i][j];
			}
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, modelBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, modelData);
		
		// Save camera pitch and yaw in case of event
		const currentPitch = camera.pitch;
		const currentYaw   = camera.yaw;

		const cosPitch = Math.cos(currentPitch);
		const sinYaw = Math.sin(currentYaw);
		const cosYaw = Math.cos(currentYaw);

		// Find unit vector of where the camera is facing
		const forwardVec = [
			cosPitch * sinYaw,
			Math.sin(currentPitch),
			cosPitch * cosYaw
		];

		// Find unit vector pointing right of the camera
		const rightVec = [
			cosYaw,
			0,
			-sinYaw
		];

		// upVec = forwardVec X rightVec
		const upVec = [
			forwardVec[1] * rightVec[2],
			cosPitch,
			-(forwardVec[1] * cosYaw)
		];

		// Create view matrix and set uniform
		gl.uniformMatrix4fv(viewMatrixUniformLocation, false,
			new Float32Array([
				rightVec[0], upVec[0], forwardVec[0], 0,
				rightVec[1], upVec[1], forwardVec[1], 0,
				rightVec[2], upVec[2], forwardVec[2], 0,
				V3.dot(camera.invPos, rightVec),
				V3.dot(camera.invPos, upVec),
				V3.dot(camera.invPos, forwardVec), 1
			])
		);

		// Clear the canvas
		gl.clear(gl.COLOR_BUFFER_BIT);
		// Draw scene elements
		gl.drawElementsInstanced(gl.TRIANGLES, 36, gl.UNSIGNED_BYTE, 0, 3);

		// Record end of frame time
		const endFrameTime = performance.now();
		// Use time difference between last two frames as approximation
		// of time difference between last frame and current frame
		const deltaTime = endFrameTime - prevEndFrameTime;
		prevEndFrameTime = endFrameTime;


		// Calculate state for next frame
		cubeRotationDelta = deltaTime * 0.001;

		// deltaPos is amount player moves by next frame
		const deltaPos = deltaTime * 0.007;

		const scaledForwardVec = V3.newScale(forwardVec, deltaPos);
		const scaledRightVec = V3.newScale(rightVec, deltaPos);

		if (keyPressed["KeyW"]) V3.subtract(camera.invPos, scaledForwardVec);
		if (keyPressed["KeyA"]) V3.add(camera.invPos, scaledRightVec);
		if (keyPressed["KeyS"]) V3.add(camera.invPos, scaledForwardVec);
		if (keyPressed["KeyD"]) V3.subtract(camera.invPos, scaledRightVec);
		if (keyPressed["Space"]) camera.invPos[1] -= deltaPos;
		if (keyPressed["ShiftLeft"]) camera.invPos[1] += deltaPos;


		// Request next frame
		requestAnimationFrame(nextFrame);
	}

	let prevEndFrameTime = performance.now();
	requestAnimationFrame(nextFrame);
}

main();
