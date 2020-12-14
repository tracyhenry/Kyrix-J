import React, {Component} from "react";
import {Button, Space} from "antd";

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

    componentDidUpdate = prevProps => {
        if (!this.props.kyrixLoaded) return;
        if (
            (this.props.interactionType === "searchBarSearch" ||
                this.props.interactionType === "graphClick") &&
            this.props.curTable !== prevProps.curTable
        )
            this.jumpToClickedTable();
        if (
            this.props.interactionType === "historyItemClick" &&
            (this.props.kyrixCanvas !== prevProps.kyrixCanvas ||
                this.props.kyrixVX !== prevProps.kyrixVX ||
                this.props.kyrixVY !== prevProps.kyrixVY ||
                this.props.kyrixScale !== prevProps.kyrixScale ||
                this.props.kyrixPredicates.length !==
                    prevProps.kyrixPredicates.length ||
                JSON.stringify(this.props.kyrixPredicates) !==
                    JSON.stringify(prevProps.kyrixPredicates))
        )
            this.jumpToHistory();
        if (this.props.interactionType === "seeAnotherVisButtonClick")
            this.jumpToAnotherVis();
    };

    jumpToClickedTable = () => {
        let curTable = this.props.curTable;
        let defaults = this.props.clickJumpDefaults[curTable][0];
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

    jumpToAnotherVis = () => {
        let curCanvasId = window.kyrix.getCurrentCanvasId(
            this.props.kyrixViewId
        );
        let curTable = this.props.curTable;
        let defaults = this.props.clickJumpDefaults[curTable];

        // jump to the next one
        let idx = -1;
        for (let i = 0; i < defaults.length; i++)
            if (defaults[i].canvasId === curCanvasId) {
                idx = i;
                break;
            }
        idx = (idx + 1) % defaults.length;
        window.kyrix.randomJump(
            this.props.kyrixViewId,
            defaults[idx].canvasId,
            defaults[idx].predDict,
            defaults[idx].newVpX,
            defaults[idx].newVpY,
            1,
            "dict"
        );
    };

    render() {
        return (
            <div className="kyrixdiv" ref={this.kyrixdivRef}>
                <Space className="kyrixvis-button-div">
                    <Button
                        size="small"
                        onClick={this.props.handleBookmarkButtonClick}
                        disabled={this.props.bookmarksButtonDisabled}
                    >
                        Save to Bookmarks
                    </Button>
                    <Button
                        size="small"
                        onClick={this.props.handleSeeAnotherVisButtonClick}
                    >
                        See Another Vis
                    </Button>
                </Space>

                <div className="explain">Kyrix View</div>
            </div>
        );
    }
}

export default KyrixVis;
