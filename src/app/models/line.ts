import * as d3 from "d3";
import { Co2ByOriginByTime } from "../chart/chart.component";

export class Line {
    public name: string;
    public data: Co2ByOriginByTime[];
    private color: string;
    private category?: string;
    private xChartProps: any;
    private yChartProps: any;
    private lineValues: any;

    constructor(name: string, data: Co2ByOriginByTime[], xChartProps: any, yChartProps: any, color: string, category?: string) {
        this.name = name;
        this.data = data;
        this.color = color;
        this.category = category;
        this.xChartProps = xChartProps;
        this.yChartProps = yChartProps;
        this.lineValues = this.define(this.data, this.xChartProps, this.yChartProps); 
    }

    public define(data: Co2ByOriginByTime[], x: any, y: any): any {
        return d3.line<Co2ByOriginByTime>().curve(d3.curveCatmullRom.alpha(0.5))
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

    public update(svg: any, x: any, y: any): void {
        svg.select('.line.' + this.name)
        .attr('d', this.define(this.data, x, y));
    }

    public selectPath(svg: any): any {
        return svg.select('path.line.line');
    }
}