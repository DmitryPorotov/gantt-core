import { Gantt } from './gantt';
import { IGraphNotch } from './types';
import { Utilities as ut, WrappedSVGElement } from './utilities';

export class TimeLine {
  public static monthTable = [
    'Jan\'', 'Feb\'', 'Mar\'', 'Apr\'', 'May', 'Jun\'', 'Jul\'', 'Aug\'', 'Sep\'', 'Oct\'', 'Nov\'', 'Dec\''
  ];

  private mainSvgGroup: WrappedSVGElement;
  private svg: WrappedSVGElement;

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
      this.svg.rm_();
      this.svg = null;
    }
  }

  public init(notches, displayStartDate, svgDrawingWidth) {
    this.containerWidth = this.container.offsetWidth;
    this.svgDrawingWidth = svgDrawingWidth;
    this.svgViewBox = [0, 0, this.containerWidth, Gantt.timeLineHeight];
    this.svg = ut.ca_('svg')
        .sa_('class', 'draggable')
        .sa_('style', 'background: rgba(0,0,0,.1);')
        .sa_('height', Gantt.timeLineHeight + 'px')
        .sa_('width', this.containerWidth + 'px')
        .sa_('viewBox', this.svgViewBox.join(' '));
    this.container.appendChild(this.svg.element);
    this.redraw(notches, displayStartDate);
    this.subscribeToEvents();
  }

  public redraw(notches, displayStartDate: Date, delta = 0) {
    if (this.mainSvgGroup) {
      this.mainSvgGroup.rm_();
      this.mainSvgGroup = null;
    }
    this.buildTimeLine(notches, displayStartDate, delta);
  }

  private subscribeToEvents() {
    this.svg.ael_('mousedown', ev => {
      if (!ev.button && this.onMouseDown) {
        this.onMouseDown(ev);
      }
    });
  }

  public onMouseMove(visibleStart, closestDate: IGraphNotch) {
      this.svg.sa_('viewBox', [visibleStart, ...this.svgViewBox.slice(1)].join(' '));
      this.updateFirstTopLabel(visibleStart, closestDate.date);
  }

  private updateFirstTopLabel(visibleStart: number, firstDate: Date): void {
    this.timeLine.firstTopLabel.sa_('x', '' + (visibleStart + 2));
    const rect0 = this.timeLine.firstTopLabel.element.getBoundingClientRect();
    const rect1 = this.timeLine.topLabels[0].element.getBoundingClientRect();
    this.timeLine.firstTopLabel.element.textContent = TimeLine.monthTable[firstDate.getMonth()] + firstDate.getFullYear();
    if (rect0.right >= rect1.left && rect1.right >= rect0.left) {
      if (rect1.left <= rect0.left) {
        this.timeLine.firstTopLabel.sa_('visibility', 'visible');
        this.timeLine.topLabels[0].sa_('visibility', 'hidden');
      } else {
        this.timeLine.firstTopLabel.sa_('visibility', 'hidden');
        this.timeLine.topLabels[0].sa_('visibility', 'visible');
      }
    } else {
      this.timeLine.firstTopLabel.sa_('visibility', 'visible');
      this.timeLine.topLabels[0].sa_('visibility', 'visible');
    }
  }

  private buildTimeLine(notches: IGraphNotch[], startDate: Date, delta: number = null) {
    this.mainSvgGroup = ut.ca_('g')
        .sa_('class', 'main-group');

    const l = ut.ca_('path')
        .sa_('fill', 'black')
        .sa_('d', 'M0 30 h' + this.svgDrawingWidth + ' v1 H0 z');
    this.mainSvgGroup.ac_(l);

    const notchGroup = ut.ca_('g');
    const dateGroup = ut.ca_('g')
        .sa_('class', 'chart-dates');
    const tt = [];
    const topTextGroup = ut.ca_('g')
        .sa_('class', 'chart-dates');

    this.timeLine.firstTopLabel = ut.ca_('text')
        .sa_('y', '20')
        .sa_('class', 'chart-dates');

    this.timeLine.firstTopLabel.element.textContent = TimeLine.monthTable[startDate.getMonth()] + startDate.getFullYear();

    this.mainSvgGroup.ac_(this.timeLine.firstTopLabel);

    this.timeLine.topLabels = tt;
    let startPos = 0;
    for (const n of notches) {
      const isFirst = n.date.getDate() === 1;
        if (isFirst) {
          const mt = ut.ca_('text')
              .sa_('y', '20')
              .sa_('x', '' + (n.position + 2));
          mt.element.textContent = TimeLine.monthTable[n.date.getMonth()] + n.date.getFullYear();

          topTextGroup.ac_(mt);
          tt.push(mt);
        }
        if (!Gantt.weekendTable[n.date.getDay()].isWeekend) {
          const p = ut.ca_('path')
              .sa_('d', `M${n.position} 40 v-${(isFirst ? 20 : 10)} h1 v${(isFirst ? 20 : 10)} z`);
          notchGroup.ac_(p);

          const t = ut.ca_('text')
              .sa_('y', '50')
              .sa_('x', '' + (n.position + 2));
              t.element.textContent = '' + n.date.getDate();

          dateGroup.ac_(t);
        }
        if (startDate.toDateString() === n.date.toDateString()) {
          startPos = n.position;
        }
    }

    this.svgViewBox[0] = startPos
        - (delta != null ? delta : 0);
    this.updateFirstTopLabel(this.svgViewBox[0], startDate);
    this.mainSvgGroup
        .ac_(notchGroup)
        .ac_(dateGroup)
        .ac_(topTextGroup);
    this.svg.ac_(this.mainSvgGroup)
        .sa_('viewBox', this.svgViewBox.join(' '));
  }
}

interface ITimeLine {
  topLabels: WrappedSVGElement[];
  firstTopLabel: WrappedSVGElement;
}

