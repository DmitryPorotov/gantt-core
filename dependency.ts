import { IDependency, TaskType } from './types';
import { Utilities as ut, WrappedSVGElement } from './utilities';
import { Task } from './task';

export class Dependency implements IDependency {
  public difference: number;
  public hardness: 'Rubber' | 'Strong';
  public id: number;
  public type: TaskType;

  public constructor(
      dependency: IDependency,
      public dependantTask: Task
  ) {
    this.difference = dependency.difference;
    this.hardness = dependency.hardness;
    this.id = dependency.id;
    this.type = dependency.type;

  }

  public buildArrow(parentTask: Task) {
    if (this.dependantTask.isHiddenByParent) {
      return null;
    }
    let startX: number,
        endX: number,
        doHook = false;
    switch (this.type) {
      case (TaskType.StartStart):
        startX = parentTask.startPositionX;
        endX = this.dependantTask.startPositionX;
        doHook = startX <= endX;
        break;
      case (TaskType.FinishStart):
        startX = parentTask.endPositionX;
        endX = this.dependantTask.startPositionX;
        break;
      case (TaskType.FinishFinish):
        startX = parentTask.endPositionX;
        endX = this.dependantTask.endPositionX;
        doHook = startX >= endX;
        break;
      case (TaskType.StartFinish):
        startX = parentTask.startPositionX;
        endX = this.dependantTask.endPositionX;
        break;
    }

    return this.buildArrowLine(startX, endX, parentTask.index, this.dependantTask.index, doHook);
  }

  private buildArrowLine(startX: number, endX: number, startRow: number, endRow: number, doHook: boolean) {
    let line, arrowHead;
    const arrowG = ut.ce_('g')
        .ac_(
        line = ut.ce_('path')
            .sa_('stroke', '#000')
            .sa_('stroke-width', '1')
            .sa_('fill-opacity', '0')
        )
        .ac_(
        arrowHead = ut.ce_('path')
            .sa_('stroke', '#000')
            .sa_('stroke-width', '1')
        );

    if ('Rubber' === this.hardness) {
      line.sa_('stroke-dasharray', '5, 5');
    }

    let lineD = `M${startX} ${startRow * 20 + 10}`,
        arrowHeadD: string,
        realEndX: number,
        realEndY: number,
        dir: number;
    if (doHook) {
      realEndX = endX + (this.type === TaskType.StartStart ? -6 : 6);
      realEndY = endRow * 20 + 10;
      dir = this.type === TaskType.StartStart ? 1 : -1;
      lineD += `h${this.type === TaskType.StartStart ? -8 : 8}V${realEndY}H${realEndX}`;
      arrowHeadD = `v-3l${5 * dir} 3l${-5 * dir} 3z`;
    } else {
      realEndX = endX + (
          (
              endX >= startX
              || (endX < startX
                  && (
                      this.type === TaskType.StartStart
                      || this.type === TaskType.FinishStart
                  )
              )
          ) ? 3 : -3);
      realEndY = endRow * 20  + (endRow < startRow ? 23 : -3);
      dir = endRow > startRow ? 1 : -1;
      lineD += `H${realEndX} V${realEndY}`;
      arrowHeadD = `h3l-3 ${5 * dir}l-3 ${-5 * dir}z`;
    }
    arrowHeadD = `M${realEndX} ${realEndY}` + arrowHeadD;
    line.sa_('d', lineD);
    arrowHead.sa_('d', arrowHeadD);
    return arrowG;
  }

}

export class TempDependency {

  private readonly _arrow: WrappedSVGElement;

  private _arrowHead: string = `v-3l5 3l-5 3v-3z`;

  constructor (private startX: number, private startY: number) {
    this._arrow = ut.ce_('path')
        .sa_('stroke', '#000')
        .sa_('stroke-width', '1')
        .sa_('d', `M${startX} ${startY} ${this._arrowHead}`);
  }

  get arrow() {
    return this._arrow;
  }

  public redraw(endX: number, endY: number) {
    const length = Math.pow(Math.pow( (this.startX - endX), 2) + Math.pow((this.startY - endY), 2), 0.5) - 6,
        angle = Math.atan( (this.startY - endY) / (this.startX - endX)) * 180 / Math.PI + (this.startX >= endX ? 180 : 0);
    if (!isNaN(angle)) {
      this._arrow.sa_('d', `M${this.startX} ${this.startY}h${length}${this._arrowHead}`)
          .sa_('transform', `rotate(${angle} ${this.startX} ${this.startY})`);
    }
  }

  public destruct() {
    this._arrow.rm_();
  }

}
