export interface ITask {
  id: number;
  name: string;
  complete: number;
  color?: string;
  meeting: boolean;
  expand: boolean;
  start: Date;
  duration: number;
  tasks?: ITask[];
  totalDescendants?: number;
  depend?: IDependency[];
}

export interface IDependency {
  id: number;
  type: number;
  difference: number;
  hardness: string;
}


export interface IPositionAndDate {
  date: Date;
  position: number;
  isWeekend: boolean;
}
