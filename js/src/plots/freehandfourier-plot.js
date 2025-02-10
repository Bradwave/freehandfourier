/**
 * Plots of a function.
 * @param {String} id ID/Key of the canvas.
 * @param {Array} options Options of the plot.
 * @returns Public APIs.
 */
let freehandfourierPlot = function (id, options) {

    /**
     * Public methods.
     */
    let publicAPIs = {};

    /**
     * Coordinate system.
     */
    let cs;

    /*_______________________________________
    |   Math
    */

    /**
     * Points of the polynomial/series path.
     */
    let path = [];

    /**
     * Coefficients.
     */
    let coefficients = [];

    /**
     * Number of coefficients.
     */
    let N = 0;

    /**
     * List of points of the Fourier transform argument.
     */
    let transformArgPath = [];

    /**
     * Points of the frequency spectrum.
     */
    let spectrum = [];

    /**
     * Current number of used frequency.
     */
    let usedFreq = 1;

    /**
     * Current winding frequency.
     */
    let analyzedFreq = 1;

    /**
     * Points of the polynomial/series path.
     */
    let dt = 2 * Math.PI / 1000;

    /**
     * Current time.
     */
    let time = 0;

    /*_______________________________________
    |   Drawing
    */

    /*_______________________________________
    |   Resizing variables
    */

    /**
     * Width of the plot.
     */
    let width;

    /**
     * Height of the plot.
     */
    let height;

    /*_______________________________________
    |   Plot of drawing
    */

    /**
     * Epicycles plot
     */
    let dPlot;

    /**
     * Contexts of the drawing plot.
     */
    let dCtx;

    /*_______________________________________
    |   Plot of epicycles
    */

    /**
     * Epicycles plot
     */
    let ePlot;

    /**
     * Contexts of the epicycles plot.
     */
    let eCtx;

    /*_______________________________________
    |   Plot of the Fourier transform argument
    */

    /**
     * Fourier transform argument plot
     */
    let fPlot;

    /**
     * Contexts of the Fourier transform argument plot.
     */
    let fCtx;

    /*_______________________________________
    |   Plot of spectrum
    */

    /**
     * Spectrum plot
     */
    let sPlot;

    /**
     * Contexts of the spectrum plot.
     */
    let sCtx;

    /*_______________________________________
    |   Plot of path
    */

    /**
     * Trigonometric polynomial path plot
     */
    let tPlot;

    /**
     * Contexts of the trigonometric polynomial path plot.
     */
    let tCtx;

    /*_______________________________________
    |   Plots of points
    */

    /**
     * Plot of points.
     */
    let pPlot;

    /**
     * Context of the points plot.
     */
    let pCtx;

    /*_______________________________________
    |   General variables
    */

    /**
     * True if the renderer is running, false otherwise.
     */
    let isRunning = true;

    /**
     * True if the vectors renderer is running, false otherwise.
     */
    let isEpicyclesRunning = true;

    /**
     * True if the plot is being translated along a certain axes, false otherwise.
     */
    let isTranslating = { x: false, y: false };

    /**
     * True if touch on the canvas started, false otherwise.
     */
    let isPointerDown = false;

    /**
     * Mouse or touch position in screen coordinates (x, y).
     */
    let touchPosition;

    /**
     * Current zoom factor.
     */
    let currentZoom = 1;

    /**
     * True while zooming or de-zooming, false otherwise.
     */
    let isZooming = false;

    /**
     * True if the grid is visible, false otherwise.
     */
    let isGridVisible = true;

    /**
     * True if the epicycles are visible, false otherwise.
     */
    let isEpicyclesVisible = true;

    /**
     * True if the drawing is visible, false otherwise.
     */
    let isDrawingVisible = true;

    /**
     * True if the the center of the canvas follows the path point, false otherwise.
     */
    let isFollowing = false;

    /**
     * True if the plot is full screen, false otherwise.
     */
    let isFullscreen = false;

    /**
     * True if the user is drawing, false otherwise.
     */
    let isDrawing = false;

    /**
     * True if the spectrum mode is active, false otherwise.
     */
    let isSpectrumModeActive = false;

    /**
     * True if drawing mode is active.
     */
    let isDrawingModeActive = false;

    /*_______________________________________
    |   Parameters
    */

    let params = [];

    /*_______________________________________
    |   Drawing
    */

    /**
     * List of points of the drawing.
     */
    let drawingPoints = [];

    /**
     * List of points of the previous drawing.
     */
    let cachedDrawingPoints = [];

    /**
     * Brush radius used for smoothing.
     */
    const brushRadius = 10;

    /**
     * Brush center.
     */
    let brushCenter;

    /**
     * Cursor position during drawing.
     */
    let drawingCursor;

    /*_______________________________________
    |   Math methods
    */

    /**
     * Computes the Fourier coefficients after a drawing is completed
     */
    function computeCoefficients() {
        // Converts the points of the drawing into complex numbers
        const complexPoints = [];
        drawingPoints.forEach((p, i) => {
            complexPoints[i] = new ComplexNumber(p.x, p.y)
        });

        // The Fourier coefficients are computed using a DFT
        coefficients = analysisTools.dft(complexPoints);

        // The number of coefficients is stored
        N = coefficients.length;
        // The time increase is computed
        dt = (2 * Math.PI) / N;
        // Updates the number of frequencies in use, based on the corresponding slider value
        updateUsedFreq();
        // Computes the spectrum points before reordering the coefficients
        computeSpectrum();

        // The coefficients are reordered
        for (let k = 1; k < N / 2; k++) {
            coefficients[k + N / 2] =
                [coefficients[k], coefficients[k] = coefficients[k + N / 2]][0];
        }
    }

    /**
     * Computes the trigonometric polynomial path.
     */
    function computePath() {
        path = [];

        // The trigonometric polynomial path is computed based on the number of frequency is use
        for (let t = 0; t < 2 * Math.PI; t += dt) {
            let x = 0;
            let y = 0;

            for (let n = 0; n < N - 1; n++) {
                const freq = coefficients[n].freq;
                if (freq < usedFreq + 1 || freq > N - usedFreq - 1) {
                    const radius = coefficients[n].amp;
                    const phase = coefficients[n].phase;

                    x += radius * Math.cos(freq * t + phase);
                    y += radius * Math.sin(freq * t + phase);
                }
            }

            path.push({ x: x, y: y });
        }
    }

    /**
     * Computes the points of the Fourier transform argument.
     */
    function computeTransformArgPath() {
        // Updates the analyzed frequency based on the slider value
        updateAnalyzedFreq();

        transformArgPath = [];

        // Computes the Fourier transform argument
        for (let k = 0; k < N; k++) {
            const drawingX = drawingPoints[k].x;
            const drawingY = drawingPoints[k].y;
            const expX = Math.cos(- 2 * Math.PI * analyzedFreq * k / N);
            const expY = Math.sin(- 2 * Math.PI * analyzedFreq * k / N);

            const x = drawingX * expX - drawingY * expY;
            const y = drawingX * expY + drawingY * expX;

            transformArgPath.push({ x: x, y: y });
        }
    }

    /**
     * Computes the frequency spectrum points.
     */
    function computeSpectrum() {
        spectrum = [];

        for (let k = 0; k < N; k++) {
            spectrum.push({
                x: coefficients[k].re, y: coefficients[k].im
            });
        }
    }

    /*_______________________________________
    |   Methods
    */

    /**
     * Inits the plot.
     */
    function init() {
        // Sets default parameters
        if (options.parameters == undefined) options.parameters = [];
        if (options.labelSize == undefined) options.labelSize = 15;
        if (options.drawingColor == undefined) options.drawingColor = "#69d686";
        if (options.drawingWidth == undefined) options.drawingWidth = 2;
        if (options.vectorWidth == undefined) options.vectorWidth = 5;
        if (options.arrowSize == undefined) options.arrowSize = 10;
        if (options.epicycleWidth == undefined) options.epicycleWidth = 2;
        if (options.pathColor == undefined) options.pathColor = "#888888";
        if (options.pathActiveColor == undefined) options.pathActiveColor = "#444444";
        if (options.pathWidth == undefined) options.pathWidth = 6;
        if (options.transformColor == undefined) options.transformColor = "#d742f5";
        if (options.transformWidth == undefined) options.transformWidth = 2;
        if (options.spectrumColor == undefined) options.spectrumColor = "#d742f5";
        if (options.inactiveSpectrumColor == undefined) options.inactiveSpectrumColor = "#888888";
        if (options.spectrumLineWidth == undefined) options.spectrumLineWidth = 1;
        if (options.spectrumPointSize == undefined) options.spectrumPointSize = 5;
        if (options.backgroundColor == undefined) options.backgroundColor = "#ffffff";
        if (options.geometricAidColor == undefined) options.geometricAidColor = "#222222";
        if (options.geometricAidWidth == undefined) options.geometricAidWidth = 2;
        if (options.axisColor == undefined) options.axisColor = "#3c3c3c";
        if (options.gridColor == undefined) options.gridColor = "#777777";
        if (options.gridLineWidth == undefined) options.gridLineWidth = 1;
        if (options.secondaryGridColor == undefined) options.secondaryGridColor = "#7777776e";
        if (options.secondaryGridLineWidth == undefined) options.secondaryGridLineWidth = 1
        if (options.isGridVisible == undefined) options.isGridVisible = true;
        if (options.isGridToggleActive == undefined) options.isGridToggleActive = true;
        if (options.isRefreshActive == undefined) options.isRefreshActive = true;
        if (options.isTranslationActive == undefined) options.isTranslationActive = true;
        if (options.isZoomActive == undefined) options.isZoomActive = true;
        if (options.isFullscreenToggleActive == undefined) options.isFullscreenToggleActive = true;

        // Sets the grid visibility
        isGridVisible = options.isGridVisible;

        // Creates the drawing plot
        dPlot = new plotStructure("drawing-" + id, { alpha: true });
        dCtx = dPlot.getCtx();

        // Creates the epicycles plot
        ePlot = new plotStructure("epicycles-" + id, { alpha: true });
        eCtx = ePlot.getCtx();

        // Creates the Fourier transform argument plot
        fPlot = new plotStructure("transform-path-" + id, { alpha: true });
        fCtx = fPlot.getCtx();

        // Creates the spectrum plot
        sPlot = new plotStructure("spectrum-" + id, { alpha: true });
        sCtx = sPlot.getCtx();

        // Creates the path plot
        tPlot = new plotStructure("path-" + id, { alpha: true });
        tCtx = tPlot.getCtx();

        // Sets the initial value of the parameters
        options.parameters.forEach((p, i) => {
            // Gets the starting value of the parameter from the corresponding input slider
            params[p.id] = parseFloat(document.getElementById(id + "-param-" + p.id).value);
        });

        // Creates the plot
        pPlot = new plotStructure("points" + "-" + id, { alpha: true });
        pCtx = pPlot.getCtx();

        // Updates width and heigh of the canvas
        updateCanvasDimension();

        cs = new CoordinateSystem(width, height,
            { x: options.viewportCenter.x, y: options.viewportCenter.y }, options.initialPixelsPerUnit);

        addEventListeners();
    }

    /*_______________________________________
    |   Canvas and canvas dimension
    */

    const axisPlot = new plotStructure(id, { alpha: true });
    const axisCtx = axisPlot.getCtx();

    /**
     * Updates width and heigh of the canvas.
     */
    function updateCanvasDimension() {
        // Resizes the axis/grid canvas
        axisPlot.resizeCanvas();
        // Resizes the drawing canvas
        dPlot.resizeCanvas();
        // Resizes the epicycles canvas
        ePlot.resizeCanvas();
        // Resizes the Fourier Transform argument canvas
        fPlot.resizeCanvas();
        // Resizes the spectrum canvas
        sPlot.resizeCanvas();
        // Resizes the path canvas
        tPlot.resizeCanvas();
        // Resizes the points canvas
        pPlot.resizeCanvas();
        // Stores the new dimensions
        width = Math.ceil(axisPlot.getWidth());
        height = Math.ceil(axisPlot.getHeight());
    }


    /**
     * Resizes the canvas to fill the HTML canvas element.
     */
    publicAPIs.resizeCanvas = () => {
        // Updates width and heigh of the canvas
        updateCanvasDimension();
        // Updates the edges of the canvas in the coordinate system
        cs.updateSystem(width, height);
    }

    /*_______________________________________
    |   Events and controls
    */

    function addEventListeners() {

        // Executes when the play/pause button is pressed
        document.getElementById("play-button").onclick = () => {
            toggleAnimation(!isEpicyclesRunning);
        }

        /**
         * Plays or pauses the animation
         * @param {Boolean} isRunning True if the animation must play, false if it must stop
         */
        function toggleAnimation(isRunning) {
            isEpicyclesRunning = isRunning;

            // Changes the icon of the play/pause button
            document.getElementById("play-icon").innerText = isEpicyclesRunning ? "pause" : "play_arrow";

            if (isEpicyclesRunning) animateEpicycles();
        }

        let skipInterval;

        // Executes when the next button is pressed
        document.getElementById("next-button").onpointerdown = () => {
            // Pauses animation if necessary
            isEpicyclesRunning = false;
            if (!isEpicyclesRunning) toggleAnimation(false);

            clearInterval(skipInterval)
            skipInterval = setInterval(function () {
                skipNext();
            }, 50);
        }

        // Executes when the play/pause button is released
        document.getElementById("next-button").onpointerup = () => {
            clearInterval(skipInterval);
        }

        /**
         * Skips to next frame.
         */
        function skipNext() {
            // Computes next time
            time = (time + dt) % (2 * Math.PI);

            generateFrame();
        }

        // Executes when the previous button is pressed
        document.getElementById("previous-button").onpointerdown = () => {
            // Pauses animation if necessary
            isEpicyclesRunning = false;
            if (!isEpicyclesRunning) toggleAnimation(false);

            clearInterval(skipInterval)
            skipInterval = setInterval(function () {
                skipPrev();
            }, 50);
        }

        // Executes when the play/pause button is released
        document.getElementById("previous-button").onpointerup = () => {
            clearInterval(skipInterval);
        }

        /**
         * Skips to previous frame.
         */
        function skipPrev() {
            // Computes previous time
            const newTime = time - dt;
            time = newTime < 0 ? 2 * Math.PI + newTime : newTime;

            generateFrame();
        }

        // The drawing button activates and disables the drawing mode on click
        document.getElementById("drawing-button").onclick = () => {
            isDrawingModeActive = !isDrawingModeActive;

            // Changes the icon of the play/pause button
            if (isDrawingModeActive) document.getElementById("drawing-button").classList.add("active");
            else document.getElementById("drawing-button").classList.remove("active");
        }

        /**
         * Ture if the epicycles were animated before the spectrum mode was activated
         */
        let wasEpicyclesRunningBeforeSpectrum = true;

        document.getElementById("fourier-transform-button").onclick = () => {
            isSpectrumModeActive = !isSpectrumModeActive;

            // Changes the icon of the spectrum mode
            document.getElementById("fourier-transform-icon").innerText =
                isSpectrumModeActive ? "function" : "functions";

            // Changes the icon of the play/pause button
            if (isSpectrumModeActive) {
                // Styles the buttons and activates/disables the slider accordingly
                document.getElementById("fourier-transform-button").classList.add("active");
                disableButtons(["play-button", "previous-button", "next-button"]);
                toggleSlider("N", true);
                toggleSlider("n", false);

                // Stores the epicycles animation status to restart it later if necessary
                wasEpicyclesRunningBeforeSpectrum = isEpicyclesRunning;
                if (isEpicyclesRunning) toggleAnimation(false);

                // Stops the path following feature
                disableFollowing();
            } else {
                // Styles the buttons and activates/disables the slider accordingly
                document.getElementById("fourier-transform-button").classList.remove("active");
                activateButtons(["play-button", "previous-button", "next-button"]);
                toggleSlider("N", false);
                toggleSlider("n", true);

                // Plays the epicycles animation if it was playing before the spectrum mode was activated
                isEpicyclesRunning = wasEpicyclesRunningBeforeSpectrum;
                if (isEpicyclesRunning) toggleAnimation(true);
            }

            // Redraws everything aside from the coordinate system
            redrawScene();
        }

        /**
         * Activates or disables a slider.
         * @param {String} sliderId ID of the slider.
         * @param {Boolean} isSliderActive True if the slider is active, false otherwise.
         */
        function toggleSlider(sliderId, isSliderActive) {
            document.getElementById(id + "-param-" + sliderId).disabled = isSliderActive;
            // Makes the slider transparent or opaque
            if (isSliderActive) document.getElementById(id + "-param-" + sliderId + "-group").classList.add("transparent");
            else document.getElementById(id + "-param-" + sliderId + "-group").classList.remove("transparent");
        }

        let drawingIndex = 0;

        // Draws the Mole Antonelliana
        document.getElementById("mole-button").onclick = () => {
            // Clears the previous drawing
            drawingPoints = [];
            // Computes the points
            const bezierPoints = new PolyBezier(drawingCoordinates[drawingIndex++ % drawingCoordinates.length]);
            drawingPoints = bezierPoints.samplePoints(10).map((point) => {
                return {
                    x: point.re,
                    y: point.im
                }
            });
            // Does the math (coefficients, spectrum, path, transform argument)
            computeStuffAfterDrawing();
            // Redraws everything aside from the coordinate system
            redrawScene();
        }

        // Pointers cache
        const eventsCache = [];
        // Difference between two touches
        let previousDiff = -1;

        /**
         * Removes the pointer from the cache and reset the target's.
         * @param {Event} e Pointer event.
         */
        function removePointerFromCache(e) {
            const index = eventsCache.findIndex(
                (cachedEvent) => cachedEvent.pointerId === e.pointerId,
            );
            eventsCache.splice(index, 1);
        }

        // List of buttons that need to be disabled or activated during drawing
        const plotButtonIds = [
            id + "-plot-zoom-out",
            id + "-plot-zoom-in",
            id + "-plot-refresh",
            id + "-plot-toggle-fullscreen"
        ];

        // True if the epicycles were running prior to drawing
        let wasEpicyclesRunningBeforeDrawing = true;

        /**
         * Must be called when the drawing starts.
         * @param {Event} e Pointer event
         */
        function startDrawing(e) {
            isDrawing = true;
            // Buttons are disabled
            disableButtons(plotButtonIds);
            // Stores if the epicycles is currently running
            wasEpicyclesRunningBeforeDrawing = isEpicyclesRunning;
            // The epicycles are stopped if necessary
            if (isEpicyclesRunning) toggleAnimation(false);

            // The position of the brush center is set to the cursor position
            brushCenter = { x: e.clientX, y: e.clientY };
            // The previous drawing is cached and cleared
            cachedDrawingPoints = [];
            cachedDrawingPoints = drawingPoints.map((point) => point);
            drawingPoints = [];

            // Redraws everything aside from the coordinate system
            redrawScene();
        }

        /**
         * Must be called when the drawing stops.
         */
        function endDrawing() {
            isDrawing = false;
            // Buttons are re-activated
            activateButtons(plotButtonIds);
            // Starts the epicycles animation if it was running prior to drawing
            if (wasEpicyclesRunningBeforeDrawing) toggleAnimation(true);

            const numOfPoints = drawingPoints.length;

            // Checks if there's more than one point
            if (numOfPoints > 1) {
                // The average distance between 
                let distanceSum = 0;
                for (let i = 1; i < numOfPoints; i++) {
                    distanceSum += Math.sqrt(
                        (drawingPoints[i].x - drawingPoints[i - 1].x) ** 2 +
                        (drawingPoints[i].y - drawingPoints[i - 1].y) ** 2
                    );
                }
                const averageDistance = distanceSum / (numOfPoints - 1);

                // The distance between the first and last point of the drawing is computed
                const xDistance = (drawingPoints[numOfPoints - 1].x - drawingPoints[0].x);
                const yDistance = (drawingPoints[numOfPoints - 1].y - drawingPoints[0].y);
                const startEndDistance = Math.sqrt(xDistance ** 2 + yDistance ** 2);

                // THe number of points that need to be added is computed
                let numOfAddedPoints = Math.round(startEndDistance / averageDistance) - 1;
                // It makes sure there's an even number of points in the end
                if ((numOfPoints + numOfAddedPoints) % 2 != 0) numOfAddedPoints++;

                // The distance between added points is computed
                const addedDistance = startEndDistance / (numOfAddedPoints + 1);

                // The path is completed with a straight line of equally spaced points
                for (let i = 0; i < numOfAddedPoints; i++) {
                    drawingPoints.push({
                        x: drawingPoints[drawingPoints.length - 1].x - (xDistance / startEndDistance) * addedDistance,
                        y: drawingPoints[drawingPoints.length - 1].y - (yDistance / startEndDistance) * addedDistance
                    });
                }
            } else {
                // The previous drawing is restored if the current one is a single point
                drawingPoints = cachedDrawingPoints.map((point) => point)
            }

            // Does the math (coefficients, spectrum, path, transform argument)
            computeStuffAfterDrawing();
            // Redraws everything aside from the coordinate system
            redrawScene();
        }

        /**
         * As the name suggests, it computes stuff when the drawing is complete.
         */
        function computeStuffAfterDrawing() {
            // The previous drawing is cleared is cleared and the new one plotted
            clearDrawing();
            drawDrawing();

            // The coefficients and the path are computed
            computeCoefficients();
            computePath();
            // Computes the transform argument path and the spectrum path
            computeTransformArgPath();

            // Resets time
            time = 0;
        }

        /**
         * Must be called when the cursor moves and the drawing is ongoing.
         * @param {Event} e Pointer event.
         */
        function freehandDrawing(e) {
            // The mouse or touch position is stored
            drawingCursor = { x: e.clientX, y: e.clientY };

            // The distance from the cursor and the brush center is computed
            const brushDistance = Math.sqrt((drawingCursor.x - brushCenter.x) ** 2 + (drawingCursor.y - brushCenter.y) ** 2);
            // If the distance between the cursor and the brush center exceeds the brush radius, the brush radius is moved
            if (brushDistance > brushRadius) {
                const xInc = (drawingCursor.x - brushCenter.x) * (1 - brushRadius / brushDistance);
                const yInc = (drawingCursor.y - brushCenter.y) * (1 - brushRadius / brushDistance);
                brushCenter = { x: brushCenter.x + .2 * xInc, y: brushCenter.y + .2 * yInc };
            }

            // The brush center is converted in cartesian coordinates
            const rect = document.getElementById(id + "-plot").getBoundingClientRect();
            const drawingX = cs.toCartesianX(toBoundingX(brushCenter.x, rect));
            const drawingY = cs.toCartesianY(toBoundingY(brushCenter.y, rect));

            // The point is added to the drawing list of points
            drawingPoints.push({ x: drawingX, y: drawingY });

            // The drawing is cleared and re-drawn
            clearDrawing();
            drawDrawing();
            // The brush is drawn
            drawBrush();
        }

        /* -- Axis translation and drawing -- */

        // Executes when a mouse button si pressed the canvas
        document.getElementById(id + "-plot").onpointerdown = (e) => {
            // For touch pointers, caches the event
            if (e.pointerType == 'touch') eventsCache.push(e);
            // Checks if the drawing mode is active
            if (isDrawingModeActive && eventsCache.length < 2) {
                startDrawing(e);
            } else if (e.pointerType == 'touch' && isDrawing) {
                endDrawing();
                removePointerFromCache(e);
            } else if (eventsCache.length < 2) {
                isPointerDown = true;
                // The mouse or touch position is stored
                touchPosition = { x: e.clientX * dpi, y: e.clientY * dpi };
            }
            // If there are more than two touches
            if (e.pointerType == 'touch' && eventsCache.length > 2) {
                removePointerFromCache(e);
            }
        }

        // Executes when a mouse button is released on the whole document
        document.onpointerup = (e) => {
            // Not mouse pointer or mouse pointer with left button
            if (e.pointerType == 'touch') {
                // Remove this pointer from the cache and reset the target's
                removePointerFromCache(e);

                // If the number of pointers down is less than two then reset diff tracker
                if (isZooming && eventsCache.length < 2) {
                    prevDiff = -1;
                    // Not zooming anymore
                    isZooming = false;
                    // Stores the remaining touch position
                    touchPosition = { x: eventsCache[0].clientX * dpi, y: eventsCache[0].clientY * dpi };
                }
            }
            // Checks if a drawing is ongoing or if a touch pointer is still down
            if (isDrawing) endDrawing();
            else if (eventsCache.length > 0) isPointerDown = true;
            else isPointerDown = false;
        }

        // // Executes when the mouse is moved
        // document.getElementById(id + "-plot").ontouchmove = (e) => {
        //     if (!isDrawing && !isDrawing) {
        //         // Stores the current touch position
        //         const newTouchPosition = getTouchPosition(e);
        //         // Translates the axis
        //         translateAxis(newTouchPosition);
        //     }
        // }

        // Executes when the mouse pointer moves
        document.onpointermove = (e) => {
            // Checks if a drawing is ongoing
            if (isDrawing && eventsCache.length < 2) {
                freehandDrawing(e);
            } else if (isDrawing && eventsCache.length > 0) {
                removePointerFromCache(e);
            } else if (!isZooming && isPointerDown) {
                // Stores the current mouse position
                const newTouchPosition = { x: e.clientX * dpi, y: e.clientY * dpi }
                // Translates the axis
                translateAxis(newTouchPosition);
            }
        }

        // Executes when the pointer event is cancelled
        document.onpointercancel = () => {
            isPointerDown = false;
        }

        /**
         * Store the latest touch position.
         * @param {*} e Event
         * @returns The current touch position.
         */
        const getTouchPosition = (e) => {
            // e.preventDefault();
            // Stores the touches
            let touches = e.changedTouches;
            return {
                x: touches[0].pageX * dpi,
                y: touches[0].pageY * dpi
            }
        }

        /* -- Zoom -- */

        // Executes when the zoom-in button is pressed
        document.getElementById(id + "-plot-zoom-in").onclick = () => {
            // Checks if a drawing is ongoing
            isRunning = true;
            // Stores current zoom as 1
            currentZoom = 1;
            // Sets the zoom increment factor
            const zoomInc = 1.05;
            // Sets the maximum zoom, compared to current (which is set to 1)
            const maxZoom = 2;
            // Animates the zoom-in
            animate(() => {
                zoomViewport(zoomInc, maxZoom, () => { return currentZoom > maxZoom / zoomInc });
            });
        }

        // Executes when the zoom-out button is pressed
        document.getElementById(id + "-plot-zoom-out").onclick = () => {
            // Checks if a drawing is ongoing
            isRunning = true;
            // Stores current zoom as 1
            currentZoom = 1;
            // Sets the zoom increment factor
            const zoomInc = 1.05;
            // Sets the minimum zoom, compared to current (which is set to 1)
            const minZoom = 1 / 2;
            // Animates the zoom-out
            animate(() => {
                zoomViewport(1 / zoomInc, minZoom, () => { return currentZoom < minZoom * zoomInc });
            });
        }

        // Executes when the mouse wheel is scrolled
        axisPlot.getCanvas().addEventListener("wheel", (e) => {
            // Checks if a drawing is ongoing
            if (!isDrawing) {
                // Stops running animations
                isRunning = false;

                // Prevents page scrolling
                e.preventDefault();

                // Bounding client rectangle
                const rect = e.target.getBoundingClientRect();
                // x position within the canvas
                const zoomX = (e.clientX - rect.left) * dpi;
                // y position within the canvas
                const zoomY = (e.clientY - rect.top) * dpi;

                // Updates the zoom level
                cs.updateZoom(Math.exp(-e.deltaY / 1000), { x: zoomX, y: zoomY });
                // Draws the plot
                publicAPIs.drawPlot();
            }
            // "passive: false" allows preventDefault() to be called
        }, { passive: false });

        /* -- Translating, drawing and zoom -- */

        // Executes when the touch pointer moves
        document.getElementById(id + "-plot").onpointermove = (e) => {
            // Checks if a drawing is ongoing
            if (!isDrawing && e.pointerType == 'touch') {
                // Caches the event
                const index = eventsCache.findIndex(
                    (cachedEvent) => cachedEvent.pointerId === e.pointerId,
                );
                eventsCache[index] = e;

                // If two pointers are down, check for pinch gestures
                if (eventsCache.length === 2) {
                    isZooming = true;
                    // Calculate the distance between the two pointers
                    const currentDiff = Math.sqrt(
                        (eventsCache[0].clientX * dpi - eventsCache[1].clientX * dpi) ** 2 +
                        (eventsCache[0].clientY * dpi - eventsCache[1].clientY * dpi) ** 2);

                    // Bounding client rectangle
                    const rect = e.target.getBoundingClientRect();
                    // x position of the zoom center
                    const zoomX = (.5 * (eventsCache[0].clientX + eventsCache[1].clientX) - rect.left) * dpi;
                    // y position of the zoom center
                    const zoomY = (.5 * (eventsCache[0].clientY + eventsCache[1].clientY) - rect.top) * dpi;

                    if (previousDiff > 0) {
                        // The distance between the two pointers has increased
                        if (currentDiff > previousDiff) {
                            // Updates the zoom level
                            cs.updateZoom(1.03, { x: zoomX, y: zoomY });
                        }
                        // The distance between the two pointers has decreased
                        if (currentDiff < previousDiff) {
                            cs.updateZoom(0.97, { x: zoomX, y: zoomY });
                        }
                        // Draws the plot
                        publicAPIs.drawPlot();
                    }

                    // Cache the distance for the next move event
                    previousDiff = currentDiff;
                }
            }
        }

        /* -- Grid -- */

        if (options.isGridToggleActive) {
            // Executes when the grid button is pressed
            document.getElementById(id + "-plot-toggle-grid").onclick = () => {
                // Checks if a drawing is ongoing
                isGridVisible = !isGridVisible;
                // Styles the button
                if (isGridVisible) document.getElementById(id + "-plot-toggle-grid").classList.remove("transparent");
                else document.getElementById(id + "-plot-toggle-grid").classList.add("transparent");
                // Draws the plot
                publicAPIs.drawPlot();
            }
        }

        /* -- Epicycles -- */

        document.getElementById(id + "-plot-toggle-epicycles").onclick = () => {
            isEpicyclesVisible = !isEpicyclesVisible;
            // Styles the button
            if (isEpicyclesVisible) document.getElementById(id + "-plot-toggle-epicycles").classList.remove("transparent");
            else document.getElementById(id + "-plot-toggle-epicycles").classList.add("transparent");
            // Draws the plot
            publicAPIs.drawPlot();
        }

        /* -- Drawing -- */

        document.getElementById(id + "-plot-toggle-drawing").onclick = () => {
            // Checks if a drawing is ongoing
            isDrawingVisible = !isDrawingVisible;
            // Styles the button
            if (isDrawingVisible) document.getElementById(id + "-plot-toggle-drawing").classList.remove("transparent");
            else document.getElementById(id + "-plot-toggle-drawing").classList.add("transparent");
            // Draws the plot
            publicAPIs.drawPlot();
        }

        document.getElementById(id + "-plot-toggle-follow").onclick = () => {
            // Checks if a drawing is ongoing
            if (N > 0) {
                isFollowing = !isFollowing;
                // Styles the button
                if (isFollowing) {
                    isRunning = true;
                    document.getElementById(id + "-plot-toggle-follow").classList.remove("transparent");
                    document.getElementById(id + "-plot-toggle-follow").classList.add("active");
                } else {
                    isRunning = false;
                    document.getElementById(id + "-plot-toggle-follow").classList.add("transparent");
                    document.getElementById(id + "-plot-toggle-follow").classList.remove("active");
                }
            }
        }

        /* -- Refresh -- */

        if (options.isRefreshActive) {
            // Executes when the refresh button is pressed
            document.getElementById(id + "-plot-refresh").onclick = () => {
                // Checks if a drawing is ongoing
                isRunning = true;

                /* -- Zoom setup -- */

                // Stores current zoom level as 1
                currentZoom = 1;
                // Computes the end zoom level, compared to current (which is set to 1)
                const endZoom = options.initialPixelsPerUnit / cs.pixelsPerUnit;
                // Sets the zoom increment factor
                const zoomInc = 1.05;
                // Zoom needs to be performed by default (not locked)
                let isZoomLocked = false;

                /* -- Translation setup -- */

                // The translation is performed by default
                isTranslating = { x: true, y: true };

                /* -- Animation -- */

                animate(() => {
                    // Animates the zoom-in or zoom-out
                    zoomViewport(endZoom > 1 ? zoomInc : (1 / zoomInc), endZoom,
                        () => {
                            if (endZoom > 1) return currentZoom > endZoom / zoomInc;
                            else return currentZoom <= endZoom * zoomInc
                        }, cs.toScreen(0, 0), isZoomLocked);

                    // If the zoom animation is stopped, the zoom is locked
                    // The value of "running" could change depending on the translation animation
                    if (!isRunning) {
                        isZoomLocked = true;
                    }

                    // Animates the translation
                    autoTranslate(options.viewportCenter, 0.05);

                    // The animation keeps running until both the zoom and the translation stop
                    isRunning = !isRunning || isTranslating.x || isTranslating.y;
                });
            }
        }

        /* -- Fullscreen -- */

        if (options.isFullscreenToggleActive) {
            // Executes when the fullscreen button is pressed
            document.getElementById(id + "-plot-toggle-fullscreen").onclick = () => {
                // Checks if a drawing is ongoing
                if (!isDrawing) {
                    // Changes the fullscreen status
                    isFullscreen = !isFullscreen;

                    // Changes the icon
                    document.getElementById(id + "-plot-toggle-fullscreen-icon").innerText =
                        isFullscreen ? "fullscreen_exit" : "fullscreen";

                    // Stores the fullscreen and original container
                    let fullscreenContainer = document.getElementById("fullscreen-container");
                    let fullscreenSlidersContainer = document.getElementById("fullscreen-sliders-container");
                    let originalPlotContainer = document.getElementById(id + "-plot-container");
                    let originalSlidersContainer = document.getElementById(id + "-plot-sliders-container");

                    // Sets the body opacity to zero
                    document.body.classList.add("transparent");

                    // Executes after the body opacity is lowered
                    setTimeout(() => {
                        if (isFullscreen) {
                            // Makes the container for fullscreen content visible
                            fullscreenContainer.classList.add("visible");
                            fullscreenSlidersContainer.classList.add("visible")
                            // Hides the scrollbar
                            document.body.classList.add("hidden-overflow");
                            // Moves the plot into the full screen container
                            moveHTML(originalPlotContainer, fullscreenContainer);
                            // Moves the slider panel into the full screen container
                            moveHTML(originalSlidersContainer, fullscreenSlidersContainer);
                            // Styles the plot as fullscreen
                            document.getElementById(id + "-plot").classList.add("fullscreen");
                            // Makes the plot canvas borders squared
                            document.getElementById(id + "-canvas").classList.add("squared-border");
                            // Moves the sliders panel in the top-left corner
                            document.getElementById(id + "-plot-sliders-panel").classList.add("fullscreen");
                        } else {
                            // Hides the container for fullscreen content
                            fullscreenContainer.classList.remove("visible");
                            fullscreenSlidersContainer.classList.remove("visible");
                            // Displays the scrollbar
                            document.body.classList.remove("hidden-overflow");
                            // Moves the plot into its original container
                            moveHTML(fullscreenContainer, originalPlotContainer)
                            // Moves the sliders back where they belong
                            moveHTML(fullscreenSlidersContainer, originalSlidersContainer);
                            // Removes the fullscreen class and style
                            document.getElementById(id + "-plot").classList.remove("fullscreen");
                            // Makes the plot canvas borders rounded
                            document.getElementById(id + "-canvas").classList.remove("squared-border")
                            // Moves back the sliders panel where it was before
                            document.getElementById(id + "-plot-sliders-panel").classList.remove("fullscreen");
                        }

                        // Changes the border radius of the vectors and geometric aid canvases
                        if (isFullscreen) {
                            dPlot.getCanvas().classList.add("squared-border");
                            ePlot.getCanvas().classList.add("squared-border");
                            fPlot.getCanvas().classList.add("squared-border");
                            sPlot.getCanvas().classList.add("squared-border");
                            tPlot.getCanvas().classList.add("squared-border");
                            pPlot.getCanvas().classList.add("squared-border");
                        } else {
                            dPlot.getCanvas().classList.remove("squared-border");
                            ePlot.getCanvas().classList.remove("squared-border");
                            fPlot.getCanvas().classList.add("squared-border");
                            sPlot.getCanvas().classList.add("squared-border");
                            tPlot.getCanvas().classList.add("squared-border");
                            pPlot.getCanvas().classList.remove("squared-border");
                        }

                        // Resizes the canvas
                        publicAPIs.resizeCanvas();
                        // Draws the plot
                        publicAPIs.drawPlot();
                    }, 200);

                    // After the transition between fullscreen and non-fullscreen (or viceversa) is completed...
                    setTimeout(() => {
                        // ...resets the body opacity
                        document.body.classList.remove("transparent");
                    }, 300);
                }
            }
        }

        /* -- Parameters -- */

        // Executes when the number of used frequency input changes
        document.getElementById(id + "-param-N").oninput = () => {
            // Updates the number of frequency that need be used
            updateUsedFreq();
            // Computes absolute values of series vectors
            computePath();
            // Clears everything and redraws the scene
            redrawScene();
        }

        // Executes when the frequency input changes
        document.getElementById(id + "-param-n").oninput = () => {
            // Updates the analyzed frequency
            updateAnalyzedFreq();
            // Computes the transform argument path
            computeTransformArgPath();
            // Clears everything and redraws the scene
            redrawScene();
        }
    }

    /* -- Utils -- */

    /**
     * Translates the axis according to the latest touch/mouse position and the starting touch/mouse position.
     * @param {Object} newTouchPosition The latest touch/mouse position (x, y);
     */
    function translateAxis(newTouchPosition) {
        // Computes the variation in touches
        const deltaX = newTouchPosition.x - touchPosition.x;
        const deltaY = newTouchPosition.y - touchPosition.y;
        // Disables the following feature (when active) if the the delta is greater than a certain value
        if (isFollowing && deltaX ** 2 + deltaY ** 2 > 500) disableFollowing();
        // Translates the origin, if the following feature isn't active anymore
        if (!isFollowing) cs.translateOrigin(deltaX, deltaY);
        // Updates the touch position
        touchPosition = newTouchPosition;
        // Draws the updated plot
        publicAPIs.drawPlot();
    }

    /**
  * Performs a step in the auto translation animation to center a given point.
  * @param {Object} endingPoint Ending point which needs to moved in the middle of the screen.
  * @param {*} translationFactor Translation factor.
  */
    function autoTranslate(endingPoint, translationFactor) {
        // Screen center in cartesian coordinates
        const screenCenterInCartesian = cs.toCartesian(width / 2, height / 2);
        // Total translation vector from current point to ending point, measured in pixels
        const totalTranslation = {
            x: (screenCenterInCartesian.x - endingPoint.x) * cs.pixelsPerUnit,
            y: -(screenCenterInCartesian.y - endingPoint.y) * cs.pixelsPerUnit
        }
        // Sign of the translation vector components
        const translationSign = {
            x: Math.sign(totalTranslation.x),
            y: Math.sign(totalTranslation.y)
        }
        // Translation increment (always positive)
        const tInc = {
            x: translationFactor * Math.abs(totalTranslation.x) + 1,
            y: translationFactor * Math.abs(totalTranslation.y) + 1,
        }
        // Executes if, along the x axes, the increment is greater than the total translation magnitude
        if (tInc.x > Math.abs(totalTranslation.x)) {
            // Increment is set equal to the total translation along the x axes
            tInc.x = Math.abs(totalTranslation.x);
            // Translation is stopped along the x axes
            isTranslating.x = false;
        }
        // Executes if, along the y axes, the increment is greater than the total translation magnitude
        if (tInc.y > Math.abs(totalTranslation.y)) {
            // Increment is set equal to the total translation the y axes
            tInc.y = Math.abs(totalTranslation.y);
            // Translation is stopped along the y axes
            isTranslating.y = false;
        }

        // The translation is performed
        cs.translateOrigin(translationSign.x * tInc.x, translationSign.y * tInc.y);
    }

    /**
     * Zooms the viewport.
     * @param {Number} zoomInc Zoom multiplication factor by which zoom is increased every frame.
     * @param {Number} endZoom Maximum zoom multiplication factor
     * @param {Function} condition Function returning true or false; when true, it ends the zoom.
     * @param {Boolean} isLocked True if zoom must not be performed, false otherwise.
     */
    function zoomViewport(zoomInc, endZoom, condition,
        zoomCenter = { x: width / 2, y: height / 2 }, isLocked = false) {
        // If zoom isn't locked (needed in case another animations is playing as well, translating e.g.)
        if (!isLocked) {
            // Multiplies the current zoom by the zoom increment factor
            currentZoom *= zoomInc;
            // IF the end condition is met
            if (condition()) {
                // The zoom increment is set so that the final zoom matches endZoom
                zoomInc = endZoom / (currentZoom / zoomInc);
                // Animations is gonna stop
                isRunning = false;
            }
            // Updates the zoom
            cs.updateZoom(zoomInc, { x: zoomCenter.x, y: zoomCenter.y });
        }
    }

    /**
     * Buttons are disabled and styled appropriately.
     * @param {Array} buttonsIds List of IDs of buttons.
     */
    function disableButtons(buttonsIds) {
        buttonsIds.forEach(buttonId => {
            document.getElementById(buttonId).classList.add("transparent");
            document.getElementById(buttonId).disabled = true;
        })
    }

    /**
     * Buttons are activated and styled appropriately.
     * @param {Array} buttonsIds List of IDs of buttons.
     */
    function activateButtons(buttonsIds) {
        buttonsIds.forEach(buttonId => {
            document.getElementById(buttonId).classList.remove("transparent");
            document.getElementById(buttonId).disabled = false;
        })
    }

    /**
     * Disables the following feature.
     */
    function disableFollowing() {
        isFollowing = false;
        // Styles the button
        document.getElementById(id + "-plot-toggle-follow").classList.add("transparent");
        document.getElementById(id + "-plot-toggle-follow").classList.remove("active");
    }

    /**
     * Updates the number of frequency that need to be used, based on the slider value.
     */
    function updateUsedFreq() {
        // Stores the slider element
        const slider = document.getElementById(id + "-param-N");
        // Computes the number of frequency that need to be used
        usedFreq = Math.round(Math.pow(parseFloat(slider.value) / parseFloat(slider.getAttribute("max")), 4) * N + 1);
        // Updates the slider value
        updateSliderValue("N", usedFreq);
    }

    /**
     * Updates the analyzed frequency.
     */
    function updateAnalyzedFreq() {
        // Stores the slider element
        const slider = document.getElementById(id + "-param-n");
        // Computes the number of frequency that need to be used
        const sliderProgress = parseFloat(slider.value) / parseFloat(slider.getAttribute("max"));
        if (sliderProgress < 0.5) analyzedFreq = Math.round(0.5 * Math.pow(2 * sliderProgress, 4) * (N - 1));
        else analyzedFreq = Math.round((-0.5 * Math.pow(2 * (sliderProgress - 1), 4) + 1) * (N - 1));
        // Updates the slider value
        updateSliderValue("n", analyzedFreq);
    }

    /**
     * Updates the value of the parameter in the corresponding slider value span.
     * @param {String} paramId Id of the parameter.
     * @param {} value Value that needs to be represented
     */
    function updateSliderValue(paramId, value) {
        // Gets the span with the slider value
        const sliderValueSpan = document.getElementById(id + "-param-" + paramId + "-value");
        // MathJax will forget about the math inside said span
        MathJax.typesetClear([sliderValueSpan]);
        // The inner text of the span is edited
        sliderValueSpan.innerText =
            "$" + paramId + "=" + value + "$";
        // MathJax does its things and re-renders the formula
        MathJax.typesetPromise([sliderValueSpan]).then(() => {
            // the new content is has been typeset
        });
    }

    /**
     * Moves an HTML element and its children to a new parent.
     * @param {HTMLElement} oldParent Old parent HTML element.
     * @param {HTMLElement} newParent New parent HTML element.
     */
    function moveHTML(oldParent, newParent) {
        while (oldParent.childNodes.length > 0) {
            newParent.appendChild(oldParent.childNodes[0]);
        }
    }

    /*_______________________________________
    |   Animations
    */

    /**
     * A (probably poor) implementation of the pause-able loop.
     * @param {Function} action Function to be executed every frame.
     * @returns Early return if not playing.
     */
    function animate(action) {
        if (!isRunning) {
            return;
        }
        // Executes action to be performed every frame
        action();
        // Draws the plot
        publicAPIs.drawPlot();
        // Keeps executing this function
        requestAnimationFrame(() => { animate(action); });
    }

    /**
     * It animates the vectors
     * @returns Early return if not playing.
     */
    function animateEpicycles() {
        // When no parameter is animated, it stops
        if (!isEpicyclesRunning) {
            return;
        }

        time = (time + dt) % (2 * Math.PI);

        generateFrame();

        // Keeps executing this function
        requestAnimationFrame(() => { animateEpicycles(); });
    }

    /**
     * If the following feature isn't active, redraws the scene aside from the coordinate system.
     * If the feature is active, it translates the scene in order to snap the current path point in the center of the canvas.
     */
    function generateFrame() {
        if (isFollowing) {
            // Computes the current index
            let index = Math.ceil(time / (2 * Math.PI) * path.length) - 1;
            index = constrain(index, 0, path.length - 1)
            // Translates the scene (higher the number, faster it will snap)
            autoTranslate({ x: path[index].x, y: path[index].y }, 0.75);
            // Clears everything and redraws the scene
            publicAPIs.drawPlot();
        } else {
            // Clears everything and redraws the scene (aside from the coordinate system)
            redrawScene();
        }
    }

    /*_______________________________________
    |   Plot
    */

    /**
     * Draws the plots.
     */
    publicAPIs.drawPlot = () => {
        // Clears the canvases
        publicAPIs.clearPlot();

        // ------- STUFF HERE -------
        drawAxisPlot();

        drawDrawing();
        drawEpicycles();
        drawTransform();
        drawSpectrum();
        drawPath();
        drawPoints();
    }

    /**
     * Draws the drawing, duh.
     */
    function drawDrawing() {
        if (drawingPoints.length > 1 && (isDrawing || isDrawingVisible)) {
            /* -- Drawing --  */

            // True if the previous point of the drawing was visible, false otherwise
            let wasPrevDrawingPointInbound = true;
            // Resets the squared distance between subsequent points
            let drawingDistanceSquared = 2;
            // Stores the number of points for later use
            const numOfPoints = drawingPoints.length;

            // Sets the style
            dCtx.strokeStyle = options.drawingColor;
            dCtx.lineWidth = options.drawingWidth;

            dCtx.beginPath();
            dCtx.moveTo(cs.toScreenX(drawingPoints[0].x), cs.toScreenY(drawingPoints[0].y));
            for (let i = 1; i < numOfPoints + 1; i++) {
                // Computes the path coordinates in screen coordinates
                const x = cs.toScreenX(drawingPoints[i % numOfPoints].x);
                const y = cs.toScreenY(drawingPoints[i % numOfPoints].y);
                // Checks if visible
                if (isInbound(x, y)) {
                    const prevX = cs.toScreenX(drawingPoints[(i - 1) % numOfPoints].x);
                    const prevY = cs.toScreenY(drawingPoints[(i - 1) % numOfPoints].y);

                    // If the previous point wasn't visible, it moves there
                    if (!wasPrevDrawingPointInbound) dCtx.moveTo(prevX, prevY);

                    // Draws the line only if it's greater than a given value
                    const newDistance = (x - prevX) ** 2 + (y - prevY) ** 2;
                    drawingDistanceSquared = drawingDistanceSquared > .25 ? newDistance : drawingDistanceSquared + newDistance;
                    if (drawingDistanceSquared > .25) dCtx.lineTo(x, y);

                    wasPrevDrawingPointInbound = true;
                } else if (wasPrevDrawingPointInbound) {
                    // Prevents line from ending abruptly
                    dCtx.lineTo(x, y);
                    wasPrevDrawingPointInbound = false;
                }
            }
            dCtx.stroke();

            /* -- Starting/Ending point */

            dCtx.fillStyle = options.backgroundColor;

            // Draws the outline
            dCtx.beginPath();
            dCtx.arc(cs.toScreenX(drawingPoints[0].x), cs.toScreenY(drawingPoints[0].y), options.drawingWidth * 2 + 2, 0, 2 * Math.PI);
            dCtx.fill();

            dCtx.fillStyle = options.drawingColor;

            // Draws the dot/circle
            dCtx.beginPath();
            dCtx.arc(cs.toScreenX(drawingPoints[0].x), cs.toScreenY(drawingPoints[0].y), options.drawingWidth * 2, 0, 2 * Math.PI);
            dCtx.fill();
        }
    }

    /**
     * Draws the drawing brush
     */
    function drawBrush() {
        // Stores the bounding element
        const rect = document.getElementById(id + "-plot").getBoundingClientRect();

        /* -- Brush circle -- */

        // Sets the style (the color is derived from the drawing color, the opacity is lowered)
        dCtx.fillStyle = options.drawingColor + "44";

        dCtx.beginPath();
        dCtx.arc(toBoundingX(brushCenter.x, rect), toBoundingY(brushCenter.y, rect), brushRadius * dpi, 0, 2 * Math.PI);
        dCtx.fill();

        /* -- Dashed line from brush center to cursor -- */

        dCtx.fillStyle = options.drawingColor;
        dCtx.lineWidth = 2;

        dCtx.setLineDash([2, 4]);

        dCtx.beginPath();
        dCtx.moveTo(toBoundingX(brushCenter.x, rect), toBoundingY(brushCenter.y, rect));
        dCtx.lineTo(toBoundingX(drawingCursor.x, rect), toBoundingY(drawingCursor.y, rect));
        dCtx.stroke();

        /* -- Point on the edge of the brush, where the cursor should be (more or less) -- */

        dCtx.fillStyle = options.backgroundColor;
        dCtx.setLineDash([]);

        // Draws the outline
        dCtx.beginPath();
        dCtx.arc(toBoundingX(brushCenter.x, rect), toBoundingY(brushCenter.y, rect), 8, 0, 2 * Math.PI);
        dCtx.fill();

        dCtx.fillStyle = options.drawingColor;

        // Draws the dot/circle
        dCtx.beginPath();
        dCtx.arc(toBoundingX(brushCenter.x, rect), toBoundingY(brushCenter.y, rect), 4, 0, 2 * Math.PI);
        dCtx.fill();
    }

    /**
     * Draws the epicycles and the trigonometric polynomial
     */
    function drawEpicycles() {
        // Only draws the epicycles when there's no drawing ongoing, the spectrum mode isn't active and a drawing is already present
        if (!isSpectrumModeActive && !isDrawing && isEpicyclesVisible && coefficients.length > 0) {
            let prevX = 0;
            let prevY = 0;

            let x = 0;
            let y = 0;

            for (let n = 0; n < N; n++) {
                // Stores frequency, radius and phase of the epicycles
                const freq = coefficients[n].freq;

                if (freq < usedFreq + 1 || freq > N - usedFreq - 1) {
                    const radius = coefficients[n].amp;
                    const phase = coefficients[n].phase;

                    // Sets the color for the epicycles and the vectors
                    eCtx.strokeStyle = n < N / 2 + 1 ? options.clockwiseColor : options.counterclockwiseColor;

                    // Computes next x and y coordinates
                    x += radius * Math.cos(freq * time + phase);
                    y += radius * Math.sin(freq * time + phase);

                    if (n > 0 && radius * cs.pixelsPerUnit > 6) {
                        /* -- Circle --*/

                        const centerX = cs.toScreenX(prevX);
                        const centerY = cs.toScreenY(prevY);

                        // Only draws the circle if it's visible
                        if (isInbound(centerX, centerY, radius * cs.pixelsPerUnit)) {
                            eCtx.lineWidth = options.epicycleWidth;
                            eCtx.setLineDash([2, 4]);

                            eCtx.beginPath();
                            eCtx.arc(centerX, centerY, radius * cs.pixelsPerUnit, 0, 2 * Math.PI);
                            eCtx.stroke();
                        }

                        /* -- Vector --*/

                        const vectorX = cs.toScreenX(x);
                        const vectorY = cs.toScreenY(y);

                        // Only draws the vector if it's visible
                        if (
                            isInbound(vectorX, vectorY, radius * cs.pixelsPerUnit / 2) ||
                            isInbound(prevX, prevY, radius * cs.pixelsPerUnit / 2)
                        ) {
                            eCtx.lineWidth = options.vectorWidth;
                            eCtx.setLineDash([]);

                            eCtx.beginPath();
                            eCtx.moveTo(centerX, centerY);

                            eCtx.lineTo(vectorX, vectorY);
                            eCtx.stroke();
                        }
                    }

                    prevX = x;
                    prevY = y;
                }
            }
        }
    }

    /**
     * Draws the Fourier transform argument path, according to the currently analyzed frequency
     */
    function drawTransform() {
        // Only draws the transform argument path if there's no drawing ongoing, the spectrum mode is active
        // and if there's a drawing already present
        if (!isDrawing && isSpectrumModeActive && transformArgPath.length > 0) {
            fCtx.strokeStyle = options.transformColor;
            fCtx.lineWidth = options.transformWidth;

            // True if the previous transform path point was visible
            let wasPrevTransformPointInbound = true;
            // Resets the distance between two subsequent points
            let transformDistanceSquared = 1;

            fCtx.beginPath();
            fCtx.moveTo(cs.toScreenX(transformArgPath[0].x), cs.toScreenY(transformArgPath[0].y));
            for (let i = 0; i < transformArgPath.length - 1; i++) {
                const x = cs.toScreenX(transformArgPath[i].x);
                const y = cs.toScreenY(transformArgPath[i].y);
                let nextX;
                let nextY;
                // Computes the following point
                if (i < transformArgPath.length - 2) {
                    // Aside from the last two index, the next point is the middle point between i-point and (i+1)-point
                    nextX = cs.toScreenX((transformArgPath[i].x + transformArgPath[i + 1].x) / 2);
                    nextY = cs.toScreenY((transformArgPath[i].y + transformArgPath[i + 1].y) / 2);
                } else {
                    nextX = cs.toScreenX(transformArgPath[i + 1].x);
                    nextY = cs.toScreenY(transformArgPath[i + 1].y);
                }
                // Checks if the current and next point are both within the radius from the canvas border
                if (
                    isInbound(x, y, cs.pixelsPerUnit * coefficients[0].amp) ||
                    isInbound(nextX, nextY, cs.pixelsPerUnit * coefficients[0].amp)
                ) {
                    if (i > 0) {
                        const prevX = cs.toScreenX(transformArgPath[i - 1].x);
                        const prevY = cs.toScreenY(transformArgPath[i - 1].y);
                        // If the previous point wasn't visible, it moves there
                        if (!wasPrevTransformPointInbound) fCtx.moveTo(prevX, prevY);
                        // Computes the distance between the current and next point or sums it to previous distance
                        const newDistance = (x - prevX) ** 2 + (y - prevY) ** 2;
                        let transformDistanceSquared = transformDistanceSquared > .25 ? newDistance : transformDistanceSquared + newDistance;
                    }
                    // Only draws the curve if it's big enough
                    if (transformDistanceSquared > .25) {
                        fCtx.quadraticCurveTo(x, y, nextX, nextY);
                    }
                    wasPrevTransformPointInbound = true;
                } else if (wasPrevTransformPointInbound) {
                    // Prevents line from ending abruptly
                    fCtx.lineTo(x, y);
                    wasPrevTransformPointInbound = false;
                }
            }
            fCtx.stroke();
        }
    }

    /**
     * Draws the frequency spectrum.
     */
    function drawSpectrum() {
        // Only draws the spectrum if there's no drawing ongoing, the spectrum ongoing and a drawing is already present
        if (!isDrawing && isSpectrumModeActive && spectrum.length > 0) {
            /* -- Spectrum line -- */

            sCtx.strokeStyle = options.inactiveSpectrumColor;
            sCtx.lineWidth = options.spectrumLineWidth;
            sCtx.lineCap = "round";
            sCtx.setLineDash([2, 6]);

            sCtx.beginPath();
            const originX = cs.toScreenX(0);
            const originY = cs.toScreenY(0);
            for (i = 1; i < N; i++) {
                const x = cs.toScreenX(spectrum[i].x);
                const y = cs.toScreenY(spectrum[i].y);
                // Only draws the line if the spectrum point and the origin are both visible
                if (isInbound(x, y) && isInbound(originX, originY)) {
                    sCtx.moveTo(originX, originY);
                    let distanceSquared = (x - originX) ** 2 + (y - originY) ** 2;
                    if (distanceSquared > 4 * options.spectrumPointSize) sCtx.lineTo(x, y);
                }
            }
            sCtx.stroke();

            /* -- Coefficients -- */

            sCtx.fillStyle = options.inactiveSpectrumColor;
            sCtx.setLineDash([]);

            for (let i = 0; i < N; i++) {
                const coefficientX = cs.toScreenX(spectrum[i].x);
                const coefficientY = cs.toScreenY(spectrum[i].y);
                const distanceFromOriginSquared = (coefficientX - width / 2) ** 2 + (coefficientY - height) ** 2;
                if (isInbound(coefficientX, coefficientY, options.spectrumPointSize) && distanceFromOriginSquared > 4) {
                    sCtx.beginPath();
                    sCtx.arc(coefficientX, coefficientY, options.spectrumPointSize, 0, 2 * Math.PI);
                    sCtx.fill();
                }
            }

            /* -- Current coefficient -- */

            const coefficientX = cs.toScreenX(spectrum[analyzedFreq].x);
            const coefficientY = cs.toScreenY(spectrum[analyzedFreq].y);

            // Draws the currently selected coefficient only if visible
            if (isInbound(coefficientX, coefficientY), options.spectrumPointSize * 2) {
                sCtx.fillStyle = options.backgroundColor;

                // Draws the outline
                sCtx.beginPath();
                sCtx.arc(coefficientX, coefficientY, options.spectrumPointSize * 2 + 4, 0, 2 * Math.PI);
                sCtx.fill();

                sCtx.fillStyle = options.spectrumColor;

                // Draws the dot/circle
                sCtx.beginPath();
                sCtx.arc(coefficientX, coefficientY, options.spectrumPointSize * 2, 0, 2 * Math.PI);
                sCtx.fill();
            }
        }
    }

    /**
     * True if the previous path point was visible, false otherwise
     */
    let wasPrevPathPointInbound;

    let pathDistanceSquared = 1;

    function drawPath() {
        if (!isDrawing && !isSpectrumModeActive && path.length > 0) {
            /* -- Complete path --*/

            wasPrevPathPointInbound = true;
            let pathDistanceSquared = 1;

            tCtx.strokeStyle = options.pathColor;
            tCtx.lineWidth = options.pathWidth - 1;

            tCtx.beginPath();
            tCtx.moveTo(cs.toScreenX(path[0].x), cs.toScreenY(path[0].y));
            // The drawing is drawn and closed
            for (i = 1; i < path.length + 1; i++) {
                // Only draws the segment if necessary
                drawSegment(i % path.length);
            }
            // tCtx.lineTo(cs.toScreenX(path[0].x), cs.toScreenY(path[0].y));
            tCtx.stroke();

            /* -- Active path --*/

            wasPrevPathPointInbound = true;

            tCtx.strokeStyle = options.pathActiveColor;
            tCtx.lineWidth = options.pathWidth;

            tCtx.beginPath();
            tCtx.moveTo(cs.toScreenX(path[0].x), cs.toScreenY(path[0].y));
            for (i = 1; i < Math.ceil(time / (2 * Math.PI) * path.length); i++) {
                // Only draws the segment if necessary
                drawSegment(i);
            }
            tCtx.stroke();

            /* -- Starting/Ending point */

            const startingPointX = cs.toScreenX(path[0].x);
            const startingPointY = cs.toScreenY(path[0].y);

            if (isInbound(startingPointX, startingPointY, options.pathWidth * 2)) {
                tCtx.fillStyle = options.backgroundColor;

                // Draws the outline
                tCtx.beginPath();
                tCtx.arc(startingPointX, startingPointY, options.pathWidth * 2 + 4, 0, 2 * Math.PI);
                tCtx.fill();

                tCtx.fillStyle = options.pathColor;

                // Draws the dot/circle
                tCtx.beginPath();
                tCtx.arc(startingPointX, startingPointY, options.pathWidth * 2, 0, 2 * Math.PI);
                tCtx.fill();
            }

            let index = Math.ceil(time / (2 * Math.PI) * path.length) - 1;
            index = constrain(index, 0, path.length);

            const endingPointX = cs.toScreenX(path[index].x);
            const endingPointY = cs.toScreenY(path[index].y);

            if (isInbound(endingPointX, endingPointY, options.pathWidth * 2)) {
                // Sets the style
                pCtx.fillStyle = options.backgroundColor;

                // Draws the outline
                pCtx.beginPath();
                pCtx.arc(endingPointX, endingPointY, options.pathWidth * 2 + 4, 0, 2 * Math.PI);
                pCtx.fill();

                // Sets the style
                pCtx.fillStyle = options.pathActiveColor;

                // Draws the dot/circle
                pCtx.beginPath();
                pCtx.arc(endingPointX, endingPointY, options.pathWidth * 2, 0, 2 * Math.PI);
                pCtx.fill();
            }
        }
    }

    /**
     * Draws a path segment if visible.
     * @param {Number} i Index of the path point.
     */
    function drawSegment(i) {
        // Computes the path coordinates in screen coordinates
        const x = cs.toScreenX(path[i].x);
        const y = cs.toScreenY(path[i].y);
        // Checks if visible
        if (isInbound(x, y)) {
            if (i > 0) {
                const prevX = cs.toScreenX(path[i - 1].x);
                const prevY = cs.toScreenY(path[i - 1].y);
                // If the previous point wasn't visible, it moves there
                if (!wasPrevPathPointInbound) tCtx.moveTo(prevX, prevY);
                // Computes the distance between the current point and the previous one or sums it
                const newDistance = (x - prevX) ** 2 + (y - prevY) ** 2;
                pathDistanceSquared = pathDistanceSquared > .25 ? newDistance : pathDistanceSquared + newDistance;
            }
            // Only draws the segment if the current point and the previous one are far enough
            if (pathDistanceSquared > .25) tCtx.lineTo(x, y);
            wasPrevPathPointInbound = true;
        } else if (wasPrevPathPointInbound) {
            // Prevents line from ending abruptly
            tCtx.lineTo(x, y);
            wasPrevPathPointInbound = false;
        }
    }

    /**
     * Draws the points.
     */
    function drawPoints() {

    }

    /**
     * Draws the axis/grid plot.
     */
    function drawAxisPlot() {
        if (isGridVisible) {
            /* -- Secondary grid  -- */
            drawGrid({ x: cs.screenSecondaryGridXMin, y: cs.screenSecondaryGridYMin }, cs.screenSecondaryGridStep,
                options.secondaryGridColor, options.secondaryGridLineWidth
            );

            /* -- Main grid  -- */
            drawGrid({ x: cs.screenGridXMin, y: cs.screenGridYMin }, cs.screenGridStep,
                options.gridColor, options.gridLineWidth
            );

            /* -- Axis -- */
            drawAxis(options.axisColor, options.axisLineWidth);
        }

        /* -- Plot border -- */
        drawBorders(options.gridColor, options.gridLineWidth + 1);

        if (isGridVisible) {
            /* -- Labels -- */
            drawLabels(options.gridColor, 3);

            /* -- Origin --  */
            drawOrigin(options.axisColor, 4);
        }
    }

    /**
     * Draws a grid, given the (x, y) starting points and the step.
     * @param {Object} gridMin Starting points of the grid (x, y).
     * @param {Number} gridStep Grid step value.
     * @param {String} color Color of the grid.
     * @param {Number} lineWidth Line width of the grid lines.
     */
    function drawGrid(gridMin, gridStep, color, lineWidth) {
        // Sets the style
        axisCtx.strokeStyle = color;
        axisCtx.lineWidth = lineWidth;

        axisCtx.beginPath();
        // Draws the vertical grid lines
        for (i = gridMin.x; i < cs.screenXMax; i += gridStep) {
            if (i > cs.screenXMin) {
                axisCtx.moveTo(i, cs.screenYMin);
                axisCtx.lineTo(i, cs.screenYMax);
            }
        }
        // Draws the horizontal grid lines
        for (j = gridMin.y; j < cs.screenYMax; j += gridStep) {
            if (j > cs.screenYMin) {
                axisCtx.moveTo(cs.screenXMin, j);
                axisCtx.lineTo(cs.screenXMax, j);
            }
        }
        axisCtx.stroke();
    }

    /**
     * Draws the axis of the plot.alpha
     * @param {String} color Color of the axis.
     * @param {Number} lineWidth Line width of the axis.
     */
    function drawAxis(color, lineWidth) {
        // Sets the style
        axisCtx.strokeStyle = color;
        axisCtx.lineWidth = lineWidth;

        axisCtx.beginPath();
        // Draws the x axes
        const xAxes = cs.toScreenX(0);
        if (xAxes > cs.screenXMin) {
            axisCtx.moveTo(xAxes, cs.screenYMin);
            axisCtx.lineTo(xAxes, cs.screenYMax);
        }
        // Draws the y axes
        const yAxes = cs.toScreenY(0);
        if (yAxes > cs.screenYMin) {
            axisCtx.moveTo(cs.screenXMin, yAxes);
            axisCtx.lineTo(cs.screenXMax, yAxes);
        }
        axisCtx.stroke();
    }

    /**
     * Draws the origin dot.
     * @param {String} color Color of the origin dot.
     * @param {Number} size Size of the origin dot.
     */
    function drawOrigin(color, size) {
        axisCtx.fillStyle = color;

        axisCtx.beginPath();
        axisCtx.arc(cs.toScreenX(0), cs.toScreenY(0), size, 0, 2 * Math.PI);
        axisCtx.fill();
    }

    /**
     * Draws the border of the plot.
     * @param {String} color Color of the border.
     * @param {Number} lineWidth Line width of the border.
     */
    function drawBorders(color, lineWidth) {
        // Sets the style
        axisCtx.strokeStyle = color;
        axisCtx.lineWidth = lineWidth;

        axisCtx.beginPath();
        // Draws the right border
        if (cs.screenXMin > 0) {
            axisCtx.moveTo(cs.screenXMin, cs.screenYMin);
            axisCtx.lineTo(cs.screenXMin, cs.screenYMax);
        }
        // Draws the left border
        if (cs.screenXMax < width) {
            axisCtx.moveTo(cs.screenXMax, cs.screenYMin);
            axisCtx.lineTo(cs.screenXMax, cs.screenYMax);
        }
        // Draws the top border
        if (cs.screenYMin > 0) {
            axisCtx.moveTo(cs.screenXMin, cs.screenYMin);
            axisCtx.lineTo(cs.screenXMax, cs.screenYMin);
        }
        // Draws the bottom border
        if (cs.screenYMax < height) {
            axisCtx.moveTo(cs.screenXMin, cs.screenYMax);
            axisCtx.lineTo(cs.screenXMax, cs.screenYMax);
        }
        axisCtx.stroke();
    }

    function drawLabels(color, lineWidth) {
        // Sets the style of the outline
        axisCtx.strokeStyle = options.backgroundColor;
        axisCtx.lineWidth = lineWidth;

        // Sets the style of the label
        axisCtx.fillStyle = color;
        axisCtx.font = options.labelSize + "px sans-serif";

        // Computes the axis coordinates
        const xAxes = cs.toScreenX(0);
        const yAxes = cs.toScreenY(0);

        axisCtx.beginPath();

        /* -- Labels along the x axes -- */

        for (i = cs.screenGridXMin; i < cs.screenXMax + 2; i += cs.screenGridStep) {
            if (i > cs.screenXMin - 2) {
                // Label numerical value
                const labelValue = roundNumberDigit(cs.toCartesianX(i), cs.maxNumberOfGridLabelDigits);

                // If it's not the origin
                if (labelValue != 0) {
                    // Label text
                    const labelText = labelValue.toString();
                    // Label measure
                    const labelMeasure = axisCtx.measureText(labelText);
                    // Horizontal position of the label
                    const xPos = i -
                        // Moves to the left by half the label width
                        (labelMeasure.width
                            // Moves to the left if negative, to compensate for minus sign
                            + (labelValue < 0 ? axisCtx.measureText("-").width : 0)) / 2;
                    // Vertical position
                    const yPos = getLabelPosition(yAxes, cs.screenYMin, cs.screenYMax,
                        {
                            min: 0,
                            max: -5 - options.labelSize * dpi
                        },
                        {
                            default: options.labelSize * dpi,
                            min: options.labelSize * dpi,
                            max: -5
                        }
                    );

                    // Draws the label
                    axisCtx.strokeText(labelValue, xPos, yPos);
                    axisCtx.fillText(labelValue, xPos, yPos);
                }
            }
        }

        /* -- Labels along the y axes -- */

        for (j = cs.screenGridYMin; j < cs.screenYMax + 2; j += cs.screenGridStep) {
            if (j > cs.screenYMin - 2) {
                // Label numerical value
                const labelValue = roundNumberDigit(cs.toCartesianY(j), cs.maxNumberOfGridLabelDigits);

                // If it's not the origin
                if (labelValue != 0) {
                    // Label text
                    const labelText = labelValue.toString();
                    // Label measure
                    const labelMeasure = axisCtx.measureText(labelText);
                    // Horizontal label offset
                    const xOffset = labelMeasure.width + 8;
                    // Horizontal position of the label; the label is moved to the left by its width
                    const xPos = getLabelPosition(xAxes, cs.screenXMin, cs.screenXMax,
                        {
                            min: xOffset + 8,
                            max: 0
                        },
                        {
                            default: -xOffset,
                            min: 5,
                            max: -xOffset
                        }
                    );
                    // Vertical position, the label is moved up by half its height
                    const yPos = j + (options.labelSize / 2) / dpi;

                    // Draws the label
                    axisCtx.strokeText(labelValue, xPos, yPos);
                    axisCtx.fillText(labelValue, xPos, yPos);
                }

            }
        }

        /* -- Origin label -- */

        // Cartesian origin in screen coordinates
        const origin = cs.toScreen(0, 0)
        // Origin label text
        const labelText = "0";
        // Label measure
        const labelMeasure = axisCtx.measureText(labelText);

        // If the origin in on screen
        if (origin.x > cs.screenXMin && origin.x < cs.screenXMax + labelMeasure.width + 8 &&
            origin.y > cs.screenYMin - options.labelSize * dpi && origin.y < cs.screenYMax) {
            // Horizontal position
            const xPos = origin.x - labelMeasure.width - 8;
            // Vertical position
            const yPos = origin.y + options.labelSize * dpi;
            // Draws the label
            axisCtx.strokeText("0", xPos, yPos);
            axisCtx.fillText("0", xPos, yPos);
        }

        axisCtx.closePath();
    }

    /**
     * Gets the label position given the axes coordinate, the viewport edges and the offset.
     * @param {Number} axes Screen coordinate of the axes.
     * @param {*} minValue Min screen coordinate along the perpendicular axes.
     * @param {*} maxValue Max screen coordinate along the perpendicular axes
     * @param {*} tolerance Tolerance when reaching the min and max screen coordinates.
     * @param {Object} offset Label offset.
     * @returns The label position.
     */
    const getLabelPosition = (axes, minValue, maxValue, tolerance, offset) => {
        if (axes < minValue + tolerance.min) {
            return minValue + offset.min;
        } else if (axes > maxValue + tolerance.max) {
            return maxValue + offset.max;
        } else {
            return axes + offset.default;
        }
    }

    /**
     * Clears the plots.
     */
    publicAPIs.clearPlot = () => {
        // Clears the axis/grid plot
        axisCtx.clearRect(0, 0, width + 1, height + 1)

        // Draws the background
        axisCtx.fillStyle = options.backgroundColor;

        axisCtx.beginPath();
        axisCtx.rect(0, 0, width + 1, height + 1);
        axisCtx.fill();

        // Clears the functions and points
        clearDrawing();
        clearTransform();
        clearSpectrum();
        clearEpicycles();
        clearPath();
        clearPoints();
    }

    /**
     * Clears the drawing plot.
     */
    function clearDrawing() {
        dCtx.clearRect(0, 0, width + 1, height + 1);
    }

    /**
     * Clears the Fourier transform argument  plot.
     */
    function clearTransform() {
        fCtx.clearRect(0, 0, width + 1, height + 1);
    }

    /**
     * Clears the spectrum plot.
     */
    function clearSpectrum() {
        sCtx.clearRect(0, 0, width + 1, height + 1);
    }

    /**
     * Clears the epicycles plot.
     */
    function clearEpicycles() {
        eCtx.clearRect(0, 0, width + 1, height + 1);
    }

    /**
     * Clears the path plot.
     */
    function clearPath() {
        tCtx.clearRect(0, 0, width + 1, height + 1);
    }

    /**
     * Clears the points plot.
     */
    function clearPoints() {
        pCtx.clearRect(0, 0, width + 1, height + 1);
    }

    /**
     * Clears everything and redraws the scene
     */
    function redrawScene() {
        // Clear
        // clearDrawing();
        clearEpicycles();
        clearTransform();
        clearSpectrum();
        clearPath();
        clearPoints();
        // Draw
        // drawDrawing();
        drawEpicycles();
        drawTransform();
        drawSpectrum();
        drawPath();
        drawPoints();
    }

    /**
     * Checks if a point is inside the canvas.
     * @param {Number} pX Coordinate x of the point.
     * @param {Number} pY Coordinate y of the point.
     * @param {Number} tolerance Tolerance.
     * @returns True if the point is inside the canvas, false otherwise.
     */
    const isInbound = (pX, pY, tolerance = 0) => {
        const isXInbound = (pX < cs.screenXMax + tolerance) && (pX > cs.screenXMin - tolerance);
        const isYInbound = (pY < cs.screenYMax + tolerance) && (pY > cs.screenYMin - tolerance)
        return isXInbound && isYInbound;
    }

    init();
    animateEpicycles();

    // Returns public methods
    return publicAPIs;
}