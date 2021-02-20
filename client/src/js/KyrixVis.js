import React, {Component} from "react";
import {Button, Space, List, Popover} from "antd";

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
        if (this.props.interactionType === "historyItemClick")
            this.jumpToHistory();
        if (this.props.interactionType === "seeAnotherVisButtonClick")
            this.jumpToCjd();
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

    jumpToCjd = () => {
        let cjd = this.props.cjd;
        window.kyrix.randomJump(
            this.props.kyrixViewId,
            cjd.canvasId,
            cjd.predDict,
            cjd.newVpX,
            cjd.newVpY,
            1,
            "dict"
        );
    };

    render() {
        // seeanothervis button popover content
        let cjds = this.props.clickJumpDefaults[this.props.curTable];
        const content = (
            <List
                itemLayout="vertical"
                dataSource={cjds}
                renderItem={cjd => (
                    <List.Item key={JSON.stringify(cjd)}>
                        <Button
                            type="text"
                            onClick={() =>
                                this.props.handleSeeAnotherVisButtonClick(cjd)
                            }
                        >
                            {" "}
                            {cjd.title}{" "}
                        </Button>
                    </List.Item>
                )}
            />
        );

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
                    <Popover
                        content={content}
                        placement="bottom"
                        overlayClassName="seeanothervis-popover"
                    >
                        <Button size="small">See Another Vis</Button>
                    </Popover>
                </Space>

                <div className="explain">Kyrix View</div>
            </div>
        );
    }
}

export default KyrixVis;
