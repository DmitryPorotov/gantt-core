// import { TimeLine } from './time-line';

class Gantt {
    public static SVG_NS: 'http://www.w3.org/2000/svg' = 'http://www.w3.org/2000/svg';

    public static zoomTable: { notchDistance: number, weekendSpace: number }[] = [
        {
            notchDistance: 0,
            weekendSpace: 0
        },
        {
            notchDistance: 0,
            weekendSpace: 0
        },
        {
            notchDistance: 45,
            weekendSpace: 2
        }
    ];

    public static weekendTable = [
        { isWeekend: true },
        { isWeekend: false },
        { isWeekend: false },
        { isWeekend: false },
        { isWeekend: false },
        { isWeekend: false },
        { isWeekend: true }
    ];

    private container: HTMLElement;

    private timeLine: TimeLine;

    public static get numWeekends(): number {
        return Gantt.weekendTable.reduce((a, d) => a + (d.isWeekend ? 1 : 0), 0);
    }

    public static nextDay(date: Date): Date {
        date.setDate(date.getDate() + 1);
        return date;
    }

    public constructor (container: string) {
        this.container = document.getElementById(container);
        this.timeLine = new TimeLine(this.container, 60);
        this.timeLine.init();
    }
}

// class TimeLine {
//
// }

