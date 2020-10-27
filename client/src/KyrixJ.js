import React, {Component} from "react";
import SchemaGraph from "./js/SchemaGraph";
import TableDetails from "./js/TableDetails";
import SlideReel from "./js/SlideReel";
import resizeSvgs from "./js/ResizeSvgs";
import KyrixVis from "./js/KyrixVis";

class KyrixJ extends Component {
    state = {
        kyrixLoaded: false
    };

    // dummy dataset info
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
                <TableDetails />
                <SlideReel />
                <KyrixVis handleKyrixLoad={this.handleKyrixLoad} />
            </>
        );
    }
}

export default KyrixJ;
