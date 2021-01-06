import React, {Component} from "react";
import SQLQuery from "./low-level-components/SQLQuery";
import PreviewFilters from "./low-level-components/PreviewFilters";
import * as d3 from "d3";

class JumpPreview extends Component {
    shouldComponentUpdate = nextProps =>
        JSON.stringify(this.props) !== JSON.stringify(nextProps);

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
            .style(
                "top",
                Math.min(this.props.y, windowHeight - popoverHeight) + "px"
            )
            .style("left", this.props.x + "px")
            .style("visibility", this.props.visible ? "visible" : "hidden")
            .style("opacity", this.props.visible ? 1 : 0);
    };

    render() {
        if (!this.props.kyrixLoaded) return null;
        return (
            <div className="jump-preview">
                <div className="ant-popover-title">
                    <h4>
                        <i>Jump Preview</i>
                    </h4>
                </div>
                <SQLQuery
                    kyrixCanvas={this.props.kyrixCanvas}
                    sqlQuery={this.props.sqlQuery}
                />
                <PreviewFilters
                    kyrixPredicates={this.props.kyrixPredicates}
                    getSqlPredicates={this.props.getSqlPredicates}
                    kyrixViewId={this.props.kyrixViewId}
                />
            </div>
        );
    }
}

export default JumpPreview;
