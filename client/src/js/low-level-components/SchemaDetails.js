import React, {Component} from "react";
import {Table} from "antd";
import {CSSTransition} from "react-transition-group";

class SchemaDetails extends Component {

    shouldComponentUpdate = nextProps => (nextProps.maxHeight !== this.props.maxHeight || nextProps.curTable !== this.props.curTable);

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

        // calculate number of rows to show based on props.maxHeight
        // (x + 1) * 32 + 47 <= props.maxHeight
        let num = Math.floor((this.props.maxHeight - 120) / 32);
        const data = this.props.columns.slice(0, num).map((d, i) => ({
            key: i,
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
