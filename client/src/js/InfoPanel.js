import React, {Component} from "react";
import SQLQuery from "./low-level-components/SQLQuery";
import Filters from "./low-level-components/Filters";
import VisualDataMappings from "./low-level-components/VisualDataMappings";

class InfoPanel extends Component {
    render() {
        return (
            <div className="info-panel">
                <SQLQuery
                    kyrixCanvas={this.props.kyrixCanvas}
                    sqlQuery={this.props.sqlQuery}
                />
                <Filters kyrixPredicates={this.props.kyrixPredicates} />
                <VisualDataMappings m={this.props.visualDataMappings} />
            </div>
        );
    }
}

export default InfoPanel;
