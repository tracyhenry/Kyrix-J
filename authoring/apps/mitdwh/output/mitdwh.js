// libraries
const Project = require("../../src/index").Project;
const Jump = require("../../src/Jump").Jump;
const SSV = require("../../src/template-api/SSV").SSV;
const StaticAggregation = require("../../src/template-api/StaticAggregation")
    .StaticAggregation;

// construct a project
let p = new Project("mitdwh", "../../../config.txt");

// construct a view
let view = new View("mitdwh", 1000, 1000);
p.addView(view);

/******************************** canvases ********************************/

// ================================================================
let spec = {
    data: {
        db: "mit",
        query:
            "select building_name, fclt_building_key, building_type, building_height, date_built, num_of_rooms, assignable_area from Fclt_building;"
    },
    layout: {
        x: {field: "num_of_rooms", extent: [0, 1400]},
        y: {field: "assignable_area", extent: [300000, 0]},
        z: {field: "building_height", order: "desc"}
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
let ssv0Pyramid = p.addSSV(new SSV(spec), {view: view}).pyramid;

// ================================================================
let spec = {
    db: "mit",
    query: {
        table: "fclt_rooms",
        dimensions: ["fclt_building_key", "organization_name"],
        measure: "SUM(area)",
        sampleFields: [
            "building_room",
            "latitude_wgs",
            "longitude_wgs",
            "warehouse_load_date"
        ]
    },
    type: "treemap",
    tooltip: {
        columns: ["organization_name", "kyrixAggValue"],
        aliases: ["Organization", "Area"]
    },
    legend: {title: "Total Area by Organization"},
    textFields: ["organization_name"]
};
let staticAggregation0Canvas = p.addStaticAggregation(
    new StaticAggregation(spec),
    {view: view}
).canvas;

// ================================================================
let spec = {
    db: "mit",
    query: {
        table: "fclt_rooms",
        dimensions: ["building_room"],
        measure: "SUM(area)",
        sampleFields: [
            "fclt_building_key",
            "latitude_wgs",
            "longitude_wgs",
            "warehouse_load_date",
            "organization_name",
            "use_desc"
        ]
    },
    type: "circlePack",
    tooltip: {
        columns: ["building_room", "kyrixAggValue"],
        aliases: ["Room", "Area"]
    },
    legend: {title: "Rooms and Their Occupied Area"},
    textFields: ["building_room"]
};
let staticAggregation1Canvas = p.addStaticAggregation(
    new StaticAggregation(spec),
    {view: view}
).canvas;

// ================================================================
let spec = {
    db: "mit",
    query: {
        table: "mit_student_directory",
        dimensions: ["student_year"],
        measure: "COUNT(*)",
        sampleFields: [
            "full_name",
            "office_location",
            "warehouse_load_date",
            "department",
            "department_name"
        ]
    },
    type: "pie",
    tooltip: {
        columns: ["student_year", "kyrixAggValue"],
        aliases: ["Student Year", "Number of Students"]
    },
    legend: {
        title: "Number of students by Year",
        domain: {
            "1": "Freshmen",
            "2": "Sophomore",
            "3": "Junior",
            "4": "Senior",
            "": "N/A",
            U: "Undesignated Sophomore",
            G: "Graduate Students"
        }
    },
    colorScheme: "schemePastel1"
};
let staticAggregation2Canvas = p.addStaticAggregation(
    new StaticAggregation(spec),
    {view: view}
).canvas;

// ================================================================
let spec = {
    db: "mit",
    query: {
        table: "fclt_rooms",
        dimensions: ["major_use_desc"],
        stackDimensions: ["use_desc"],
        measure: "SUM(area)",
        sampleFields: [
            "building_room",
            "fclt_building_key",
            "latitude_wgs",
            "longitude_wgs",
            "warehouse_load_date",
            "organization_name"
        ]
    },
    type: "bar",
    colorScheme: "schemeSet3",
    tooltip: {
        columns: ["major_use_desc", "use_desc", "kyrixAggValue"],
        aliases: ["Major Use", "Minor Use", "Area"]
    },
    legend: {title: "Major/Minor Usages of Rooms"},
    axis: {xTitle: "Major Use", yTitle: "Total Area (sq ft)"}
};
let staticAggregation3Canvas = p.addStaticAggregation(
    new StaticAggregation(spec),
    {view: view}
).canvas;

// ================================================================
let spec = {
    db: "mit",
    query: {
        table: "course_catalog_subject_offered",
        dimensions: ["department_name"],
        measure: "SUM(total_units)",
        sampleFields: [
            "subject_title",
            "meet_place",
            "warehouse_load_date",
            "dept_code",
            "department_code"
        ]
    },
    type: "bar",
    tooltip: {
        columns: ["department_name", "kyrixAggValue"],
        aliases: ["Department Name", "Total Units Offered"]
    },
    legend: {title: "Departments and Their Total Units of Classes Offered"},
    axis: {xTitle: "Department", yTitle: "Total Units"}
};
let staticAggregation4Canvas = p.addStaticAggregation(
    new StaticAggregation(spec),
    {view: view}
).canvas;

// ================================================================
let spec = {
    db: "mit",
    query: {
        table: "fclt_building",
        dimensions: ["building_name", "fclt_building_key"],
        measure: "SUM(random() * 100)",
        sampleFields: [
            "latitude_wgs",
            "longitude_wgs",
            "warehouse_load_date",
            "building_number",
            "parent_building_number",
            "parent_building_name",
            "parent_building_name_long",
            "building_name_long",
            "ext_gross_area",
            "assignable_area"
        ]
    },
    type: "wordCloud",
    tooltip: {
        columns: ["building_name", "fclt_building_key"],
        aliases: ["building_name", "fclt_building_key"]
    },
    padding: 15,
    legend: {title: "Primary keys of table FCLT_BUILDING (random text size)"},
    textFields: ["building_name"],
    cloud: {maxTextSize: 65, fontFamily: "Arial"}
};
let staticAggregation5Canvas = p.addStaticAggregation(
    new StaticAggregation(spec),
    {view: view}
).canvas;

// ================================================================
let spec = {
    db: "mit",
    query: {
        table: "fclt_rooms",
        dimensions: ["building_room"],
        measure: "SUM(random() * 100)",
        sampleFields: [
            "fclt_building_key",
            "latitude_wgs",
            "longitude_wgs",
            "warehouse_load_date",
            "fclt_room_key",
            "floor2",
            "fclt_floor_key",
            "room",
            "space_id",
            "fclt_major_use_key"
        ]
    },
    type: "wordCloud",
    tooltip: {columns: ["building_room"], aliases: ["building_room"]},
    padding: 15,
    legend: {title: "Primary keys of table FCLT_ROOMS (random text size)"},
    textFields: ["building_room"],
    cloud: {maxTextSize: 65, fontFamily: "Arial"}
};
let staticAggregation6Canvas = p.addStaticAggregation(
    new StaticAggregation(spec),
    {view: view}
).canvas;

// ================================================================
let spec = {
    db: "mit",
    query: {
        table: "course_catalog_subject_offered",
        dimensions: ["subject_title"],
        measure: "SUM(random() * 100)",
        sampleFields: [
            "meet_place",
            "warehouse_load_date",
            "dept_code",
            "academic_year",
            "term_code",
            "subject_id",
            "subject_code",
            "subject_number",
            "source_subject_id",
            "print_subject_id"
        ]
    },
    type: "wordCloud",
    tooltip: {columns: ["subject_title"], aliases: ["subject_title"]},
    padding: 15,
    legend: {
        title:
            "Primary keys of table COURSE_CATALOG_SUBJECT_OFFERED (random text size)"
    },
    textFields: ["subject_title"],
    cloud: {maxTextSize: 65, fontFamily: "Arial"}
};
let staticAggregation7Canvas = p.addStaticAggregation(
    new StaticAggregation(spec),
    {view: view}
).canvas;

// ================================================================
let spec = {
    db: "mit",
    query: {
        table: "mit_student_directory",
        dimensions: ["full_name"],
        measure: "SUM(random() * 100)",
        sampleFields: [
            "office_location",
            "warehouse_load_date",
            "department",
            "first_name",
            "middle_name",
            "last_name",
            "office_phone",
            "email_address",
            "department_name",
            "student_year"
        ]
    },
    type: "wordCloud",
    tooltip: {columns: ["full_name"], aliases: ["full_name"]},
    padding: 15,
    legend: {
        title: "Primary keys of table MIT_STUDENT_DIRECTORY (random text size)"
    },
    textFields: ["full_name"],
    cloud: {maxTextSize: 65, fontFamily: "Arial"}
};
let staticAggregation8Canvas = p.addStaticAggregation(
    new StaticAggregation(spec),
    {view: view}
).canvas;

p.setInitialStates(ssv0Pyramid[0], 0, 0);

// save to db
p.saveProject();
