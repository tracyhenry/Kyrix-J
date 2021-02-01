import React, {Component} from "react";
import {Table, List, Divider, Collapse} from "antd";
const {Panel} = Collapse;

class NodePopover extends Component {
    getContentOfNormalTable = d => {
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
                value: d.numCanvas
            },
            {
                key: 1,
                field: "# Records",
                value: d.numRecords
            }
        ];
        const attributes = this.props.tableColumns[d.table_name];
        return (
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
    };

    getContentOfMetaTable = () => {
        let metaTables = this.props.d.meta_tables;
        let panels = metaTables.map(d => (
            <Panel header={d.table_name} key={d.table_name}>
                {this.getContentOfNormalTable(d)}
            </Panel>
        ));

        let content = (
            <Collapse accordion defaultActiveKey={[]}>
                {panels}
            </Collapse>
        );

        return content;
    };

    render() {
        let tableName = this.props.d.table_name;
        let content = tableName.includes("meta_")
            ? this.getContentOfMetaTable()
            : this.getContentOfNormalTable(this.props.d);
        let titleText = tableName.includes("meta_") ? (
            <>
                More neighbors of Table <i>{tableName.substring(5)}</i>
            </>
        ) : (
            <>
                Table <i>{tableName}</i>
            </>
        );

        return (
            <div
                className={
                    "node-popover-" + tableName + " node-popover graph-popover"
                }
                style={{
                    visibility: "hidden"
                }}
            >
                <div className="ant-popover-title">
                    <h4>{titleText}</h4>
                </div>
                {content}
            </div>
        );
    }
}

export default NodePopover;
