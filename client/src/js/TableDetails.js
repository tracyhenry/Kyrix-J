import React, {Component} from "react";

class TableDetails extends Component {
    constructor(props) {
        super(props);
        this.state = {
            searchBarValue: "",
            visibleTables: Object.keys(props.tableColumns)
        };
    }

    handleSearchBarChange = event => {
        // find matching tables
        let value = event.target.value;
        let columns = this.props.tableColumns;
        let matchingTables = [];
        for (let table in columns) {
            let match = false;
            for (let i = 0; i < columns[table].length; i++) {
                if (
                    columns[table][i]
                        .toLowerCase()
                        .startsWith(value.toLowerCase())
                ) {
                    match = true;
                    break;
                }
            }
            if (table.toLowerCase().startsWith(value.toLowerCase()))
                match = true;
            if (match) matchingTables.push(table);
        }

        // set state
        this.setState({
            searchBarValue: value,
            visibleTables: matchingTables
        });
    };

    render() {
        const visibleTableList = this.state.visibleTables.map(d => (
            <li key={d}>{d}</li>
        ));
        return (
            <div className="tabledetails">
                <div className="searchbar">
                    <input
                        type="text"
                        size="30"
                        placeholder="Search for a table..."
                        value={this.state.searchBarValue}
                        onChange={this.handleSearchBarChange}
                    />
                </div>
                <div className="tablelist">
                    <ul className="tablelistul">{visibleTableList}</ul>
                </div>
                <div className="schemadetails">
                    <style type="text/css"></style>
                    <table className="curtable">
                        <thead>
                            <tr>
                                <th className="tg-76qt">Buildings</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="tg-76qt">building_number</td>
                            </tr>
                            <tr>
                                <td className="tg-76qt">campus_sector</td>
                            </tr>
                            <tr>
                                <td className="tg-76qt">assignable_area</td>
                            </tr>
                            <tr>
                                <td className="tg-76qt">building_use</td>
                            </tr>
                            <tr>
                                <td className="tg-76qt">latitude</td>
                            </tr>
                            <tr>
                                <td className="tg-76qt">ownership_type</td>
                            </tr>
                            <tr>
                                <td className="tg-76qt">building_height</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="explain">Table Details View</div>
            </div>
        );
    }
}

export default TableDetails;
