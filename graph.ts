import { IGraphNotch, INotchesData, ITask, TaskType } from './types';
import { Gantt } from './gantt';
import { dependencyFactory, IDependencyWrapper } from './dependency';
import { Utilities as ut, WrappedSVGElement } from './utilities';

export class Graph {

  private mainSvgGroup: WrappedSVGElement;
  private svg: WrappedSVGElement;

  private containerWidth: number;
  private svgDrawingWidth: number;

  private svgViewBox: number[] = [];

  public onMouseDown: (ev: MouseEvent) => void;

  private buildTasks(notchesData: INotchesData, tasks: ITask[]): WrappedSVGElement {
    const tasksGroup: WrappedSVGElement =  ut.ca_('g'),
        depArrowsG: WrappedSVGElement = ut.ca_('g');
    for (let currentTaskIdx = 0; currentTaskIdx < tasks.length; ++currentTaskIdx) {
      const t = tasks[currentTaskIdx],
          dependencies: IDependencyWrapper[] = [];

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

      if (t.depend) {
        for (const d of t.depend) {
          for (let dependantTaskIdx = 0; dependantTaskIdx < tasks.length; ++dependantTaskIdx) {
            if (tasks[dependantTaskIdx].id === d.id) {

              const dayDur = 1000 * 3600 * 24;
              let skip: number;

              switch (d.type) {
                case (TaskType.StartStart):
                  skip = Math.round((tasks[dependantTaskIdx].start.getTime() - t.start.getTime()) / dayDur);
                  break;
                case (TaskType.StartFinish):
                  skip = Math.round((tasks[dependantTaskIdx].start.getTime() - t.end.getTime()) / dayDur) - 1;
                  break;
                case (TaskType.FinishFinish):
                  skip = Math.round((tasks[dependantTaskIdx].end.getTime() - t.end.getTime()) / dayDur);
                  break;
                case (TaskType.FinishStart):
                  skip = Math.round((tasks[dependantTaskIdx].end.getTime() - t.start.getTime()) / dayDur) + 1;
                  break;
              }

              if (skip) {
                for (let numDaysToCheck = Math.abs(skip), day: Date = t.start; numDaysToCheck; --numDaysToCheck) {
                  day = ut.addDay(day, skip > 0 ? 1 : -1);
                  if (!Gantt.weekendTable[day.getDay()].isWeekend) {
                    skip += skip < 0 ? 1 : -1;
                  }
                  // TODO: check for holidays too
                }
              }
              const dep = dependencyFactory(d, currentTaskIdx, dependantTaskIdx, t.duration, skip, start.position);
              dependencies.push(dep);
            }
          }
        }
      }

      const notchDist = Gantt.currentZoom.notchDistance;
      if (start && end) {
        let completion;
        const g = ut.ca_('g'),
            task = ut.ca_('path')
                .sa_('fill', t.color || '#8cb6ce')
                .sa_('class', 'clickable');
        if (!t.tasks) {
          task.sa_('stroke', 'black')
              .sa_('stroke-width', '1')
              .sa_('d', `M${start.position} ${(currentTaskIdx * 20) + 4} H${end.position + notchDist} v13 H${start.position} z`);
          if (t.complete) {
            completion = ut.ca_('path')
              .sa_('fill', 'black')
              .sa_('d',
              `M${start.position} ${(currentTaskIdx * 20) + 9} h${(end.position - start.position + notchDist) / 100 * t.complete}`
              + ` v2 H${start.position} z`);
          }
        } else {
          task.sa_('d',
              `M${start.position} ${(currentTaskIdx * 20) + 4} H${end.position + notchDist} v12 l-7 -7`
              + `L${start.position + 7} ${(currentTaskIdx * 20) + 9} l-7 7 z`);
        }

        if (dependencies.length) {
          for (const d of dependencies) {
            depArrowsG.ac_(d.buildArrow());
          }
        }

        g.ac_(task);
        if (completion) {
          g.ac_(completion);
        }
        tasksGroup.ac_(g);
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
    }
  }

  public init(notches: INotchesData, displayStartDate: Date, tasks: ITask[], svgDrawingWidth: number) {
    this.containerWidth = this.container.offsetWidth;
    this.svgDrawingWidth = svgDrawingWidth;
    this.svg = ut.ca_('svg')
        .sa_('style', 'margin-top:-4px;')
        .sa_('class', 'draggable')
        .sa_('height', this.container.offsetHeight
        - Gantt.timeLineHeight + 'px')
        .sa_('width', this.containerWidth + 'px');
    this.svgViewBox = [0, 0, this.containerWidth, this.container.offsetHeight
    - Gantt.timeLineHeight];
    this.container.appendChild(this.svg.element);
    this.subscribeToEvents();
    this.redraw(notches, displayStartDate, tasks);
  }

  private subscribeToEvents() {
    this.svg.ael_('mousedown', ev => {
      if (!ev.button && this.onMouseDown) {
        this.onMouseDown(ev);
      }
    });
  }

  public redraw(notches: INotchesData, displayStartDate: Date, tasks: ITask[], delta = 0) {
    if (this.mainSvgGroup) {
      this.mainSvgGroup.rm_();
      this.mainSvgGroup = null;
    }
    this.buildGraph(notches, displayStartDate, tasks, delta);
  }

  private buildGraph(notchesData: INotchesData, startDate: Date, tasks: ITask[], delta: number = null) {
    this.mainSvgGroup = ut.ca_('g')
        .sa_('class', 'main-group');

    const horizontalLines = ut.ca_('g');
    const verticalLines = ut.ca_('g');


    const numTasks = tasks.length;

    const weekendDayWidth = Gantt.currentZoom.weekendSpace;
    const height = this.container.offsetHeight - Gantt.timeLineHeight;
    let startPos = 0;
    for (const n of notchesData.notches) {
      if (Gantt.weekendTable[n.date.getDay()].isWeekend) {
        const line = ut.ca_('path')
            .sa_('fill', 'black')
            .sa_('fill-opacity', '0.1')
            .sa_('d'
            , `M${n.position} 0 h${weekendDayWidth} v${height} h-${weekendDayWidth} z`);
        verticalLines.ac_(line);
      }
      if (n.date.getTime() === startDate.getTime()) {
        startPos = n.position;
      }
    }

    for (let i = 1; i <= numTasks; ++i) {
      const line = ut.ca_('path')
          .sa_('fill', 'black')
          .sa_('d', `M0 ${i * 20} h${this.svgDrawingWidth} v1 H0 z`);
      horizontalLines.ac_(line);
    }

    this.mainSvgGroup.ac_(verticalLines)
        .ac_(horizontalLines)
        .ac_(this.buildTasks(notchesData, tasks));

    this.svgViewBox[0] = startPos
        - (delta != null ? delta : 0);
    this.svg.ac_(this.mainSvgGroup.element)
        .sa_('viewBox', this.svgViewBox.join(' '));
  }

  public onMouseMove(visibleStart) {
    this.svg.sa_('viewBox', [visibleStart, ...this.svgViewBox.slice(1)].join(' '));
  }
}
