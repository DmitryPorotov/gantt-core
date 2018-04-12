import { Gantt } from './gantt';
import { IGraphNotch } from './types';

export class TimeLine {
  public static monthTable = [
    'Jan\'', 'Feb\'', 'Mar\'', 'Apr\'', 'May', 'Jun\'', 'Jul\'', 'Aug\'', 'Sep\'', 'Oct\'', 'Nov\'', 'Dec\''
  ];

  private mainSvgGroup: SVGGElement;
  private svg: SVGSVGElement;

  private containerWidth: number;
  private svgDrawingWidth: number;

  private svgViewBox: number[] = [];

  public timeLine: ITimeLine = {
    topLabels: null,
    firstTopLabel: null
  };

  public onMouseDown: (ev: MouseEvent) => void;

  public constructor(private container: HTMLElement) {
  }

  public destruct() {
    if (this.svg) {
      this.svg.remove();
      this.svg = null;
    }
  }

  public init(notches, displayStartDate, svgDrawingWidth) {
    this.containerWidth = this.container.offsetWidth;
    this.svgDrawingWidth = svgDrawingWidth;
    this.svg = document.createElementNS(Gantt.SVG_NS, 'svg');
    this.svg.setAttribute('class', 'draggable');
    this.svg.setAttribute('style', 'background: rgba(0,0,0,.1);');
    this.svg.setAttribute('height', Gantt.timeLineHeight + 'px');
    this.svg.setAttribute('width', this.containerWidth + 'px');
    this.svgViewBox = [0, 0, this.containerWidth, Gantt.timeLineHeight];
    this.svg.setAttribute('viewBox', this.svgViewBox.join(' '));
    this.container.appendChild(this.svg);
    this.redraw(notches, displayStartDate);
    this.subscribeToEvents();
  }

  public redraw(notches, displayStartDate: Date, delta = 0) {
    if (this.mainSvgGroup) {
      this.mainSvgGroup.remove();
      this.mainSvgGroup = null;
    }
    this.buildTimeLine(notches, displayStartDate, delta);
  }

  private subscribeToEvents() {
    this.svg.addEventListener('mousedown', ev => {
      if (!ev.button && this.onMouseDown) {
        this.onMouseDown(ev);
      }
    });
  }

  public onMouseMove(visibleStart, closestDate: IGraphNotch) {
      this.svg.setAttribute('viewBox', [visibleStart, ...this.svgViewBox.slice(1)].join(' '));
      this.updateFirstTopLabel(visibleStart, closestDate.date);
  }

  private updateFirstTopLabel(visibleStart: number, firstDate: Date): void {
    this.timeLine.firstTopLabel.setAttribute('x', '' + (visibleStart + 2));
    const rect0 = this.timeLine.firstTopLabel.getBoundingClientRect();
    const rect1 = this.timeLine.topLabels[0].getBoundingClientRect();
    this.timeLine.firstTopLabel.textContent = TimeLine.monthTable[firstDate.getMonth()] + firstDate.getFullYear();
    if (rect0.right >= rect1.left && rect1.right >= rect0.left) {
      if (rect1.left <= rect0.left) {
        this.timeLine.firstTopLabel.setAttribute('visibility', 'visible');
        this.timeLine.topLabels[0].setAttribute('visibility', 'hidden');
      } else {
        this.timeLine.firstTopLabel.setAttribute('visibility', 'hidden');
        this.timeLine.topLabels[0].setAttribute('visibility', 'visible');
      }
    } else {
      this.timeLine.firstTopLabel.setAttribute('visibility', 'visible');
      this.timeLine.topLabels[0].setAttribute('visibility', 'visible');
    }
  }

  private buildTimeLine(notches: IGraphNotch[], startDate: Date, delta: number = null) {
    this.mainSvgGroup = document.createElementNS(Gantt.SVG_NS, 'g');
    this.mainSvgGroup.setAttribute('class', 'main-group');

    const l = document.createElementNS(Gantt.SVG_NS, 'path');
    l.setAttribute('fill', 'black');
    l.setAttribute('d', 'M0 30 h' + this.svgDrawingWidth + ' v1 H0 z');
    this.mainSvgGroup.appendChild(l);

    const notchGroup = document.createElementNS(Gantt.SVG_NS, 'g');
    const dateGroup = document.createElementNS(Gantt.SVG_NS, 'g');
    dateGroup.setAttribute('class', 'chart-dates');
    const tt = [];
    const topTextGroup = document.createElementNS(Gantt.SVG_NS, 'g');
    topTextGroup.setAttribute('class', 'chart-dates');

    this.timeLine.firstTopLabel = document.createElementNS(Gantt.SVG_NS, 'text');
    this.timeLine.firstTopLabel.textContent = TimeLine.monthTable[startDate.getMonth()] + startDate.getFullYear();
    this.timeLine.firstTopLabel.setAttribute('y', '20');
    this.timeLine.firstTopLabel.setAttribute('class', 'chart-dates');
    this.mainSvgGroup.appendChild(this.timeLine.firstTopLabel);

    this.timeLine.topLabels = tt;
    let startPos = 0;
    for (const n of notches) {
      const isFirst = n.date.getDate() === 1;
        if (isFirst) {
          const mt = document.createElementNS(Gantt.SVG_NS, 'text');
          mt.textContent = TimeLine.monthTable[n.date.getMonth()] + n.date.getFullYear();
          mt.setAttribute('y', '20');
          mt.setAttribute('x', '' + (n.position + 2));
          topTextGroup.appendChild(mt);
          tt.push(mt);
        }
        if (!Gantt.weekendTable[n.date.getDay()].isWeekend) {
          const p = document.createElementNS(Gantt.SVG_NS, 'path');
          p.setAttribute('d', 'M' + n.position + ' 40 v-' + (isFirst ? 20 : 10) + ' h1 v' + (isFirst ? 20 : 10) + ' z');
          notchGroup.appendChild(p);

          const t = document.createElementNS(Gantt.SVG_NS, 'text');
          t.textContent = '' + n.date.getDate();
          t.setAttribute('y', '50');
          t.setAttribute('x', '' + (n.position + 2));
          dateGroup.appendChild(t);
        }
        if (startDate.toDateString() === n.date.toDateString()) {
          startPos = n.position;
        }
    }

    this.mainSvgGroup.appendChild(notchGroup);
    this.mainSvgGroup.appendChild(dateGroup);
    this.mainSvgGroup.appendChild(topTextGroup);
    this.svg.appendChild(this.mainSvgGroup);
    this.svgViewBox[0] = startPos
        - (delta != null ? delta : 0);
    this.updateFirstTopLabel(this.svgViewBox[0], startDate);
    this.svg.setAttribute('viewBox', this.svgViewBox.join(' '));
  }
}

interface ITimeLine {
  topLabels: SVGTextElement[];
  firstTopLabel: SVGTextElement;
}

