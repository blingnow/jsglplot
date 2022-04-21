// jsglplot -- Copyright(c) 2022 Benjamin Lingnau
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
        typeof define === 'function' && define.amd ? define(['exports'], factory) :
            (factory((global.jsglplot = global.jsglplot || {})));
}(this, (function (exports) {
    'use strict';

    const vsAreaSolid = `
            attribute vec4 position;

            uniform mat4 dataToPixelsMatrix;
            uniform mat4 pixelsToViewportMatrix;

            void main() {
                gl_Position = pixelsToViewportMatrix * dataToPixelsMatrix * position;
            }
        `;
    const fsAreaSolid = `
            precision mediump float;
            uniform vec4 color;
            void main() {
                gl_FragColor = color;
            }
        `;


    const vsLineSolid = `
            attribute vec4 position;
            attribute vec2 tangent;
            // attribute vec2 tangent2;

            uniform mat4 dataToPixelsMatrix;
            uniform mat4 pixelsToViewportMatrix;

            precision highp float;
            uniform float width;

            void main() {
                vec4 tpos = dataToPixelsMatrix * position;
                vec2 tt1 = normalize((dataToPixelsMatrix * vec4(tangent, 0, 0)).xy);
                // vec2 tt2 = normalize((dataToPixelsMatrix * vec4(tangent2, 0, 0)).xy);

                // vec2 tt = vec2(-tt2.y - tt1.y, tt2.x + tt1.x) / (1.0 + dot(tt1,tt2));
                vec2 tt = vec2(-tt1.y, tt1.x);

                gl_Position = pixelsToViewportMatrix * (tpos + vec4(tt * width, 0, 0));
            }
        `;
    const fsLineSolid = `
            precision mediump float;
            uniform vec4 color;
            void main() {
                gl_FragColor = color;
            }
        `;

    const vsLineDashed = `
            attribute vec4 position;
            attribute vec2 tangent;
            attribute vec2 linelength;

            uniform mat4 dataToPixelsMatrix;
            uniform mat4 pixelsToViewportMatrix;

            precision highp float;
            uniform float width;

            varying float linelen;

            void main() {
                vec4 tpos = dataToPixelsMatrix * position;
                vec2 tt1 = normalize((dataToPixelsMatrix * vec4(tangent, 0, 0)).xy);

                vec2 tt = vec2(-tt1.y, tt1.x);

                linelen = length((dataToPixelsMatrix * vec4(linelength, 0, 0)).xy);
                gl_Position = pixelsToViewportMatrix * (tpos + vec4(tt * width, 0, 0));
            }
        `;
    const fsLineDashed = `
            precision highp float;
            uniform vec4 color;
            uniform vec2 dashes;
            varying float linelen;
            void main() {
                if (fract(linelen / dashes.x) > dashes.y) discard;
                gl_FragColor = color;
            }
        `;


    function generateLineSolidBuffers(lineData, parameters) {
        const indices = [];
        const positions = [];
        const tangents = [];

        let count = 0;
        for (let i = 0; i < lineData.length - 1; i++) {
            if (lineData[i] && lineData[i + 1]) {
                positions.push(lineData[i][0], lineData[i][1]);
                positions.push(lineData[i][0], lineData[i][1]);

                positions.push(lineData[i + 1][0], lineData[i + 1][1]);
                positions.push(lineData[i + 1][0], lineData[i + 1][1]);

                tangents.push((lineData[i + 1][0] - lineData[i][0]), (lineData[i + 1][1] - lineData[i][1]));
                tangents.push((lineData[i][0] - lineData[i + 1][0]), (lineData[i][1] - lineData[i + 1][1]));

                tangents.push((lineData[i + 1][0] - lineData[i][0]), (lineData[i + 1][1] - lineData[i][1]));
                tangents.push((lineData[i][0] - lineData[i + 1][0]), (lineData[i][1] - lineData[i + 1][1]));

                if (lineData[i - 1]) {
                    indices.push(4 * count - 2);
                    indices.push(4 * count - 1);
                    indices.push(4 * count - 0);
                    indices.push(4 * count - 1);
                    indices.push(4 * count + 0);
                    indices.push(4 * count + 1);
                }
                indices.push(4 * count + 0);
                indices.push(4 * count + 1);
                indices.push(4 * count + 2);
                indices.push(4 * count + 1);
                indices.push(4 * count + 2);
                indices.push(4 * count + 3);

                count += 1;

            }
        }
        return {
            indices: indices,
            position: positions,
            tangent: tangents,
        };
    }
    function generateLineDashedBuffers(lineData, parameters) {
        const indices = [];
        const positions = [];
        const tangents = [];
        const linelengths = [];

        let curlen = [0, 0];

        let count = 0;
        for (let i = 0; i < lineData.length - 1; i++) {
            if (lineData[i] && lineData[i + 1]) {
                positions.push(lineData[i][0], lineData[i][1]);
                positions.push(lineData[i][0], lineData[i][1]);

                positions.push(lineData[i + 1][0], lineData[i + 1][1]);
                positions.push(lineData[i + 1][0], lineData[i + 1][1]);

                tangents.push((lineData[i + 1][0] - lineData[i][0]), (lineData[i + 1][1] - lineData[i][1]));
                tangents.push((lineData[i][0] - lineData[i + 1][0]), (lineData[i][1] - lineData[i + 1][1]));
                tangents.push((lineData[i + 1][0] - lineData[i][0]), (lineData[i + 1][1] - lineData[i][1]));
                tangents.push((lineData[i][0] - lineData[i + 1][0]), (lineData[i][1] - lineData[i + 1][1]));

                linelengths.push(curlen[0], curlen[1]);
                linelengths.push(curlen[0], curlen[1]);
                curlen[0] += Math.abs(lineData[i + 1][0] - lineData[i][0]);
                curlen[1] += Math.abs(lineData[i + 1][1] - lineData[i][1]);
                linelengths.push(curlen[0], curlen[1]);
                linelengths.push(curlen[0], curlen[1]);


                indices.push(4 * count + 0);
                indices.push(4 * count + 1);
                indices.push(4 * count + 2);
                indices.push(4 * count + 1);
                indices.push(4 * count + 2);
                indices.push(4 * count + 3);


                count += 1;
            }
            else {
                curlen = [0, 0];
            }
        }
        return {
            indices: indices,
            position: positions,
            tangent: tangents,
            linelength: linelengths,
        };
    }
    function generateAreaBuffers(lineData, parameters) {
        const indices = [];
        const positions = [];
        let startIndex = 0;
        let count = 0;
        for (let i = 0; i < lineData.length; i++) {
            if (lineData[i]) {
                positions.push(lineData[i][0]);
                positions.push(lineData[i][1]);
                positions.push(lineData[i][0]);
                positions.push(parameters.baseline);
                if (i > startIndex) {
                    indices.push(2 * count - 2);
                    indices.push(2 * count - 1);
                    indices.push(2 * count - 0);
                    indices.push(2 * count - 1);
                    indices.push(2 * count - 0);
                    indices.push(2 * count + 1);
                }
                count += 1;
            }
            else startIndex = i + 1;
        }
        return {
            indices: indices,
            position: positions,
        };
    }

    class Material {
        static loadShader(gl, type, source) {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);

            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.log(gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }
            return shader;
        }

        constructor(gl, vertexShader, fragmentShader, vertexBuffers, fillBuffersFunc, parameterDefaults, renderFunc) {
            this.gl = gl;
            this.parameterDefaults = parameterDefaults;
            this.fillBuffersFunc = fillBuffersFunc;
            this.vertexBuffers = vertexBuffers;
            this.renderFunc = renderFunc || Material.defaultRenderFunc;

            // compile shaders
            this.vertexShader = Material.loadShader(this.gl, this.gl.VERTEX_SHADER, vertexShader);
            this.fragmentShader = Material.loadShader(this.gl, this.gl.FRAGMENT_SHADER, fragmentShader);

            const shaderProgram = gl.createProgram();
            this.gl.attachShader(shaderProgram, this.vertexShader);
            this.gl.attachShader(shaderProgram, this.fragmentShader);
            this.gl.linkProgram(shaderProgram);

            if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) {
                alert(this.gl.getProgramInfoLog(shaderProgram));
                return null;
            }

            this.shader = shaderProgram;

            this.__vertexBufferLocations = {};
            for (let buffer of this.vertexBuffers) {
                this.__vertexBufferLocations[buffer] = this.gl.getAttribLocation(shaderProgram, buffer);
            }

            this.__parameterLocations = {
                dataToPixelsMatrix: this.gl.getUniformLocation(shaderProgram, 'dataToPixelsMatrix'),
                pixelsToViewportMatrix: this.gl.getUniformLocation(shaderProgram, 'pixelsToViewportMatrix')
            };
            for (let param in this.parameterDefaults) {
                this.__parameterLocations[param] = this.gl.getUniformLocation(shaderProgram, param);
            }

        }

        generateBuffers(data, parameters) {
            if (this.parameterDefaults) {
                for (let param in this.parameterDefaults) {
                    if (parameters[param] === undefined) parameters[param] = this.parameterDefaults[param];
                }
            }
            const bufferdata = this.fillBuffersFunc(data, parameters);
            const buffers = {};
            for (let k in bufferdata) {
                buffers[k] = this.gl.createBuffer();
                if (k === 'indices') {
                    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, buffers[k]);
                    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(bufferdata[k]), this.gl.STATIC_DRAW);
                    buffers.__indexcount = bufferdata[k].length;
                }
                else {
                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffers[k]);
                    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(bufferdata[k]), this.gl.STATIC_DRAW);
                }
            }
            return buffers;
        }

        clearBuffers(buffer) {
            if (!buffer) return;
            for (let buf in this.vertexBuffers) {
                this.gl.deleteBuffer(buffer[buf]);
            }
        }

        render(buffers, parameters) {
            if (!buffers) return;
            this.gl.useProgram(this.shader);

            for (let buffer in this.__vertexBufferLocations) {
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffers[buffer]);
                //                                                                     numComponents, type, stride, offset
                this.gl.vertexAttribPointer(this.__vertexBufferLocations[buffer], 2, this.gl.FLOAT, false, 0, 0);
                this.gl.enableVertexAttribArray(this.__vertexBufferLocations[buffer]);
            }

            parameters ||= this.parameterDefaults;
            if (this.parameterDefaults) {
                for (let param in this.parameterDefaults) {
                    let paramLocation = this.__parameterLocations[param];
                    if (paramLocation) {
                        parameters[param] ||= this.parameterDefaults[param];
                        if (parameters[param].length == 4) this.gl.uniform4fv(this.__parameterLocations[param], parameters[param]);
                        else if (typeof (parameters[param]) === 'number') {
                            if (param == 'width') this.gl.uniform1f(this.__parameterLocations[param], parameters[param] * window.devicePixelRatio);
                            else this.gl.uniform1f(this.__parameterLocations[param], parameters[param]);
                        }
                        else if (parameters[param].length == 3) this.gl.uniform3fv(this.__parameterLocations[param], parameters[param]);
                        else if (parameters[param].length == 2) this.gl.uniform2fv(this.__parameterLocations[param], parameters[param]);
                    }
                }
            }

            this.gl.uniformMatrix4fv(this.__parameterLocations.dataToPixelsMatrix, false, this.gl.dataToPixelsMatrix);
            this.gl.uniformMatrix4fv(this.__parameterLocations.pixelsToViewportMatrix, false, this.gl.pixelsToViewportMatrix);

            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
            this.gl.drawElements(this.gl.TRIANGLES, buffers.__indexcount, this.gl.UNSIGNED_INT, 0);

            for (let i in this.__vertexBufferLocations) this.gl.disableVertexAttribArray(this.__vertexBufferLocations[i]);
        }
    }

    function setDataMatrices(chart, datum) {

        chart.gl.viewport(chart.viewport.left, chart.viewport.bottom, chart.viewport.width, chart.viewport.height);

        chart.gl.dataToPixelsMatrix = glMatrix.mat4.create();
        glMatrix.mat4.ortho(chart.gl.dataToPixelsMatrix,
            chart.axes[chart.data[datum].xaxis].min,
            chart.axes[chart.data[datum].xaxis].max,
            chart.axes[chart.data[datum].yaxis].min,
            chart.axes[chart.data[datum].yaxis].max,
            -1, 1);

        const normToPixelMatrix = glMatrix.mat4.create();
        glMatrix.mat4.set(normToPixelMatrix,
            chart.viewport.width / 2, 0, 0, 0,
            0, chart.viewport.height / 2, 0, 0,
            0, 0, 1, 0,
            chart.viewport.width / 2, chart.viewport.height / 2, 0, 1
        );

        glMatrix.mat4.multiply(chart.gl.dataToPixelsMatrix, normToPixelMatrix, chart.gl.dataToPixelsMatrix);

        chart.gl.pixelsToViewportMatrix = glMatrix.mat4.create();
        glMatrix.mat4.ortho(chart.gl.pixelsToViewportMatrix, 0, chart.viewport.width, 0, chart.viewport.height, -1, 1);
    }

    function setChartMatrices(chart) {
        chart.gl.viewport(0, 0, chart.gl.canvas.clientWidth, chart.gl.canvas.clientHeight);

        chart.gl.dataToPixelsMatrix = glMatrix.mat4.create();
        glMatrix.mat4.ortho(chart.gl.dataToPixelsMatrix, 0, 2, 0, 2, -1, 1);

        chart.gl.pixelsToViewportMatrix = glMatrix.mat4.create();
        glMatrix.mat4.ortho(chart.gl.pixelsToViewportMatrix, 0, chart.gl.canvas.clientWidth, 0, chart.gl.canvas.clientHeight, -1, 1);
    }

    function getTicksForInterval(interval, desiredNumber = 12, allowedTickIntervals) {
        let extent = interval[1] - interval[0];

        if (!allowedTickIntervals) {
            let l = Math.pow(10, Math.floor(Math.log10(extent / desiredNumber)));
            allowedTickIntervals = [l, 2 * l, 5 * l, 10 * l, 20 * l, 50 * l]
        }

        let tickInterval = allowedTickIntervals[0];
        let minv = Number.MAX_VALUE;
        for (let i of allowedTickIntervals) {
            let d = Math.abs(extent / i - desiredNumber);
            if (d < minv) {
                tickInterval = i;
                minv = d;
            }
            else break;
        }

        let vmin = Math.ceil(interval[0] / tickInterval) * tickInterval;
        let vmax = Math.floor(interval[1] / tickInterval) * tickInterval;

        let ticks = [];
        for (let v = vmin; v <= vmax; v += tickInterval) ticks.push(v);

        return ticks;
    }


    class Plot {
        #buffers = { data: {}, axes: {}, grid: {} };
        #lastzoom = 1;
        #lastPanx = 0;
        #lastPany = 0;
        #lastPinchx = 0;
        #lastPinchy = 0;

        viewport = {};
        dimensions = {};

        constructor(selector, config) {
            this.root = document.querySelector(selector);
            this.root.style.overflow = "clip";

            this.canvas = document.createElement("canvas");
            this.canvas.style.position = "absolute";
            this.root.appendChild(this.canvas);

            this.gl = this.canvas.getContext("webgl2");
            if (this.gl === null) {
                alert("Unable to initialize WebGL. Your browser or machine may not support it.");
                return null;
            }

            this.axes = config.axes || {};
            this.data = config.data || {};

            this.options = config.options || {};
            this.options.margins = this.options.margins || { left: 0, right: 0, top: 0, bottom: 0 };
            this.options.margins.left = this.options.margins.left || 0;
            this.options.margins.right = this.options.margins.right || 0;
            this.options.margins.top = this.options.margins.top || 0;
            this.options.margins.bottom = this.options.margins.bottom || 0;

            this.materials = config.materials || {};
            this.materials.fill = new Material(this.gl, vsAreaSolid, fsAreaSolid, ["position"], generateAreaBuffers, { color: [0, 0.25, 0.75, 0.5], baseline: 0 });
            this.materials.lineSolid = new Material(this.gl, vsLineSolid, fsLineSolid, ["position", "tangent"], generateLineSolidBuffers, { color: [0, 0.25, 0.75, 0.5], width: 1 });
            this.materials.lineDashed = new Material(this.gl, vsLineDashed, fsLineDashed, ["position", "tangent", "linelength"], generateLineDashedBuffers, { color: [0, 0.25, 0.75, 0.5], width: 1, dashes: [8, 0.5] });

            const thisplot = this;

            this.labelDiv = d3.select(selector).append("div")
                .style("inset", "0px")
                .style("position", "absolute");

            this.inputDiv = d3.select(selector).append("div")
                // .style("inset", "0px")
                .style("position", "absolute")
                .on("wheel", function (ev) {
                    thisplot.zoom(Math.exp(-ev.wheelDeltaY * 0.001), ev.layerX, ev.layerY);
                    ev.preventDefault();
                });

            let pannable = false;
            for (let ax in this.axes) {
                if (this.axes[ax].pan || this.axes[ax].zoom) {
                    pannable = true;
                    break;
                }
            }

            if (pannable) {
                this.mc = new Hammer.Manager(this.inputDiv.node());
                var pan = new Hammer.Pan();
                var pinch = new Hammer.Pinch();
                pan.recognizeWith(pinch);
                this.mc.add([pan, pinch]);

                this.mc.on("pinchstart", function (ev) {
                    thisplot.#lastzoom = 1;
                    thisplot.#lastPinchx = ev.center.x;
                    thisplot.#lastPinchy = ev.center.y;
                });

                this.mc.on("pinch", function (ev) {
                    thisplot.zoom(1 / (ev.scale / thisplot.#lastzoom), ev.center.x, ev.center.y);
                    thisplot.#lastzoom = ev.scale;
                });

                this.mc.on("pinchmove", function (ev) {
                    thisplot.pan(ev.center.x - thisplot.#lastPinchx, ev.center.y - thisplot.#lastPinchy);
                    thisplot.#lastPinchx = ev.center.x;
                    thisplot.#lastPinchy = ev.center.y;
                    thisplot.#lastPanx -= ev.center.x - thisplot.#lastPinchx;
                    thisplot.#lastPany -= ev.center.y - thisplot.#lastPinchy;
                    // d3.select("#debug").text("pinchmove");
                });

                this.mc.on("panstart", function (ev) {
                    thisplot.#lastPanx = ev.deltaX;
                    thisplot.#lastPany = ev.deltaY;
                    // d3.select("#debug").text("panstart");
                });

                this.mc.on("pan", function (ev) {
                    thisplot.pan(ev.deltaX - thisplot.#lastPanx, ev.deltaY - thisplot.#lastPany);
                    thisplot.#lastPanx = ev.deltaX;
                    thisplot.#lastPany = ev.deltaY;
                    // d3.select("#debug").text(ev.deltaX);
                });
            }

            //       data, axes, labels, dimensions
            this.update(true, true, true, true);

            window.addEventListener("resize", () => this.update(false, true, true, true));
        }

        clear() {
            const gl = this.gl;
            gl.clearColor(1.0, 1.0, 1.0, 1.0);  // Clear to black, fully opaque
            gl.clearDepth(1.0);                 // Clear everything
            gl.disable(gl.DEPTH_TEST);           // Enable depth testing
            // gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        }

        draw() {
            this.clear();
            for (let datum in this.data) {
                setDataMatrices(this, datum);
                for (let mat in this.data[datum].materials) {
                    if (this.materials[mat]) this.materials[mat].render(this.#buffers.data[datum][mat], this.data[datum].materials[mat])
                }
            }
            setChartMatrices(this);
            for (let ax in this.axes) {
                if (this.axes[ax].grid) {
                    for (let mat in this.axes[ax].grid) {
                        if (this.materials[mat]) this.materials[mat].render(this.#buffers.grid[ax][mat], this.axes[ax].grid[mat])
                    }
                }
            }
            for (let ax in this.axes) {
                for (let mat in this.axes[ax].materials) {
                    if (this.materials[mat]) this.materials[mat].render(this.#buffers.axes[ax][mat], this.axes[ax].materials[mat])
                }
            }
        }

        makeLabels() {
            this.labelDiv.selectAll("div").data(Object.keys(this.axes)).enter().append("div").attr("id", (d) => d);
            for (let ax in this.axes) {
                let axis = this.axes[ax]
                if (axis.label) {
                    if (!axis.label.__labelnode) {
                        axis.label.__labelnode = this.labelDiv.append("div")
                            .attr("id", ax + "label")
                            .attr("class", axis.label.classes)
                            .style("position", "absolute")
                            .html(axis.label.text);
                    }
                    axis.label.__labelnode
                        .style("left", ((axis.xy == 'x') ? 0.5 * (axis.pixelMin + axis.pixelMax) : 0) + "px")
                        .style("bottom", ((axis.xy == 'x') ? 0 : 0.5 * (axis.pixelMin + axis.pixelMax)) + "px");
                }
                if (axis.ticks && axis.ticks.labels) {
                    let ticks = this.labelDiv.select("#" + ax).selectAll("div").data(axis.ticks.ticks);
                    ticks.exit().remove();
                    ticks.enter().append("div")
                        .merge(ticks)
                        .attr("class", axis.ticks.classes)
                        .style("position", "absolute")
                        .style("left", (d) => d.px + "px")
                        .style("bottom", (d) => d.py + "px")
                        .html((d) => (axis.ticks.tickFormatter) ? axis.ticks.tickFormatter(d.v) : +(d.v).toPrecision(4));
                }
            }
        }

        updateDimensions() {
            let scale = window.devicePixelRatio;
            let rect = this.root.getBoundingClientRect();

            if (this.options.aspect) {
                if (this.options.aspect < 0) {
                    rect.width = -(rect.height * this.options.aspect);
                    this.root.style.width = rect.width + "px";
                }
                else {
                    rect.height = (rect.width / this.options.aspect);
                    this.root.style.height = rect.height + "px";
                }
            }

            this.dimensions.width = rect.width - this.options.margins.right - this.options.margins.left;
            this.dimensions.height = rect.height - this.options.margins.top - this.options.margins.bottom;
            this.dimensions.left = this.options.margins.left;
            this.dimensions.right = rect.width - this.options.margins.right;
            this.dimensions.top = rect.height - this.options.margins.top;
            this.dimensions.bottom = this.options.margins.bottom;

            // canvas.setAttribute("width", (window.innerWidth) + "px");
            // canvas.setAttribute("height", (window.innerWidth / options.aspect) + "px");
            this.canvas.style.transformOrigin = "top left";
            this.canvas.setAttribute("width", Math.round(rect.width * scale) + "px");
            this.canvas.setAttribute("height", Math.round(rect.height * scale) + "px");
            this.canvas.style.transform = "scale(" + (1 / scale) + ", " + (1 / scale) + ")";

            this.viewport.width = Math.round(this.canvas.clientWidth - (this.options.margins.right + this.options.margins.left) * scale);
            this.viewport.height = Math.round(this.canvas.clientHeight - (this.options.margins.top + this.options.margins.bottom) * scale);
            this.viewport.left = Math.round(this.options.margins.left * scale);
            this.viewport.right = Math.round(this.canvas.clientWidth - (this.options.margins.right) * scale);
            this.viewport.rightMargin = Math.round(this.options.margins.right * scale);
            this.viewport.top = Math.round(this.canvas.clientHeight - (this.options.margins.top) * scale);
            this.viewport.topMargin = Math.round(this.options.margins.top * scale);
            this.viewport.bottom = Math.round(this.options.margins.bottom * scale);

            this.inputDiv
                .style("top", this.options.margins.top + "px")
                .style("left", this.options.margins.left + "px")
                .style("right", this.options.margins.right + "px")
                .style("bottom", this.options.margins.bottom + "px");
        }

        updateAxis(ax) {
            const axis = this.axes[ax];

            if (axis.linkAxis) {
                let linkAxis = this.axes[axis.linkAxis];
                axis.min = linkAxis.min;
                axis.max = linkAxis.max;
            }
            else if (axis.min === undefined || axis.max === undefined) {
                // get min/max values of assigned data 
                let min = Number.MAX_VALUE;
                let max = -Number.MAX_VALUE;
                for (let datum in this.data) {
                    if ((axis.xy === 'y') ? this.data[datum].yaxis == ax : this.data[datum].xaxis == ax) {
                        if (this.data[datum].data) this.data[datum].data.map(el => {
                            if (el) {
                                min = Math.min(min, (axis.xy === 'y') ? el[1] : el[0]);
                                max = Math.max(max, (axis.xy === 'y') ? el[1] : el[0]);
                            }
                        })
                    }
                }
                if (axis.min === undefined) axis.min ||= min;
                if (axis.max === undefined) axis.max ||= max;
            }

            axis.toPixel = function (v) {
                return axis.pixelMin + (v - axis.min) / (axis.max - axis.min) * (axis.pixelMax - axis.pixelMin);
            }
            axis.fromPixel = function (v) {
                return axis.min + (v) / (axis.pixelMax - axis.pixelMin) * (axis.max - axis.min);
            }
            axis.toViewport = function (v) {
                return axis.viewportMin + (v - axis.min) / (axis.max - axis.min) * (axis.viewportMax - axis.viewportMin);
            }
            // axis.fromViewport = function (v) {
            //     return axis.min + (v) / (axis.viewportMax - axis.viewportMin) * (axis.max - axis.min);
            // }

            let lines = [];
            if (axis.xy === 'y') {
                let xPos = (axis.position === 'right') ? this.viewport.right : this.viewport.left;
                let pxPos = (axis.position === 'right') ? this.dimensions.right : this.dimensions.left;
                axis.pixelMin = this.dimensions.bottom;
                axis.pixelMax = this.dimensions.top;
                axis.viewportMin = this.viewport.bottom;
                axis.viewportMax = this.viewport.top;
                lines = [[xPos, this.viewport.bottom], [xPos, this.viewport.top], null];
                if (axis.ticks) {
                    axis.ticks.ticks = [];
                    for (let v of getTicksForInterval([axis.min, axis.max], axis.ticks.tickNumber, axis.ticks.tickIntervals)) {
                        let y = axis.toViewport(v);
                        lines.push([xPos - 5, y]);
                        lines.push([xPos + 5, y]);
                        lines.push(null);
                        axis.ticks.ticks.push({
                            x: xPos,
                            y: y,
                            px: pxPos,
                            py: axis.toPixel(v),
                            v: v
                        });
                    }
                }
            }
            else {
                let yPos = (axis.position === 'top') ? this.viewport.top : this.viewport.bottom;
                let pyPos = (axis.position === 'top') ? this.dimensions.top : this.dimensions.bottom;
                axis.pixelMin = this.dimensions.left;
                axis.pixelMax = this.dimensions.right;
                axis.viewportMin = this.viewport.left;
                axis.viewportMax = this.viewport.right;
                lines = [[this.viewport.left, yPos], [this.viewport.right, yPos], null];
                if (axis.ticks) {
                    axis.ticks.ticks = [];
                    for (let v of getTicksForInterval([axis.min, axis.max], axis.ticks.tickNumber, axis.ticks.tickIntervals)) {
                        let x = axis.toViewport(v);
                        lines.push([x, yPos - 5]);
                        lines.push([x, yPos + 5]);
                        lines.push(null);
                        axis.ticks.ticks.push({
                            x: x,
                            y: yPos,
                            px: axis.toPixel(v),
                            py: pyPos,
                            v: v
                        });
                    }
                }
            }
            for (let mat in axis.materials) {
                if (this.materials[mat]) {
                    if (this.#buffers.axes[ax]) this.materials[mat].clearBuffers(this.#buffers.axes[ax][mat]);
                    else this.#buffers.axes[ax] = {};
                    this.#buffers.axes[ax][mat] = this.materials[mat].generateBuffers(lines, this.axes[ax].materials[mat]);
                }
            }

            if (axis.grid) {
                let gridlines = [];
                for (let tick of axis.ticks.ticks) {
                    if (axis.xy === 'y') {
                        gridlines.push([this.viewport.left, tick.y]);
                        gridlines.push([this.viewport.right, tick.y]);
                        gridlines.push(null);
                    }
                    else {
                        gridlines.push([tick.x, this.viewport.bottom]);
                        gridlines.push([tick.x, this.viewport.top]);
                        gridlines.push(null);
                    }
                }
                for (let mat in axis.grid) {
                    if (this.materials[mat]) {
                        if (this.#buffers.grid[ax]) this.materials[mat].clearBuffers(this.#buffers.grid[ax][mat]);
                        else this.#buffers.grid[ax] = {};
                        this.#buffers.grid[ax][mat] = this.materials[mat].generateBuffers(gridlines, axis.grid[mat]);
                    }
                }
            }
        }

        updateAxes() {
            for (let ax in this.axes) {
                this.updateAxis(ax)
            }
        }

        updateDatum(datum) {
            for (let mat in this.data[datum].materials) {
                if (this.materials[mat]) {
                    if (this.#buffers.data[datum]) this.materials[mat].clearBuffers(this.#buffers.data[datum][mat]);
                    else this.#buffers.data[datum] = {};
                    this.#buffers.data[datum][mat] = this.materials[mat].generateBuffers(this.data[datum].data, this.data[datum].materials[mat]);
                }
            }
        }

        updateData() {
            for (let d in this.data) {
                this.updateDatum(d)
            }
        }

        update(data, axes, labels, dimensions) {
            if (this.updating) return;
            this.updating = true;

            if (dimensions) this.updateDimensions();
            if (data) this.updateData();
            if (axes) this.updateAxes();
            this.draw();
            if (labels) this.makeLabels();

            window.requestAnimationFrame((t) => {
                delete this.updating;
            });
        }


        zoom(fac, x, y) {
            y = this.dimensions.height - y;
            for (let ax in this.axes) {
                let axis = this.axes[ax];
                if (!axis.linkAxis && axis.zoom) {
                    if (axis.zoom.maxRange) fac = Math.min(fac, axis.zoom.maxRange / (axis.max - axis.min))
                    if (axis.zoom.minRange) fac = Math.max(fac, axis.zoom.minRange / (axis.max - axis.min))
                    let mid = (axis.min + axis.max) / 2;
                    let zoomPivot = axis.fromPixel((axis.xy === 'x') ? x : y) - mid;
                    let r = (axis.max - mid) * fac;
                    if (axis.zoom.minRange) r = Math.max(axis.zoom.minRange / 2, r);
                    if (axis.zoom.maxRange) r = Math.min(axis.zoom.maxRange / 2, r);
                    axis.min = mid - r;
                    axis.max = mid + r;
                    axis.min -= zoomPivot * (fac - 1);
                    axis.max -= zoomPivot * (fac - 1);
                    this.panAxis(axis, 0, 0);
                }
            }
            // data, axes, labels, dimensions
            this.update(false, true, true, false);
        }

        panAxis(axis, dx, dy) {
            if (axis.linkAxis || !axis.pan) return false;

            if (axis.xy === 'x') {
                let facx = (axis.max - axis.min) / (this.dimensions.width);
                axis.min -= dx * facx;
                axis.max -= dx * facx;
            }
            else {
                let facy = (axis.max - axis.min) / (this.dimensions.height);
                axis.min += dy * facy;
                axis.max += dy * facy;
            }
            if (typeof(axis.pan.max) == "number" && axis.max > axis.pan.max) {
                axis.min += axis.pan.max - axis.max;
                axis.max += axis.pan.max - axis.max;
            }
            if (typeof (axis.pan.min) == "number" && axis.min < axis.pan.min) {
                axis.max += axis.pan.min - axis.min;
                axis.min += axis.pan.min - axis.min;
            }
            return true;
        }

        pan(dx, dy) {
            let needsUpdate = false;
            for (let ax in this.axes) needsUpdate |= this.panAxis(this.axes[ax], dx, dy);
            //                           data, axes, labels, dimensions
            if (needsUpdate) this.update(false, true, true, false);
        }
    };

    exports.Plot = Plot;
    exports.Material = Material;
})));
