import React, {Component} from "react";

class KyrixVis extends Component {
    constructor(props) {
        super(props);
        this.kyrixdivRef = React.createRef();
    }

    componentDidMount = () => {
        var serverAddr = "http://127.0.0.1:8000";
        window.kyrix
            .initializeApp(serverAddr, this.kyrixdivRef.current)
            .then(() => {
                this.props.handleKyrixLoad();
            });
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
