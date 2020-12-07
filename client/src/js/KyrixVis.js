import React, {Component} from "react";
import {Button} from "antd";

class KyrixVis extends Component {
    constructor(props) {
        super(props);
        this.kyrixdivRef = React.createRef();
    }

    componentDidMount = () => {
        var serverAddr = "http://127.0.0.1:8000";
        setTimeout(() => {
            window.kyrix
                .initializeApp(serverAddr, this.kyrixdivRef.current)
                .then(() => {
                    this.props.handleKyrixLoad();
                });
        }, 30);
    };

    shouldComponentUpdate = nextProps => {
        if (!nextProps.kyrixLoaded) return false;
        if (
            nextProps.interactionType === "searchBarSearch" ||
            nextProps.interactionType === "graphClick"
        )
            return nextProps.curTable !== this.props.curTable;
        if (nextProps.interactionType === "historyItemClick") {
            if (
                nextProps.kyrixCanvas !== this.props.kyrixCanvas ||
                nextProps.kyrixVX !== this.props.kyrixVX ||
                nextProps.kyrixVY !== this.props.kyrixVY ||
                nextProps.kyrixScale !== this.props.kyrixScale
            )
                return true;
            if (
                nextProps.kyrixPredicates.length !==
                this.props.kyrixPredicates.length
            )
                return true;
            return (
                JSON.stringify(nextProps.kyrixPredicates) !==
                JSON.stringify(this.props.kyrixPredicates)
            );
        }
        return false;
    };

    componentDidUpdate = () => {
        if (
            this.props.interactionType === "searchBarSearch" ||
            this.props.interactionType === "graphClick"
        )
            this.jumpToClickedTable();
        if (this.props.interactionType === "historyItemClick")
            this.jumpToHistory();
    };

    jumpToClickedTable = () => {
        let curTable = this.props.curTable;
        let defaults = this.props.clickJumpDefaults[curTable];
        window.kyrix.randomJump(
            this.props.kyrixViewId,
            defaults.canvasId,
            defaults.predDict,
            defaults.newVpX,
            defaults.newVpY,
            1,
            "dict"
        );
    };

    jumpToHistory = () => {
        window.kyrix.randomJump(
            this.props.kyrixViewId,
            this.props.kyrixCanvas,
            this.props.kyrixPredicates,
            this.props.kyrixVX,
            this.props.kyrixVY,
            this.props.kyrixScale,
            "array"
        );
    };

    render() {
        return (
            <div className="kyrixdiv" ref={this.kyrixdivRef}>
                <Button
                    size="default"
                    style={{position: "absolute", top: "5px", right: "5px"}}
                >
                    See Another Vis
                </Button>

                <div className="explain">Kyrix View</div>
            </div>
        );
    }
}

export default KyrixVis;
