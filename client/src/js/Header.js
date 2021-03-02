import React, {Component} from "react";
import {Input, AutoComplete, Tag} from "antd";
import {
    createFromIconfontCN,
    HistoryOutlined,
    SyncOutlined
} from "@ant-design/icons";

class Header extends Component {
    constructor(props) {
        super(props);
        this.IconFont = createFromIconfontCN({
            scriptUrl: "//at.alicdn.com/t/font_2257494_xqvvxo50lt.js"
        });
    }

    shouldComponentUpdate = nextProps => {
        return (
            this.props.searchBarValue !== nextProps.searchBarValue ||
            JSON.stringify(this.props.searchResults) !==
                JSON.stringify(nextProps.searchResults)
        );
    };

    getHighlightedText = text => {
        let words = text.split(/\s+/);
        let st = text
            .toLowerCase()
            .indexOf(this.props.searchBarValue.toLowerCase());
        let ed = st + this.props.searchBarValue.length;
        if (st < 0) return <>{text}</>;
        return (
            <>
                <span>{text.substring(0, st)}</span>
                <span className="search-result-highlight">
                    {text.substring(st, ed)}
                </span>
                <span>{text.substring(ed)}</span>
            </>
        );
    };

    render() {
        let options = [];
        if (Object.keys(this.props.searchResults).length === 0)
            options.push({
                value: "wait",
                label: (
                    <div className="result-spin">
                        <SyncOutlined spin />
                    </div>
                )
            });
        else {
            let tables = Object.keys(this.props.searchResults);
            tables.sort((a, b) => {
                let va = a.includes(this.props.searchBarValue)
                    ? a.length
                    : 1000;
                let vb = b.includes(this.props.searchBarValue)
                    ? b.length
                    : 1000;
                return va - vb;
            });
            for (let i = 0; i < tables.length; i++) {
                let t = tables[i];
                if (this.props.searchResults[t].length === 0) continue;
                let nonTableNameMatches = this.props.searchResults[t].filter(
                    res => res.type !== "table_name"
                );
                options.push({
                    value: t,
                    label: (
                        <div
                            className="search-result"
                            key={t}
                            onClick={() => {
                                this.props.handleSearch(t);
                            }}
                        >
                            <div
                                className={
                                    "search-result-title" +
                                    (nonTableNameMatches.length > 0
                                        ? " search-result-title-section"
                                        : "")
                                }
                            >
                                Table <i>{this.getHighlightedText(t)}</i>
                            </div>
                            {nonTableNameMatches.map(res => (
                                <div
                                    key={res.value}
                                    className="search-result-item"
                                >
                                    <p>{this.getHighlightedText(res.value)}</p>
                                    <Tag color="geekblue">{res.type}</Tag>
                                </div>
                            ))}
                        </div>
                    )
                });
            }
        }
        return (
            <div className="kyrixjheader">
                <div
                    className="header-button-div"
                    onClick={this.props.handleHistoryVisibleChange}
                >
                    <HistoryOutlined className="header-button" />
                    History
                </div>
                <div
                    className="header-button-div"
                    onClick={this.props.handleBookmarksVisibleChange}
                >
                    <this.IconFont
                        type="icon-weibiaoti15"
                        className="header-button"
                    />
                    Bookmarks
                </div>
                <p className="header-title">Superman @ The MONDIAL Database</p>
                <AutoComplete
                    className="header-input"
                    notFoundContent={"No matches found."}
                    options={options}
                    value={this.props.searchBarValue}
                    dropdownMatchSelectWidth={500}
                    // defaultActiveFirstOption={false}
                    onSearch={this.props.handleSearchBarInputChange}
                >
                    <Input.Search
                        size="large"
                        placeholder="Search for a starting table..."
                    />
                </AutoComplete>
            </div>
        );
    }
}

export default Header;
