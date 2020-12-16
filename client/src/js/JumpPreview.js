import React, {Component} from "react";
import SQLQuery from "./low-level-components/SQLQuery";
import PreviewFilters from "./low-level-components/PreviewFilters";
import {Popover} from "antd";
import * as d3 from "d3";

class JumpPreview extends Component {
    componentDidUpdate = () => {
        if (!this.props.kyrixLoaded) return;
        let windowHeight =
            window.innerHeight ||
            document.documentElement.clientHeight ||
            document.body.clientHeight;
        let popoverHeight = d3
            .select(".jump-preview")
            .node()
            .getBoundingClientRect().height;
        d3.select(".jump-preview")
            .style("visibility", this.props.visible ? "visible" : "hidden")
            .style("opacity", this.props.visible ? 1 : 0)
            .style(
                "top",
                Math.min(this.props.y, windowHeight - popoverHeight) + "px"
            )
            .style("left", this.props.x + "px");
    };

    render() {
        if (!this.props.kyrixLoaded) return null;
        let content = (
            <>
                <SQLQuery
                    kyrixCanvas={this.props.kyrixCanvas}
                    sqlQuery={this.props.sqlQuery}
                />
                <PreviewFilters
                    kyrixPredicates={this.props.kyrixPredicates}
                    getSqlPredicates={this.props.getSqlPredicates}
                    kyrixViewId={this.props.kyrixViewId}
                />
            </>
        );

        return (
            <Popover
                placement={this.props.placement}
                title={
                    <h4>
                        <i>SQL Preview</i>
                    </h4>
                }
                content={content}
                trigger="click"
                visible
                overlayClassName="jump-preview"
                overlayStyle={{visibility: "hidden", width: "400px"}}
            >
                <div
                    style={{
                        position: "fixed",
                        top: "0px",
                        left: "0px",
                        width: "0px",
                        height: "0px"
                    }}
                ></div>
            </Popover>
        );
    }
}

export default JumpPreview;
