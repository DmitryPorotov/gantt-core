import { IDependency, ITask } from './types';
import { Dependency } from './dependency';
import { Utilities as ut, WrappedSVGElement } from './utilities';

export class Task implements ITask {
  public color: string;
  public complete: number;
  public depend: IDependency[];
  public duration: number;
  public end: Date;
  public expand: boolean;
  public id: number;
  public meeting: boolean;
  public name: string;
  public start: Date;
  public tasks: ITask[];
  public totalDescendants: number;
  public isInTimeLine: boolean;
  public isHiddenByParent: boolean;
  public isVisible: boolean = true;

  public wrappedDependencies: Dependency[];

  public startPositionX: number;
  public endPositionX: number;

  private svgGroup: WrappedSVGElement;

  public constructor(task: ITask, public index) {
    this.color = task.color;
    this.complete = task.complete;
    this.depend = task.depend;
    this.duration = task.duration;
    this.expand = task.expand;
    this.id = task.id;
    this.meeting = task.meeting;
    this.name = task.name;
    this.start = task.start;
    this.tasks = task.tasks;
    this.totalDescendants = task.totalDescendants;

    this.wrappedDependencies = [];
  }

  public onMouseDown(handler: (task: Task, evt: MouseEvent) => void) {
    this.svgGroup.ael_('mousedown', (evt: MouseEvent) => {
      evt.preventDefault();
      evt.stopPropagation();
      if (!evt.button) {
        handler(this, evt);
      }
    });
  }

  public onMouseUp(handler: (task: Task) => void) {
    this.svgGroup.ael_('mouseup', (evt) => {
      evt.preventDefault();
      evt.stopPropagation();
      handler(this);
    });
  }

  public buildTask() {
      let completion;
      this.svgGroup = ut.ce_('g').sa_('class', 'gantt-task');
      const task = ut.ce_('path')
              .sa_('fill', this.color || '#8cb6ce')
              .sa_('class', 'clickable');
      if (!this.tasks) {
        task.sa_('stroke', 'black')
            .sa_('stroke-width', '1')
            .sa_('d', `M${this.startPositionX} ${(this.index * 20) + 4}H${this.endPositionX}v13H${this.startPositionX}z`);
        if (this.complete) {
          completion = ut.ce_('path')
            .sa_('fill', 'black')
            .sa_('d',
            `M${this.startPositionX} ${(this.index * 20) + 9}`
                + `h${(this.endPositionX - this.startPositionX) / 100 * this.complete}v3H${this.startPositionX}z`);
        }
      } else {
        task.sa_('d',
            `M${this.startPositionX} ${(this.index * 20) + 4}H${this.endPositionX}v12l-7 -7`
            + `L${this.startPositionX + 7} ${(this.index * 20) + 9}l-7 7z`);
      }
      this.svgGroup.ac_(task);
      if (completion) {
        this.svgGroup.ac_(completion);
      }
      return this.svgGroup;
  }

}
