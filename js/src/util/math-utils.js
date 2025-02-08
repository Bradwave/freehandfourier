/**
 * Complex number a + ib.
 */
class ComplexNumber {

    /**
     * Constructor for the complex number a + ib.
     * @param {Number} a Real value a.
     * @param {*} b Imaginary coefficient b.
     */
    constructor(a, b) {
        this.re = a;
        this.im = b
    }

    /**
     * Add z to the current number.
     * @param {ComplexNumber} z Number to be added.
     */
    add(z) {
        this.re += z.re;
        this.im += z.im;
    }

    /**
     * Multiply the current number by z and returns the result.
     * @param {ComplexNumber} z Complex umber to be multiplied by.
     * @returns Result of the multiplication.
     */
    multiply(z) {
        return new ComplexNumber(
            this.re * z.re - this.im * z.im,
            this.re * z.im + this.im * z.re
        );
    }

    /**
     * Scale current number by a real factor r.
     * @param {Number} r Real factor to be scaled by.
     * @returns The scaled complex number.
     */
    scale(r) {
        return new ComplexNumber(this.re * r, this.im * r);
    }

    /**
     * Divide the current number by a real number r and returns the result.
     * @param {Number} r Real number to be divided by.
     * @returns Result of the division.
     */
    divide(r) {
        return new ComplexNumber(this.re / r, this.im / r);
    }

    /**
     * Get the conjugate.
     * @returns The conjugate.
     */
    conj() {
        return new ComplexNumber(this.re, -this.im);
    }

    /**
     * Get the absolute value, that is A in A*e^(i*phi)
     * @returns The absolute value.
     */
    abs() {
        return Math.sqrt(this.re * this.re + this.im * this.im);
    }

    /**
     * Get the phase, that is phi in A*e^(i*phi)
     * @returns The phase.
     */
    phase() {
        return Math.atan2(this.im, this.re);
    }

    /**
     * Get the ral part.
     * @returns The real part.
     */
    real() {
        return this.re;
    }

    /**
     * Get the ral part.
     * @returns The real part.
     */
    imag() {
        return this.im;
    }

}

/**
 * Poly-bezier curve.
 */
class PolyBezier {

    /**
     * Constructor of the poly-bezier curve.
     * @param {String} inputCoord String with input coordinates.
     */
    constructor(inputCoord) {
        this.points = this.importAbsCoord(inputCoord);
    }

    /**
     * Converts the string with coordinates into an array.
     * @param {String} inputCoord String with coordinates.
     * @returns The coordinates of the points.
     */
    importAbsCoord(inputCoord) {
        inputCoord = inputCoord.replace(/ C /g, " ");
        let splitCoord = inputCoord.split(" ");
        let points = [];
        for (let k = 0; k < splitCoord.length; k++) {
            let xy = splitCoord[k].split(",")
            points[k] = { x: parseFloat(xy[0]), y: - parseFloat(xy[1]) };
        }
        return points;
    }

    /**
     * Computes the coordinates of a point on a quadratic bezier curve.
     * @param {Array} p0 First control point.
     * @param {Array} p1 Second control point.
     * @param {Array} p2 Third control point.
     * @param {Array} p3 Fourth control point.
     * @param {Number} t Parameter between 0 and 1.
     * @returns 
     */
    getPoint(p0, p1, p2, p3, t) {
        let x = p0.x * Math.pow(1 - t, 3) + 3 * p1.x * t * Math.pow(1 - t, 2)
            + 3 * p2.x * Math.pow(t, 2) * (1 - t) + p3.x * Math.pow(t, 3);
        let y = p0.y * Math.pow(1 - t, 3) + 3 * p1.y * t * Math.pow(1 - t, 2)
            + 3 * p2.y * Math.pow(t, 2) * (1 - t) + p3.y * Math.pow(t, 3);
        return new ComplexNumber(x, y);
    }

    /**
     * Samples points along the poly-bezier.
     * @param {Number} N Number of sampled points in each bezier curve.
     * @returns The coordinates of the points sampled along the poly-bezier.
     */
    samplePoints(N) {
        let s = 1.000000 / N;
        let M = this.points.length / 3;
        let sampledPoints = [];

        for (let j = 0; j < M; j++) {
            let points = {
                p0: this.points[3 * j], p1: this.points[1 + 3 * j],
                p2: this.points[2 + 3 * j], p3: this.points[(3 + 3 * j) % this.points.length]
            };
            for (let k = 0; k < N; k++) {
                sampledPoints[k + j * N] = this.getPoint(points.p0, points.p1, points.p2, points.p3, k * s);
            }
        }

        return sampledPoints;
    }

}

/**
 * Time-Frequency analysis tools
 */
const analysisTools = new function () {

    /**
     * Public methods.
     */
    let publicAPIs = {};

    /**
     * Compute the discrete Fourier transform.
     * @param {Array} x Input points.
     * @param {Array} options Options.
     * @returns An array of transformed points.
     */
    publicAPIs.dft = (x, options = { L: 1, maxFreq: x.length, df: 1, complex: true }) => {
        const X = [];
        const N = x.length;

        for (let freq = 0; freq < options.maxFreq; freq += options.df) {
            let sum = new ComplexNumber(0, 0);

            for (let n = 0; n < N; n++) {
                const phi = (- 2 * Math.PI * options.L * (n / N) * freq);
                const c = new ComplexNumber(Math.cos(phi), Math.sin(phi));
                if (options.complex) {
                    sum.add(c.multiply(x[n]));
                } else {
                    sum.add(c.scale(x[n]));
                }
            }
            sum = sum.divide(N);

            X.push({
                re: sum.real(),
                im: sum.imag(),
                freq: freq,
                amp: sum.abs(),
                phase: sum.phase()
            });
        }
        return X;
    }

    return publicAPIs;
}