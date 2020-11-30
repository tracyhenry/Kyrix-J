// libraries
const Project = require("../../src/index").Project;
const Canvas = require("../../src/Canvas").Canvas;
const Jump = require("../../src/Jump").Jump;
const Layer = require("../../src/Layer").Layer;
const SSV = require("../../src/template-api/SSV").SSV;
const Pie = require("../../src/template-api/Pie").Pie;
const StaticHierarchy = require("../../src/template-api/StaticHierarchy")
    .StaticHierarchy;

// project components
const renderers = require("./renderers");
const transforms = require("./transforms");

// construct a project
var p = new Project("mitdwh", "../../../config.txt");
p.addRenderingParams(renderers.renderingParams);
var vw = 1000,
    vh = 1000;
var demo1 = false;

// SSV of buildings
var ssv = {
    data: {
        db: "mit",
        query:
            "select building_name, fclt_building_key, building_type, building_height, date_built, num_of_rooms, assignable_area from Fclt_building;"
    },
    layout: {
        x: {
            field: "num_of_rooms",
            extent: [0, 1400]
        },
        y: {
            field: "assignable_area",
            extent: [300000, 0]
        },
        z: {
            field: "building_height",
            order: "desc"
        }
    },
    marks: {
        cluster: {
            mode: "custom",
            custom: renderers.buildingCircleRendering,
            config: {
                clusterCount: false,
                bboxW: 30,
                bboxH: 30
            }
        },
        hover: {
            tooltip: {
                columns: [
                    "building_name",
                    "fclt_building_key",
                    "building_type",
                    "building_height",
                    "num_of_rooms",
                    "assignable_area"
                ],
                aliases: [
                    "Building Name",
                    "Building ID",
                    "Building Type",
                    "Building Height",
                    "# of Rooms",
                    "Area"
                ]
            }
        }
    },
    config: {
        axis: true,
        xAxisTitle: "Number of Rooms",
        yAxisTitle: "Assignable Area (sq ft)",
        numLevels: 4,
        topLevelWidth: vw,
        topLevelHeight: vh
    }
};

var buildingLegendLayer = new Layer(null, true);
buildingLegendLayer.addRenderingFunc(renderers.buildingLegendRendering);

var ret = p.addSSV(new SSV(ssv));
var building_pyramid = ret.pyramid;
var kyrixView = ret.view;
for (var i = 0; i < building_pyramid.length; i++) {
    building_pyramid[i].addLayer(buildingLegendLayer);
}

// ================== Canvas treemap ===================
var staticHierarchy = {
    db: "mit",
    query: {
        table: "fclt_rooms",
        dimensions: ["fclt_building_key", "organization_name"],
        measure: "SUM(area)",
        sampleFields: ["building_room"]
    },
    type: "treemap",
    tooltip: {
        columns: ["organization_name", "kyrixAggValue"],
        aliases: ["Organization", "Area"]
    },
    legend: {
        title: "Total Area by Organization"
    },
    textFields: ["organization_name"]
};

var roomTreemapCanvas = p.addStaticHierarchy(
    new StaticHierarchy(staticHierarchy),
    {
        view: kyrixView
    }
).canvas;

// ================== Canvas stacked bar chart ===================
var roomBarChartCanvas = new Canvas("room_barchart", vw, vh);
p.addCanvas(roomBarChartCanvas);

// static bar chart layer
var roomBarChartLayer = new Layer(transforms.roomBarChartStaticTransform, true);
roomBarChartCanvas.addLayer(roomBarChartLayer);
roomBarChartLayer.addRenderingFunc(renderers.roomBarChartRendering);
roomBarChartLayer.addTooltip(
    ["major_use", "minor_use", "area"],
    ["Major use", "Minor Use", "Area"]
);

// ================== Canvas course bar chart ===================
var courseBarChartCanvas = new Canvas("course_bar", vw, vh);
p.addCanvas(courseBarChartCanvas);

// static circle pack layer
var courseBarChartLayer = new Layer(
    transforms.courseBarChartStaticTransform,
    true
);
courseBarChartCanvas.addLayer(courseBarChartLayer);
courseBarChartLayer.addRenderingFunc(renderers.courseBarChartRendering);
courseBarChartLayer.addTooltip(
    ["name", "class_count", "totalUnits"],
    ["Department Name", "Number of Classes", "Total Units Offered"]
);

// ================== Canvas circlepack ===================
var staticHierarchy = {
    db: "mit",
    query: {
        table: "fclt_rooms",
        dimensions: ["building_room"],
        measure: "SUM(area)",
        sampleFields: ["fclt_building_key", "organization_name", "use_desc"]
    },
    type: "circlePack",
    tooltip: {
        columns: ["building_room", "kyrixAggValue"],
        aliases: ["Room", "Area"]
    },
    legend: {
        title: "Rooms and Their Occupied Area"
    },
    textFields: ["building_room"]
};

var roomCirclePackCanvas = p.addStaticHierarchy(
    new StaticHierarchy(staticHierarchy),
    {
        view: kyrixView
    }
).canvas;

// ================== Canvas student pie chart ===================
var pie = {
    db: "mit",
    query: {
        table: "mit_student_directory",
        dimensions: ["student_year"],
        measure: "COUNT(*)",
        sampleFields: ["full_name", "department", "office_location"]
    },
    tooltip: {
        columns: ["student_year", "kyrixAggValue"],
        aliases: ["Student Year", "Number of Students"]
    },
    legend: {
        title: "Number of students by Year",
        domain: {
            "": "N/A",
            "1": "Freshmen",
            "2": "Sophomore",
            "3": "Junior",
            "4": "Senior",
            U: "Undesignated Sophomore",
            G: "Graduate Students"
        }
    },
    colorScheme: "schemePastel1",
    transition: true
};

var studentPieChartCanvas = p.addPie(new Pie(pie), {view: kyrixView}).canvas;

// ================== building -> room treemap ===================
for (var i = 0; i < building_pyramid.length; i++) {
    var selector = function(row, args) {
        return args.layerId == 0;
    };

    var newViewport = function() {
        return {constant: [0, 0]};
    };

    var newPredicate = function(row) {
        var pred = {
            "==": ["fclt_building_key", row.fclt_building_key]
        };
        return {layer0: pred, layer1: pred};
    };

    var jumpName = function(row) {
        return "organization occupancy in " + row.building_name;
    };

    p.addJump(
        new Jump(
            building_pyramid[i],
            roomTreemapCanvas,
            demo1 ? "semantic_zoom" : "slide",
            {
                selector: selector,
                viewport: newViewport,
                predicates: newPredicate,
                name: jumpName,
                noPrefix: true,
                slideSuperman: true
            }
        )
    );
}

// ================== room treemap -> room bar chart ===================
var selector = function(row) {
    return row != null && typeof row == "object" && "kyrixAggValue" in row;
};

var newViewport = function() {
    return {constant: [0, 0]};
};

var newPredicate = function(row, args) {
    var pred0 = {
        AND: [
            {"==": args.predicates.layer0["=="]},
            {"==": ["organization_name", row.organization_name]}
        ]
    };
    return {layer0: pred0};
};

var jumpName = function(row) {
    return (
        "room usage of " +
        row.organization_name +
        " in building " +
        row.fclt_building_key
    );
};

p.addJump(
    new Jump(roomTreemapCanvas, roomBarChartCanvas, "semantic_zoom", {
        selector: selector,
        viewport: newViewport,
        predicates: newPredicate,
        name: jumpName,
        noPrefix: true
    })
);

// ================== room bar chart -> room circle pack ===================
var selector = function(row) {
    return row != null && typeof row == "object" && "minor_use" in row;
};

var newViewport = function() {
    return {constant: [0, 0]};
};

var newPredicate = function(row, args) {
    var pred = {
        AND: [args.predicates.layer0, {"==": ["use_desc", row.minor_use]}]
    };
    return {layer0: pred, layer1: pred};
};

var jumpName = function(row, args) {
    return (
        row.minor_use +
        " rooms used by " +
        args.predicates.layer0["AND"][1]["=="][1] +
        " in bldg " +
        args.predicates.layer0["AND"][0]["=="][1]
    );
};

p.addJump(
    new Jump(roomBarChartCanvas, roomCirclePackCanvas, "semantic_zoom", {
        selector: selector,
        viewport: newViewport,
        predicates: newPredicate,
        name: jumpName,
        noPrefix: true
    })
);

// ================== room circle pack -> course bar chart ===================
var selector = function(row) {
    return row != null && typeof row == "object" && "kyrixAggValue" in row;
};

var newViewport = function() {
    return {constant: [0, 0]};
};

var newPredicate = function(row) {
    var pred0 = {
        "==": ["meet_place", row.building_room]
    };
    return {layer0: pred0};
};

var jumpName = function(row) {
    return `Courses taught in room ${row.building_room}`;
};

p.addJump(
    new Jump(
        roomCirclePackCanvas,
        courseBarChartCanvas,
        demo1 ? "semantic_zoom" : "slide",
        {
            selector: selector,
            viewport: newViewport,
            predicates: newPredicate,
            name: jumpName,
            noPrefix: true,
            slideSuperman: true
        }
    )
);

// ================== room circle pack -> student pie chart ===================
var selector = function(row) {
    return row != null && typeof row == "object" && "kyrixAggValue" in row;
};

var newViewport = function() {
    return {constant: [0, 0]};
};

var newPredicate = function(row) {
    var pred = {
        "==": ["office_location", row.building_room]
    };
    return {layer0: pred, layer1: pred};
};

var jumpName = function(row) {
    return `Students in ${row.building_room}`;
};

p.addJump(
    new Jump(
        roomCirclePackCanvas,
        studentPieChartCanvas,
        demo1 ? "semantic_zoom" : "slide",
        {
            selector: selector,
            viewport: newViewport,
            predicates: newPredicate,
            name: jumpName,
            noPrefix: true,
            slideSuperman: true
        }
    )
);

// ================== course bar chart -> student pie chart ===================
var selector = function(row) {
    return row != null && typeof row == "object" && "name" in row;
};

var newViewport = function() {
    return {constant: [0, 0]};
};

var newPredicate = function(row) {
    var pred = {
        "==": ["department", row.dept_code]
    };
    return {layer0: pred, layer1: pred};
};

var jumpName = function(row) {
    return `Students in course ${row.dept_code}`;
};

p.addJump(
    new Jump(
        courseBarChartCanvas,
        studentPieChartCanvas,
        demo1 ? "semantic_zoom" : "slide",
        {
            selector: selector,
            viewport: newViewport,
            predicates: newPredicate,
            name: jumpName,
            noPrefix: true,
            slideSuperman: true
        }
    )
);

// save to db
p.saveProject();
