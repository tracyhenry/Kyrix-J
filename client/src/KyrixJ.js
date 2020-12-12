import React, {Component} from "react";
import SchemaGraph from "./js/SchemaGraph";
import InfoPanel from "./js/InfoPanel";
import History from "./js/History";
import RawDataTable from "./js/RawDataTable";
import Bookmarks from "./js/Bookmarks";
import {
    resizeSvgs,
    getRawDataTableMaxHeight,
    resizeRawDataTable
} from "./js/ResizeStuff";
import KyrixVis from "./js/KyrixVis";
import Header from "./js/Header";
import html2canvas from "html2canvas";
import {message} from "antd";

class KyrixJ extends Component {
    state = {
        // visited tables
        tableHistory: [],

        // screenshot history
        screenshotHistory: [],

        // bookmarks
        bookmarks: [],

        // type of interaction that generates the new table
        // can be one of ["graphClick", "kyrixLoaded", "searchBarInputChange",
        // "kyrixVisJump", "searchBarSearch", "kyrixRandomJump",
        // "historyItemClick", "seeAnotherVisButtonClick"]
        // used by SchemaGraph / KyrixVis (or other components in the future)
        // to do different things
        interactionType: "",

        // current kyrix canvas
        kyrixCanvas: "",

        // current kyrix sql filters
        kyrixPredicates: [],

        // other kyrix vis states
        kyrixVx: null,
        kyrixVy: null,
        kyrixScale: null,

        // current render data
        kyrixRenderData: [],

        // max height of raw data table
        rawDataTableMaxHeight: 240,

        // whether kyrix is loaded
        kyrixLoaded: false,

        // search bar value in Header
        searchBarValue: "",

        // history visible
        historyVisible: false,

        // bookmarks visible
        bookmarksVisible: false,

        // whether the bookmark save button is enabled
        bookmarksButtonDisabled: false
    };

    componentDidMount = () => {
        window.addEventListener("resize", resizeSvgs);
        window.addEventListener("resize", () => {
            resizeRawDataTable(this);
        });
    };

    handleSchemaGraphNodeClick = d => {
        let tableName = d.table_name;
        this.setState({
            tableHistory: this.state.tableHistory.concat([tableName]),
            interactionType: "graphClick"
        });
    };

    handleSearchBarSearch = tableName => {
        this.setState({
            tableHistory: this.state.tableHistory.concat([tableName]),
            interactionType: "searchBarSearch"
        });
    };

    handleKyrixJumpEnd = jump => {
        const nextKyrixCanvas = window.kyrix.getCurrentCanvasId(
            this.kyrixViewId
        );
        const nextTableHistory = this.state.tableHistory.concat(
            this.canvasIdToTable[nextKyrixCanvas]
        );
        if (jump.type === "slide") {
            this.setState({
                tableHistory: nextTableHistory
            });
        } else if (jump.type === "randomJumpBack") {
            this.setState({
                tableHistory: nextTableHistory,
                interactionType: "kyrixRandomJump"
            });
        } else if (jump.type === "semantic_zoom")
            this.setState({
                tableHistory: nextTableHistory
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
                curData[i].length >= curData[dataLayerId].length
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
        window.kyrix.on(
            "jumpstart.setinteractiontype",
            this.kyrixViewId,
            this.setInteractionTypeToKyrixVisJump
        );
        window.kyrix.on(
            "jumpstart.loghistory",
            this.kyrixViewId,
            this.createHistoryEntry
        );
        this.loadData();
        let kyrixCanvas = window.kyrix.getCurrentCanvasId(this.kyrixViewId);
        let kyrixPredicates = window.kyrix.getGlobalVarDictionary(
            this.kyrixViewId
        ).predicates;
        this.setState({
            tableHistory: [this.canvasIdToTable[kyrixCanvas]],
            kyrixCanvas: kyrixCanvas,
            kyrixPredicates: kyrixPredicates,
            interactionType: "kyrixLoaded",
            kyrixLoaded: true,
            rawDataTableMaxHeight: getRawDataTableMaxHeight(),
            searchBarValue: ""
        });
    };

    setInteractionTypeToKyrixVisJump = () => {
        this.setState({
            interactionType: "kyrixVisJump"
        });
    };

    handleSearchBarInputChange = value => {
        // set state
        this.setState({
            searchBarValue: value,
            interactionType: "searchBarInputChange"
        });
    };

    createHistoryEntry = jump => {
        if (jump.type === "literal_zoom_in" || jump.type === "literal_zoom_out")
            return;
        let historyItem = window.kyrix.getHistoryItem(this.kyrixViewId);

        // check if this has been booked marked before
        // if so, reuse canvas url
        let url = "";
        for (let i = 0; i < this.state.bookmarks.length; i++) {
            let curBookmark = this.state.bookmarks[i];
            if (this.historyItemsAreTheSame(curBookmark, historyItem)) {
                url = curBookmark.url;
                break;
            }
        }

        if (url.length > 0) {
            this.setState({
                screenshotHistory: this.state.screenshotHistory.concat([
                    Object.assign({}, {url: url}, historyItem)
                ])
            });
        } else {
            html2canvas(document.getElementsByClassName("kyrixvisdiv")[0], {
                logging: false
            }).then(canvas => {
                this.setState({
                    screenshotHistory: this.state.screenshotHistory.concat([
                        Object.assign(
                            {},
                            {url: canvas.toDataURL()},
                            historyItem
                        )
                    ])
                });
            });
        }
    };

    handleHistoryItemClick = historyItem => {
        const nextTableHistory = this.state.tableHistory.concat(
            this.canvasIdToTable[historyItem.canvasId]
        );
        this.setState({
            tableHistory: nextTableHistory,
            interactionType: "historyItemClick",
            kyrixCanvas: historyItem.canvasId,
            kyrixPredicates: historyItem.predicates,
            kyrixVX: historyItem.viewportX,
            kyrixVY: historyItem.viewportY,
            kyrixScale: historyItem.initialScale
        });
    };

    handleHistoryVisibleChange = () => {
        this.setState({
            historyVisible: !this.state.historyVisible
        });
    };

    handleBookmarksVisibleChange = () => {
        this.setState({
            bookmarksVisible: !this.state.bookmarksVisible
        });
    };

    createBookmarkEntry = () => {
        if (this.state.bookmarksButtonDisabled) return;
        this.setState({bookmarksButtonDisabled: true});
        let historyItem = window.kyrix.getHistoryItem(this.kyrixViewId);
        let exist = false;
        for (let i = 0; i < this.state.bookmarks.length; i++) {
            let curBookmark = this.state.bookmarks[i];
            if (this.historyItemsAreTheSame(historyItem, curBookmark)) {
                exist = true;
                break;
            }
        }
        if (exist) {
            message.warning("This visualization is already bookmarked.", 1.5);
            this.setState({bookmarksButtonDisabled: false});
            return;
        }
        [historyItem.table] = this.state.tableHistory.slice(-1);
        html2canvas(document.getElementsByClassName("kyrixvisdiv")[0], {
            logging: false
        }).then(canvas => {
            message.success("Bookmark saved!", 1.5);
            this.setState({
                bookmarks: this.state.bookmarks.concat([
                    Object.assign({}, {url: canvas.toDataURL()}, historyItem)
                ]),
                bookmarksButtonDisabled: false
            });
        });
    };

    historyItemsAreTheSame = (a, b) => {
        return (
            a.canvasId === b.canvasId &&
            a.initialScale === b.initialScale &&
            a.viewportX === b.viewportX &&
            a.viewportY === b.viewportY &&
            JSON.stringify(a.predicates) === JSON.stringify(b.predicates)
        );
    };

    handleSeeAnotherVisButtonClick = () => {
        let [curTable] = this.state.tableHistory.slice(-1);
        if (this.clickJumpDefaults[curTable].length === 1) {
            message.warning(
                "There is only one visualization of this table.",
                1.5
            );
            return;
        } else
            this.setState({
                tableHistory: this.state.tableHistory.concat([curTable]),
                interactionType: "seeAnotherVisButtonClick"
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
                    handleHistoryVisibleChange={this.handleHistoryVisibleChange}
                    handleBookmarksVisibleChange={
                        this.handleBookmarksVisibleChange
                    }
                />
                <SchemaGraph
                    width="1200"
                    height="1200"
                    kyrixLoaded={this.state.kyrixLoaded}
                    curTable={
                        this.state.tableHistory.length > 0
                            ? this.state.tableHistory[
                                  this.state.tableHistory.length - 1
                              ]
                            : ""
                    }
                    interactionType={this.state.interactionType}
                    handleNodeClick={this.handleSchemaGraphNodeClick}
                    // app metadata (TODO: combine them into one field)
                    canvasIdToTable={this.canvasIdToTable}
                    graphEdges={this.graphEdges}
                    tableMetadata={this.tableMetadata}
                    tableColumns={this.tableColumns}
                />
                <InfoPanel
                    kyrixCanvas={this.state.kyrixCanvas}
                    sqlQuery={this.sqlQuery}
                    kyrixPredicates={this.state.kyrixPredicates}
                />
                <History
                    tableHistory={this.state.tableHistory}
                    screenshotHistory={this.state.screenshotHistory}
                    handleHistoryItemClick={this.handleHistoryItemClick}
                    handleHistoryVisibleChange={this.handleHistoryVisibleChange}
                    visible={this.state.historyVisible}
                />
                <Bookmarks
                    bookmarks={this.state.bookmarks}
                    handleHistoryItemClick={this.handleHistoryItemClick}
                    handleBookmarksVisibleChange={
                        this.handleBookmarksVisibleChange
                    }
                    visible={this.state.bookmarksVisible}
                />
                <KyrixVis
                    handleKyrixLoad={this.handleKyrixLoad}
                    curTable={
                        this.state.tableHistory.length > 0
                            ? this.state.tableHistory[
                                  this.state.tableHistory.length - 1
                              ]
                            : ""
                    }
                    interactionType={this.state.interactionType}
                    kyrixLoaded={this.state.kyrixLoaded}
                    handleBookmarkButtonClick={this.createBookmarkEntry}
                    bookmarksButtonDisabled={this.state.bookmarksButtonDisabled}
                    handleSeeAnotherVisButtonClick={
                        this.handleSeeAnotherVisButtonClick
                    }
                    // kyrix states
                    // only useful in "historyItemClick"
                    kyrixCanvas={this.state.kyrixCanvas}
                    kyrixPredicates={this.state.kyrixPredicates}
                    kyrixVX={this.state.kyrixVX}
                    kyrixVY={this.state.kyrixVY}
                    kyrixScale={this.state.kyrixScale}
                    // app metadata (TODO: combine them into one field)
                    kyrixViewId={this.kyrixViewId}
                    clickJumpDefaults={this.clickJumpDefaults}
                />
                <RawDataTable
                    tableColumns={this.tableColumns}
                    curTable={
                        this.state.tableHistory.length > 0
                            ? this.state.tableHistory[
                                  this.state.tableHistory.length - 1
                              ]
                            : ""
                    }
                    kyrixRenderData={this.state.kyrixRenderData}
                    maxHeight={this.state.rawDataTableMaxHeight}
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
        staticAggregation0:
            "SELECT organization_name, SUM(area)\nFROM room\nGROUP BY organization_name;",
        staticAggregation3:
            "SELECT use_desc, major_use_desc, SUM(area)\nFROM room\nGROUP BY use_desc, major_use_desc;",
        staticAggregation1: "SELECT *\nFROM room;",
        staticAggregation4:
            "SELECT department_code, SUM(total_units)\nFROM course\nGROUP BY department_code;",
        staticAggregation2:
            "SELECT student_year, COUNT(*)\nFROM student\nGROUP BY student_year;"
    };

    canvasIdToTable = {
        ssv0_level0: "building",
        ssv0_level1: "building",
        ssv0_level2: "building",
        ssv0_level3: "building",
        staticAggregation0: "room",
        staticAggregation1: "room",
        staticAggregation3: "room",
        staticAggregation2: "student",
        staticAggregation4: "course"
    };

    graphEdges = [
        {
            source: "building",
            target: "room",
            matches: [
                {
                    sourceCol: "Fclt Building Key",
                    targetCol: "Fclt Building Key"
                },
                {
                    sourceCol: "Latitude Wgs",
                    targetCol: "Latitude Wgs"
                },
                {
                    sourceCol: "Longitude Wgs",
                    targetCol: "Longitude Wgs"
                },
                {
                    sourceCol: "Warehouse Load Date",
                    targetCol: "Warehouse Load Date"
                }
            ]
        },
        {
            source: "room",
            target: "course",
            matches: [
                {
                    sourceCol: "Fclt Building Key",
                    targetCol: "Fclt Building Key"
                },
                {
                    sourceCol: "Warehouse Load Date",
                    targetCol: "Warehouse Load Date"
                }
            ]
        },
        {
            source: "room",
            target: "student",
            matches: [
                {
                    sourceCol: "Building room",
                    targetCol: "Office Location"
                },
                {
                    sourceCol: "Warehouse Load Date",
                    targetCol: "Warehouse Load Date"
                }
            ]
        },
        {
            source: "course",
            target: "student",
            matches: [
                {
                    sourceCol: "Dept code",
                    targetCol: "Department"
                },
                {
                    sourceCol: "Warehouse Load Date",
                    targetCol: "Warehouse Load Date"
                }
            ]
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
        building: [
            {
                canvasId: "ssv0_level0",
                predDict: {},
                newVpX: 0,
                newVpY: 0
            }
        ],
        room: [
            {
                canvasId: "staticAggregation0",
                predDict: {
                    layer0: {
                        "==": ["fclt_building_key", "32"]
                    },
                    layer1: {
                        "==": ["fclt_building_key", "32"]
                    }
                },
                newVpX: 0,
                newVpY: 0
            },
            {
                canvasId: "staticAggregation1",
                predDict: {
                    layer0: {
                        AND: [
                            {"==": ["fclt_building_key", "32"]},
                            {
                                AND: [
                                    {"==": ["organization_name", "CSAIL"]},
                                    {"==": ["use_desc", "RES LO"]}
                                ]
                            }
                        ]
                    },
                    layer1: {
                        AND: [
                            {"==": ["fclt_building_key", "32"]},
                            {
                                AND: [
                                    {"==": ["organization_name", "CSAIL"]},
                                    {"==": ["use_desc", "RES LO"]}
                                ]
                            }
                        ]
                    }
                },
                newVpX: 0,
                newVpY: 0
            },
            {
                canvasId: "staticAggregation3",
                predDict: {
                    layer0: {
                        AND: [
                            {"==": ["fclt_building_key", "32"]},
                            {"==": ["organization_name", "CSAIL"]}
                        ]
                    },
                    layer1: {
                        AND: [
                            {"==": ["fclt_building_key", "32"]},
                            {"==": ["organization_name", "CSAIL"]}
                        ]
                    }
                },
                newVpX: 0,
                newVpY: 0
            }
        ],
        student: [
            {
                canvasId: "staticAggregation2",
                predDict: {
                    layer0: {
                        "==": [
                            "department_name",
                            "Electrical Eng & Computer Sci"
                        ]
                    },
                    layer1: {
                        "==": [
                            "department_name",
                            "Electrical Eng & Computer Sci"
                        ]
                    }
                },
                newVpX: 0,
                newVpY: 0
            }
        ],
        course: [
            {
                canvasId: "staticAggregation4",
                predDict: {
                    layer0: {
                        "==": ["meet_place", "32-123"]
                    },
                    layer1: {
                        "==": ["meet_place", "32-123"]
                    }
                },
                newVpX: 0,
                newVpY: 0
            }
        ]
    };
}

export default KyrixJ;
