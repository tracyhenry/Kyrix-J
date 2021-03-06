import React, {Component} from "react";
import {List} from "antd";

class EdgePopover extends Component {
    render() {
        const listData = this.props.edge.matches;
        const content = (
            <List
                size="small"
                dataSource={listData}
                renderItem={item => (
                    <div className="matching-column-pairs">
                        <div className="source-col">
                            <b>
                                <i>{this.props.edge.source}</i>
                            </b>
                            .{item.sourceCol}
                        </div>
                        <div className="equivalence-sign">&#8660;</div>
                        <div className="target-col">
                            <b>
                                <i>{this.props.edge.target}</i>
                            </b>
                            .{item.targetCol}
                        </div>
                    </div>
                )}
            />
        );
        return (
            <div
                className={
                    "edge-popover-" +
                    this.props.edge.source +
                    " edge-popover-" +
                    this.props.edge.target +
                    " edge-popover graph-popover"
                }
                style={{
                    visibility: "hidden"
                }}
            >
                <div className="edge-popover-transparent-div"></div>
                <div className="ant-popover-title">
                    <h4>Matching Columns</h4>
                </div>
                {content}
            </div>
        );
    }
}

export default EdgePopover;
