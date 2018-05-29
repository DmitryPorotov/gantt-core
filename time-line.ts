import { Gantt } from './gantt';
import { IGraphNotch } from './types';
import { Utilities as ut, WrappedSVGElement } from './utilities';
import { Task } from './task';
import { currentWeekNumber } from './week/get-week';

export class TimeLine {
  public static monthTable = [
    'Jan\'', 'Feb\'', 'Mar\'', 'Apr\'', 'May', 'Jun\'', 'Jul\'', 'Aug\'', 'Sep\'', 'Oct\'', 'Nov\'', 'Dec\''
  ];

  private mainSvgGroup: WrappedSVGElement;
  private svg: WrappedSVGElement;

  private containerWidth: number;
  private svgDrawingWidth: number;

  private svgViewBox: number[] = [];

  private tasks: Task[];

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

  public init(notches, displayStartDate, tasks: Task[], svgDrawingWidth) {
    this.tasks = tasks;
    this.containerWidth = this.container.offsetWidth;
    this.svgDrawingWidth = svgDrawingWidth;
    this.svgViewBox = [0, 0, this.containerWidth, Gantt.timeLineHeight];
    this.svg = ut.ce_('svg')
        .sa_('class', 'draggable')
        .sa_('style', 'background: rgba(0,0,0,.1);')
        .sa_('height', Gantt.timeLineHeight + 'px')
        .sa_('width', this.containerWidth + 'px')
        .sa_('viewBox', this.svgViewBox.join(' '));
    this.container.appendChild(this.svg.element);
    this.redraw(notches, displayStartDate, 0);
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
    let rect1, i = -1;
    do {
      ++i;
      rect1 = this.timeLine.topLabels[i].element.getBoundingClientRect();
    } while (!(rect1.left > 0 || rect1.right > 0));

    switch (Gantt.currentZoom.detail) {
      case 'day-week':
        this.timeLine.firstTopLabel.element.textContent = 'Week ' + currentWeekNumber(firstDate);
        break;
      case 'day-month':
        this.timeLine.firstTopLabel.element.textContent = TimeLine.monthTable[firstDate.getMonth()] + firstDate.getFullYear();
        break;
    }

    // this.timeLine.firstTopLabel.element.textContent = TimeLine.monthTable[firstDate.getMonth()] + firstDate.getFullYear();
    if (rect0.right >= rect1.left && rect1.right >= rect0.left) {
      if (rect1.left <= rect0.left) {
        this.timeLine.firstTopLabel.sa_('visibility', 'visible');
        this.timeLine.topLabels[i].sa_('visibility', 'hidden');
      } else {
        this.timeLine.firstTopLabel.sa_('visibility', 'hidden');
        this.timeLine.topLabels[i].sa_('visibility', 'visible');
      }
    } else {
      this.timeLine.firstTopLabel.sa_('visibility', 'visible');
      this.timeLine.topLabels[i].sa_('visibility', 'visible');
    }
  }

  private buildTimeLine(notches: IGraphNotch[], startDate: Date, delta: number = null) {
    this.mainSvgGroup = ut.ce_('g')
        .sa_('class', 'main-group');

    const l = ut.ce_('path')
        .sa_('fill', 'black')
        .sa_('d', `M0 30h${this.svgDrawingWidth}v1H0z`);
    this.mainSvgGroup.ac_(l);

    const notchGroup = ut.ce_('g'),
        dateGroup = ut.ce_('g')
            .sa_('class', 'chart-dates'),
        topTextGroup = ut.ce_('g')
            .sa_('class', 'chart-dates');

    this.timeLine.firstTopLabel = ut.ce_('text')
        .sa_('y', '20')
        .sa_('class', 'chart-dates');

    this.mainSvgGroup.ac_(this.timeLine.firstTopLabel);

    this.timeLine.topLabels = [];
    let startPos = 0;
    for (const n of notches) {

      const isFirstOfMonth = n.date.getDate() === 1,
          isFirstOfWeek = n.date.getDay() === 1;
      let text: string, doMakeNotch: boolean = false;
      if (isFirstOfMonth || isFirstOfWeek) {
        const mt = ut.ce_('text')
            .sa_('y', '20')
            .sa_('x', '' + (n.position + 2))
            .sa_('id', 'top' + n.position);

        switch (Gantt.currentZoom.detail) {
          case 'day-week':
            if (isFirstOfWeek) {
              text = 'Week ' + currentWeekNumber(n.date);
              doMakeNotch = true;
            }
            break;
          case 'day-month':
            if (isFirstOfMonth) {
              text = TimeLine.monthTable[n.date.getMonth()] + n.date.getFullYear();
              doMakeNotch = true;
            }
            break;
          case 'week-year':
            if (isFirstOfMonth) {
              text = TimeLine.monthTable[n.date.getMonth()] + n.date.getFullYear();
              doMakeNotch = true;
            }
            break;
          case 'month-year':
            if (isFirstOfMonth && !n.date.getMonth()) {
              text = '' + n.date.getFullYear();
              doMakeNotch = true;
            }
            break;
        }

        if (doMakeNotch) {
          const p = ut.ce_('path')
              .sa_('d', `M${n.position} 30v-10h1v10z`);

          notchGroup.ac_(p);
        }
        mt.element.textContent = text;
        topTextGroup.ac_(mt);
        this.timeLine.topLabels.push(mt);
      }

      switch (Gantt.currentZoom.detail) {
        case 'day-week':
        case 'day-month':
          if (!Gantt.weekendTable[n.date.getDay()].isWeekend) {
            const p = ut.ce_('path')
                .sa_('d', `M${n.position} 40v-10h1v10z`);
            notchGroup.ac_(p);

            const t = ut.ce_('text')
                .sa_('y', '50')
                .sa_('x', '' + (n.position + 2));
            t.element.textContent = '' + n.date.getDate();

            dateGroup.ac_(t);
          }
          break;
        case 'week-year':
          if (isFirstOfWeek) {
            const p = ut.ce_('path')
                .sa_('d', `M${n.position} 40v-10h1v10z`);
            notchGroup.ac_(p);

            const t1 = ut.ce_('text')
                .sa_('y', '50')
                .sa_('x', '' + (n.position + 2))
                .sa_('class', 'bottom-notch-text'),
            t2 = ut.ce_('text')
                .sa_('y', '57')
                .sa_('x', '' + (n.position + 2))
                .sa_('class', 'bottom-notch-sub-text');
            t1.element.textContent = 'Week ' + currentWeekNumber(n.date);
            t2.element.textContent = n.date.toLocaleDateString();


            dateGroup.ac_(t1);
            dateGroup.ac_(t2);
          }
          break;
        case 'month-year':
          if (isFirstOfMonth) {
            const p = ut.ce_('path')
                .sa_('d', `M${n.position} 40v-10h1v10z`);
            notchGroup.ac_(p);

            const t = ut.ce_('text')
                .sa_('y', '50')
                .sa_('x', '' + (n.position + 2));
            t.element.textContent = '' + TimeLine.monthTable[n.date.getMonth()];

            dateGroup.ac_(t);
          }
          break;
      }


      if (startDate.toDateString() === n.date.toDateString()) {
        startPos = n.position;
      }
    }

    this.svgViewBox[0] = startPos
        - (delta != null ? delta : 0);
    this.mainSvgGroup
        .ac_(notchGroup)
        .ac_(dateGroup)
        .ac_(topTextGroup);
    this.buildTaskNames();
    this.svg.ac_(this.mainSvgGroup)
        .sa_('viewBox', this.svgViewBox.join(' '));
    this.updateFirstTopLabel(this.svgViewBox[0], startDate);
  }

  private buildTaskNames() {
    const group = ut.ce_('g');
    this.mainSvgGroup.ac_(group);
    for (const t of this.tasks) {
      if (t.isInTimeLine) {
        const g = ut.ce_('g'),
            rect = ut.ce_('rect'),
            text = ut.ce_('text')
                .sa_('fill', t.color)
                .sa_('x', '' + t.startPositionX)
                .sa_('y', '25')
                .sa_('class', 'chart-dates');
        text.element.textContent = t.name;
        g.ac_(text);
        group.ac_(g);
        setTimeout(() => {
          const textBBox = text.element.getBoundingClientRect();
          rect.sa_('x', '' + (t.startPositionX - 2))
              .sa_('y', '' + 14)
              .sa_('width', '' + (textBBox.width + 4))
              .sa_('height', '' + textBBox.height)
              .sa_('fill', '#fff')
              .sa_('stroke', t.color);
        }, 0);

        g.element.insertBefore(rect.element, text.element);
      }
    }
    return group;
  }

}

interface ITimeLine {
  topLabels: WrappedSVGElement[];
  firstTopLabel: WrappedSVGElement;
}

