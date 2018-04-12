import { TimeLine } from './time-line';
import { tasks2 as __tasks__ } from './mock_data';
import { Graph } from './graph';
import { IGraphNotch, INotchesData, ITask } from './types';

export class Gantt {
  public static SVG_NS: 'http://www.w3.org/2000/svg' = 'http://www.w3.org/2000/svg';

  public static zoomTable: { notchDistance: number, weekendSpace: number }[] = [
    {
      notchDistance: 0,
      weekendSpace: 0
    },
    {
      notchDistance: 0,
      weekendSpace: 0
    },
    {
      notchDistance: 45,
      weekendSpace: 3
    }
  ];

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

  private visibleStartPositionX: number;

  private notchesData: INotchesData;

  public zoomLevel = 2;

  public svgDrawingWidth: number;

  private readonly container: HTMLElement;

  private readonly timeLine: TimeLine;

  private readonly graph: Graph;

  private dragStartX?: number;

  private dragStartY?: number;

  private visibleStartPositionXTmp?: number;

  private displayStartDate: Date;

  private actualStartDate: Date;

  private tasksFlatArr: ITask[] = [];

  public static get numWeekends(): number {
    return Gantt.weekendTable.reduce((a, d) => a + (d.isWeekend ? 1 : 0), 0);
  }

  private resizeTimeout: number = -1;

  public static addDay(date: Date, numDays = 1): Date {
    const d = new Date(date.getTime());
    d.setDate(d.getDate() + numDays);
    return d;
  }

  public constructor(containerId: string) {
    this.container = document.getElementById(containerId);

    // TODO: this section should be in a separate method
    this.actualStartDate = __tasks__.reduce(
        (acc, cv) => (cv.start < acc.start ? cv : acc)
    ).start;
    const prevDate = new Date(this.actualStartDate);
    prevDate.setDate(prevDate.getDate() - 1);
    this.displayStartDate = prevDate;
    // end section

    this.timeLine = new TimeLine(this.container);

    this.timeLine.onMouseDown = (ev) => {
      this.onMouseDown(ev);
    };
    this.graph = new Graph(this.container);
    this.graph.onMouseDown = (ev) => {
      this.onMouseDown(ev);
      this.dragStartY = ev.clientY;
    };
    this.init();
    this.subscribeToEvents();
  }

  private onMouseDown(ev: MouseEvent) {
    document.body.classList.add('dragging');
    this.dragStartX = ev.clientX;
    this.visibleStartPositionXTmp = this.visibleStartPositionX;
  }

  private init() {
    this.svgDrawingWidth = this.container.offsetWidth + 500;

    this.buildTasksFlatArr(__tasks__);
    this.buildNotchesPositions(this.displayStartDate, this.actualStartDate);

    this.timeLine.destruct();
    this.graph.destruct();

    this.timeLine.init(this.notchesData.notches, this.displayStartDate, this.svgDrawingWidth);
    this.graph.init(
        this.notchesData,
        this.displayStartDate,
        this.tasksFlatArr,
        this.svgDrawingWidth
    );
  }

  private subscribeToEvents() {
    document.addEventListener('mousemove', ev => {
      if (typeof this.dragStartX === 'number') {
        const dx = ev.clientX - this.dragStartX;
        let closestDate = this.findClosestDate(this.visibleStartPositionX);
        if (Math.abs(dx) < 200) {
          this.visibleStartPositionX = this.visibleStartPositionXTmp - dx;
          this.timeLine.onMouseMove(this.visibleStartPositionX, closestDate);
          this.graph.onMouseMove(this.visibleStartPositionX);
        } else {
          const delta = closestDate.position - this.visibleStartPositionX;
          this.buildNotchesPositions(closestDate.date, this.actualStartDate);
          closestDate = this.findClosestDate(this.visibleStartPositionX);

          this.visibleStartPositionX = closestDate.position - delta;
          this.visibleStartPositionXTmp = this.visibleStartPositionX;
          this.dragStartX = ev.clientX;
          this.timeLine.redraw(this.notchesData.notches, closestDate.date, delta);
          this.graph.redraw(this.notchesData, closestDate.date, this.tasksFlatArr, delta);
        }
        this.displayStartDate = closestDate.date;
      }
    });
    document.addEventListener('mouseup', () => {
      if (typeof this.dragStartX === 'number') {
        this.dragStartX = undefined;
        this.displayStartDate = this.findClosestDate(this.visibleStartPositionX).date;
        this.buildNotchesPositions(this.displayStartDate, this.actualStartDate);
        this.timeLine.redraw(this.notchesData.notches, this.displayStartDate );
        this.graph.redraw(this.notchesData, this.displayStartDate, this.tasksFlatArr);
      }
      document.body.classList.remove('dragging');
    });
    window.addEventListener('resize', () => {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => { this.init(); }, 100 );
    });
  }

  private buildNotchesPositions(startDate: Date, actualStartDate: Date) {
    this.notchesData = {
      graphStartIndex: -1,
      graphStartDate: actualStartDate,
      notches: []
    };
    const approxDaysOffScreen = Math.ceil(150 / (
        (Gantt.zoomTable[this.zoomLevel].notchDistance * (7 - Gantt.numWeekends) +
            Gantt.zoomTable[this.zoomLevel].weekendSpace * Gantt.numWeekends) / 7
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
        nextNotchPosition += Gantt.zoomTable[this.zoomLevel].weekendSpace;
      } else {
        nextNotchPosition += Gantt.zoomTable[this.zoomLevel].notchDistance;
      }
      drawStartDate = Gantt.addDay(drawStartDate);
      if (startDate.toDateString() === drawStartDate.toDateString()) {
        this.visibleStartPositionX = nextNotchPosition;
      }
      if (drawStartDate.toDateString() === actualStartDate.toDateString()) {
        this.notchesData.graphStartIndex = this.notchesData.notches.length - 1;
      }
    }
    while (nextNotchPosition < this.svgDrawingWidth);
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

  private buildTasksFlatArr(tasks_: ITask[]) {
    this.tasksFlatArr = [];
    this.recBuildTasksFlatArr(tasks_);
    for (const t of this.tasksFlatArr) {
      let nextDay = t.start;
      for (let dur = t.duration - 1; dur;) {
        nextDay = Gantt.addDay(nextDay);
        if (!Gantt.weekendTable[nextDay.getDay()].isWeekend) {
          --dur;
        }
      }
      t.end = nextDay;
    }
  }

  private recBuildTasksFlatArr(tasks: ITask[]) {
    for (const t of tasks) {
      this.tasksFlatArr.push(t);
      if (t.tasks) {
        this.recBuildTasksFlatArr(t.tasks);
      }
    }
  }

}
