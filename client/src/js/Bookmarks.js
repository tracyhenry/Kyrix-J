import React, {Component} from "react";
import {Drawer, List} from "antd";
import HistoryItem from "./low-level-components/HistoryItem";

class Bookmarks extends Component {
    shouldComponentUpdate = nextProps =>
        this.props.visible !== nextProps.visible ||
        this.props.bookmarks.length !== nextProps.bookmarks.length;

    render() {
        return (
            <Drawer
                title="Bookmarks"
                className="slideshow"
                placement="left"
                onClose={this.props.handleBookmarksVisibleChange}
                visible={this.props.visible}
            >
                <List
                    dataSource={this.props.bookmarks}
                    renderItem={d => (
                        <HistoryItem
                            d={d}
                            clickHandler={this.props.handleHistoryItemClick}
                        />
                    )}
                />
            </Drawer>
        );
    }
}

export default Bookmarks;
