import { IDependency, ITask } from './types';

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

  public constructor(task: ITask) {
    this.color = task.color;
    this.complete = task.complete;
    this.depend = task.depend;
    this.duration = task.duration;
    this.end = task.end;
    this.expand = task.expand;
    this.id = task.id;
    this.meeting = task.meeting;
    this.name = task.name;
    this.start = task.start;
    this.tasks = task.tasks;
    this.totalDescendants = task.totalDescendants;
  }



}
