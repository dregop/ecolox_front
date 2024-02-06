import * as d3 from "d3";
import { Co2ByOriginByTime } from "../chart/chart.component";

export class Line {
    public name: string;
    public data: Co2ByOriginByTime[];
    public color: string;
    private category?: string;
    private xChartProps: any;
    private yChartProps: any;
    private lineValues: any;
    private areaGradient: any;

    constructor(name: string, data: Co2ByOriginByTime[], xChartProps: any, yChartProps: any, color: string, curveType?: d3.CurveFactory | d3.CurveBundleFactory, category?: string) {
        this.name = name;
        this.data = data;
        this.color = color;
        this.category = category;
        this.xChartProps = xChartProps;
        this.yChartProps = yChartProps;
        this.lineValues = this.define(this.data, this.xChartProps, this.yChartProps, curveType); 
    }

    // given the data and x, y it defines a line with a certain type of curve
    public define(data: Co2ByOriginByTime[], x: any, y: any, curveType?: d3.CurveFactory | d3.CurveBundleFactory): any {
        let curve = curveType === undefined ? d3.curveMonotoneX : curveType;
        return d3.line<Co2ByOriginByTime>().curve(curve)
            .x(function (d) {
                if (d.date instanceof Date) {
                return x(d.date.getTime());
                } 
            })
            .y(function (d) { return y(d.co2); })(data);
    }

    public addToPath(linesGroup: any): any {
        return linesGroup.append('path')
        .attr('class', 'line ' + this.name)
        .style('stroke', this.color)
        .style('fill', 'none')
        .style("stroke-width", 2)
        .attr('d', this.lineValues);
    }

    public update(svg: any, x: any, y: any, curveType?: d3.CurveFactory | d3.CurveBundleFactory): void {
        this.areaGradient = svg.append("defs")
        .append("linearGradient")
        .attr("id","areaGradient_" + this.name)
        .attr("x1", "0%").attr("y1", "0%")
        .attr("x2", "0%").attr("y2", "100%");
        
        this.areaGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", this.color)
        .attr("stop-opacity", 0.3);
        this.areaGradient.append("stop")
        .attr("offset", "120%")
        .attr("stop-color", "white")
        .attr("stop-opacity", 0);
    
        svg.select('.line.' + this.name)
        .style("fill", "url(#areaGradient_" + this.name + ")")
        .attr('d', this.define(this.data, x, y, curveType));
    }

    public selectPath(svg: any): any {
        return svg.select('path.line.line');
    }

    public getLineLastPointPos(chartProps: any, xz?: any, yz?: any) {
        const yAccessor = (d: Co2ByOriginByTime) => d.co2;
        const xAccessor = (d: Co2ByOriginByTime) => d.date;
    
        let xLastPos;
        let yLastPos;
        if (xz && yz) {
          xLastPos = xz(xAccessor(this.data[this.data.length - 1]));
          yLastPos = yz(yAccessor(this.data[this.data.length - 1]));
        } else {
          xLastPos = chartProps.x(xAccessor(this.data[this.data.length - 1]));
          yLastPos = chartProps.y(yAccessor(this.data[this.data.length - 1]));
        }
    
        return {x: xLastPos, y: yLastPos};
    }

    public buildAvatar(chartProps: any) {
        const pos = this.getLineLastPointPos(chartProps);
        chartProps.svgBox.append("circle")
        .style("stroke", "gray")
        .style("fill", "white")
        .attr("class", "circle_" + this.name)
        .attr("r", 14)
        .attr("cx", pos.x+ 20)
        .attr("cy", pos.y);
        chartProps.svgBox.append('image')
        .attr("class", "image_" + this.name)
        .attr('xlink:href', 'assets/avatar_' + this.name + '.png')
        .attr('width', 25)
        .attr('height', 25)
        .attr('x', pos.x + 7)
        .attr('y', pos.y - 13);
    }

    public updateAvatarPosition(chartProps: any, xz?: any, yz?: any) {
        const avatarPos = this.getLineLastPointPos(chartProps, xz, yz);
        chartProps.svgBox.select('.circle_' + this.name)
        .attr("cx", avatarPos.x)
        .attr("cy", avatarPos.y);
        chartProps.svgBox.select('.image_' + this.name)
        .attr("x", avatarPos.x - 12)
        .attr("y", avatarPos.y - 13);
    }

    public addLineLabel(chartProps: any) {
        const labelPos = this.getLineLastPointPos(chartProps);
        chartProps.svgBox.append("text")
        .attr("class", 'line_label_' + this.name)
        .attr("x", labelPos.x - 10)
        .attr("y", labelPos.y + 5)
        .style("font-size", "12px")
        .attr("dy", ".75em")
        .text(this.name);
    }

    public updateLabelPosition(chartProps: any, xz?: any, yz?: any) {
        const labelPos = this.getLineLastPointPos(chartProps, xz, yz);
        chartProps.svgBox.select('.line_label_' + this.name)
        .attr("x", labelPos.x - 50)
        .attr("y", labelPos.y + 5);
    }

    public hide() {
        d3.select('.line.' + this.name).style("opacity", 0);
        d3.select('.circle_' + this.name).style("opacity", 0);
        d3.select('.image_' + this.name).style("opacity", 0);
        d3.select('.line_label_' + this.name).style("opacity", 0);
    }

    public show() {
        d3.select('.line.' + this.name).style("opacity", 1);
        d3.select('.circle_' + this.name).style("opacity", 1);
        d3.select('.image_' + this.name).style("opacity", 1);
        d3.select('.line_label_' + this.name).style("opacity", 1);
    }
}