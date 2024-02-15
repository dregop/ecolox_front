import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { GraphService } from '../services/graph.service';
import { Co2ByOriginByTime } from '../internet.component';
import * as d3 from 'd3';
import { Line } from 'src/app/models/line';
import { UserFeatures } from 'src/app/models/userFeatures';
import { UserService } from 'src/app/services/user.service';
import { ToastService, toastType } from 'src/app/services/toast.service';

@Component({
  selector: 'bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.scss']
})
export class BarChartComponent implements OnInit {

  @ViewChild('bar_chart') chartElement!: ElementRef;

  parseDate = d3.timeParse('%d-%m-%Y');
  
  public browserName: string = "Chrome";
  public chartProps!: any;
  public dataSumDbExtCo2TimeSerieFiltered: Co2ByOriginByTime[] = [];
  public dataDrawnCo2TimeSerie: Co2ByOriginByTime[] = [];
  public dataThreshold: Co2ByOriginByTime[] = [];
  public bars!: any;
  private thresholdCo2 = 450;
  public tonnes!: number;
  public degres!: number;
  public userFeatures!: UserFeatures;

  public currentSelectedDayOfWeek = new Date().getDay();
  public currentSelectedDayOfMonth = new Date().getDate();
  public currentSelectedMonth = new Date().getMonth();
  public currentSelectedYear = new Date().getFullYear();
  public daysOfWeek!: HTMLCollection;
  public dayOfWeekNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];


  @Input() public dataDb: Co2ByOriginByTime[] = [];
  @Input() public dataExt: Co2ByOriginByTime[] = [];
  @Input() public dataGlobal: Co2ByOriginByTime[] = [];
  @Input() public firstDataExt: Co2ByOriginByTime[] = [];
  @Input() public dataSumDbExt: Co2ByOriginByTime[] = [];
  constructor(private graphService: GraphService, private userService: UserService, public toastService: ToastService) {
    this.userService.$userFeatures.subscribe({
      next: (features) => {
        console.log(features);
        if (features && features.level) {
          this.userFeatures = features;
        } else {
          const overlay_message = document.getElementById('overlay_message');
          if (overlay_message) {
            overlay_message.style.display = 'block';
          }
        }
      },
      error: (err) => console.log(err.message)
    });
  }

  ngOnInit(): void {
    this.graphService.$browserName.subscribe((browser) => {
      this.browserName = browser;
    });

    this.graphService.setD3Locale(); // initiate date for x graph 

    let loop = 0;
    const draw = setInterval(() => {
      if (this.chartProps && this.dataSumDbExt.length > 0) {
        // this.updateChart();
      } else if (this.dataSumDbExt.length > 0) {
        this.buildChart();
      }
      loop++;
      // if (loop > 1000) { // ~15 min we stop updating chart
      //   clearInterval(draw);
      // }

    }, 1000);

    // Add an event listener that run the function when dimension change
    window.addEventListener('resize', updateOnResize);
    const _this = this;
    function updateOnResize() {
      // get the current width of the div where the chart appear, and attribute it to Svg
      if (_this.chartProps) {
        // const newWidth = document.body.clientWidth - 200;
        const newWidth = document.getElementById('bar_chart')?.clientWidth;
        const newHeight = document.getElementById('bar_chart')?.clientHeight;
        if (newWidth && newHeight) {
          console.log('# on resize');

          _this.chartProps.svg
          .attr("viewBox", '0 0 ' +  newWidth + ' ' +newHeight );

          _this.chartProps.x.range([ 0, newWidth - _this.chartProps.margin.left - _this.chartProps.margin.right ]);
          _this.chartProps.y.range([ newHeight - _this.chartProps.margin.top - _this.chartProps.margin.bottom, 0]);

          _this.chartProps.svgBox.select('.x.axis') // update x axis
          .attr('transform', `translate(0,${newHeight  - _this.chartProps.margin.top - _this.chartProps.margin.bottom})`)
          .call(_this.chartProps.xAxis, _this.chartProps.x);
          _this.chartProps.svgBox.select('.y.axis') // update y axis
          .call(_this.chartProps.yAxis, _this.chartProps.y);


          _this.chartProps.svgBox.select('.arrow')
          .attr("x", newWidth - 50 - _this.chartProps.margin.top )
          .attr("y", newHeight -37 - _this.chartProps.margin.bottom);

          _this.chartProps.width = newWidth - _this.chartProps.margin.left - _this.chartProps.margin.right;
          _this.chartProps.height = newHeight - _this.chartProps.margin.top - _this.chartProps.margin.bottom;

          _this.updateChart();
        }
      }
    }

    const treasholdButton = document.getElementById('treashold');
    const dayButton = document.getElementById('day');
    const weekButton = document.getElementById('week');
    const monthButton = document.getElementById('month');
    const allButton = document.getElementById('all');

    dayButton?.addEventListener('click', () => {
      console.log('Range : day of month nbr ' + this.currentSelectedDayOfMonth);

      this.dataSumDbExtCo2TimeSerieFiltered = this.dataSumDbExt.filter(d => new Date(d.date).getDate() === this.currentSelectedDayOfMonth && new Date(d.date).getMonth() === this.currentSelectedMonth && new Date(d.date).getFullYear() === this.currentSelectedYear);

      // let day = 1;
      // while (this.dataDbCo2TimeSerieFiltered.length === 0) {
      //   this.dataDbCo2TimeSerieFiltered = this.dataDb.filter(d => new Date(d.date).getDate() === new Date().getDate() - day && new Date(d.date).getMonth() === new Date().getMonth() && new Date(d.date).getFullYear() === new Date().getFullYear());
      //   this.toastService.handleToast(toastType.Info, 'Pas de donnée enregistrée disponible pour le ' + (new Date().getDate() - day + 1));
      //   day++;
      // }
      dayButton.className = 'btn-graph activated';

      const rightButtonDay = document.getElementById('right-button-day');
      const leftButtonDay = document.getElementById('left-button-day');

      if (rightButtonDay && leftButtonDay) {
        (rightButtonDay as HTMLInputElement).disabled = false;
        rightButtonDay.style.opacity = '1';    
        (leftButtonDay as HTMLInputElement).disabled = false;
        leftButtonDay.style.opacity = '1';    
      }
  
      if (this.currentSelectedDayOfMonth === new Date().getDate() && this.currentSelectedMonth === new Date().getMonth() && this.currentSelectedYear === new Date().getFullYear() && rightButtonDay) {
        (rightButtonDay as HTMLInputElement).disabled = true;
        rightButtonDay.style.opacity = '0.3';
      }
  
      if (this.dataSumDbExt.length > 0 && this.currentSelectedDayOfMonth === new Date(this.dataSumDbExt[0].date).getDate() && this.currentSelectedMonth === new Date(this.dataSumDbExt[0].date).getMonth() && this.currentSelectedYear === new Date(this.dataSumDbExt[0].date).getFullYear() && leftButtonDay) {
        (leftButtonDay as HTMLInputElement).disabled = true;
        leftButtonDay.style.opacity = '0.3';
      }
    
      if (allButton) {
        allButton.className = 'btn-graph';
      }
      // if (weekButton) {
      //   weekButton.className = 'btn-graph';
      // }
      // if (monthButton) {
      //   monthButton.className = 'btn-graph';
      // }

      //  Add lines if on click on checkboxes (wait a bit so the inputs are added to the DOM)
      // setTimeout(() => {
      //   this.buildLinesDaysOfWeek();
      // }, 100);

      this.updateChart();

      this.daysOfWeek = document.getElementsByClassName('days_of_week');
    });

    allButton?.addEventListener('click', () => {
      console.log('Range : all');
      this.dataSumDbExtCo2TimeSerieFiltered = [];
      allButton.className = 'btn-graph activated';     
      // this.fillIndicators(); //TODO: check impact
      if (dayButton) {
        dayButton.className = 'btn-graph';
      }
      if (weekButton) {
        weekButton.className = 'btn-graph';
      }
      if (monthButton) {
        monthButton.className = 'btn-graph';
      }

      this.updateChart();
    });

    treasholdButton?.addEventListener('click', () => {
      if (treasholdButton.className.includes('activated')) {
        // this.graphService.scaleXYDomain(this.dataDrawnCo2TimeSerie, this.chartProps.x, this.chartProps.y);
        treasholdButton.className = 'btn-graph';
        d3.select('.threshold').style("opacity", 0);
        d3.select('.threshold_label').style("opacity", 0);
      } else {
        const sumAllData = [...this.dataThreshold];
        this.dataDrawnCo2TimeSerie.forEach((data) => {
          sumAllData.push(data);
        });
        // if (!lastDayButton?.className.includes('activated')) {
        //   this.graphService.scaleXYDomain(sumAllData, this.chartProps.x, this.chartProps.y);
        // }
        treasholdButton.className = 'btn-graph activated';
        d3.select('.threshold').style("opacity", 1);
        d3.select('.threshold_label').style("opacity", 1);
      }
      this.updateChart();
    });

    const date_filters = document.getElementById('date-filters');
    const buttons = date_filters?.getElementsByTagName('button');
    const rightButtonDay = document.getElementById('right-button-day');
    const leftButtonDay = document.getElementById('left-button-day');
    Array.from(buttons as any).forEach((button: any) => {
      (button as HTMLInputElement).addEventListener(('click'), () => {
        if ((button as HTMLInputElement).id === 'left-button-day') {
          const newDate = new Date(this.currentSelectedYear, this.currentSelectedMonth, this.currentSelectedDayOfMonth).getTime() - 3600000 * 24; // remove 1 day;
          this.currentSelectedDayOfWeek = new Date(newDate).getDay();
          this.currentSelectedDayOfMonth = new Date(newDate).getDate();
          this.currentSelectedMonth = new Date(newDate).getMonth();
          this.currentSelectedYear = new Date(newDate).getFullYear();

        } else if ((button as HTMLInputElement).id === 'right-button-day') {
          const newDate = new Date(this.currentSelectedYear, this.currentSelectedMonth, this.currentSelectedDayOfMonth).getTime() + 3600000 * 24; // add 1 day;
          this.currentSelectedDayOfWeek = new Date(newDate).getDay();
          this.currentSelectedDayOfMonth = new Date(newDate).getDate();
          this.currentSelectedMonth = new Date(newDate).getMonth();
          this.currentSelectedYear = new Date(newDate).getFullYear();
        } else {
          return;
        }

        if (this.currentSelectedDayOfMonth === new Date().getDate() && this.currentSelectedMonth === new Date().getMonth() && this.currentSelectedYear === new Date().getFullYear() && rightButtonDay) {
          (rightButtonDay as HTMLInputElement).disabled = true;
          rightButtonDay.style.opacity = '0.3';
        } else if (rightButtonDay) {
          (rightButtonDay as HTMLInputElement).disabled = false;
          rightButtonDay.style.opacity = '1';        
        }

        if (this.currentSelectedDayOfMonth === new Date(this.dataSumDbExt[0].date).getDate() && this.currentSelectedMonth === new Date(this.dataSumDbExt[0].date).getMonth() && this.currentSelectedYear === new Date(this.dataSumDbExt[0].date).getFullYear() && leftButtonDay) {
          (leftButtonDay as HTMLInputElement).disabled = true;
          leftButtonDay.style.opacity = '0.3';
        } else if (leftButtonDay) {
          (leftButtonDay as HTMLInputElement).disabled = false;
          leftButtonDay.style.opacity = '1';        
        }

        this.dataSumDbExtCo2TimeSerieFiltered = this.dataSumDbExt.filter(d => new Date(d.date).getDate() === this.currentSelectedDayOfMonth && new Date(d.date).getMonth() === this.currentSelectedMonth && new Date(d.date).getFullYear() === this.currentSelectedYear);

        const selectedDate = new Date(this.currentSelectedYear, this.currentSelectedMonth, this.currentSelectedDayOfMonth);
        let displayedDay: number;
        displayedDay = this.currentSelectedDayOfWeek % 7; // sunday is 0 and monday to 1 so we take the rest
        if (displayedDay === 0) {
          displayedDay = 7;
        }
        let j = 0;
        Array.from(this.daysOfWeek).forEach((day: any) => {
          j++;
          if ((j > new Date().getDay() % 7 && day && this.graphService.getWeek(new Date()) === this.graphService.getWeek(selectedDate)) || this.dataSumDbExtCo2TimeSerieFiltered.length === 0) {
            ((day as HTMLInputElement).nextSibling as  HTMLElement).style.opacity = '0.5';
            (day as HTMLInputElement).disabled = true;
          } else {
            ((day as HTMLInputElement).nextSibling as  HTMLElement).style.opacity = '1';
            (day as HTMLInputElement).disabled = false;
          }
        });

        if (this.daysOfWeek && this.daysOfWeek.length > 0) {
          for (let i = 0; i < this.daysOfWeek.length; i++) {
            (this.daysOfWeek[i] as HTMLInputElement).checked = false;
            if (i+1 === displayedDay) {
              (this.daysOfWeek[i] as HTMLInputElement).checked = true;   
            }
          }
        }

        if (!this.dataSumDbExtCo2TimeSerieFiltered || this.dataSumDbExtCo2TimeSerieFiltered.length === 0) {
          this.toastService.handleToast(toastType.Info, 'Pas de donnée enregistrée disponible pour ce jour');
          return;
        }

        // this.removeLinesDaysOfWeek();
        this.updateChart();
      });
    });
  }

  private groupByDays(data: Co2ByOriginByTime[]): Co2ByOriginByTime[] {
    let newData : Co2ByOriginByTime[] = [];
    const groupedData = d3.group(data, d => new Date(d.date).getDate());
    groupedData.forEach((entry: Co2ByOriginByTime[]) => {
      const co2 = entry[entry.length - 1].co2 - entry[0].co2;
      newData.push({co2: co2, date: new Date(2024, 0, entry[0].date.getDate())});
    });
    return newData;
  }

  private groupByHours(data: Co2ByOriginByTime[]): Co2ByOriginByTime[] {
    let newData : Co2ByOriginByTime[] = [];
    const groupedData = d3.group(data, d => new Date(d.date).getHours());
    groupedData.forEach((entry: Co2ByOriginByTime[]) => {
      const co2 = entry[entry.length - 1].co2 - entry[0].co2;
      newData.push({co2: co2, date: new Date(2024, 0, entry[0].date.getDate(), entry[0].date.getHours())});
    });
    return newData;
  }

  private buildChart() {
    console.log('i bluid bar chart');

    const no_data_overlay = document.getElementById('no_data_bar');
    if (no_data_overlay) {
      no_data_overlay.style.display = 'none';
    }

    this.chartProps = {};
    
    this.dataDrawnCo2TimeSerie = this.groupByDays(this.dataSumDbExt);
    console.log(this.dataDrawnCo2TimeSerie);
    // propage 
    this.graphService.$dataDrawnCo2TimeSerie.next(this.dataDrawnCo2TimeSerie);

    // Set the dimensions of the graph
    const margin = { top: 30, right: 20, bottom: 40, left: 50 };
    let width = 1244  - margin.left - margin.right;
    let height = 651  - margin.top - margin.bottom;

    const widthDivChart = document.getElementById('bar_chart')?.clientWidth;
    const heightDivChart = document.getElementById('bar_chart')?.clientHeight;
    if (widthDivChart && heightDivChart) {
      width = widthDivChart - margin.left - margin.right;
      height = heightDivChart - margin.top - margin.bottom;
    }
    
    const svg = d3.select(this.chartElement.nativeElement)
      .append('svg')
      // .attr('width', width + margin.left + margin.right)
      // .attr('height', height + margin.top + margin.bottom)
      .attr('viewBox', '0 0 ' + ( width + margin.left + margin.right)  + ' ' + (height + margin.top + margin.bottom));
      const svgBox = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Set the ranges and domains
    this.chartProps.x = d3.scaleBand()
    .domain(this.dataDrawnCo2TimeSerie.map((d) => d.date))
    .range([0, width])
    .padding(0.1);

    this.chartProps.y = d3.scaleLinear()
    .domain([0, d3.max(this.dataDrawnCo2TimeSerie, (d) => d.co2 as any + d.co2/15)]) // as any -> otherwise error
    .range([height, 0]);

    // Define the axes
    const xAxis = (g: any, x: any) => g
    .call(d3.axisBottom(x).tickFormat(this.graphService.multiFormat).tickPadding(width / 80));
    var yAxis = (g: any, y: any) => g
    .call(d3.axisLeft(y).tickPadding(height / 80).tickSize(-15000));
  
    // Add a rect for each bar.
    this.bars = svg.append("g")
      .attr("fill", "orange")
      .attr("class", "bars")
      .selectAll()
      .data(this.dataDrawnCo2TimeSerie)
      .join("rect")
        .attr("x", (d) => this.chartProps.x(d.date) + margin.left)
        .attr("y", (d) => this.chartProps.y(d.co2) + margin.top - 1)
        .attr("height", (d) => this.chartProps.y(0) - this.chartProps.y(d.co2))
        .attr("width", this.chartProps.x.bandwidth());

    // Add the X Axis
    const gx = svgBox.append('g')
      .attr('class', 'x axis')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis, this.chartProps.x);

    this.chartProps.height = height;
    this.chartProps.width = width;

      svgBox.append('image')
      .attr("class", "arrow")
      .attr('xlink:href', "assets/arrow.png")
      .attr('width', 14)
      .attr('height', 14)
      .attr('x', this.chartProps.width - 5)
      .attr('opacity', '1')
      .attr('y', this.chartProps.height - 7);

    // Add the Y Axis
    const gy = svgBox.append('g')
      .attr('class', 'y axis')
      .call(yAxis, this.chartProps.y);

    gy.selectAll(".tick line").style("stroke-dasharray", "5 5").style("opacity", "0.3");
    // gx.select('path').style("opacity", "0");
    gy.select('path').style("opacity", "0");

    // Setting the required objects in chartProps so they could be used to update the chart
    this.chartProps.svg = svg;
    this.chartProps.svgBox = svgBox;
    this.chartProps.xAxis = xAxis;
    this.chartProps.yAxis = yAxis;
    this.chartProps.margin = margin;

    // // Add treashold internet line
    this.dataDrawnCo2TimeSerie.forEach((data) =>  {
      this.dataThreshold.push({co2: this.thresholdCo2, date: data.date});
    })

    // add the threshold TODO: name it to update it
    svg.append("g")
    .attr("fill", "red")
    .attr("class", "threshold")
    .selectAll()
    .data(this.dataThreshold)
    .join("rect")
      .attr("x", (d) => this.chartProps.x(d.date) + margin.left)
      .attr("y", (d) => this.chartProps.y(d.co2) + margin.top - 1)
      .attr("height", (d) => this.chartProps.y(d.co2 - 4) - this.chartProps.y(d.co2))
      .attr("width", this.chartProps.x.bandwidth());

    this.chartProps.svgBox.append("text")
    .attr("class", 'threshold_label')
    .attr("x", width - 40)
    .attr("y", height + margin.top + margin.bottom - this.thresholdCo2 - 15)
    .style("font-size", "12px")
    .attr("dy", ".75em")
    .text('Seuil');

    // Label for Y axis
    svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "middle")
    .attr("x", 100)
    .attr("y", this.chartProps.height / 2)
    .style("font-size", "12px")
    .attr("dy", ".75em")
    .text("Co2(grammes)");

    d3.select('.threshold').style("opacity", 0);
    d3.select('.threshold_label').style("opacity", 0);

    this.updateChart();
  }

  public isDayButtonActivated(): boolean {
    const  dayButton = document.getElementById('day');
    if (dayButton?.className.includes('activated')) {
      return true;
    } else {
      return false;
    }
  }

  public updateChart(): void {
    console.log('update chart');

    // which data to draw 
    if (this.dataSumDbExtCo2TimeSerieFiltered && this.dataSumDbExtCo2TimeSerieFiltered.length > 0) {
      this.dataDrawnCo2TimeSerie = [...this.dataSumDbExtCo2TimeSerieFiltered];
    }
    else if (this.dataDb && this.dataDb.length > 0) {
      this.dataDrawnCo2TimeSerie = [...this.dataDb];
    } else {
      this.dataDrawnCo2TimeSerie = [];
    }

    if (this.currentSelectedDayOfMonth === new Date().getDate() && this.currentSelectedMonth === new Date().getMonth() && this.currentSelectedYear === new Date().getFullYear()) {
      this.firstDataExt.forEach((entry) => {  // fill with data extension stored when you were not on the website
        this.dataDrawnCo2TimeSerie.push(entry); //DIFFERENT THAN IN LINE CHART I NNEED TO PUT IT BEFORE
      });
      this.dataExt.forEach((entry) => {
        this.dataDrawnCo2TimeSerie.push(entry);
      });
      const dayButton = document.getElementById('day');
      if (dayButton?.className.includes('activated')) {
        this.dataDrawnCo2TimeSerie = this.groupByHours(this.dataDrawnCo2TimeSerie);
       } else {
        this.dataDrawnCo2TimeSerie = this.groupByDays(this.dataDrawnCo2TimeSerie);
       }
    } else {
      const dayButton = document.getElementById('day');
      if (dayButton?.className.includes('activated')) {
        this.dataDrawnCo2TimeSerie = this.groupByHours(this.dataDrawnCo2TimeSerie);
       } else {
        this.dataDrawnCo2TimeSerie = this.groupByDays(this.dataDrawnCo2TimeSerie);
       }
    }
    // propage 
    this.graphService.$dataDrawnCo2TimeSerie.next(this.dataDrawnCo2TimeSerie);

    // define the right threashold according to time filter and level
    let threshold;
    if (this.userFeatures && this.userFeatures.level && this.userFeatures.internet) {
      switch(this.userFeatures.level) {
        case 'debutant':
          this.tonnes = 6;
          this.degres = 3.5;
          threshold = this.tonnes * 1000 * this.userFeatures.internet / 100;
          break;
        case 'apprenti':
          this.tonnes = 5;
          this.degres = 3;
          threshold = this.tonnes * 1000 * this.userFeatures.internet / 100;
          break;
        default:
          this.tonnes = 2;
          this.degres = 1.5;
          threshold = this.tonnes * 1000 * this.userFeatures.internet / 100;
          break;
      }
    } else {
      threshold = 275;
    }
    let diff_between_dataDrawn_minmax_date = this.dataDrawnCo2TimeSerie[this.dataDrawnCo2TimeSerie.length - 1].date - this.dataDrawnCo2TimeSerie[0].date;
    diff_between_dataDrawn_minmax_date /= (3.6e+6); // heures
    if (diff_between_dataDrawn_minmax_date < 24 && threshold) {
      this.thresholdCo2 = this.dataDrawnCo2TimeSerie[0].co2 + threshold;
    } else if (diff_between_dataDrawn_minmax_date >= 24 && diff_between_dataDrawn_minmax_date < 24*7 && threshold) {
      this.thresholdCo2 = this.dataDrawnCo2TimeSerie[0].co2 + threshold * 7;
    } else if (diff_between_dataDrawn_minmax_date >= 24*7 && diff_between_dataDrawn_minmax_date < 24*31 && threshold) {
      this.thresholdCo2 = this.dataDrawnCo2TimeSerie[0].co2 + threshold * 30;
    } else {
      this.thresholdCo2 = 100000;
    }
    this.dataThreshold = [{co2: this.thresholdCo2, date: this.dataDrawnCo2TimeSerie[0].date}, {co2: this.thresholdCo2, date: this.dataDrawnCo2TimeSerie[this.dataDrawnCo2TimeSerie.length - 1].date}];

    // SCALE ACCORDING TO UPDATED RANGE
    // let sumAllData: Co2ByOriginByTime[] = [];
    // const treasholdButton = document.getElementById('treashold');
    // const globalDataButton = document.getElementById('global_data');
    // if (treasholdButton?.className.includes('activated')) {
    //   sumAllData = [...this.dataThreshold];
    // }
    // if (globalDataButton?.className.includes('activated')) {
    //   this.dataGlobal.forEach((data) => {
    //     sumAllData.push(data);
    //   });
    // }
    // this.dataDrawnCo2TimeSerie.forEach((data) => {
    //   sumAllData.push(data);
    // });

    console.log(this.dataDrawnCo2TimeSerie);
    this.chartProps.x
    .domain(this.dataDrawnCo2TimeSerie.map((d) => d.date))
    .padding(0.1);

    this.chartProps.y
    .domain([0, d3.max(this.dataDrawnCo2TimeSerie, (d) => d.co2 as any + d.co2/15)]); // as any -> otherwise error

    const areaGradient = this.chartProps.svg.append("defs")
    .append("linearGradient")
    .attr("id","areaGradient")
    .attr("x1", "0%").attr("y1", "0%")
    .attr("x2", "0%").attr("y2", "100%");
    
    areaGradient.append("stop")
    .attr("offset", "1%")
    .attr("stop-color", "#FF8729")
    .attr("stop-opacity", 0.9);
    areaGradient.append("stop")
    .attr("offset", "40%")
    .attr("stop-color", "orange")
    .attr("stop-opacity", 0.7);
    areaGradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "white")
    .attr("stop-opacity", 0.3);

    // update bar chart
    this.bars
    .data(this.dataDrawnCo2TimeSerie)
    .style("fill", "url(#areaGradient)")
    .join("rect")
      .attr("x", (d: Co2ByOriginByTime) => this.chartProps.x(d.date) + this.chartProps.margin.left)
      .attr("y", (d: Co2ByOriginByTime) => this.chartProps.y(d.co2) + this.chartProps.margin.top - 1)
      .attr("height", (d: Co2ByOriginByTime) => this.chartProps.y(0) - this.chartProps.y(d.co2))
      .attr("width", this.chartProps.x.bandwidth());


    this.chartProps.svgBox.select('.x.axis') // update x axis
    .call(this.chartProps.xAxis, this.chartProps.x);

    this.chartProps.svgBox.select('.y.axis') // update y axis
      .call(this.chartProps.yAxis, this.chartProps.y);

    this.chartProps.svgBox.selectAll(".tick line").style("stroke-dasharray", "5 5").style("opacity", "0.3");

    // SET BANNER TIME RANGE
    const time_range = document.getElementById('time_range');
    if (time_range) {
      let start_date = new Date(this.dataDrawnCo2TimeSerie[0].date);
      let end_date = new Date(this.dataDrawnCo2TimeSerie[this.dataDrawnCo2TimeSerie.length - 1].date);
      // TODO: issue with month, i have to add 1
      time_range.innerHTML = start_date.getDate() + '/' + (start_date.getMonth() + 1) + '/' + start_date.getFullYear() + ' - ' + end_date.getDate() + '/' + (end_date.getMonth() + 1) + '/' + end_date.getFullYear();

      if (start_date.getDate() === end_date.getDate() && 
      start_date.getMonth() === end_date.getMonth()) {
        const formatDate = this.graphService.d3Locale.format("%A %d %B");
        time_range.innerHTML = formatDate(start_date);
      }
    }
  }

}
