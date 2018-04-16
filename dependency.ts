import { IDependency, TaskType } from './types';
import { Gantt } from './gantt';
import { Utilities as ut, WrappedSVGElement } from './utilities';

export interface IDependencyWrapper extends IDependency {
  startPositionX: number;
  buildArrow(): WrappedSVGElement;
}

export function dependencyFactory(
    dependency: IDependency,
    fromRow: number,
    toRow: number,
    numWeekendsToSkip: number
): IDependencyWrapper {
  switch (dependency.type) {
    case (TaskType.StartStart):
      return new StartStartDependency(dependency, fromRow, toRow, numWeekendsToSkip);
    case (TaskType.StartFinish):
      return new StartFinishDependency(dependency, fromRow, toRow, numWeekendsToSkip);
    case (TaskType.FinishFinish):
      return new FinishFinishDependency(dependency, fromRow, toRow, numWeekendsToSkip);
    case (TaskType.FinishStart):
      return new FinishStartDependency(dependency, fromRow, toRow, numWeekendsToSkip);
  }
}

abstract class BaseDependencyWrapper implements IDependencyWrapper {
  public difference: number;
  public hardness: 'Rubber' | 'Strong';
  public id: number;
  public type: TaskType;

  public set startPositionX(val: number) {
    this._startPositionX = val;
  }

  protected _startPositionX: number;
  protected _arrow: WrappedSVGElement;
  protected _arrowLine: WrappedSVGElement;
  protected _arrowHead: WrappedSVGElement;
  protected _startPositionY: number;
  protected _directionY: 1 | -1;
  protected _deltaY: number;

  protected abstract _buildArrow(): void;

  public constructor(
      dependency: IDependency,
      protected _fromRow: number,
      protected _toRow: number,
      protected _numWeekendsToSkip: number
  ) {
    this.difference = dependency.difference;
    this.hardness = dependency.hardness;
    this.id = dependency.id;
    this.type = dependency.type;
    this._startPositionY = (_fromRow * 20) + 10;
    this._directionY = this._toRow > this._fromRow ? -1 : 1;
    this._deltaY = 20 * (this._toRow - this._fromRow) + 13 * this._directionY;
  }

  public buildArrow(): WrappedSVGElement {
    this._arrowLine = ut.ca_('path')
        .sa_('stroke', '#000')
        .sa_('stroke-width', '1')
        .sa_('fill-opacity', '0');
    if (this.hardness === 'Rubber') {
      this._arrowLine.sa_('stroke-dasharray', '5, 5');
    }
    this._arrowHead = ut.ca_('path')
        .sa_('stroke', '#000')
        .sa_('stroke-width', '1');
    this._arrow = ut.ca_('g')
        .ac_(this._arrowLine)
        .ac_(this._arrowHead);
    this._buildArrow();
    return this._arrow;
  }

  protected buildArrowHead(startX: number): void {
    this._arrowHead.sa_('d',
    `M${startX} ${this._startPositionY + this._deltaY} h3 l-3 ${-5 * this._directionY} l-3 ${5 * this._directionY} h3`);

  }
}

class StartStartDependency extends BaseDependencyWrapper {
  protected _buildArrow() {
    const verticalDist = 20 * (this._toRow - this._fromRow),
          horizontalDist = Gantt.currentZoom.weekendSpace * this._numWeekendsToSkip + (this.difference * Gantt.currentZoom.notchDistance);
    this._arrowLine.sa_('d',
        `M${this._startPositionX} ${this._startPositionY} h-5 v${verticalDist} h${horizontalDist}`);
    this._arrowHead.sa_('d',
        `M${this._startPositionX + horizontalDist - 5} ${this._startPositionY + verticalDist} v-3 l5 3 l-5 3 v-3`);
  }
}

class StartFinishDependency extends BaseDependencyWrapper {
  protected _buildArrow() {
    const startPosX =  this._startPositionX + Gantt.currentZoom.notchDistance,
          dx = Gantt.currentZoom.weekendSpace * this._numWeekendsToSkip + (this.difference * Gantt.currentZoom.notchDistance) + 3;
    this._arrowLine.sa_('d', `M${startPosX} ${this._startPositionY}, h${dx} v${this._deltaY}`);
    this.buildArrowHead(startPosX + dx);
  }
}

class FinishFinishDependency extends BaseDependencyWrapper {
  protected _buildArrow() {
    const startPosX =  this._startPositionX + Gantt.currentZoom.notchDistance,
        dx = Gantt.currentZoom.weekendSpace * this._numWeekendsToSkip + (this.difference * Gantt.currentZoom.notchDistance) - 3;
    this._arrowLine.sa_('d', `M${startPosX} ${this._startPositionY}, h${dx} v${this._deltaY}`);
    this.buildArrowHead(startPosX + dx);
  }
}

class FinishStartDependency extends BaseDependencyWrapper {
  protected _buildArrow() {
    const dx = Gantt.currentZoom.weekendSpace * this._numWeekendsToSkip + (this.difference * Gantt.currentZoom.notchDistance) - 3;
    this._arrowLine.sa_('d', `M${this._startPositionX} ${this._startPositionY}, h${dx} v${this._deltaY}`);
    this.buildArrowHead(this._startPositionX + dx);
  }
}
