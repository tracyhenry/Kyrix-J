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
                    <div className="matching-column-pairs">
                        <div className="source-col">
                            <i>{this.props.edge.source}</i>.
                            <b>{item.sourceCol}</b>
                        </div>
                        <div className="equivalence-sign">&#8660;</div>
                        <div className="target-col">
                            <i>{this.props.edge.target}</i>.
                            <b>{item.targetCol}</b>
                        </div>
                    </div>
                )}
            />
        );
        return (
            <Popover
                placement="left"
                title={<h4>Matching Columns</h4>}
                content={content}
                trigger="click"
                visible
                overlayClassName={
                    "edge-popover-" +
                    this.props.edge.source +
                    " edge-popover-" +
                    this.props.edge.target +
                    " edge-popover"
                }
                overlayStyle={{visibility: "hidden"}}
            />
        );
    }
}

export default EdgePopover;
