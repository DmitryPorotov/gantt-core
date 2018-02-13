var Gantt = /** @class */ (function () {
    function Gantt(container) {
        this.zoomLevel = 2;
        this.timeLine = {
            line: null,
            notches: null,
            topTexts: null,
            dates: null,
            notchesPositions: []
        };
        this.svgViewBox = [];
        this.svgViewBoxTmp = [];
        this.zoomTable = [
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
        this.weekendTable = [
            { isWeekend: true },
            { isWeekend: false },
            { isWeekend: false },
            { isWeekend: false },
            { isWeekend: false },
            { isWeekend: false },
            { isWeekend: true }
        ];
        this.container = document.getElementById(container);
        this.init();
    }
    Object.defineProperty(Gantt.prototype, "numWeekends", {
        get: function () {
            return this.weekendTable.reduce(function (a, d) { return a + (d.isWeekend ? 1 : 0); }, 0);
        },
        enumerable: true,
        configurable: true
    });
    Gantt.nextDay = function (date) {
        date.setDate(date.getDate() + 1);
        return date;
    };
    Gantt.prototype.init = function () {
        this.displayStartDate = new Date;
        this.redraw();
        this.subscribeToEvents();
    };
    Gantt.prototype.redraw = function () {
        var _this = this;
        if (this.svg) {
            this.svg.remove();
            this.svg = null;
        }
        this.containerWidth = this.container.offsetWidth;
        this.svgDrawingWidth = window.innerWidth * 3.2;
        this.currentHeight = 60;
        this.svg = document.createElementNS(Gantt.SVG_NS, 'svg');
        this.svg.setAttribute('height', this.currentHeight + 'px');
        this.svg.setAttribute('width', this.containerWidth + 'px');
        this.svgViewBox = [0, 0, this.containerWidth, this.currentHeight];
        this.svgViewBoxTmp = [0, 0, this.containerWidth, this.currentHeight];
        this.svg.setAttribute('viewBox', this.svgViewBox.join(' '));
        this.svg.setAttribute('class', 'draggable');
        this.buildTimeLine(this.zoomLevel, this.displayStartDate);
        this.container.appendChild(this.svg);
        this.svg.addEventListener('mousedown', function (ev) {
            if (!ev.button) {
                _this.dragStartX = ev.clientX;
            }
        });
    };
    Gantt.prototype.subscribeToEvents = function () {
        var _this = this;
        window.addEventListener('resize', function () {
            _this.redraw();
        });
        document.addEventListener('mousemove', function (ev) {
            if (typeof _this.dragStartX === 'number') {
                var dx = ev.clientX - _this.dragStartX;
                // this.svgViewBoxTmp = [];
                _this.svgViewBoxTmp[0] = _this.svgViewBox[0] - dx;
                // this.svgViewBoxTmp[2] = this.svgViewBox[2] - dx;
                _this.svg.setAttribute('viewBox', _this.svgViewBoxTmp.join(' '));
            }
        });
        document.addEventListener('mouseup', function () {
            if (typeof _this.dragStartX === 'number') {
                _this.dragStartX = undefined;
                // for (const i of this.svgViewBoxTmp) {
                //     this.svgViewBox[i] = this.svgViewBoxTmp[i];
                // }
                _this.displayStartDate = _this.findClosestDate(_this.svgViewBoxTmp[0]);
                _this.redraw();
            }
        });
    };
    Gantt.prototype.findClosestDate = function (point) {
        var minDist = Number.POSITIVE_INFINITY;
        var res;
        for (var i = 0; i < this.timeLine.notchesPositions.length; ++i) {
            var cur = Math.abs(this.timeLine.notchesPositions[i].position - point);
            if (cur < minDist) {
                minDist = cur;
            }
            else {
                res = this.timeLine.notchesPositions[i - 1];
                break;
            }
        }
        return res.date;
    };
    Gantt.prototype.buildTimeLine = function (zoomLevel, startDate) {
        var l = document.createElementNS(Gantt.SVG_NS, 'path');
        l.setAttribute('fill', 'black');
        l.setAttribute('d', 'M0 30 h' + this.svgDrawingWidth + ' v1 H0 z');
        this.svg.appendChild(l);
        this.timeLine.line = l;
        var approxDaysPerScreen = Math.ceil(this.containerWidth / ((this.zoomTable[this.zoomLevel].notchDistance * (7 - this.numWeekends) +
            this.zoomTable[this.zoomLevel].weekendSpace * this.numWeekends) / 7)) + 3;
        var drawStartDate = new Date(startDate.getTime());
        drawStartDate.setDate(drawStartDate.getDate() - approxDaysPerScreen);
        var n = [];
        var notchGroup = document.createElementNS(Gantt.SVG_NS, 'g');
        var d = [];
        var dateGroup = document.createElementNS(Gantt.SVG_NS, 'g');
        dateGroup.setAttribute('class', 'chart-dates');
        var tt = [];
        var topTextGroup = document.createElementNS(Gantt.SVG_NS, 'g');
        topTextGroup.setAttribute('class', 'chart-dates');
        this.timeLine.notches = n;
        this.timeLine.dates = d;
        this.timeLine.topTexts = tt;
        var nextNotchPosition = 0;
        var startPos = 0;
        this.timeLine.notchesPositions = [];
        do {
            this.timeLine.notchesPositions.push({ date: new Date(drawStartDate.getTime()), position: nextNotchPosition });
            var isFirst = drawStartDate.getDate() === 1;
            if (isFirst) {
                var mt = document.createElementNS(Gantt.SVG_NS, 'text');
                mt.textContent = Gantt.monthTable[drawStartDate.getMonth()] + drawStartDate.getFullYear();
                mt.setAttribute('y', '20');
                mt.setAttribute('x', '' + (nextNotchPosition + 2));
                topTextGroup.appendChild(mt);
                tt.push(mt);
            }
            if (this.weekendTable[drawStartDate.getDay()].isWeekend) {
                nextNotchPosition += this.zoomTable[this.zoomLevel].weekendSpace;
            }
            else {
                var p = document.createElementNS(Gantt.SVG_NS, 'path');
                p.setAttribute('d', 'M' + nextNotchPosition + ' 40 v-' + (isFirst ? 20 : 10) + ' h1 v' + (isFirst ? 20 : 10) + ' z');
                n.push(p);
                notchGroup.appendChild(p);
                var t = document.createElementNS(Gantt.SVG_NS, 'text');
                t.textContent = '' + drawStartDate.getDate();
                t.setAttribute('y', '50');
                t.setAttribute('x', '' + (nextNotchPosition + 2));
                dateGroup.appendChild(t);
                nextNotchPosition += this.zoomTable[this.zoomLevel].notchDistance;
            }
            drawStartDate = Gantt.nextDay(drawStartDate);
            if (startDate.getTime() === drawStartDate.getTime()) {
                startPos = nextNotchPosition;
            }
        } while (nextNotchPosition < this.svgDrawingWidth);
        this.svg.appendChild(notchGroup);
        this.svg.appendChild(dateGroup);
        this.svg.appendChild(topTextGroup);
        this.svgViewBox[0] = startPos;
        this.svg.setAttribute('viewBox', this.svgViewBox.join(' '));
    };
    Gantt.SVG_NS = 'http://www.w3.org/2000/svg';
    Gantt.monthTable = [
        'Jan\'', 'Feb\'', 'Mar\'', 'Apr\'', 'May', 'Jun\'', 'Jul\'', 'Aug\'', 'Sep\'', 'Oct\'', 'Nov\'', 'Dec\''
    ];
    return Gantt;
}());
