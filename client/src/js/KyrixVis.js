import React, {Component} from "react";
import {Button, Space, Dropdown, Menu, Popover} from "antd";
import {DownOutlined} from "@ant-design/icons";

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
        let visDetailsContent = (
            <>
                <div style={{display: "flex"}}>
                    <p style={{marginRight: "10px"}}>Visualization type:</p>
                    <p style={{marginRight: "10px"}}>Stacked bar chart</p>
                </div>
                <div style={{display: "flex"}}>
                    <p style={{marginRight: "10px"}}>Color Scheme:</p>
                    <Dropdown
                        overlay={
                            <Menu>
                                <Menu.Item>blue-green</Menu.Item>
                                <Menu.Item>red-purple</Menu.Item>
                            </Menu>
                        }
                    >
                        <a
                            className="ant-dropdown-link"
                            onClick={e => e.preventDefault()}
                        >
                            red-yellow <DownOutlined />
                        </a>
                    </Dropdown>
                </div>
            </>
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
                    <Button size="small">See Another Vis</Button>

                    <Popover content={visDetailsContent} trigger="click">
                        <Button size="small">Vis Details</Button>
                    </Popover>
                </Space>

                <div className="explain">Kyrix View</div>
            </div>
        );
    }
}

export default KyrixVis;
