import { ITask, TaskType } from './types';

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
  },
  {
    id: 12,
    name: 'task_12',
    complete: 0,
    meeting: false,
    expand: true,
    color: '#8cb6ce',
    start: new Date('2018-02-05'),
    duration: 1,
    depend: [
      {
        id: 11,
        type: 2,
        difference: 0,
        hardness: 'Strong'
      }
    ],
  }
];


export const tasks2: ITask[] = [
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
        duration: 2,
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
            hardness: 'Rubber'
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
        start: new Date('2018-02-06'),
        duration: 2,
        tasks: [
          {
            id: 7,
            name: 'task_6',
            complete: 0,
            meeting: false,
            expand: true,
            start: new Date('2018-02-06'),
            duration: 1,
            depend: [
              {
                id: 11,
                type: 2,
                difference: 0,
                hardness: 'Strong'
              }
            ]


          },
          {
            id: 11,
            name: 'task_10',
            complete: 0,
            meeting: false,
            expand: true,
            start: new Date('2018-02-07'),
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
    start: new Date('2018-02-06'),
    duration: 1,
    depend: [
      {
        id: 11,
        type: 2,
        difference: 0,
        hardness: 'Strong'
      },
      {
        id: 19,
        type: 2,
        difference: 2,
        hardness: 'Strong'
      }
    ]
  },
  {
    id: 19,
    name: 'task_19',
    complete: 0,
    meeting: false,
    expand: true,
    color: '#8cb6ce',
    start: new Date('2018-02-09'),
    duration: 1
  },
  {
    id: 21,
    name: 'task_21',
    complete: 0,
    meeting: false,
    expand: true,
    color: '#8cb6ce',
    start: new Date('2018-02-05'),
    duration: 2,
    depend: [
      {
        id: 23,
        type: 3,
        difference: 0,
        hardness: 'Strong'
      }
    ]
  },
  {
    id: 23,
    name: 'task_23',
    complete: 0,
    meeting: false,
    expand: true,
    color: '#8cb6ce',
    start: new Date('2018-02-06'),
    duration: 1
  },
  {
    id: 41,
    name: 'task_41',
    complete: 0,
    meeting: false,
    expand: true,
    color: '#8cb6ce',
    start: new Date('2018-02-05'),
    duration: 1,
    depend: [
      {
        id: 42,
        type: 4,
        difference: 0,
        hardness: 'Strong'
      }
    ]
  },
  {
    id: 42,
    name: 'task_42',
    complete: 0,
    meeting: false,
    expand: true,
    color: '#8cb6ce',
    start: new Date('2018-02-02'),
    duration: 1
  },
  {
    id: 45,
    name: 'task_45',
    complete: 0,
    meeting: false,
    expand: true,
    color: '#8cb6ce',
    start: new Date('2018-02-05'),
    duration: 1,
    depend: [
      {
        id: 46,
        type: TaskType.StartStart,
        difference: 6,
        hardness: 'Strong'
      }
    ]
  },
  {
    id: 46,
    name: 'task_46',
    complete: 0,
    meeting: false,
    expand: true,
    color: '#8cb6ce',
    start: new Date('2018-02-13'),
    duration: 1
  },
];
