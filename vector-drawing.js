// Global WebGL context variable
let gl;

// Saves the amount of points and mode of each drawn object
// [[numPoints, mode], [numPoints, mode],...]
let savedObjects = [];

let verts = [];   // Global for vertex vectors
let colors = [];  // Global for color vectors
let	vertexBuffer; // Global for vertex buffer
let	colorBuffer;  // Global for color buffer
let mode; 	      // Global for current mode

// Global for the number of vertices
let numVerts = 3; // initialize to 3 since we start with a triangle

// Global for the number of vertices since last mode change
let numVertsSinceChange = 3; // initialize to 3 since we start with a triangle

// Once the document is fully loaded run this init function.
window.addEventListener('load', function init() {
	// Get the HTML5 canvas object from it's ID
	const canvas = document.getElementById('gl-canvas');

	// Get the WebGL context (save into a global variable)
	gl = WebGLUtils.create3DContext(canvas);
	if (!gl) {
		window.alert("WebGL isn't available");
		return;
	}

	// Configure WebGL
	// gl.viewport(0, 0, canvas.width, canvas.height);
	onResize(); // sets up the viewport so the above line isn't needed
	gl.clearColor(1.0, 1.0, 1.0, 0.0); // setup the background color with red, green, blue, and alpha

	// Compile Shaders:
	// Vertex Shader
	let vertShdr = compileShader(gl, gl.VERTEX_SHADER, `
		attribute vec4 vPosition;
		attribute vec4 vColor;
		varying vec4 fColor;
		void main() {
			gl_Position = vPosition;
			gl_PointSize = 5.0;
			fColor = vColor;
		}
	`);
	// Fragment Shader
	let fragShdr = compileShader(gl, gl.FRAGMENT_SHADER, `
		precision mediump float;
		varying vec4 fColor;
		void main() {
			gl_FragColor = fColor;
		}
	`);

	// Link the programs and use them with the WebGL context
	let program = linkProgram(gl, [vertShdr, fragShdr]);
	gl.useProgram(program);

	// Load the vertex data into the GPU and associate with shader
	vertexBuffer = gl.createBuffer(); // create the vertex buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer); // bind to the new buffer
	gl.bufferData(gl.ARRAY_BUFFER, sizeof.vec2 * 100000, gl.DYNAMIC_DRAW); // load empty buffer
	let vPosition = gl.getAttribLocation(program, 'vPosition'); // get the vertex shader attribute "vPosition"
	gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0); // associate the buffer with "vPosition" making sure it knows it is length-2 vectors of floats
	gl.enableVertexAttribArray(vPosition); // enable this set of data

	// Load the color data into the GPU and associate with shader
	colorBuffer = gl.createBuffer(); // create the color buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer); // bind to the new buffer
	//gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.DYNAMIC_DRAW); // load the flattened data into the buffer
	gl.bufferData(gl.ARRAY_BUFFER, sizeof.vec4 * 100000, gl.DYNAMIC_DRAW); // load the flattened data into the buffer
	//gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(colors));
	let vColor = gl.getAttribLocation(program, 'vColor'); // get the vertex shader attribute "vColor"
	gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0); // associate the buffer with "vColor" making sure it knows it is length-4 vectors of floats
	gl.enableVertexAttribArray(vColor); // enable this set of data

	// Add listeners
	canvas.addEventListener('click', onClick);
	window.addEventListener('resize', onResize);

	document.getElementById("redSlider").addEventListener("change", colorChanged);
	document.getElementById("greenSlider").addEventListener("change", colorChanged);
	document.getElementById("blueSlider").addEventListener("change", colorChanged);
	document.getElementById("drawingModes").addEventListener("change", modeChanged);
	document.getElementById("random").addEventListener("click", randomizeColor);
	document.getElementById("reset").addEventListener("click", resetCanvas);

	// Set the initial mode
	mode = gl.POINTS;

	// Add a triangle to show the current color
	let r = vec4(1,0,0,1); // red is our initial color
	savedObjects.push([3, gl.TRIANGLES]);
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer); // bind to the vertex buffer
	gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten([vec2(-1,1), vec2(-1, 0.9), vec2(-0.9, 1)]));
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer); // bind to the color buffer
	gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten([r, r, r]));

	// Render the initial red triangle
	render();
});

// Render the scene
function render() {
	gl.clear(gl.COLOR_BUFFER_BIT);

	// Draws the objects created in previous modes
	let numVertsProcessed = 0; // number of vertices processed
	for (let i = 0; i < savedObjects.length; i++) {
		let curObject = savedObjects[i]; // [numVertsInObject, mode]
		gl.drawArrays(curObject[1], numVertsProcessed, curObject[0]);
		numVertsProcessed += curObject[0];
	}

	// Loads the new vertices (and their corresponding colors) into the buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer); // bind to the vertex buffer
	gl.bufferSubData(gl.ARRAY_BUFFER, numVertsSinceChange*sizeof.vec2, flatten(verts));
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer); // bind to the color buffer
	gl.bufferSubData(gl.ARRAY_BUFFER, numVertsSinceChange*sizeof.vec4, flatten(colors));
	// Draws the latest object
	gl.drawArrays(mode, numVertsSinceChange, verts.length);
}

// Adds vertices to verts and the colors to colors and then attempts to render them
function onClick(evt) {
	let x = evt.clientX - this.getBoundingClientRect().left - this.clientLeft + this.scrollLeft;
	let y = evt.clientY - this.getBoundingClientRect().left - this.clientTop + this.scrollTop;
	x = 2*(x/this.width) - 1;   // Calculate WebGL coordinates
	y = 1 - 2*(y/this.height);  //
	numVerts++;
	verts.push(vec2(x, y));
	colors.push(getColor());
	render();
}

// Scales the canvas when the window changes size
function onResize() {
	let size = Math.min(window.innerWidth, window.innerHeight);
	gl.canvas.width = size;
	gl.canvas.height = size;
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}

// Saves the object of vertices and colors in the
// current mode before changing to the next mode
function modeChanged() {
	let numVertsInCurMode = numVerts - numVertsSinceChange;
	if (mode === gl.POINTS) {
		if (numVertsInCurMode > 0) {
			savedObjects.push([numVertsInCurMode, mode]);
		}
	} else if (mode === gl.LINES) {
		// makes the number of vertices even since each line is drawn with 2 points
		if (numVertsInCurMode % 2 !== 0) {
			numVerts--;   			 // removes the point that isn't used
			numVertsInCurMode--; // (if an extra point exists)
		}
		if (numVertsInCurMode > 1) {
			savedObjects.push([numVertsInCurMode, mode]);
		}
	} else if (mode === gl.LINE_STRIP || mode === gl.LINE_LOOP) {
		// lines require at least 2 vertices, but these modes use all vertices following the first 2
		if (numVertsInCurMode > 1) {
			savedObjects.push([numVertsInCurMode, mode]);
		} else if (numVertsInCurMode === 1) {
			numVerts--; // removes the point that isn't used
		}
	} else if (mode === gl.TRIANGLES) {
		// makes the number of vertices a multiple of 3 since each triangle needs 3 points
		while (numVertsInCurMode % 3 !== 0) {
			numVerts--;   			 // removes the point that isn't used
			numVertsInCurMode--; //
		}
		if (numVertsInCurMode > 2) {
			savedObjects.push([numVertsInCurMode, mode]);
		}
	} else if (mode === gl.TRIANGLE_STRIP || mode === gl.TRIANGLE_FAN) {
		if (numVertsInCurMode > 2) {
			savedObjects.push([numVertsInCurMode, mode]);
		} else {
			numVerts -= numVertsInCurMode; 		 // removes the unused point
		}
	}

	// changes to the new mode
	mode = parseInt(document.getElementById("drawingModes").value);

	verts = [];
	colors = [];
	numVertsSinceChange = numVerts; // saves number of vertices since the mode changed
}

function colorChanged() { // changes the current color and calls render
	resetCurrentColor()
	render();
}

function getColor() { // returns the current color
	let curColor = vec4(1,0,0,1);
	curColor[0] = document.getElementById("redSlider").value / 255.0;
	curColor[1] = document.getElementById("greenSlider").value / 255.0;
	curColor[2] = document.getElementById("blueSlider").value / 255.0;
	return curColor;
}

function resetCurrentColor() { // resets our triangle's color to the current color
	let curColor = getColor();
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer); // bind to the color buffer
	gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten([curColor, curColor, curColor]));
}

function randomizeColor() { // randomizes the current color and calls colorChanged
	document.getElementById("redSlider").value = Math.random() * 255;
	document.getElementById("greenSlider").value = Math.random() * 255;
	document.getElementById("blueSlider").value = Math.random() * 255;
	colorChanged();
}

function resetCanvas() {
	// Reset variables
	savedObjects = [];
	verts = [];
	colors = [];
	mode = gl.POINTS;
	numVerts = 3;
	numVertsSinceChange = 3;

	// Re-add our current color triangle
	savedObjects.push([3, gl.TRIANGLES]);

	// Reset mode selecter and color sliders
	document.getElementById("drawingModes").value = gl.POINTS;
	document.getElementById("redSlider").value = 255;
	document.getElementById("greenSlider").value = 0;
	document.getElementById("blueSlider").value = 0;

	// Resets the triangle's color, also calls render
	colorChanged();
}
