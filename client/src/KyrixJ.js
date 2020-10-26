import React, {Component} from "react";
import SchemaGraph from "./js/SchemaGraph";

class KyrixJ extends Component {
    state = {};

    render() {
        return (
            <>
                <div className="kyrixjheader">
                    Superman @ MIT Data Warehouse
                </div>
                <SchemaGraph width="600" height="600" />
            </>
        );
    }
}

export default KyrixJ;
