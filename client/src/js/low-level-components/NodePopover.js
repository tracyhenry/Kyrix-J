import React, {Component} from "react";
import {Table, Popover, List, Divider} from "antd";

class NodePopover extends Component {
    render() {
        const columns = [
            {
                title: "",
                dataIndex: "field",
                key: "field",
                align: "right",
                width: "60%",
                render: text => <h5>{text}</h5>
            },
            {
                title: "",
                dataIndex: "value",
                key: "value",
                render: text => {
                    return <i>{text}</i>;
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
            }
        ];
        const attributes = this.props.tableColumns[this.props.d.table_name];
        const content = (
            <>
                <Table
                    size="small"
                    columns={columns}
                    dataSource={data}
                    showHeader={false}
                    pagination={false}
                    bordered={false}
                />
                <Divider style={{margin: "3px 0px"}}>Attributes</Divider>
                <div className="attribute-container">
                    <List
                        size="small"
                        bordered={false}
                        dataSource={attributes}
                        renderItem={item => (
                            <p>
                                <i>{item}</i>
                            </p>
                        )}
                    />
                </div>
            </>
        );

        return (
            <Popover
                placement="bottom"
                title={<h4>{this.props.d.table_name}</h4>}
                content={content}
                trigger="click"
                visible
                overlayClassName={
                    "schemagraphPopover_" + this.props.d.table_name
                }
                overlayStyle={{visibility: "hidden"}}
            />
        );
    }
}

export default NodePopover;
