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
                field: "# Vis",
                value: this.props.d.numCanvas
            },
            {
                key: 1,
                field: "# Records",
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
                <Divider style={{margin: "3px 0px"}}>
                    <h5>Attributes</h5>
                </Divider>
                <div className="attribute-container">
                    <List
                        size="small"
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
                title={
                    <h4>
                        Table <i>{this.props.d.table_name}</i>
                    </h4>
                }
                content={content}
                trigger="click"
                visible
                overlayClassName={
                    "node-popover-" + this.props.d.table_name + " node-popover"
                }
                overlayStyle={{visibility: "hidden"}}
            />
        );
    }
}

export default NodePopover;
