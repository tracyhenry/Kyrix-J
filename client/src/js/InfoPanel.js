import React, {Component} from "react";
import SQLQuery from "./low-level-components/SQLQuery";
import Filters from "./low-level-components/Filters";
import VisDetails from "./low-level-components/VisDetails";

class InfoPanel extends Component {
    render() {
        return (
            <div className="info-panel">
                <SQLQuery
                    kyrixCanvas={this.props.kyrixCanvas}
                    sqlQuery={this.props.sqlQuery}
                />
                <Filters kyrixPredicates={this.props.kyrixPredicates} />
                <VisDetails />
            </div>
        );
    }
}

export default InfoPanel;
