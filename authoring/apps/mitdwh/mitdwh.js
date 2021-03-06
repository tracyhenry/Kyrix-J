// libraries
const Project = require("../../src/index").Project;
const Jump = require("../../src/Jump").Jump;
const SSV = require("../../src/template-api/SSV").SSV;
const StaticAggregation = require("../../src/template-api/StaticAggregation")
    .StaticAggregation;

// construct a project
var p = new Project("mitdwh", "../../../config.txt");

/******************************** canvases ********************************/
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
            mode: "dot",
            config: {
                clusterCount: false,
                dotSizeColumn: "building_height",
                dotSizeDomain: [0, 275],
                dotSizeLegendTitle: "Building Height (ft)",
                dotColorColumn: "building_type",
                dotColorDomain: ["RESIDENT", "ACADEMIC", "SERVICE"],
                dotColorLegendTitle: "Building Type"
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
        topLevelWidth: 1000,
        topLevelHeight: 1000
    }
};

var ret = p.addSSV(new SSV(ssv));
var building_pyramid = ret.pyramid;
var kyrixView = ret.view;

// ================== room treemap ===================
var staticAggregation = {
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

var roomTreemapCanvas = p.addStaticAggregation(
    new StaticAggregation(staticAggregation),
    {
        view: kyrixView
    }
).canvas;

// ================== room circlepack ===================
var staticAggregation = {
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

var roomCirclePackCanvas = p.addStaticAggregation(
    new StaticAggregation(staticAggregation),
    {
        view: kyrixView
    }
).canvas;

// ================== Canvas student pie chart ===================
var staticAggregation = {
    db: "mit",
    query: {
        table: "mit_student_directory",
        dimensions: ["student_year"],
        measure: "COUNT(*)",
        sampleFields: ["full_name", "department_name", "office_location"]
    },
    type: "pie",
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
    colorScheme: "schemePastel1"
};

var studentPieChartCanvas = p.addStaticAggregation(
    new StaticAggregation(staticAggregation),
    {view: kyrixView}
).canvas;

// ================== room stacked bar chart ===================
var staticAggregation = {
    db: "mit",
    query: {
        table: "fclt_rooms",
        dimensions: ["major_use_desc"],
        stackDimensions: ["use_desc"],
        measure: "SUM(area)",
        sampleFields: [
            "building_room",
            "fclt_building_key",
            "organization_name"
        ]
    },
    type: "bar",
    colorScheme: "schemeSet3",
    tooltip: {
        columns: ["major_use_desc", "use_desc", "kyrixAggValue"],
        aliases: ["Major Use", "Minor Use", "Area"]
    },
    legend: {
        title: "Major/Minor Usages of Rooms"
    },
    axis: {
        xTitle: "Major Use",
        yTitle: "Total Area (sq ft)"
    }
};

var roomBarChartCanvas = p.addStaticAggregation(
    new StaticAggregation(staticAggregation),
    {view: kyrixView}
).canvas;

// ================== course bar chart ===================
var staticAggregation = {
    db: "mit",
    query: {
        table: "course_catalog_subject_offered",
        dimensions: ["department_name"],
        measure: "SUM(total_units)",
        sampleFields: ["subject_title", "department_code", "meet_place"]
    },
    type: "bar",
    tooltip: {
        columns: ["department_name", "kyrixAggValue"],
        aliases: ["Department Name", "Total Units Offered"]
    },
    legend: {
        title: "Departments and Their Total Units of Classes Offered"
    },
    axis: {
        xTitle: "Department",
        yTitle: "Total Units"
    }
};

var courseBarChartCanvas = p.addStaticAggregation(
    new StaticAggregation(staticAggregation),
    {view: kyrixView}
).canvas;

// ================== building word cloud ===================
var staticAggregation = {
    db: "mit",
    query: {
        table: "fclt_building",
        dimensions: ["building_name", "fclt_building_key"],
        measure: "SUM(random() * 100)",
        sampleFields: [
            "building_number",
            "parent_building_number",
            "parent_building_name",
            "parent_building_name_long",
            "building_name_long",
            "ext_gross_area",
            "assignable_area",
            "non_assignable_area",
            "site",
            "campus_sector",
            "access_level_code",
            "access_level_name",
            "building_type"
        ]
    },
    type: "wordCloud",
    tooltip: {
        columns: ["building_name"],
        aliases: ["building_name"]
    },
    padding: 15,
    legend: {
        title: "Primary keys of table FCLT_BUILDING (random text size)"
    },
    textFields: ["building_name"],
    cloud: {
        maxTextSize: 65,
        fontFamily: "Arial"
    }
};

var buildingWordCloudCanvas = p.addStaticAggregation(
    new StaticAggregation(staticAggregation),
    {view: kyrixView}
).canvas;

// ================== room word cloud ===================
var staticAggregation = {
    db: "mit",
    query: {
        table: "fclt_rooms",
        dimensions: ["building_room"],
        measure: "SUM(random() * 100)",
        sampleFields: [
            "fclt_room_key",
            "fclt_building_key",
            "floor2",
            "room",
            "space_id",
            "major_use_desc",
            "use_desc",
            "minor_use_desc"
        ]
    },
    type: "wordCloud",
    tooltip: {
        columns: ["building_room"],
        aliases: ["building_room"]
    },
    padding: 15,
    legend: {
        title: "Primary keys of table FCLT_ROOMS (random text size)"
    },
    textFields: ["building_room"],
    cloud: {
        maxTextSize: 65,
        fontFamily: "Arial"
    }
};

var roomWordCloudCanvas = p.addStaticAggregation(
    new StaticAggregation(staticAggregation),
    {view: kyrixView}
).canvas;

// ================== course word cloud ===================
var staticAggregation = {
    db: "mit",
    query: {
        table: "course_catalog_subject_offered",
        dimensions: ["subject_title"],
        measure: "MIN(random() * 100)",
        sampleFields: [
            "academic_year",
            "term_code",
            "subject_code",
            "subject_number",
            "is_printed_in_bulletin",
            "department_code",
            "department_name",
            "effective_term_code",
            "subject_short_title",
            "is_variable_units",
            "lecture_units",
            "lab_units",
            "preparation_units",
            "design_units"
        ]
    },
    type: "wordCloud",
    tooltip: {
        columns: ["subject_title"],
        aliases: ["subject_title"]
    },
    padding: 15,
    legend: {
        title:
            "Primary keys of table COURSE_CATALOG_SUBJECT_OFFERED (random text size)"
    },
    textFields: ["subject_title"],
    cloud: {
        maxTextSize: 65,
        fontFamily: "Arial"
    }
};

var courseWordCloudCanvas = p.addStaticAggregation(
    new StaticAggregation(staticAggregation),
    {view: kyrixView}
).canvas;

// ================== student word cloud ===================
var staticAggregation = {
    db: "mit",
    query: {
        table: "mit_student_directory",
        dimensions: ["full_name"],
        measure: "SUM(random() * 100)",
        sampleFields: [
            "first_name",
            "middle_name",
            "last_name",
            "office_location",
            "office_phone",
            "email_address",
            "department",
            "department_name",
            "student_year",
            "full_name_uppercase",
            "warehouse_load_date"
        ]
    },
    type: "wordCloud",
    tooltip: {
        columns: ["full_name"],
        aliases: ["full_name"]
    },
    padding: 15,
    legend: {
        title: "Primary keys of table MIT_STUDENT_DIRECTORY (random text size)"
    },
    textFields: ["full_name"],
    cloud: {
        maxTextSize: 65,
        fontFamily: "Arial"
    }
};

var studentWordCloudCanvas = p.addStaticAggregation(
    new StaticAggregation(staticAggregation),
    {view: kyrixView}
).canvas;

/******************************** jumps ********************************/
// ================== building ssv -> room treemap ===================
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
        new Jump(building_pyramid[i], roomTreemapCanvas, "slide", {
            selector: selector,
            viewport: newViewport,
            predicates: newPredicate,
            name: jumpName,
            noPrefix: true,
            slideSuperman: true
        })
    );
}

// ================== building word cloud -> room treemap ===================
var selector = function(row) {
    return row != null && typeof row == "object" && "kyrixAggValue" in row;
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

var jumpName = function() {
    return "Table FCLT_ROOMS [Treemap]";
};

p.addJump(
    new Jump(buildingWordCloudCanvas, roomTreemapCanvas, "slide", {
        selector: selector,
        viewport: newViewport,
        predicates: newPredicate,
        name: jumpName,
        noPrefix: true,
        slideSuperman: true
    })
);

// ================== building word cloud -> room circlepack ===================
var jumpName = function() {
    return "Table FCLT_ROOMS [Circle Pack]";
};

p.addJump(
    new Jump(buildingWordCloudCanvas, roomCirclePackCanvas, "slide", {
        selector: selector,
        viewport: newViewport,
        predicates: newPredicate,
        name: jumpName,
        noPrefix: true,
        slideSuperman: true
    })
);

// ================== building word cloud -> room stacked barchart ===================
var jumpName = function() {
    return "Table FCLT_ROOMS [Bar Chart]";
};

p.addJump(
    new Jump(buildingWordCloudCanvas, roomBarChartCanvas, "slide", {
        selector: selector,
        viewport: newViewport,
        predicates: newPredicate,
        name: jumpName,
        noPrefix: true,
        slideSuperman: true
    })
);

// ================== room treemap -> room bar chart ===================
var newPredicate = function(row, args) {
    var pred = {
        AND: [
            {"==": args.predicates.layer0["=="]},
            {"==": ["organization_name", row.organization_name]}
        ]
    };
    return {layer0: pred, layer1: pred};
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
var newPredicate = function(row, args) {
    var pred = {
        AND: [args.predicates.layer0, {"==": ["use_desc", row.use_desc]}]
    };
    return {layer0: pred, layer1: pred};
};

var jumpName = function(row) {
    return `rooms with major use "${row.major_use_desc}" and minor use "${row.use_desc}"`;
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
var newPredicate = function(row) {
    var pred = {
        "==": ["meet_place", row.building_room]
    };
    return {layer0: pred, layer1: pred};
};

var jumpName = function(row) {
    return `Courses taught in room ${row.building_room}`;
};

p.addJump(
    new Jump(roomCirclePackCanvas, courseBarChartCanvas, "slide", {
        selector: selector,
        viewport: newViewport,
        predicates: newPredicate,
        name: jumpName,
        noPrefix: true,
        slideSuperman: true
    })
);

// ================== room circle pack -> student pie chart ===================
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
    new Jump(roomCirclePackCanvas, studentPieChartCanvas, "slide", {
        selector: selector,
        viewport: newViewport,
        predicates: newPredicate,
        name: jumpName,
        noPrefix: true,
        slideSuperman: true
    })
);

// ================== course bar chart -> student pie chart ===================
var newPredicate = function(row) {
    var pred = {
        "==": ["department_name", row.department_name]
    };
    return {layer0: pred, layer1: pred};
};

var jumpName = function(row) {
    return `Students in ${row.department_name}`;
};

p.addJump(
    new Jump(courseBarChartCanvas, studentPieChartCanvas, "slide", {
        selector: selector,
        viewport: newViewport,
        predicates: newPredicate,
        name: jumpName,
        noPrefix: true,
        slideSuperman: true
    })
);

// save to db
p.saveProject();
