jsglplot
-
A minimal js module for simple data plotting with webGL.

Examples
-
[Basic plotting](https://blingnow.github.io/jsglplot/examples/basic.html)
[Panning and zooming](https://blingnow.github.io/jsglplot/examples/panzoom.html)
[Axes grid](https://blingnow.github.io/jsglplot/examples/grid.html)


Plotting with jsglplot
-
A *jsglplot* plot can be created using the module's *Plot* method:

	jsglplot.Plot(selector, config);

**selector** is used to select a DOM element within which the plot canvas will be created, e.g. "#canvasID". The configuration dictionary **config** must be defined using the following layout:

    config = 
    {
        data: {
            DATA_LABEL1: {
                data: array_object,
                xaxis: XAXIS_LABEL,
                yaxis: YAXIS_LABEL,
                materials: {
                    MATERIAL_LABEL: {
	                    [material options]
                    },
                    ...
                }
            },
            ...
        },
        axes: {
            AXIS_LABEL1: {
                xy: "x" | "y",
                [min: number],
                [max: number],
                [position: ("left" | "right" | "top" | "bottom")],
                [materials: {
                    MATERIAL_LABEL: {
                        [material options]
                    },
                    ...
                }],
                [ticks: {
                    labels: true|false,
                    [classes: string],
                    [tickFormatter: function(number) => string]
                }],
                [label: {
                    text: string,
                    [classes: string]
                }],
                [grid: {
                    MATERIAL_LABEL: {
                        [material options]
                    },
                    ...
                }],
                [pan: {
                    [min: number],
                    [max: number],
                }],
                [zoom: {
                    [minRange: number],
                    [maxRange: number],
                }],
                [linkAxis: AXIS_LABEL string],
            },
            ...
        },
        options: {
            [aspect: number],
            [margins: {
                [left: number],
                [right: number],
                [top: number],
                [bottom: number],
            }],
            [materials: {
                MATERIAL_LABEL1: Material object,
                ...
            }]
        }
    }

**data** declaration:
 - Dictionary of data declarations with unique **DATA_LABEL**s, each as a dictionary with the following entries:
	 - **data**: A 2-dimensional **array** object with data coordinates. Format: [[x1, y1], [x2, y2], ... ]
	 - **xaxis**: The **AXIS_LABEL** of the axis to be used as x-axis for this dataset
	 - **yaxis**: The **AXIS_LABEL** of the axis to be used as y-axis for this dataset
	 - **materials**: A dictionary of materials to be used to render the data. Each dictionary entry must be named according to the **MATERIAL_LABEL** of the material to be used. Options for each material can be set via **material options** for each material dictionary entry.

**axes** declaration:
 - Dictionary of axis declarations with unique **AXIS_LABEL**s, each as a dictionary with the following entries:
	 - **xy**: Either "x" or "y" to define a horizontal or vertical axis.
	 - **min**: *Optional*. Minimum value of the axis extent. When unset, will use the minimum value of all data entries using this axis.
	 - **max**: *Optional*. Maximum value of the axis extent. When unset, will use the maximum value of all data entries using this axis.
	 - **position**:  *Optional*. Choose from "left", "right" for y-axis, or "top", "bottom" for x-axis.
	 - **materials**: *Optional*. A dictionary of materials to be used to render the axis and ticks. Each dictionary entry must be named according to the **MATERIAL_LABEL** of the material to be used. Options for each material can be set via **material options** for each material dictionary entry.
	 - **yaxis**: The **AXIS_LABEL** of the axis to be used as y-axis for this dataset
	 - **materials**: A dictionary of materials to be used to render the data. Each dictionary entry must be named according to the **MATERIAL_LABEL** of the material to be used. Options for each material can be set via **material options** for each dictionary entry.
	 - **ticks**: *Optional*. A dictionary with tick options. Will draw axis ticks when set. Options:
		 - **labels**: *Optional*. Will draw tick labels if *true*.
		 - **classes**: *Optional*. string with a whitespace-separated CSS class list for labels.
		 - **tickFormatter**: *Optional*. Function taking a coordinate number as parameter and returning a string to be used as the tick label. Will use *(coord) => (coord).toPrecision(4)* if unset.
		 - **tickNumber**: *Optional*. Desired number of ticks to be automatically generated for the given axis extent. *Default value: 12*
		 - **tickIntervals**: *Optional*. List of allowed intervals between adjacent ticks. The tick interval will be chosen from this list to best match the number of generated ticks to the chosen **tickNumber**.
	 - **label**: *Optional*.  A dictionary with label options. Will draw an axis label when set. Options:
		 - **text**: string to be used as label.
		 - **classes**: *Optional*. string with a whitespace-separated CSS class list for the label.
	 - **grid**: *Optional*. A dictionary of materials to be used to render the axis grid. Each dictionary entry must be named according to the **MATERIAL_LABEL** of the material to be used. Options for each material can be set via **material options** for each dictionary entry. Will draw grid lines at the positions of the axis ticks. Grid lines will be horizontal for y-axes, vertical for x-axes.
	 - **pan**: *Optional*. A dictionary with panning options. The axis can be panned via mouse or touch input when set. Options:
		 - **min**: *Optional*. Minimum data value below which the axis cannot be panned.
		 - **max**: *Optional*. Maximum data value above which the axis cannot be panned.
	 - **zoom**: *Optional*. A dictionary with zooming options. The axis can be zoomed via mouse wheel or pinch input when set. Options:
		 - **minRange**: *Optional*. Minimum axis extent below which the axis cannot be zoomed.
		 - **maxRange**: *Optional*. Maximum axis extent above which the axis cannot be zoomed.
	 - **linkAxis**: *Optional*. A string equal to the **AXIS_LABEL** to which this axis will be linked. When set, the axis extent will be copied from the chosen axis. Will ignore **min, max, pan, zoom** options if set.

**options** declaration:
 - Dictionary of various plot options:
	 - **aspect**: *Optional*. When set to a positive number, will set canvas height from its width with the chosen aspect ratio. When negative, will set canvas width from its height with the chosen aspect ratio.
	 - **margins**: *Optional*. A dictionary with margin options.
		 - **left**: *Optional*. Left plot margin in px.
		 - **right**: *Optional*. Right plot margin in px.
		 - **top**: *Optional*. Top plot margin in px.
		 - **bottom**: *Optional*. Bottom plot margin in px.

Materials
-
The following built-in materials are available. Each **MATERIAL_LABEL** in the plot configuration must be equal to one of **lineSolid**, **lineDashed**, or **fill**. For the chosen material, the following options can be set:

    lineSolid: {
        [width: number],
        [color: [r,g,b,a]],             # r,g,b,a within [0,1]
    }
    
    lineDashed: {
        [width: number],
        [color: [r,g,b,a]],             # r,g,b,a within [0,1]
        [dashes: [number, number]],     # dashinterval, dashlength
    }
    
    fill: {
        [color: [r,g,b,a]],             # r,g,b,a within [0,1]
        [baseline: number],             # fill curve between datapoints and baseline
    }
    
