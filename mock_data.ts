import { ITask } from './types';

export const tasks: ITask[] = [
  {
    id: 0,
    name: 'do things',
    complete: 7,
    meeting: false,
    expand: true,
    start: new Date('2018-02-02'),
    duration: 3,
    tasks: [
      {
        id: 1,
        name: 'do more things',
        color: '#ff6666',
        meeting: false,
        expand: true,
        complete: 21,
        start: new Date('2018-02-02'),
        duration: 1,
        depend: [
          {
            id: 2,
            type: 2,
            difference: 0,
            hardness: 'Strong'
          },
          {
            id: 5,
            type: 2,
            difference: 0,
            hardness: 'Strong'
          }
        ],
      },
      {
        id: 2,
        name: 'task_2',
        complete: 0,
        meeting: false,
        expand: true,
        color: '#8cb6ce',
        start: new Date('2018-02-05'),
        duration: 2,
        tasks: [
          {
            id: 7,
            name: 'task_6',
            complete: 0,
            meeting: false,
            expand: true,
            start: new Date('2018-02-05'),
            duration: 1
          },
          {
            id: 11,
            name: 'task_10',
            complete: 0,
            meeting: false,
            expand: true,
            start: new Date('2018-02-06'),
            duration: 1
          }
        ]
      }
    ]
  },
  {
    id: 5,
    name: 'task_5',
    complete: 0,
    meeting: false,
    expand: true,
    color: '#8cb6ce',
    start: new Date('2018-02-05'),
    duration: 21,
  }
];
