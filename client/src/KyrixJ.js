import React, {Component} from "react";
import SchemaGraph from "./js/SchemaGraph";
import TableDetails from "./js/TableDetails";
import SlideReel from "./js/SlideReel";
import resizeSvgs from "./js/ResizeSvgs";
import KyrixVis from "./js/KyrixVis";
import QueryDetails from "./js/QueryDetails";

class KyrixJ extends Component {
    state = {
        // name of the current table
        curTable: "",

        // type of interaction that generates the new table
        // can be one of ["graphClick", "kyrixLoaded", "kyrixVisJump", "tableDetailsClick"]
        // used by SchemaGraph / KyrixVis (or other components in the future)
        // to do different things
        newTableType: "",
        kyrixLoaded: false
    };

    componentDidMount = () => {
        window.addEventListener("resize", resizeSvgs);
    };

    componentWillUnmount = () => {
        window.removeEventListener("resize", resizeSvgs);
    };

    handleSchemaGraphNodeClick = d => {
        this.setState({
            curTable: d.table_name,
            newTableType: "graphClick"
        });
    };

    handleKyrixJumpEnd = jump => {
        if (jump.type === "slide")
            this.setState({
                curTable: this.canvasIdToTable[
                    window.kyrix.getCurrentCanvasId(this.kyrixViewId)
                ],
                newTableType: "kyrixVisJump"
            });
    };

    handleKyrixLoad = () => {
        window.kyrix.on(
            "jumpend.settable",
            this.kyrixViewId,
            this.handleKyrixJumpEnd
        );
        this.setState({
            curTable: this.canvasIdToTable[
                window.kyrix.getCurrentCanvasId(this.kyrixViewId)
            ],
            newTableType: "kyrixLoaded",
            kyrixLoaded: true
        });
    };

    handleTableDetailsClick = event => {
        this.setState({
            curTable: event.target.innerHTML,
            newTableType: "tableDetailsClick"
        });
    };

    render() {
        return (
            <>
                <div className="kyrixjheader">
                    Superman @ MIT Data Warehouse
                </div>
                <SchemaGraph
                    width="600"
                    height="600"
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
                <TableDetails
                    tableColumns={this.tableColumns}
                    curTable={this.state.curTable}
                    handleClick={this.handleTableDetailsClick}
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
                <QueryDetails />
            </>
        );
    }

    // static dataset info - shouldn't be in states
    // TODO: move it to a JSON and fetch it on page load
    kyrixViewId = "ssv0";

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
        building: [
            "Fclt Building Key",
            "Building Number",
            "Parent Building Number",
            "Parent Building Name",
            "Parent Building Name Long",
            "Building Name Long",
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
            "Building Name",
            "Date Built",
            "Date Acquired",
            "Date Occupied",
            "Warehouse Load Date",
            "Num Of Rooms"
        ],
        room: [
            "Fclt Room Key",
            "Building Room",
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
            "Subject Title",
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
            "First Name",
            "Middle Name",
            "Last Name",
            "Full Name",
            "Office Location",
            "Office Phone",
            "Email Address",
            "Department",
            "Department Name",
            "Student Year",
            "Full Name Uppercase",
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
