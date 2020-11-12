import React, {Component} from "react";
import {Table} from "antd";
import {CSSTransition} from "react-transition-group";

class SchemaDetails extends Component {
    render() {
        const curTable = this.props.curTable;
        const columns = [
            {
                title: curTable,
                dataIndex: "colName",
                align: "center",
                render: text => text
            }
        ];
        const data = this.props.columns.slice(0, 8).map(d => ({
            key: d,
            colName: d
        }));

        return (
            <div className="schemadetails">
                {curTable && (
                    <CSSTransition
                        key={curTable}
                        classNames="tablefade"
                        in={true}
                        appear={true}
                        timeout={300}
                    >
                        <Table
                            scroll={{x: true}}
                            columns={columns}
                            dataSource={data}
                            bordered
                            pagination={false}
                            size="small"
                        />
                    </CSSTransition>
                )}
            </div>
        );
    }
}

export default SchemaDetails;
