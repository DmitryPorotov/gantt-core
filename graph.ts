import { IGraphNotch, INotchesData } from './types';
import { Gantt } from './gantt';
import { Utilities as ut, WrappedSVGElement } from './utilities';
import { Task } from './task';
import { TempDependency } from './dependency';

export class Graph {

  private mainSvgGroup: WrappedSVGElement;
  private svg: WrappedSVGElement;

  private containerWidth: number;
  private svgDrawingWidth: number;

  private svgViewBox: number[] = [];

  private tempDependency: TempDependency;
  private fromTask: Task;

  private currentStartY = 0;

  public isDragged = false;

  public isVerticallyDraggable = false;

  public onMouseDown: (ev: MouseEvent) => void;

  public onDependencyAdded: (fromTask: Task, toTask: Task) => void;

  private notchesData: INotchesData;

  private _verticalShift: number = 0;

  private _maxVertShift: number;

  public set verticalShift(val: number) {
    if (val < 0) {
      this._verticalShift = 0;
    } else if (val > this._maxVertShift) {
      this._verticalShift = this._maxVertShift;
    } else {
      this._verticalShift = val;
    }
  }

  public get verticalShift() {
    return this._verticalShift;
  }

  private dateLabel: {
    group: WrappedSVGElement;
    arrow: WrappedSVGElement;
    text: WrappedSVGElement;
  } = null;

  private buildTasks(tasks: Task[], startPos): WrappedSVGElement {

    const tasksGroup: WrappedSVGElement =  ut.ce_('g'),
        depArrowsG: WrappedSVGElement = ut.ce_('g');
    for (const t of tasks) {
      if (t.isHiddenByParent) {
        continue;
      }

      tasksGroup.ac_(t.buildTask());

      if (t.isVisible) {
        t.onMouseDown((task, evt) => {
          this.tempDependency = new TempDependency(evt.offsetX + startPos, evt.offsetY + this.currentStartY);
          this.fromTask = task;
          this.svg.ac_(this.tempDependency.arrow);
          this.tempDependency.arrow.ael_('mouseup', () => {
            this.onMouseUp();
          });
        });
        t.onMouseUp((task) => {
          if (this.fromTask && this.fromTask !== task && this.onDependencyAdded) {
            this.onDependencyAdded(this.fromTask, task);
          }
          this.onMouseUp();
        });
      }
    }

    for (const t of tasks) {
      if (t.wrappedDependencies.length && !t.isHiddenByParent) {
        for (const d of t.wrappedDependencies) {
          const arrow = d.buildArrow(t);
          if (arrow) {
            depArrowsG.ac_(arrow);
          }
        }
      }
    }

    tasksGroup.ac_(depArrowsG);
    return tasksGroup;
  }

  public constructor(private container: HTMLElement) {
  }

  public destruct() {
    if (this.svg) {
      this.svg.rm_();
      this.svg = null;
      this.dateLabel = null;
    }
  }

  public init(notches: INotchesData, displayStartDate: Date, tasks: Task[], svgDrawingWidth: number) {
    this.containerWidth = this.container.offsetWidth;
    this.svgDrawingWidth = svgDrawingWidth;
    this.svg = ut.ce_('svg')
        .sa_('style', 'margin-top:-4px;')
        .sa_('class', 'draggable')
        .sa_('height', this.container.offsetHeight
        - Gantt.timeLineHeight + 'px')
        .sa_('width', this.containerWidth + 'px');
    this.svgViewBox = [0, 0, this.containerWidth, this.container.offsetHeight
    - Gantt.timeLineHeight];
    this.container.appendChild(this.svg.element);
    this.subscribeToEvents();
    if (!this.dateLabel) {
      this.dateLabel = {
        group: ut.ce_('g'),
        arrow: ut.ce_('path').sa_('fill', '#000'),
        text: ut.ce_('text').sa_('font-size', '12')
      };
      this.dateLabel.group
          .ac_(this.dateLabel.arrow)
          .ac_(this.dateLabel.text);
      this.dateLabel.text.sa_('y', '15');
      this.svg.ac_(this.dateLabel.group);
    }
    this.redraw(notches, displayStartDate, tasks);
  }

  private subscribeToEvents() {
    this.svg.ael_('mousedown', ev => {
      if (!ev.button && this.onMouseDown) {
        this.onMouseDown(ev);
        this.isDragged = true;
      }
    });
  }

  public redraw(notches: INotchesData, displayStartDate: Date, tasks: Task[], delta = 0) {
    if (this.mainSvgGroup) {
      this.mainSvgGroup.rm_();
      this.mainSvgGroup = null;
    }
    this.notchesData = notches;
    this.buildGraph(displayStartDate, tasks, delta);
  }

  private buildGraph(startDate: Date, tasks: Task[], delta: number = 0) {
    this.mainSvgGroup = ut.ce_('g')
        .sa_('class', 'main-group');

    const horizontalLines = ut.ce_('g'),
        verticalLines = ut.ce_('g'),
        numTasks = tasks.reduce((acc, cv) => {
          return acc + (cv.isHiddenByParent ? 0 : 1);
        }, 0),
        weekendDayWidth = Gantt.currentZoom.weekendSpace,
        heightByTasks = 20 * numTasks,
        heightByContainer = this.container.offsetHeight - Gantt.timeLineHeight,
        height = Math.max(heightByContainer, heightByTasks);
    this._maxVertShift = heightByTasks - heightByContainer;
    this.isVerticallyDraggable = heightByTasks > heightByContainer;

    let startPos = 0;
    for (const n of this.notchesData.notches) {
      if (Gantt.weekendTable[n.date.getDay()].isWeekend) {
        const line = ut.ce_('path')
            .sa_('fill', 'black')
            .sa_('fill-opacity', '0.1')
            .sa_('d'
            , `M${n.position} 0h${weekendDayWidth}v${height}h-${weekendDayWidth}z`);
        verticalLines.ac_(line);
      }
      if (n.date.getTime() === startDate.getTime()) {
        startPos = n.position;
      }
    }

    for (let i = 1; i <= numTasks; ++i) {
      const line = ut.ce_('path')
          .sa_('fill', 'black')
          .sa_('d', `M0 ${i * 20}h${this.svgDrawingWidth}v1H0z`);
      horizontalLines.ac_(line);
    }

    this.mainSvgGroup.ac_(verticalLines)
        .ac_(horizontalLines)
        .ac_(this.buildTasks(tasks, startPos));

    this.svgViewBox[0] = startPos
        - (delta != null ? delta : 0);
    this.svg.pc_(this.mainSvgGroup.element)
        .sa_('viewBox', this.svgViewBox.join(' '));
  }

  public onMouseMove(visibleStart, evt: MouseEvent, dragStartY = null) {
    if (this.tempDependency) {
      this.tempDependency.redraw(evt.offsetX + visibleStart, evt.offsetY);
    } else {
      this.svgViewBox[0] = visibleStart;
      if (this.isVerticallyDraggable && dragStartY !== null) {
        this.verticalShift = this.currentStartY - ( evt.clientY - dragStartY );
        this.svgViewBox[1] = this.verticalShift;
      }
      this.svg.sa_('viewBox', this.svgViewBox.join(' '));
    }
  }

  public drawDate(x: number) {
        x += this.svgViewBox[0];
        const notches = this.notchesData.notches;
    let low = 0, high = notches.length - 1, result: IGraphNotch;
    try {
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        if (notches[mid].position <= x && notches[mid + 1].position >= x) {
          result = notches[mid];
          break;
        } else if ((notches[mid].position) < x) {
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }
    } catch { }

    if (result) {

      if (this.isDragged) {
        this.dateLabel.group.sa_('visibility', 'hidden');
      } else {
        this.dateLabel.group.sa_('visibility', 'visible');
      }
      this.dateLabel.arrow.sa_('d', `M${result.position} ${this.verticalShift} v5h3z`);
      this.dateLabel.text.sa_('x', `${result.position}`);
      this.dateLabel.text.sa_('y', `${15 + this.verticalShift}`);
      this.dateLabel.text.element.textContent = result.date.toLocaleDateString();
    }
  }

  public onMouseUp() {
    this.isDragged = false;
    this.fromTask = null;
    this.currentStartY = this.svgViewBox[1];
    if (this.tempDependency) {
      this.tempDependency.destruct();
      this.tempDependency = null;
    }
  }
}
