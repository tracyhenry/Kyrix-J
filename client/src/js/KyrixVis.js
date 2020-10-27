import React, {Component} from "react";
import * as kyrix from "../lib/kyrix";

class KyrixVis extends Component {
    constructor(props) {
        super(props);
        this.kyrixdivRef = React.createRef();
    }

    componentDidMount = () => {
        var serverAddr = "http://127.0.0.1:8000";
        kyrix.initializeApp(serverAddr, this.kyrixdivRef.current);
    };

    componentDidUpdate = () => {
        var serverAddr = "http://127.0.0.1:8000";
        kyrix.initializeApp(serverAddr, this.kyrixdivRef.current);
    };

    render() {
        return (
            <div className="kyrixdiv" ref={this.kyrixdivRef}>
                <div className="explain">Kyrix View</div>
            </div>
        );
    }
}

export default KyrixVis;
