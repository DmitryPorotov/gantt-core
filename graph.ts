import { IDependency, IGraphNotch, INotchesData, ITask, TaskType } from './types';
import { Gantt } from './gantt';

export class Graph {

  private mainSvgGroup: SVGGElement;
  private svg: SVGSVGElement;

  private zoomLevel = 2;

  private containerWidth: number;
  private svgDrawingWidth: number;

  private svgViewBox: number[] = [];

  public onMouseDown: (ev: MouseEvent) => void;

  private buildTasks(notchesData: INotchesData, tasks: ITask[]): SVGGElement {
    const tasksGroup: SVGGElement = document.createElementNS(Gantt.SVG_NS, 'g'),
        depArrowsG: SVGGElement = document.createElementNS(Gantt.SVG_NS, 'g');
    for (let j = 0; j < tasks.length; ++j) {
      const t = tasks[j],
          dependencies: { index: number, skip: number, dependency: IDependency } [] = [];

      if (t.depend) {
        for (const d of t.depend) {
          for (let k = 0; k < tasks.length; ++k) {
            if (tasks[k].id === d.id) {

              const dayDur = 1000 * 3600 * 24;
              let skip: number;

              switch (d.type) {
                case (TaskType.StartStart):
                  skip = Math.round((tasks[k].start.getTime() - t.start.getTime()) / dayDur);
                  break;
                case (TaskType.StartFinish):
                  skip = Math.round((tasks[k].start.getTime() - t.end.getTime()) / dayDur) - 1;
                  break;
                case (TaskType.FinishFinish):
                  skip = Math.round((tasks[k].end.getTime() - t.end.getTime()) / dayDur);
                  break;
                case (TaskType.FinishStart):
                  skip = Math.round((tasks[k].end.getTime() - t.start.getTime()) / dayDur) + 1;
                  break;
              }

              if (skip) {
                for (let numDaysToCheck = Math.abs(skip), day: Date = t.start; numDaysToCheck; --numDaysToCheck) {
                  day = Gantt.addDay(day, skip > 0 ? 1 : -1);
                  if (!Gantt.weekendTable[day.getDay()].isWeekend) {
                    skip += skip < 0 ? 1 : -1;
                  }
                  // TODO: check for holidays too
                }
              }

              const dep = {
                index: k,
                skip,
                dependency: d
              };
              dependencies.push(dep);
            }
          }
        }
      }

      let start: IGraphNotch, end: IGraphNotch;

      for (
          let i = (notchesData.graphStartIndex !== -1 ? notchesData.graphStartIndex : 0);
          i < notchesData.notches.length;
          ++i
      ) {
        if (notchesData.notches[i].date.toDateString() === t.start.toDateString()) {
          start = notchesData.notches[i];
        }
        if (notchesData.notches[i].date.toDateString() === t.end.toDateString()) {
          end = notchesData.notches[i];
        }
      }

      if (!start && end) {
        start = notchesData.notches[0];
      }
      if (!end && start) {
        end = notchesData.notches[notchesData.notches.length - 1];
      }

      const notchDist = Gantt.zoomTable[this.zoomLevel].notchDistance;
      if (start && end) {
        let c;
        const g = document.createElementNS(Gantt.SVG_NS, 'g'),
            p = document.createElementNS(Gantt.SVG_NS, 'path');
        p.setAttribute('fill', t.color || '#8cb6ce');
        p.setAttribute('class', 'clickable');
        if (!t.tasks) {
          p.setAttribute('stroke', 'black');
          p.setAttribute('stroke-width', '1');
          p.setAttribute('d', `M${start.position} ${(j * 20) + 4} H${end.position + notchDist} v13 H${start.position} z`);
          if (t.complete) {
            c = document.createElementNS(Gantt.SVG_NS, 'path');
            c.setAttribute('fill', 'black');
            c.setAttribute('d',
                `M${start.position} ${(j * 20) + 9} h${(end.position - start.position + notchDist) / 100 * t.complete}`
                + ` v2 H${start.position} z`);
          }
        } else {
          p.setAttribute('d',
              `M${start.position} ${(j * 20) + 4} H${end.position + notchDist} v12 l-7 -7 L${start.position + 7} ${(j * 20) + 9}`
              + ` l-7 7 z`);
        }

        if (dependencies.length) {
          for (const d of dependencies) {
            const arrow = document.createElementNS(Gantt.SVG_NS, 'path');
            arrow.setAttribute('d',
                `M${end.position + (d.dependency.type === TaskType.FinishStart || d.dependency.type === TaskType.StartStart ? 0 : notchDist)} ${(j * 20) + 10} h${
              Gantt.zoomTable[this.zoomLevel].weekendSpace * d.skip
                    + (3 * (d.dependency.type === TaskType.FinishFinish || d.dependency.type === TaskType.FinishStart ? -1 : 1))
                    + (d.dependency.difference * Gantt.zoomTable[this.zoomLevel].notchDistance)}`
                + ` v${(20 * (d.index - j)) + 13 * (d.index > j ? -1 : 1)} h3 l-3 ${5 * (d.index > j ? 1 : -1)} l-3`
                + ` ${ 5 * (d.index > j ? -1 : 1)} h3 v${-((20 * (d.index - j)) + 13 * (d.index > j ? -1 : 1))}`
            );
            arrow.setAttribute('stroke', '#000');
            if (d.dependency.hardness === 'Rubber') {
              arrow.setAttribute('stroke-dasharray', '3, 5');
            }
            arrow.setAttribute('stroke-width', '1');
            depArrowsG.appendChild(arrow);
          }
        }

        g.appendChild(p);
        if (c) {
          g.appendChild(c);
        }
        tasksGroup.appendChild(g);
      }
    }
    tasksGroup.appendChild(depArrowsG);
    return tasksGroup;
  }

  public constructor(private container: HTMLElement) {
  }

  public destruct() {
    if (this.svg) {
      this.svg.remove();
      this.svg = null;
    }
  }

  public init(notches: INotchesData, displayStartDate: Date, tasks: ITask[], svgDrawingWidth: number) {
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

  public redraw(notches: INotchesData, displayStartDate: Date, tasks: ITask[], delta = 0) {
    if (this.mainSvgGroup) {
      this.mainSvgGroup.remove();
      this.mainSvgGroup = null;
    }
    this.buildGraph(notches, displayStartDate, tasks, delta);
  }

  private buildGraph(notchesData: INotchesData, startDate: Date, tasks: ITask[], delta: number = null) {
    this.mainSvgGroup = document.createElementNS(Gantt.SVG_NS, 'g');
    this.mainSvgGroup.setAttribute('class', 'main-group');

    const horizontalLines = document.createElementNS(Gantt.SVG_NS, 'g');
    const verticalLines = document.createElementNS(Gantt.SVG_NS, 'g');


    const numTasks = tasks.length;

    const weekendDayWidth = Gantt.zoomTable[this.zoomLevel].weekendSpace;
    const height = this.container.offsetHeight - Gantt.timeLineHeight;
    let startPos = 0;
    for (const n of notchesData.notches) {
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
    this.mainSvgGroup.appendChild(this.buildTasks(notchesData, tasks));


    this.svg.appendChild(this.mainSvgGroup);
    this.svgViewBox[0] = startPos
        - (delta != null ? delta : 0);
    this.svg.setAttribute('viewBox', this.svgViewBox.join(' '));
  }

  public onMouseMove(visibleStart) {
    this.svg.setAttribute('viewBox', [visibleStart, ...this.svgViewBox.slice(1)].join(' '));
  }
}
