import React, {Component} from "react";
import SQLQuery from "./low-level-components/SQLQuery";
import Filters from "./low-level-components/Filters";
import VisualDataMappings from "./low-level-components/VisualDataMappings";

class InfoPanel extends Component {
    shouldComponentUpdate = nextProps =>
        JSON.stringify(this.props) !== JSON.stringify(nextProps);

    render() {
        return (
            <div className="info-panel">
                <SQLQuery
                    kyrixCanvas={this.props.kyrixCanvas}
                    sqlQuery={this.props.sqlQuery}
                    preview={false}
                />
                <Filters
                    kyrixPredicates={this.props.kyrixPredicates}
                    getSqlPredicates={this.props.getSqlPredicates}
                />
                <VisualDataMappings m={this.props.visualDataMappings} />
            </div>
        );
    }
}

export default InfoPanel;
