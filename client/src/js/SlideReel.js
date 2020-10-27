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
                        <img src={ssvPic} />
                    </div>
                    <div className="img-container">
                        <img src={barChartPic} />
                    </div>
                    <div className="img-container">
                        <img src={pieChartPic} />
                    </div>
                    <div className="img-container">
                        <img src={stackBarChartPic} />
                    </div>
                    <div className="img-container">
                        <img src={circlePackPic} />
                    </div>
                    <div className="img-container">
                        <img src={treemapPic} />
                    </div>
                </div>
                <div className="explain">History Slider View</div>
            </div>
        );
    }
}

export default SlideReel;
