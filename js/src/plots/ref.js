/**
 * Plots of the Fourier transform visualization.
 * @param {Number} ids IDs of the plots.
 * @param {Array} options Options of the plot. 
 * @returns Public APIs.
 */
let fsvPlots = function (ids, options) {

    /**
     * Public methods.
     */
    let publicAPIs = {};

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

    const xCenter = 0.55;
    const yCenter = 0.5;

    /*_______________________________________
    |   General variables
    */

    /**
     * Sampled points of the function.
     */
    let functionPoints = [];

    /**
     * Fourier coefficients.
     */
    let coefficients = [];

    /**
     * Scale.
     */
    let scale;

    /**
     * Time increment;
     */
    let dt;

    /**
     * Current time.
     */
    let time = 0;

    /**
     * Current winding frequency.
     */
    let usedFreq = 1;

    /**
     * Number between 0 and 1, progress in used frequency.
     */
    let progress = 0;

    /**
     * Progress increment.
     */
    const dp = 0.05;

    /**
     * True if running, false otherwise.
     */
    let running = false;

    const playButton = document.getElementById("play-pause-fs");

    // Play/pause the animation
    playButton.onclick = () => {
        running = !running;
        toggleAnimation(running);
    }

    /**
     * Switch on or off the animation.
     * @param {Boolean} isRunning True if running, false otherwise.
     */
    function toggleAnimation(isRunning) {
        playButton.innerHTML = isRunning ? "pause" : "play_arrow";
        if (isRunning) {
            // Starts the animation
            requestAnimationFrame(animate);
        }
    }

    // Move to previous step.

    let skipInterval;

    document.getElementById("skip-prev-fs").onclick = () => {
        skipPrev();
    }

    document.getElementById("skip-prev-fs").onmousedown = () => {
        running = false;
        if (!running) toggleAnimation(false);

        clearInterval(skipInterval)
        skipInterval = setInterval(function () {
            skipPrev();
        }, 50);
    }

    document.getElementById("skip-prev-fs").onmouseup = () => {
        clearInterval(skipInterval);
    }

    /**
     * Skips to previous point in time.
     */
    function skipPrev() {
        const newTime = time - dt;
        time = newTime < 0 ? 2 * Math.PI - newTime : newTime;
        drawEpicycles();
    }

    // Move to next step

    document.getElementById("skip-next-fs").onclick = () => {
        skipNext();
    }

    document.getElementById("skip-next-fs").onmousedown = () => {
        running = false;
        if (!running) toggleAnimation(false);

        clearInterval(skipInterval)
        skipInterval = setInterval(function () {
            skipNext();
        }, 50);
    }

    document.getElementById("skip-next-fs").onmouseup = () => {
        clearInterval(skipInterval);
    }

    /**
     * Skips to next moment in time.
     */
    function skipNext() {
        time = (time + dt) % (2 * Math.PI);
        drawEpicycles();
    }

    // Changes the number of components used

    const compNumberInput = document.getElementById("components-number");

    compNumberInput.addEventListener('keyup', (e) => {
        if (e.code === "Enter") {
            updateCompNumberInput();
        }
    });

    compNumberInput.addEventListener('focusout', () => {
        updateCompNumberInput();
    });

    function updateCompNumberInput() {
        const newUsedFreq = getInputNumber(compNumberInput, options = { min: 1, max: N });
        if (newUsedFreq !== usedFreq) {
            usedFreq = newUsedFreq;
            const newProgress = dp
                * Math.round(((usedFreq - 1) / (N - 1)) ** (1 / 3) * (1 / dp));
            progress = newProgress > N ? N : newProgress;
            console.log(progress)
            computePath();
            publicAPIs.drawPlot();
        }
    }

    // Decreases the number of components used

    let compInterval;

    document.getElementById("less-components").onclick = () => {
        decreaseComponents();
    }

    document.getElementById("less-components").onmousedown = () => {
        clearInterval(compInterval)
        compInterval = setInterval(function () {
            decreaseComponents({ increasing: false });
        }, 500);
    }

    document.getElementById("less-components").onmouseup = () => {
        clearInterval(compInterval);
    }

    /**
     * Decreases the number of components used.
     */
    function decreaseComponents() {
        const newProgress = progress - dp;
        progress = newProgress < 0 ? progress + newProgress : newProgress;
        updateUsedFreq();
        publicAPIs.drawPlot();
    }

    // Increases the number of components used

    document.getElementById("more-components").onclick = () => {
        increaseComponents();
    }

    document.getElementById("more-components").onmousedown = () => {
        clearInterval(compInterval)
        compInterval = setInterval(function () {
            increaseComponents();
        }, 500);
    }

    document.getElementById("more-components").onmouseup = () => {
        clearInterval(compInterval);
    }

    /**
     * Decreases the number of components used.
     */
    function increaseComponents() {
        const newProgress = progress + dp;
        progress = newProgress > 1 ? 1 : newProgress;
        updateUsedFreq();
        publicAPIs.drawPlot();
    }

    /**
     * Updates the number of used frequency components and the plots.
     */
    function updateUsedFreq(options = { increasing: true }) {
        const newUsedFreq = Math.round((progress ** 3) * (N - 1)) + 1;;

        if (usedFreq == newUsedFreq) {
            if (options.increasing) {
                usedFreq = usedFreq < N ? usedFreq + 1 : N;
            } else {
                usedFreq = usedFreq > 1 ? usedFreq - 1 : 1;
            }
        } else {
            usedFreq = newUsedFreq;
        }

        compNumberInput.value = usedFreq;

        computePath();
    }

    /**
     * Inits the plot.
     * @param {*} inputOptions 
     */
    publicAPIs.init = function (inputOptions) {
        // Resizes canvas
        publicAPIs.resizeCanvas();

        const functionBezier = new PolyBezier(moleCoordinates);
        functionPoints = functionBezier.samplePoints(10);

        coefficients = analysisTools.dft(functionPoints);

        N = coefficients.length;
        dt = (2 * Math.PI) / N;

        for (let k = 1; k < N / 2; k++) {
            coefficients[k + N / 2] =
                [coefficients[k], coefficients[k] = coefficients[k + N / 2]][0];
        }

        scale = - 0.5 * 1 / Math.max(...functionPoints.map(e => {
            return e.abs();
        }));

        computePath();
    }

    /**
     * Computes the path.
     */
    function computePath() {
        path = [];

        for (let t = 0; t < 2 * Math.PI; t += dt) {
            let x = 0;
            let y = 0;

            for (let n = 0; n < N; n++) {
                const freq = coefficients[n].freq;
                if (freq < usedFreq + 1 || freq > N - usedFreq - 1) {
                    radius = coefficients[n].amp;
                    phase = coefficients[n].phase;

                    x += radius * Math.cos(freq * t + phase);
                    y += radius * Math.sin(freq * t + phase);
                }
            }

            path.push({ x: x, y: y });
        }
    }

    /**
     * Converts x to canvas coordinates.
     * @param {Number} x Coordinate x.
     * @returns The canvas coordinates for x.
     */
    const toCanvasX = (x) => {
        return width * (xCenter + scale * x);
    }

    /**
     * Converts x to canvas coordinates.
     * @param {Number} y Coordinate y.
     * @returns The canvas coordinates for y.
     */
    const toCanvasY = (y) => {
        return height * yCenter + width * scale * y;
    }

    /*_______________________________________
    |   Canvas
    */

    const pathPlot = new plotStructure(ids[0], { alpha: false });
    const pCtx = pathPlot.getCtx();

    const epicyclesPlot = new plotStructure(ids[1], { alpha: true });
    const eCtx = epicyclesPlot.getCtx();

    /**
     * Resizes the canvas to fill the HTML canvas element.
     */
    publicAPIs.resizeCanvas = () => {
        pathPlot.resizeCanvas();
        epicyclesPlot.resizeCanvas();

        width = pathPlot.getWidth();
        height = pathPlot.getHeight();
    }

    /**
     * A (probably poor) implementation of the pause-able loop.
     * @returns Early return if not playing.
     */
    function animate() {
        if (!running) {
            return;
        }

        // Draws the epicycles
        drawEpicycles();

        // Increase Time
        time = (time + dt) % (2 * Math.PI);

        // Keeps executing this function
        requestAnimationFrame(animate);
    }

    /**
     * Draws the plots.
     */
    publicAPIs.drawPlot = () => {
        drawPath();
        drawEpicycles();
    }

    /**
     * Draws the epicycles and the partial path.
     */
    function drawEpicycles() {
        // Clears the canvas.
        eCtx.clearRect(0, 0, width, height);

        // -- Partial Path --

        eCtx.strokeStyle = "#1484E6";
        eCtx.lineWidth = 3;

        eCtx.beginPath();

        eCtx.moveTo(toCanvasX(path[0].x), toCanvasY(path[0].y));

        const M = Math.ceil((time * N) / (2 * Math.PI));

        for (let m = 1; m < M; m++) {
            eCtx.lineTo(toCanvasX(path[m].x), toCanvasY(path[m].y));
        }

        eCtx.stroke();

        // -- Epicycles --

        eCtx.strokeStyle = "#55555580";
        eCtx.lineWidth = 1;

        let x = 0;
        let y = 0;

        let xPos = 0;
        let yPos = 0;

        let xPrevPos = 0;
        let yPrevPos = 0;


        for (let n = 0; n < N; n++) {
            let freq = coefficients[n].freq;

            if (freq < usedFreq + 1 || freq > N - usedFreq - 1) {
                let radius = coefficients[n].amp;
                let phase = coefficients[n].phase;

                x += radius * Math.cos(freq * time + phase);
                y += radius * Math.sin(freq * time + phase);

                xPrevPos = xPos;
                yPrevPos = yPos;

                xPos = toCanvasX(x);
                yPos = toCanvasY(y);

                if (n !== 0 && radius > scale * 1) {
                    eCtx.beginPath();
                    eCtx.arc(xPrevPos, yPrevPos, width * (-scale) * radius, 0, 2 * Math.PI);
                    eCtx.stroke();

                    eCtx.beginPath();
                    eCtx.moveTo(xPrevPos, yPrevPos);
                    eCtx.lineTo(xPos, yPos);
                    eCtx.stroke();
                }
            }
        }

        // -- Moving Point --

        eCtx.fillStyle = "#0e5ea4";

        eCtx.beginPath();
        eCtx.arc(toCanvasX(x), toCanvasY(y), 3, 0, 2 * Math.PI);
        eCtx.fill();
    }

    /**
     * Draws the complete path.
     */
    function drawPath() {
        // Clears the canvases
        publicAPIs.clearPlot();

        // -- Complete Path --

        pCtx.strokeStyle = "#888888";
        pCtx.lineWidth = 2;

        pCtx.beginPath();

        pCtx.moveTo(toCanvasX(path[0].x), toCanvasY(path[0].y));

        for (let m = 1; m < path.length; m++) {
            pCtx.lineTo(toCanvasX(path[m].x), toCanvasY(path[m].y));
        }

        pCtx.stroke();
    }

    /**
     * Clears the plots.
     */
    publicAPIs.clearPlot = () => {
        pCtx.fillStyle = "#ffffff";

        pCtx.beginPath();
        pCtx.rect(0, 0, width, height);
        pCtx.fill();
        pCtx.closePath();
    }

    publicAPIs.init(options);

    // Returns public methods
    return publicAPIs;
}