import { TimeLine } from './time-line';
import { tasks2 as __tasks__, timeLineTasks as _tlt_ } from './mock_data';
import { Graph } from './graph';
import { IGraphNotch, INotchesData, ITask } from './types';
import { Utilities as ut } from './utilities';
import { Task } from './task';
import { Dependency } from './dependency';

export class Gantt {

  public static zoomTable: { notchDistance: number, weekendSpace: number, detail: string }[] = [
    {
      notchDistance: 65,
      weekendSpace: 6,
      detail: 'day-week'
    },
    {
      notchDistance: 56,
      weekendSpace: 5,
      detail: 'day-week'
    },
    {
      notchDistance: 45,
      weekendSpace: 3,
      detail: 'day-month'
    },
    {
      notchDistance: 34,
      weekendSpace: 3,
      detail: 'day-month'
    },
    {
      notchDistance: 24,
      weekendSpace: 4,
      detail: 'week-year'
    },
    {
      notchDistance: 21,
      weekendSpace: 4,
      detail: 'week-year'
    },
    {
      notchDistance: 13,
      weekendSpace: 4,
      detail: 'week-year'
    },
    {
      notchDistance: 8,
      weekendSpace: 4,
      detail: 'week-year'
    },
    {
      notchDistance: 5,
      weekendSpace: 3,
      detail: 'month-year'
    },
    {
      notchDistance: 3,
      weekendSpace: 2,
      detail: 'month-year'
    },
    {
      notchDistance: 2,
      weekendSpace: 1,
      detail: 'month-year'
    },
    {
      notchDistance: 1,
      weekendSpace: 1,
      detail: 'month-year'
    }
  ];

  public static zoomLevel: number = 2;

  public static timeLineHeight = 60;

  public static weekendTable = [
    {isWeekend: true},
    {isWeekend: false},
    {isWeekend: false},
    {isWeekend: false},
    {isWeekend: false},
    {isWeekend: false},
    {isWeekend: true}
  ];

  public static get currentZoom() {
    return Gantt.zoomTable[Gantt.zoomLevel];
  }

  private visibleStartPositionX: number;

  private notchesData: INotchesData;

  public svgDrawingWidth: number;

  private readonly container: HTMLElement;

  private readonly graphContainer: HTMLElement;

  private readonly tasksContainer: HTMLElement;

  private readonly separatorBar: HTMLElement;

  private readonly timeLine: TimeLine;

  private readonly graph: Graph;

  private dragStartX?: number;

  private dragStartY?: number;

  private visibleStartPositionXTmp?: number;

  private displayStartDate: Date;

  private actualStartDate: Date;

  private tasksFlatArr: ITask[] = [];

  private wrappedTasks: Task[];

  public static get numWeekends(): number {
    return Gantt.weekendTable.reduce((a, d) => a + (d.isWeekend ? 1 : 0), 0);
  }

  private tasksWidth: number = 200;

  private tasksWidthTmp?: number;

  private separatorBarWidth = 2;

  private separatorBarDragStart?: number = null;

  private resizeTimeout: number = -1;

  public constructor(containerId: string) {
    this.container = document.getElementById(containerId);

    this.tasksContainer = document.createElement('div');
    this.graphContainer = document.createElement('div');
    this.separatorBar = document.createElement('div');

    this.setContainersStyles();

    this.container.appendChild(this.tasksContainer);
    this.container.appendChild(this.separatorBar);
    this.container.appendChild(this.graphContainer);

    // TODO: this section should be in a separate method
    this.actualStartDate = __tasks__.reduce(
        (acc, cv) => (cv.start < acc.start ? cv : acc)
    ).start;
    const prevDate = new Date(this.actualStartDate);
    prevDate.setDate(prevDate.getDate() - 1);
    this.displayStartDate = prevDate;

    this.buildTasksFlatArr(__tasks__);
    this.wrapTasks(this.tasksFlatArr);
    // end section

    this.timeLine = new TimeLine(this.graphContainer);

    this.timeLine.onMouseDown = (ev) => {
      this.onMouseDown(ev);
      this.graph.isDragged = true;
    };
    this.graph = new Graph(this.graphContainer);
    this.graph.onMouseDown = (ev: MouseEvent) => {
      this.onMouseDown(ev);
      this.dragStartY = ev.clientY;
    };

    this.init();
    this.subscribeToEvents();
  }

  private setContainersStyles() {
    this.tasksContainer.setAttribute('style', `height:100%; float:left; width: ${this.tasksWidth}px;`);
    this.separatorBar.setAttribute('style', `height:100%; float:left; width: ${
      this.separatorBarWidth}px; border:1px solid grey; border-radius:3px;`);
    this.graphContainer.setAttribute('style', `height:100%; float:left; width: calc(100% - ${this.tasksWidth
    + this.separatorBarWidth + 2}px)`);
  }

  private onMouseDown(ev: MouseEvent) {
    document.body.classList.add('dragging');
    this.dragStartX = ev.clientX;
    this.visibleStartPositionXTmp = this.visibleStartPositionX;
  }

  private init() {
    this.svgDrawingWidth = this.graphContainer.offsetWidth + 500;

    this.buildNotchesPositions(this.displayStartDate, this.actualStartDate);

    this.timeLine.destruct();
    this.graph.destruct();

    this.timeLine.init(
        this.notchesData.notches,
        this.displayStartDate,
        this.wrappedTasks,
        this.svgDrawingWidth);
    this.graph.init(
        this.notchesData,
        this.displayStartDate,
        this.wrappedTasks,
        this.svgDrawingWidth
    );

  }

  private subscribeToEvents() {
    document.addEventListener('mousemove', ev => {
      const isDragging = typeof this.dragStartX === 'number';
      if (isDragging) {
        const dx = ev.clientX - this.dragStartX;
        let closestDate = this.findClosestDate(this.visibleStartPositionX);
        if (Math.abs(dx) < 200) {
          this.visibleStartPositionX = this.visibleStartPositionXTmp - dx;
          this.timeLine.onMouseMove(this.visibleStartPositionX, closestDate);
        } else {
          const delta = closestDate.position - this.visibleStartPositionX;
          this.buildNotchesPositions(closestDate.date, this.actualStartDate);
          closestDate = this.findClosestDate(this.visibleStartPositionX);

          this.visibleStartPositionX = closestDate.position - delta;
          this.visibleStartPositionXTmp = this.visibleStartPositionX;
          this.dragStartX = ev.clientX;
          this.timeLine.redraw(this.notchesData.notches, closestDate.date, delta);
          this.graph.redraw(this.notchesData, closestDate.date, this.wrappedTasks, delta);
        }
        this.displayStartDate = closestDate.date;
      }
      this.graph.onMouseMove(this.visibleStartPositionX, ev, isDragging ? this.dragStartY : null);

      if (this.separatorBarDragStart !== null) {
        this.updateGraphWidth(ev.clientX);
      }
    });
    document.addEventListener('mouseup', () => {
      this.graph.onMouseUp();
      if (typeof this.dragStartX === 'number') {
        this.dragStartX = undefined;
        this.displayStartDate = this.findClosestDate(this.visibleStartPositionX).date;
        this.buildNotchesPositions(this.displayStartDate, this.actualStartDate);
        this.timeLine.redraw(this.notchesData.notches, this.displayStartDate );
        this.graph.redraw(this.notchesData, this.displayStartDate, this.wrappedTasks);
      }
      document.body.classList.remove('dragging');
      if (this.separatorBarDragStart !== null) {
        this.separatorBarDragStart = null;
      }
    });
    window.addEventListener('resize', () => {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => { this.init(); }, 100 );
    });

    this.graphContainer.addEventListener('mousemove', (event) => {
      this.graph.drawDate(event.offsetX);
    });

    this.separatorBar.addEventListener('mousedown', (event) => {
      this.tasksWidthTmp = this.tasksWidth;
      this.separatorBarDragStart = event.clientX;
    });
  }

  private updateGraphWidth(currentX: number) {
    this.tasksWidth = this.tasksWidthTmp + currentX - this.separatorBarDragStart ;
    this.setContainersStyles();
    this.init();
  }

  private buildNotchesPositions(startDate: Date, actualStartDate: Date) {
    this.notchesData = {
      graphStartIndex: -1,
      graphStartDate: actualStartDate,
      notches: []
    };
    const approxDaysOffScreen = Math.ceil(150 / (
        (Gantt.currentZoom.notchDistance * (7 - Gantt.numWeekends) +
            Gantt.currentZoom.weekendSpace * Gantt.numWeekends) / 7
    )) + 3;

    let drawStartDate = new Date(startDate.getTime());
    drawStartDate.setDate(drawStartDate.getDate() - approxDaysOffScreen);

    let nextNotchPosition = 0;
    do {
      const notch: IGraphNotch = {
        date: new Date(drawStartDate.getTime()),
        position: nextNotchPosition,
        isWeekend: Gantt.weekendTable[drawStartDate.getDay()].isWeekend,
        isHoliday: false
      };
      this.notchesData.notches.push(notch);
      if (notch.isWeekend) {
        nextNotchPosition += Gantt.currentZoom.weekendSpace;
      } else {
        nextNotchPosition += Gantt.currentZoom.notchDistance;
      }
      drawStartDate = ut.addDay(drawStartDate);
      if (startDate.toDateString() === drawStartDate.toDateString()) {
        this.visibleStartPositionX = nextNotchPosition;
      }
      if (drawStartDate.toDateString() === actualStartDate.toDateString()) {
        this.notchesData.graphStartIndex = this.notchesData.notches.length - 1;
      }
    }
    while (nextNotchPosition < this.svgDrawingWidth);
    this.updateTaskPositions();
  }

  private findClosestDate(point: number): IGraphNotch {
    let minDist = Number.POSITIVE_INFINITY;
    let res: IGraphNotch;
    for (let i = 0; i < this.notchesData.notches.length; ++i) {
      const cur = Math.abs(this.notchesData.notches[i].position - point);
      if (cur < minDist) {
        minDist = cur;
      } else {
        res = this.notchesData.notches[i - 1];
        break;
      }
    }
    return res;
  }

  private wrapTasks(flatTasksArr: ITask[]) {
    const tasks: Task[] = [],
        tmpHashTbl = [];
    for (let i = 0, j = 0, numHiddenTasks = 0; i < flatTasksArr.length; ++i) {
      const wrappedTask = new Task(flatTasksArr[i], j);
      tasks.push(wrappedTask);
      tmpHashTbl[flatTasksArr[i].id] = wrappedTask;

      numHiddenTasks -= (wrappedTask.isHiddenByParent = !!numHiddenTasks) as any;

      j += !wrappedTask.isHiddenByParent as any;

      if (!wrappedTask.expand) {
        numHiddenTasks = wrappedTask.totalDescendants;
      }

      let nextDay = tasks[i].start;
      for (let dur = tasks[i].duration - 1; dur;) {
        nextDay = ut.addDay(nextDay);
        if (!Gantt.weekendTable[nextDay.getDay()].isWeekend) {
          --dur;
        }
      }
      tasks[i].end = nextDay;
    }

    for (const t of tasks) {
      if (t.depend) {
        for (const d of t.depend) {
          t.wrappedDependencies.push(new Dependency(d, tmpHashTbl[d.id]));
        }
      }
      if (_tlt_.indexOf(t.id) > -1) {
        t.isInTimeLine = true;
      }
    }

    this.wrappedTasks = tasks;
  }

  private updateTaskPositions() {
    const getTaskBoundaryIfExtremum = (b: Date): IGraphNotch => {
      if (b < this.notchesData.notches[0].date) {
        return  this.notchesData.notches[0];
      } else if (b > this.notchesData.notches[this.notchesData.notches.length - 1].date) {
        return  this.notchesData.notches[this.notchesData.notches.length - 1];
      }
    };
    for (const t of this.wrappedTasks) {

      let start: IGraphNotch = getTaskBoundaryIfExtremum(t.start)
          , end: IGraphNotch = getTaskBoundaryIfExtremum(t.end);

      if (!start || !end) {
        for (
            let i = (this.notchesData.graphStartIndex !== -1 ? this.notchesData.graphStartIndex : 0);
            i < this.notchesData.notches.length;
            ++i
        ) {

          if (!start && this.notchesData.notches[i].date.toDateString() === t.start.toDateString()) {
            start = this.notchesData.notches[i];
          }

          if (!end && this.notchesData.notches[i].date.toDateString() === t.end.toDateString()) {
            end = this.notchesData.notches[i];
          }
        }
      } else if (start === end) {
        t.isVisible = false;
      }

      t.startPositionX = start.position;
      t.endPositionX = end.position + Gantt.currentZoom.notchDistance;
    }
  }

  private buildTasksFlatArr(tasks_: ITask[]) {
    this.tasksFlatArr = [];
    this.recBuildTasksFlatArr(tasks_);
  }

  private recBuildTasksFlatArr(tasks: ITask[]) {
    let numTasks = 0;
    for (const t of tasks) {
      this.tasksFlatArr.push(t);
      if (t.tasks) {
         numTasks += this.recBuildTasksFlatArr(t.tasks);
         t.totalDescendants = numTasks;
      } else {
        t.totalDescendants = 0;
      }
    }
    return tasks.length + numTasks;
  }

}
