import React, {Component} from "react";
import {Popover, List} from "antd";

class EdgePopover extends Component {
    render() {
        const listData = this.props.edge.matches;
        const content = (
            <List
                size="small"
                dataSource={listData}
                renderItem={item => (
                    <div>
                        {item.sourceCol} &#8660; {item.targetCol}{" "}
                    </div>
                )}
            />
        );
        return (
            <Popover
                placement="bottom"
                title={<h4>Matching Columns</h4>}
                content={content}
                trigger="click"
                visible
                overlayClassName={
                    "schemagraphPopover_" +
                    this.props.edge.source +
                    "_" +
                    this.props.edge.target +
                    " edge-popover"
                }
                overlayStyle={{visibility: "hidden"}}
            />
        );
    }
}

export default EdgePopover;
