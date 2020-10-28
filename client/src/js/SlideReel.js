import React, {Component} from "react";
import ssvPic from "../pics/ssv.png";
import barChartPic from "../pics/barchart.png";
import pieChartPic from "../pics/piechart.png";
import circlePackPic from "../pics/circlepack.png";
import stackBarChartPic from "../pics/stackbarchart.png";
import treemapPic from "../pics/treemap.png";

class SlideReel extends Component {
    state = {};

    render() {
        return (
            <div className="slidereel">
                <div className="slideshow">
                    <div className="img-container">
                        <img src={ssvPic} alt="ssv"/>
                    </div>
                    <div className="img-container">
                        <img src={barChartPic} alt="barchart"/>
                    </div>
                    <div className="img-container">
                        <img src={pieChartPic} alt="piechart"/>
                    </div>
                    <div className="img-container">
                        <img src={stackBarChartPic} alt="stackbarchart"/>
                    </div>
                    <div className="img-container">
                        <img src={circlePackPic} alt="circlepack"/>
                    </div>
                    <div className="img-container">
                        <img src={treemapPic} alt="treemap"/>
                    </div>
                </div>
                <div className="explain">History Slider View</div>
            </div>
        );
    }
}

export default SlideReel;
