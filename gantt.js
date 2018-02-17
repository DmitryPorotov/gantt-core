// import { TimeLine } from './time-line';
var Gantt = /** @class */ (function () {
    function Gantt(container) {
        this.container = document.getElementById(container);
        this.timeLine = new TimeLine(this.container, 60);
        this.timeLine.init();
    }
    Object.defineProperty(Gantt, "numWeekends", {
        get: function () {
            return Gantt.weekendTable.reduce(function (a, d) { return a + (d.isWeekend ? 1 : 0); }, 0);
        },
        enumerable: true,
        configurable: true
    });
    Gantt.nextDay = function (date) {
        date.setDate(date.getDate() + 1);
        return date;
    };
    Gantt.SVG_NS = 'http://www.w3.org/2000/svg';
    Gantt.zoomTable = [
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
    Gantt.weekendTable = [
        { isWeekend: true },
        { isWeekend: false },
        { isWeekend: false },
        { isWeekend: false },
        { isWeekend: false },
        { isWeekend: false },
        { isWeekend: true }
    ];
    return Gantt;
}());
// class TimeLine {
//
// }
