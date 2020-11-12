import React, {Component} from "react";
import SchemaDetails from "./SchemaDetails";

class TableDetails extends Component {
    render() {
        let curTable = this.props.curTable;
        let columns =
            curTable.length > 0 ? this.props.tableColumns[curTable] : [];
        return (
            <div className="tabledetails">
                <SchemaDetails curTable={curTable} columns={columns} />
                <div className="explain">Table Details View</div>
            </div>
        );
    }
}

export default TableDetails;
