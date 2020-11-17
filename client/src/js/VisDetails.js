import React, {Component} from "react";
import QueryDetails from "./low-level-components/QueryDetails";

class VisDetails extends Component {
    render() {
        return (
            <div className="visdetails">
                <QueryDetails
                    kyrixCanvas={this.props.kyrixCanvas}
                    sqlQuery={this.props.sqlQuery}
                    kyrixPredicates={this.props.kyrixPredicates}
                />
                <div className="explain">Table Details View</div>
            </div>
        );
    }
}

export default VisDetails;
