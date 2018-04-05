import { IPositionAndDate, ITask } from './types';
import { Gantt} from './gantt';

export class Graph {

  private mainSvgGroup: SVGGElement;
  private svg: SVGSVGElement;

  private zoomLevel = 2;

  private containerWidth: number;
  private svgDrawingWidth: number;

  private svgViewBox: number[] = [];

  private tasksFlatArr: ITask[] = [];

  public onMouseDown: (ev: MouseEvent) => void;

  public constructor(private container: HTMLElement) {
  }

  public destruct() {
    if (this.svg) {
      this.svg.remove();
      this.svg = null;
    }
  }

  public init(notches: IPositionAndDate[], displayStartDate: Date, tasks: ITask[], svgDrawingWidth: number) {
    this.containerWidth = this.container.offsetWidth;
    this.svgDrawingWidth = svgDrawingWidth;
    this.svg = document.createElementNS(Gantt.SVG_NS, 'svg');
    this.svg.setAttribute('class', 'draggable');
    this.svg.setAttribute('height', this.container.offsetHeight
        - Gantt.timeLineHeight + 'px');
    this.svg.setAttribute('width', this.containerWidth + 'px');
    this.svgViewBox = [0, 0, this.containerWidth, this.container.offsetHeight
    - Gantt.timeLineHeight];
    this.container.appendChild(this.svg);
    this.subscribeToEvents();
    this.redraw(notches, displayStartDate, tasks);
  }

  private subscribeToEvents() {
    this.svg.addEventListener('mousedown', ev => {
      if (!ev.button && this.onMouseDown) {
        this.onMouseDown(ev);
      }
    });
  }

  public redraw(notches: IPositionAndDate[], displayStartDate: Date, tasks: ITask[], delta = 0) {
    if (this.mainSvgGroup) {
      this.mainSvgGroup.remove();
      this.mainSvgGroup = null;
    }
    this.buildGraph(notches, displayStartDate, tasks, delta);
  }

  private buildGraph(notches: IPositionAndDate[], startDate: Date, tasks: ITask[], delta: number = null) {
    this.mainSvgGroup = document.createElementNS(Gantt.SVG_NS, 'g');
    this.mainSvgGroup.setAttribute('class', 'main-group');

    const horizontalLines = document.createElementNS(Gantt.SVG_NS, 'g');
    const verticalLines = document.createElementNS(Gantt.SVG_NS, 'g');

    this.buildTasksFlatArr(tasks);
    const numTasks = this.tasksFlatArr.length;

    const weekendDayWidth = Gantt.zoomTable[this.zoomLevel].weekendSpace;
    const height = this.container.offsetHeight - Gantt.timeLineHeight;
    let startPos = 0;
    for (const n of notches) {
      if (Gantt.weekendTable[n.date.getDay()].isWeekend) {
        const line = document.createElementNS(Gantt.SVG_NS, 'path');
        line.setAttribute('fill', 'black');
        line.setAttribute('fill-opacity', '0.1');
        line.setAttribute('d'
            , `M${n.position} 0 h${weekendDayWidth} v${height} h-${weekendDayWidth} z`);
        verticalLines.appendChild(line);
      }
      if (n.date.getTime() === startDate.getTime()) {
        startPos = n.position;
      }
    }

    for (let i = 1; i <= numTasks; ++i) {
      const line = document.createElementNS(Gantt.SVG_NS, 'path');
      line.setAttribute('fill', 'black');
      line.setAttribute('d', `M0 ${i * 20} h${this.svgDrawingWidth} v1 H0 z`);
      horizontalLines.appendChild(line);
    }

    this.mainSvgGroup.appendChild(verticalLines);
    this.mainSvgGroup.appendChild(horizontalLines);
    try {
      this.mainSvgGroup.appendChild(this.buildTasks(notches));
    } catch (e) { }


    this.svg.appendChild(this.mainSvgGroup);
    this.svgViewBox[0] = startPos
        - (delta != null ? delta : 0);
    this.svg.setAttribute('viewBox', this.svgViewBox.join(' '));
  }

  public onMouseMove(visibleStart) {
    this.svg.setAttribute('viewBox', [visibleStart, ...this.svgViewBox.slice(1)].join(' '));
  }

  private buildTasksFlatArr(tasks: ITask[]) {
    this.tasksFlatArr = [];
    this.recBuildTasksFlatArr(tasks);
  }

  private recBuildTasksFlatArr(tasks: ITask[]) {
    for (const t of tasks) {
      this.tasksFlatArr.push(t);
      if (t.tasks) {
        this.recBuildTasksFlatArr(t.tasks);
      }
    }
  }

  private buildTasks(notches: IPositionAndDate[]): SVGGElement {
    const tasksGroup: SVGGElement = document.createElementNS(Gantt.SVG_NS, 'g');
    for (let j = 0; j < this.tasksFlatArr.length; ++j) {
      const t = this.tasksFlatArr[j];
      const g = document.createElementNS(Gantt.SVG_NS, 'g'),
          p = document.createElementNS(Gantt.SVG_NS, 'path');
      let start: IPositionAndDate, end: IPositionAndDate, dur = t.duration;

      for (let i = 0; i < notches.length; ++i) {
        if (notches[i].date.getTime() === t.start.getTime()) {
          start = notches[i];
          for (; dur; ++i) {
            if (notches[i]) {
              if (!notches[i].isWeekend) {
                --dur;
              }
            } else {
              break;
            }
          }
          end = notches[i];
          break;
        }
      }
      if (!start && notches[0].date < t.start) {
        start = notches[0];
      }
      if (!end) {
        end = notches[notches.length - 1];
      }

      let c;
      p.setAttribute('fill', t.color || '#8cb6ce');
      if (!t.tasks) {
        p.setAttribute('stroke', 'black');
        p.setAttribute('stroke-width', '1');
        p.setAttribute('d', `M${start.position} ${(j * 20) + 4} H${end.position} v13 H${start.position} z`);
        if (t.complete) {
          c = document.createElementNS(Gantt.SVG_NS, 'path');
          c.setAttribute('fill', 'black');
          c.setAttribute('d',
              `M${start.position} ${(j * 20) + 9} h${(end.position - start.position) / 100 * t.complete} v2 H${start.position} z`);
        }
      } else {
        p.setAttribute('d',
            `M${start.position} ${(j * 20) + 4} H${end.position} v12 l-7 -7 L${start.position + 7} ${(j * 20) + 9} l-7 7 z`);
      }

      g.appendChild(p);
      if (c) {
        g.appendChild(c);
      }
      tasksGroup.appendChild(g);
    }
    return tasksGroup;
  }

}
