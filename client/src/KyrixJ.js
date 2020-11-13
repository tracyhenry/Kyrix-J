import React, {Component} from "react";
import SchemaGraph from "./js/SchemaGraph";
import VisDetails from "./js/VisDetails";
import SlideReel from "./js/SlideReel";
import {
    resizeSvgs,
    getSchemaTableMaxHeight,
    resizeSchemaTable,
    getRawDataTableMaxHeight,
    resizeRawDataTable
} from "./js/ResizeStuff";
import KyrixVis from "./js/KyrixVis";
import QueryDetails from "./js/QueryDetails";
import Header from "./js/Header";

class KyrixJ extends Component {
    state = {
        // name of the current table
        curTable: "",

        // type of interaction that generates the new table
        // can be one of ["graphClick", "kyrixLoaded", "searchBarInputChange",
        // "kyrixVisJump", "searchBarSearch", "kyrixRandomJump"]
        // used by SchemaGraph / KyrixVis (or other components in the future)
        // to do different things
        newTableType: "",

        // current kyrix canvas
        kyrixCanvas: "",

        // current kyrix sql filters
        kyrixPredicates: [],

        // current render data
        kyrixRenderData: [],

        // max height of the schema table
        schemaTableMaxHeight: 300,

        // max height of raw data table
        rawDataTableMaxHeight: 240,

        // whether kyrix is loaded
        kyrixLoaded: false,

        // search bar value in Header
        searchBarValue: ""
    };

    componentDidMount = () => {
        window.addEventListener("resize", resizeSvgs);
        window.addEventListener("resize", () => {
            resizeRawDataTable(this);
        });
        window.addEventListener("resize", () => {
            resizeSchemaTable(this);
        });
    };

    handleSchemaGraphNodeClick = d => {
        let tableName = d.table_name;
        this.setState({
            curTable: tableName,
            newTableType: "graphClick"
        });
    };

    handleSearchBarSearch = tableName => {
        this.setState({
            curTable: tableName,
            newTableType: "searchBarSearch"
        });
    };

    handleKyrixJumpEnd = jump => {
        const nextKyrixCanvas = window.kyrix.getCurrentCanvasId(
            this.kyrixViewId
        );
        const nextCurTable = this.canvasIdToTable[nextKyrixCanvas];
        if (jump.type === "slide")
            this.setState({
                curTable: nextCurTable,
                newTableType: "kyrixVisJump"
            });
        else if (jump.type === "randomJumpBack")
            this.setState({
                curTable: nextCurTable,
                newTableType: "kyrixRandomJump"
            });
        else if (jump.type !== "randomJump")
            // semantic zoom or literal zoom
            this.setState({
                curTable: nextCurTable,
                newTableType: "kyrixVisJump"
            });

        // update some other states
        const nextKyrixPredicates = window.kyrix.getGlobalVarDictionary(
            this.kyrixViewId
        ).predicates;
        this.setState({
            kyrixCanvas: nextKyrixCanvas,
            kyrixPredicates: nextKyrixPredicates,
            searchBarValue: ""
        });
        this.loadData();
    };

    loadData = () => {
        const curData = window.kyrix.getRenderData(this.kyrixViewId);
        let dataLayerId = -1;
        for (let i = 0; i < curData.length; i++)
            if (
                dataLayerId < 0 ||
                curData[i].length > curData[dataLayerId].length
            )
                dataLayerId = i;
        let nextKyrixRenderData = [];
        if (dataLayerId >= 0) nextKyrixRenderData = curData[dataLayerId];
        this.setState({
            kyrixRenderData: nextKyrixRenderData
        });
    };

    handleKyrixLoad = () => {
        window.kyrix.on(
            "jumpend.settable",
            this.kyrixViewId,
            this.handleKyrixJumpEnd
        );
        window.kyrix.on("zoom.loaddata", this.kyrixViewId, this.loadData);
        window.kyrix.on("pan.loaddata", this.kyrixViewId, this.loadData);
        this.loadData();
        let kyrixCanvas = window.kyrix.getCurrentCanvasId(this.kyrixViewId);
        let kyrixPredicates = window.kyrix.getGlobalVarDictionary(
            this.kyrixViewId
        ).predicates;
        this.setState({
            curTable: this.canvasIdToTable[kyrixCanvas],
            kyrixCanvas: kyrixCanvas,
            kyrixPredicates: kyrixPredicates,
            newTableType: "kyrixLoaded",
            kyrixLoaded: true,
            rawDataTableMaxHeight: getRawDataTableMaxHeight(),
            schemaTableMaxHeight: getSchemaTableMaxHeight(),
            searchBarValue: ""
        });
    };

    handleSearchBarInputChange = value => {
        // set state
        this.setState({
            searchBarValue: value,
            newTableType: "searchBarInputChange"
        });
    };

    render() {
        return (
            <>
                <Header
                    searchBarValue={this.state.searchBarValue}
                    handleClick={this.handleSearchBarSearch}
                    handleSearchBarInputChange={this.handleSearchBarInputChange}
                    tableColumns={this.tableColumns}
                />
                <SchemaGraph
                    width="1000"
                    height="1000"
                    kyrixLoaded={this.state.kyrixLoaded}
                    curTable={this.state.curTable}
                    newTableType={this.state.newTableType}
                    handleNodeClick={this.handleSchemaGraphNodeClick}
                    // app metadata (TODO: combine them into one field)
                    canvasIdToTable={this.canvasIdToTable}
                    graphEdges={this.graphEdges}
                    tableMetadata={this.tableMetadata}
                    tableColumns={this.tableColumns}
                />
                <VisDetails
                    tableColumns={this.tableColumns}
                    curTable={this.state.curTable}
                    kyrixRenderData={this.state.kyrixRenderData}
                    schemaTableMaxHeight={this.state.schemaTableMaxHeight}
                    rawDataTableMaxHeight={this.state.rawDataTableMaxHeight}
                />
                <SlideReel />
                <KyrixVis
                    handleKyrixLoad={this.handleKyrixLoad}
                    curTable={this.state.curTable}
                    newTableType={this.state.newTableType}
                    kyrixLoaded={this.state.kyrixLoaded}
                    // app metadata (TODO: combine them into one field)
                    kyrixViewId={this.kyrixViewId}
                    clickJumpDefaults={this.clickJumpDefaults}
                />
                <QueryDetails
                    kyrixCanvas={this.state.kyrixCanvas}
                    sqlQuery={this.sqlQuery}
                    kyrixPredicates={this.state.kyrixPredicates}
                />
            </>
        );
    }

    // static dataset info - shouldn't be in states
    // TODO: move it to a JSON and fetch it on page load
    kyrixViewId = "ssv0";

    sqlQuery = {
        ssv0_level0: "SELECT *\nFROM building",
        ssv0_level1: "SELECT *\nFROM building",
        ssv0_level2: "SELECT *\nFROM building",
        ssv0_level3: "SELECT *\nFROM building",
        room_treemap:
            "SELECT organization_name, SUM(area)\nFROM room\nGROUP BY organization_name;",
        room_barchart:
            "SELECT use_desc, major_use_desc, SUM(area)\nFrom room\nGROUP BY use_desc, major_use_desc;",
        room_circlepack: "SELECT *\nFROM room;",
        course_bar:
            "SELECT department_code, SUM(total_units)\nFROM course\nGROUP BY department_code;",
        student_pie:
            "SELECT student_year, COUNT(*)\nFROM student\nGROUP BY student_year;"
    };

    canvasIdToTable = {
        ssv0_level0: "building",
        ssv0_level1: "building",
        ssv0_level2: "building",
        ssv0_level3: "building",
        room_treemap: "room",
        room_barchart: "room",
        room_circlepack: "room",
        course_bar: "course",
        student_pie: "student"
    };

    graphEdges = [
        {
            source: "building",
            target: "room",
            sourceColumn: "Fclt Building Key",
            targetColumn: "Fclt Building Key"
        },
        {
            source: "room",
            target: "course",
            sourceColumn: "Building room",
            targetColumn: "Meet Place"
        },
        {
            source: "room",
            target: "student",
            sourceColumn: "Building room",
            targetColumn: "Office Location"
        },
        {
            source: "course",
            target: "student",
            sourceColumn: "Dept code",
            targetColumn: "Department"
        }
    ];

    tableMetadata = {
        building: {
            numCanvas: 1,
            numRecords: 228
        },
        room: {
            numCanvas: 3,
            numRecords: 40546
        },
        course: {
            numCanvas: 1,
            numRecords: 255976
        },
        student: {
            numCanvas: 1,
            numRecords: 11447
        }
    };

    tableColumns = {
        // make sure the first column of each table
        // is the primary key
        // and exist in the dataset
        building: [
            "Building Name",
            "Building Name Long",
            "Fclt Building Key",
            "Building Number",
            "Parent Building Number",
            "Parent Building Name",
            "Parent Building Name Long",
            "Ext Gross Area",
            "Assignable Area",
            "Non Assignable Area",
            "Site",
            "Campus Sector",
            "Access Level Code",
            "Access Level Name",
            "Building Type",
            "Ownership Type",
            "Building Use",
            "Occupancy Class",
            "Building Height",
            "Cost Center Code",
            "Cost Collector Key",
            "Latitude Wgs",
            "Longitude Wgs",
            "Easting X Spcs",
            "Northing Y Spcs",
            "Building Sort",
            "Building Named For",
            "Date Built",
            "Date Acquired",
            "Date Occupied",
            "Warehouse Load Date",
            "Num Of Rooms"
        ],
        room: [
            "Building Room",
            "Fclt Room Key",
            "Fclt Building Key",
            "Floor2",
            "Fclt Floor Key",
            "Room",
            "Space Id",
            "Fclt Major Use Key",
            "Major Use Desc",
            "Fclt Use Key",
            "Use Desc",
            "Fclt Minor Use Key",
            "Minor Use Desc",
            "Fclt Organization Key",
            "Organization Name",
            "Fclt Minor Organization Key",
            "Minor Organization",
            "Area",
            "Room Full Name",
            "Dept Code",
            "Access Level",
            "Latitude Wgs",
            "Longitude Wgs",
            "Northing Spcs",
            "Easting Spcs",
            "Warehouse Load Date"
        ],
        course: [
            "Subject Title",
            "Academic Year",
            "Term Code",
            "Subject Id",
            "Subject Code",
            "Subject Number",
            "Source Subject Id",
            "Print Subject Id",
            "Is Printed In Bulletin",
            "Department Code",
            "Department Name",
            "Effective Term Code",
            "Subject Short Title",
            "Is Variable Units",
            "Lecture Units",
            "Lab Units",
            "Preparation Units",
            "Total Units",
            "Design Units",
            "Grade Type",
            "Grade Type Desc",
            "Grade Rule",
            "Grade Rule Desc",
            "Hgn Code",
            "Hgn Desc",
            "Hgn Except",
            "Gir Attribute",
            "Gir Attribute Desc",
            "Comm Req Attribute",
            "Comm Req Attribute Desc",
            "Tuition Attribute",
            "Tuition Attribute Desc",
            "Write Req Attribute",
            "Write Req Attribute Desc",
            "Supervisor Attribute",
            "Supervisor Attribute Desc",
            "Prerequisites",
            "Subject Description",
            "Joint Subjects",
            "School Wide Electives",
            "Meets With Subjects",
            "Equivalent Subjects",
            "Is Offered This Year",
            "Is Offered Fall Term",
            "Is Offered Iap",
            "Is Offered Spring Term",
            "Is Offered Summer Term",
            "Fall Instructors",
            "Spring Instructors",
            "Status Change",
            "Last Activity Date",
            "Warehouse Load Date",
            "Master Subject Id",
            "Hass Attribute",
            "Hass Attribute Desc",
            "Term Duration",
            "Global Regions",
            "Global Countries",
            "On Line Page Number",
            "Section Id",
            "Is Master Section",
            "Is Lecture Section",
            "Is Lab Section",
            "Is Recitation Section",
            "Is Design Section",
            "Responsible Faculty Name",
            "Responsible Faculty Mit Id",
            "Meet Time",
            "Meet Place"
        ],
        student: [
            "Full Name",
            "First Name",
            "Middle Name",
            "Last Name",
            "Full Name Uppercase",
            "Office Location",
            "Office Phone",
            "Email Address",
            "Department",
            "Department Name",
            "Student Year",
            "Warehouse Load Date"
        ]
    };

    clickJumpDefaults = {
        building: {
            canvasId: "ssv0_level0",
            predDict: {},
            newVpX: 0,
            newVpY: 0
        },
        room: {
            canvasId: "room_treemap",
            predDict: {
                layer0: {
                    "==": ["fclt_building_key", "32"]
                }
            },
            newVpX: 0,
            newVpY: 0
        },
        student: {
            canvasId: "student_pie",
            predDict: {
                layer0: {
                    "==": ["department", "6"]
                }
            },
            newVpX: 0,
            newVpY: 0
        },
        course: {
            canvasId: "course_bar",
            predDict: {
                layer0: {
                    "==": ["meet_place", "32-123"]
                }
            },
            newVpX: 0,
            newVpY: 0
        }
    };
}

export default KyrixJ;
