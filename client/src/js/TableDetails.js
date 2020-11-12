import React, {Component} from "react";
import SchemaDetails from "./SchemaDetails";
import RawDataTable from "./RawDataTable";

class TableDetails extends Component {
    render() {
        let curTable = this.props.curTable;
        let columns =
            curTable.length > 0 ? this.props.tableColumns[curTable] : [];
        return (
            <div className="tabledetails">
                <SchemaDetails
                    curTable={curTable}
                    columns={columns}
                    maxHeight={this.props.schemaTableMaxHeight}
                />
                <RawDataTable
                    kyrixRenderData={this.props.kyrixRenderData}
                    maxHeight={this.props.rawDataTableMaxHeight}
                />
                <div className="explain">Table Details View</div>
            </div>
        );
    }
}

export default TableDetails;
