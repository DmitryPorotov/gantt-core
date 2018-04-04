import { TimeLine } from './time-line';
import { tasks } from './mock_data';
import { Graph } from './graph';
import { IPositionAndDate } from './types';

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

  private visibleStartPosition: number;

  private notchesPositions: IPositionAndDate[];

  public zoomLevel = 2;

  public svgDrawingWidth: number;

  private readonly container: HTMLElement;

  private readonly timeLine: TimeLine;

  private readonly graph: Graph;

  private timeLineDragStartX?: number;

  private visibleStartPositionTmp?: number;

  private displayStartDate: Date;

  public static get numWeekends(): number {
    return Gantt.weekendTable.reduce((a, d) => a + (d.isWeekend ? 1 : 0), 0);
  }

  private resizeTimeout: number = -1;

  public static nextDay(date: Date): Date {
    date.setDate(date.getDate() + 1);
    return date;
  }

  public constructor(containerId: string) {
    this.container = document.getElementById(containerId);
    this.timeLine = new TimeLine(this.container);
    const prevDate = new Date(tasks[0].start);
    prevDate.setDate(prevDate.getDate() - 1);
    this.displayStartDate = prevDate;
    this.timeLine.onMouseDown = (ev) => {
      this.timeLineDragStartX = ev.clientX;
      this.visibleStartPositionTmp = this.visibleStartPosition;
    };
    this.graph = new Graph(this.container);
    this.init();
    this.subscribeToEvents();
  }

  private init() {
    this.svgDrawingWidth = this.container.offsetWidth + 500;
    this.buildNotchesPositions(this.displayStartDate);

    this.timeLine.destruct();
    this.graph.destruct();

    this.timeLine.init(this.notchesPositions, this.displayStartDate, this.svgDrawingWidth);
    this.graph.init(this.notchesPositions, this.displayStartDate, tasks, this.svgDrawingWidth);
  }

  private subscribeToEvents() {
    document.addEventListener('mousemove', ev => {
      if (typeof this.timeLineDragStartX === 'number') {
        const dx = ev.clientX - this.timeLineDragStartX;
        let closestDate = this.findClosestDate(this.visibleStartPosition);
        if (Math.abs(dx) < 200) {
          this.visibleStartPosition = this.visibleStartPositionTmp - dx;
          this.timeLine.onMouseMove(this.visibleStartPosition, closestDate);
          this.graph.onMouseMove(this.visibleStartPosition);
        } else {
          const delta = closestDate.position - this.visibleStartPosition;
          this.buildNotchesPositions(closestDate.date);
          closestDate = this.findClosestDate(this.visibleStartPosition);

          this.visibleStartPosition = closestDate.position - delta;
          this.visibleStartPositionTmp = this.visibleStartPosition;
          this.timeLineDragStartX = ev.clientX;
          this.timeLine.redraw(this.notchesPositions, closestDate.date, delta);
          this.graph.redraw(this.notchesPositions, closestDate.date, tasks, delta);
        }
        this.displayStartDate = closestDate.date;
      }
    });
    document.addEventListener('mouseup', () => {
      if (typeof this.timeLineDragStartX === 'number') {
        this.timeLineDragStartX = undefined;
        this.displayStartDate = this.findClosestDate(this.visibleStartPosition).date;
        this.buildNotchesPositions(this.displayStartDate);
        this.timeLine.redraw(this.notchesPositions, this.displayStartDate );
        this.graph.redraw(this.notchesPositions, this.displayStartDate, tasks);
      }
    });
    window.addEventListener('resize', () => {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => { this.init(); }, 100 );
    });
  }

  private buildNotchesPositions(startDate: Date) {
    this.notchesPositions = [];
    const approxDaysPerScreen = Math.ceil(150 / (
        (Gantt.zoomTable[this.zoomLevel].notchDistance * (7 - Gantt.numWeekends) +
            Gantt.zoomTable[this.zoomLevel].weekendSpace * Gantt.numWeekends) / 7
    )) + 3;

    let drawStartDate = new Date(startDate.getTime());
    drawStartDate.setDate(drawStartDate.getDate() - approxDaysPerScreen);

    let nextNotchPosition = 0;
    do {
      const notch = {
        date: new Date(drawStartDate.getTime()),
        position: nextNotchPosition,
        isWeekend: Gantt.weekendTable[drawStartDate.getDay()].isWeekend
      };
      this.notchesPositions.push(notch);
      if (notch.isWeekend) {
        nextNotchPosition += Gantt.zoomTable[this.zoomLevel].weekendSpace;
      } else {
        nextNotchPosition += Gantt.zoomTable[this.zoomLevel].notchDistance;
      }
      drawStartDate = Gantt.nextDay(drawStartDate);
      if (startDate.getTime() === drawStartDate.getTime()) {
        this.visibleStartPosition = nextNotchPosition;
      }
    }
    while (nextNotchPosition < this.svgDrawingWidth);
  }

  private findClosestDate(point: number): IPositionAndDate {
    let minDist = Number.POSITIVE_INFINITY;
    let res: IPositionAndDate;
    for (let i = 0; i < this.notchesPositions.length; ++i) {
      const cur = Math.abs(this.notchesPositions[i].position - point);
      if (cur < minDist) {
        minDist = cur;
      } else {
        res = this.notchesPositions[i - 1];
        break;
      }
    }
    return res;
  }

}
