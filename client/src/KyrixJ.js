import React, {Component} from "react";
import SchemaGraph from "./js/SchemaGraph";
import TableDetails from "./js/TableDetails";
import resizeSvgs from "./js/ResizeSvgs";

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
            </>
        );
    }
}

export default KyrixJ;
