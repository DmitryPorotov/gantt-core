import { IDependency, TaskType } from './types';
import { Gantt } from './gantt';

export abstract class BaseDependency implements IDependency {
  protected static _notchDistance: number;
  protected static _weekendDayDistance: number;

  public static set notchDistance(val: number) {
    this._notchDistance = val;
  }

  public static set weekendDayDistance(val: number) {
    this._weekendDayDistance = val;
  }

  public difference: number;
  public hardness: 'Rubber' | 'Strong';
  public id: number;
  public type: TaskType;

  public set fromRow(val: number) {
    this._fromRow = val;
  }

  public set toRow(val: number) {
    this._toRow = val;
  }

  public set startPosition(val: number) {
    this._startPosition = val;
  }

  public set numWeekendsToSkip(val: number) {
   this._numWeekendsToSkip = val;
  }

  protected _fromRow: number;
  protected _toRow: number;
  protected _numWeekendsToSkip: number;
  protected _startPosition: number;


  protected _arrow: SVGPathElement;

  public constructor(dependency: IDependency) {
    this.difference = dependency.difference;
    this.hardness = dependency.hardness;
    this.id = dependency.id;
    this.type = dependency.type;
    switch (this.type) {
      case (TaskType.StartStart):
        return new StartStartDependency(dependency);
    }
  }

  protected buildArrow() {
    this._arrow = document.createElementNS(Gantt.SVG_NS, 'path');
    this._arrow.setAttribute('stroke', '#000');
    this._arrow.setAttribute('stroke-width', '1');
    if (this.hardness === 'Rubber') {
      this._arrow.setAttribute('stroke-dasharray', '3, 5');
    }
  }
}

export class StartStartDependency extends BaseDependency {

  // public constructor(dependency: IDependency) {
  //   return super(dependency);
  // }
  public buildArrow() {
    super.buildArrow();
    this._arrow.setAttribute('d',
    `M${this._startPosition}`
        );
  }

}

export class StartFinishDependency extends BaseDependency{
  public buildArrow() {
    super.buildArrow();
    this._arrow.setAttribute('d',
        `M${this._startPosition + BaseDependency._notchDistance} ${(this._fromRow * 20) + 10}`
    );
  }
}
