WebGL is based on vector graphics (defining the shapes and their properties instead of labelling individual pixels with a certain color).
This project is a vector drawing program where the user can draw vector shapes using points, lines, and triangles of selectable (or random) colors. 
The program allows the user to select one of the WebGL drawing modes (points, lines, line strip, line loop, triangles, triangle strip, and triangle fan) and current vertex color which are used to add shapes to the canvas display.
The selection of the drawing mode is a drop-down menu while the vertex color uses 3 slider controls plus a button that causes a random color to be chosen.
Then the user can click inside the WebGL canvas to add vertices.
In modes that are not points nothing may show up during the first click or two which is fine since some shapes require a minimum number of points before they draw anything.
Whenever the drawing mode or color is changed all previously drawn shapes remain as-is and future clicks will draw with the new mode and color. 
The currently selected color is visually shown to the user in the top left of the WebGL canvas. 
Shapes use smooth shading, i.e. colors are interpolated between vertices.
It is assumed that at most 100,000 vertices will be drawn in the program at one time.