import React, {Component} from "react";
import SchemaGraph from "./js/SchemaGraph";
import TableDetails from "./js/TableDetails";
import SlideReel from "./js/SlideReel";
import resizeSvgs from "./js/ResizeSvgs";
import KyrixVis from "./js/KyrixVis";

class KyrixJ extends Component {
    state = {};

    componentDidMount = () => {
        resizeSvgs();
        window.addEventListener("resize", resizeSvgs);
    };

    componentWillUnmount = () => {
        window.removeEventListener("resize", resizeSvgs);
    };

    render() {
        return (
            <>
                <div className="kyrixjheader">
                    Superman @ MIT Data Warehouse
                </div>
                <SchemaGraph width="600" height="600" />
                <TableDetails />
                <SlideReel />
                <KyrixVis />
            </>
        );
    }
}

export default KyrixJ;
