import React, {Component} from "react";
import SchemaGraph from "./js/SchemaGraph";
import TableDetails from "./js/TableDetails";
import SlideReel from "./js/SlideReel";
import resizeSvgs from "./js/ResizeSvgs";
import KyrixVis from "./js/KyrixVis";
import QueryDetails from "./js/QueryDetails";

class KyrixJ extends Component {
    state = {
        kyrixLoaded: false
    };

    componentDidMount = () => {
        window.addEventListener("resize", resizeSvgs);
    };

    componentWillUnmount = () => {
        window.removeEventListener("resize", resizeSvgs);
    };

    handleKyrixLoad = () => {
        this.setState({kyrixLoaded: true});
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
                    canvasIdToTable={this.canvasIdToTable}
                />
                <TableDetails tableColumns={this.tableColumns} />
                <SlideReel />
                <KyrixVis handleKyrixLoad={this.handleKyrixLoad} />
                <QueryDetails />
            </>
        );
    }

    // static dataset info - shouldn't be in states
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
}

export default KyrixJ;
