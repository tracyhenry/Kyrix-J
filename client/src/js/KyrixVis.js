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

    componentDidUpdate = () => {
        if (!this.props.kyrixLoaded) return;
        if (
            this.props.newTableType === "tableDetailsClick" ||
            this.props.newTableType === "graphClick"
        )
            this.jumpToClickedTable();
    };

    // this is necessary! Otherwise there'll be cyclic calls
    // seems like every KyrixJ.setState call will cause an update
    // to all components
    shouldComponentUpdate = nextProps =>
        nextProps.curTable !== this.props.curTable;

    jumpToClickedTable = () => {
        let curTable = this.props.curTable;
        let defaults = this.props.clickJumpDefaults[curTable];
        window.kyrix.randomJump(
            this.props.kyrixViewId,
            defaults.canvasId,
            defaults.predDict,
            defaults.newVpX,
            defaults.newVpY
        );
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
