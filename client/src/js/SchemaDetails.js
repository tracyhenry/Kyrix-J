import React, {Component} from "react";
import {CSSTransition} from "react-transition-group";

class SchemaDetails extends Component {
    render() {
        const curTable = this.props.curTable;
        const trList =
            curTable &&
            this.props.columns.slice(0, 8).map(col => (
                <CSSTransition
                    key={curTable + "." + col}
                    classNames="tablefade"
                    in={true}
                    appear={true}
                    timeout={300}
                >
                    <tr key={col}>
                        <td className="tg-76gt">{col}</td>
                    </tr>
                </CSSTransition>
            ));
        return (
            <div className="schemadetails">
                {curTable && (
                    <table className="curtable">
                        <CSSTransition
                            key={curTable + ".caption"}
                            classNames="tablefade"
                            in={true}
                            appear={true}
                            timeout={300}
                        >
                            <caption>{curTable}</caption>
                        </CSSTransition>
                        <tbody>{trList}</tbody>
                    </table>
                )}
            </div>
        );
    }
}

export default SchemaDetails;
