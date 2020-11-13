import React, {Component} from "react";
import SchemaDetails from "./low-level-components/SchemaDetails";
import RawDataTable from "./low-level-components/RawDataTable";

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
                    primaryKey={
                        columns.length > 0
                            ? columns[0]
                                  .toLowerCase()
                                  .split(" ")
                                  .join("_")
                            : ""
                    }
                    kyrixRenderData={this.props.kyrixRenderData}
                    maxHeight={this.props.rawDataTableMaxHeight}
                />
                <div className="explain">Table Details View</div>
            </div>
        );
    }
}

export default TableDetails;
