export interface ITask {
  id: number;
  name: string;
  complete: number;
  color?: string;
  meeting: boolean;
  expand: boolean;
  start: Date;
  end?: Date;
  duration: number;
  tasks?: ITask[];
  totalDescendants?: number;
  depend?: IDependency[];
}

export interface IDependency {
  id: number;
  type: TaskType; // 1 - start-start, 2 - start-finish, 3 - finish - finish, 4 finish-start
  difference: number;
  hardness: 'Rubber' | 'Strong';
}

export enum TaskType {
  StartStart = 1,
  StartFinish,
  FinishFinish,
  FinishStart
}

export interface IGraphNotch {
  date: Date;
  position: number;
  isWeekend: boolean;
  isHoliday: boolean;
}

export interface INotchesData {
  notches: IGraphNotch[];
  graphStartIndex: number;
  graphStartDate: Date;
}
