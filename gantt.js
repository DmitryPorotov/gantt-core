define(["require", "exports", "./time-line", "./mock_data", "./graph"], function (require, exports, time_line_1, mock_data_1, graph_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Gantt {
        constructor(containerId) {
            this.zoomLevel = 2;
            this.resizeTimeout = -1;
            this.container = document.getElementById(containerId);
            this.timeLine = new time_line_1.TimeLine(this.container);
            const prevDate = new Date(mock_data_1.tasks[0].start);
            prevDate.setDate(prevDate.getDate() - 1);
            this.displayStartDate = prevDate;
            this.timeLine.onMouseDown = (ev) => {
                this.timeLineDragStartX = ev.clientX;
                this.visibleStartPositionTmp = this.visibleStartPosition;
            };
            this.graph = new graph_1.Graph(this.container);
            this.init();
            this.subscribeToEvents();
        }
        static get numWeekends() {
            return Gantt.weekendTable.reduce((a, d) => a + (d.isWeekend ? 1 : 0), 0);
        }
        static nextDay(date) {
            date.setDate(date.getDate() + 1);
            return date;
        }
        init() {
            this.svgDrawingWidth = this.container.offsetWidth + 500;
            this.buildNotchesPositions(this.displayStartDate);
            this.timeLine.destruct();
            this.graph.destruct();
            this.timeLine.init(this.notchesPositions, this.displayStartDate, this.svgDrawingWidth);
            this.graph.init(this.notchesPositions, this.displayStartDate, mock_data_1.tasks, this.svgDrawingWidth);
        }
        subscribeToEvents() {
            document.addEventListener('mousemove', ev => {
                if (typeof this.timeLineDragStartX === 'number') {
                    const dx = ev.clientX - this.timeLineDragStartX;
                    let closestDate = this.findClosestDate(this.visibleStartPosition);
                    if (Math.abs(dx) < 200) {
                        this.visibleStartPosition = this.visibleStartPositionTmp - dx;
                        this.timeLine.onMouseMove(this.visibleStartPosition, closestDate);
                        this.graph.onMouseMove(this.visibleStartPosition);
                    }
                    else {
                        const delta = closestDate.position - this.visibleStartPosition;
                        this.buildNotchesPositions(closestDate.date);
                        closestDate = this.findClosestDate(this.visibleStartPosition);
                        this.visibleStartPosition = closestDate.position - delta;
                        this.visibleStartPositionTmp = this.visibleStartPosition;
                        this.timeLineDragStartX = ev.clientX;
                        this.timeLine.redraw(this.notchesPositions, closestDate.date, delta);
                        this.graph.redraw(this.notchesPositions, closestDate.date, mock_data_1.tasks, delta);
                    }
                    this.displayStartDate = closestDate.date;
                }
            });
            document.addEventListener('mouseup', () => {
                if (typeof this.timeLineDragStartX === 'number') {
                    this.timeLineDragStartX = undefined;
                    this.displayStartDate = this.findClosestDate(this.visibleStartPosition).date;
                    this.buildNotchesPositions(this.displayStartDate);
                    this.timeLine.redraw(this.notchesPositions, this.displayStartDate);
                    this.graph.redraw(this.notchesPositions, this.displayStartDate, mock_data_1.tasks);
                }
            });
            window.addEventListener('resize', () => {
                clearTimeout(this.resizeTimeout);
                this.resizeTimeout = setTimeout(() => { this.init(); }, 100);
            });
        }
        buildNotchesPositions(startDate) {
            this.notchesPositions = [];
            const approxDaysPerScreen = Math.ceil(150 / ((Gantt.zoomTable[this.zoomLevel].notchDistance * (7 - Gantt.numWeekends) +
                Gantt.zoomTable[this.zoomLevel].weekendSpace * Gantt.numWeekends) / 7)) + 3;
            let drawStartDate = new Date(startDate.getTime());
            drawStartDate.setDate(drawStartDate.getDate() - approxDaysPerScreen);
            let nextNotchPosition = 0;
            do {
                const notch = {
                    date: new Date(drawStartDate.getTime()),
                    position: nextNotchPosition,
                    isWeekend: Gantt.weekendTable[drawStartDate.getDay()].isWeekend
                };
                this.notchesPositions.push(notch);
                if (notch.isWeekend) {
                    nextNotchPosition += Gantt.zoomTable[this.zoomLevel].weekendSpace;
                }
                else {
                    nextNotchPosition += Gantt.zoomTable[this.zoomLevel].notchDistance;
                }
                drawStartDate = Gantt.nextDay(drawStartDate);
                if (startDate.getTime() === drawStartDate.getTime()) {
                    this.visibleStartPosition = nextNotchPosition;
                }
            } while (nextNotchPosition < this.svgDrawingWidth);
        }
        findClosestDate(point) {
            let minDist = Number.POSITIVE_INFINITY;
            let res;
            for (let i = 0; i < this.notchesPositions.length; ++i) {
                const cur = Math.abs(this.notchesPositions[i].position - point);
                if (cur < minDist) {
                    minDist = cur;
                }
                else {
                    res = this.notchesPositions[i - 1];
                    break;
                }
            }
            return res;
        }
    }
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
            weekendSpace: 3
        }
    ];
    Gantt.timeLineHeight = 60;
    Gantt.weekendTable = [
        { isWeekend: true },
        { isWeekend: false },
        { isWeekend: false },
        { isWeekend: false },
        { isWeekend: false },
        { isWeekend: false },
        { isWeekend: true }
    ];
    exports.Gantt = Gantt;
});
//# sourceMappingURL=gantt.js.map