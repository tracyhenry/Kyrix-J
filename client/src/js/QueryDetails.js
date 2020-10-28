import React, {Component} from "react";

class QueryDetails extends Component {
    state = {};

    render() {
        return (
            <div className="querydetails">
                <div className="sqlquerydiv">
                    <h4>Current SQL query</h4>
                    <div className="sqlquery">
                        SELECT campus_sector, AVG(building_height)
                        <br />
                        FROM buildings
                        <br />
                        GROUP BY campus_sector;
                    </div>
                </div>

                <div className="filterdiv">
                    <h4>Drill down filters</h4>
                    <ul>
                        <li>'building_number' = 32</li>
                        <li>'building_use' = 'academic'</li>
                    </ul>
                </div>

                <div className="explain">Query View</div>
            </div>
        );
    }
}

export default QueryDetails;
