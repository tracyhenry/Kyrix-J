import React, {Component} from "react";
import {Table, Popover} from "antd";

class NodePopover extends Component {
    render() {
        const columns = [
            {
                title: "",
                dataIndex: "field",
                key: "field",
                align: "right",
                render: text => <b>{text}</b>
            },
            {
                title: "",
                dataIndex: "value",
                key: "value",
                render: text => {
                    // if (text !== "attribute_list")
                    return <p>{text}</p>;
                }
            }
        ];

        const data = [
            {
                key: 0,
                field: "# of vis",
                value: this.props.d.numCanvas
            },
            {
                key: 1,
                field: "# of records",
                value: this.props.d.numRecords
            },
            {
                key: 2,
                field: "Attributes",
                value: "attribute_list"
            }
        ];

        const table = (
            <Table
                size="small"
                columns={columns}
                dataSource={data}
                showHeader={false}
                pagination={false}
                bordered={false}
            />
        );

        return (
            <Popover
                placement="bottom"
                title={<h4>{this.props.d.table_name}</h4>}
                content={table}
                trigger="click"
                visible
                overlayClassName={
                    "schemagraphtooltip_" + this.props.d.table_name
                }
                overlayStyle={{visibility: "hidden"}}
            />
        );
    }
}

export default NodePopover;
