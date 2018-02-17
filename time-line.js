var TimeLine = /** @class */ (function () {
    function TimeLine(container, currentHeight) {
        this.container = container;
        this.currentHeight = currentHeight;
        this.zoomLevel = 2;
        this.timeLine = {
            line: null,
            notches: null,
            topLabels: null,
            dateLabels: null,
            notchesPositions: [],
            firstTopLabel: null
        };
        this.svgViewBox = [];
        this.svgViewBoxTmp = [];
    }
    TimeLine.prototype.init = function () {
        this.displayStartDate = new Date;
        this.currentHeight = 60;
        this.svg = document.createElementNS(Gantt.SVG_NS, 'svg');
        this.svg.setAttribute('class', 'draggable');
        this.container.appendChild(this.svg);
        this.redraw();
        this.subscribeToEvents();
    };
    TimeLine.prototype.redraw = function () {
        if (this.mainSvgGroup) {
            this.mainSvgGroup.remove();
            this.mainSvgGroup = null;
        }
        this.containerWidth = this.container.offsetWidth;
        this.svgDrawingWidth = window.innerWidth + 500;
        this.svg.setAttribute('height', this.currentHeight + 'px');
        this.svg.setAttribute('width', this.containerWidth + 'px');
        this.svgViewBox = [0, 0, this.containerWidth, this.currentHeight];
        this.svg.setAttribute('viewBox', this.svgViewBox.join(' '));
        this.buildTimeLine(this.displayStartDate);
    };
    TimeLine.prototype.subscribeToEvents = function () {
        var _this = this;
        window.addEventListener('resize', function () {
            _this.redraw();
        });
        document.addEventListener('mousemove', function (ev) {
            if (typeof _this.dragStartX === 'number') {
                var dx = ev.clientX - _this.dragStartX;
                if (Math.abs(dx) < 200) {
                    _this.svgViewBoxTmp[0] = _this.svgViewBox[0] - dx;
                    _this.svg.setAttribute('viewBox', _this.svgViewBoxTmp.join(' '));
                    _this.updateFirstTopLabel();
                }
                else {
                    var closestDate = _this.findClosestDate(_this.svgViewBoxTmp[0]);
                    var delta = closestDate.position - _this.svgViewBoxTmp[0];
                    _this.dragStartX = ev.clientX;
                    _this.mainSvgGroup.remove();
                    _this.buildTimeLine(closestDate.date, delta);
                }
            }
        });
        document.addEventListener('mouseup', function () {
            if (typeof _this.dragStartX === 'number') {
                _this.dragStartX = undefined;
                _this.displayStartDate = _this.findClosestDate(_this.svgViewBoxTmp[0]).date;
                _this.redraw();
            }
        });
        this.svg.addEventListener('mousedown', function (ev) {
            if (!ev.button) {
                _this.dragStartX = ev.clientX;
            }
        });
    };
    TimeLine.prototype.updateFirstTopLabel = function () {
        this.timeLine.firstTopLabel.setAttribute('x', '' + (this.svgViewBoxTmp[0] + 2));
        var rect0 = this.timeLine.firstTopLabel.getBoundingClientRect();
        var rect1 = this.timeLine.topLabels[0].getBoundingClientRect();
        var cd = this.findClosestDate(this.svgViewBoxTmp[0]);
        this.timeLine.firstTopLabel.textContent = TimeLine.monthTable[cd.date.getMonth()] + cd.date.getFullYear();
        if (rect0.right >= rect1.left && rect1.right >= rect0.left) {
            if (rect1.left <= rect0.left) {
                this.timeLine.firstTopLabel.setAttribute('visibility', 'visible');
                this.timeLine.topLabels[0].setAttribute('visibility', 'hidden');
            }
            else {
                this.timeLine.firstTopLabel.setAttribute('visibility', 'hidden');
                this.timeLine.topLabels[0].setAttribute('visibility', 'visible');
            }
        }
        else {
            this.timeLine.firstTopLabel.setAttribute('visibility', 'visible');
            this.timeLine.topLabels[0].setAttribute('visibility', 'visible');
        }
    };
    TimeLine.prototype.findClosestDate = function (point) {
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
        return res;
    };
    TimeLine.prototype.buildTimeLine = function (startDate, delta) {
        if (delta === void 0) { delta = null; }
        this.mainSvgGroup = document.createElementNS(Gantt.SVG_NS, 'g');
        this.mainSvgGroup.setAttribute('class', 'main-group');
        var l = document.createElementNS(Gantt.SVG_NS, 'path');
        l.setAttribute('fill', 'black');
        l.setAttribute('d', 'M0 30 h' + this.svgDrawingWidth + ' v1 H0 z');
        this.mainSvgGroup.appendChild(l);
        this.timeLine.line = l;
        var approxDaysPerScreen = Math.ceil(/*this.containerWidth*/ 150 / ((Gantt.zoomTable[this.zoomLevel].notchDistance * (7 - Gantt.numWeekends) +
            Gantt.zoomTable[this.zoomLevel].weekendSpace * Gantt.numWeekends) / 7)) + 3;
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
        this.timeLine.firstTopLabel = document.createElementNS(Gantt.SVG_NS, 'text');
        this.timeLine.firstTopLabel.textContent = TimeLine.monthTable[startDate.getMonth()] + startDate.getFullYear();
        this.timeLine.firstTopLabel.setAttribute('y', '20');
        this.timeLine.firstTopLabel.setAttribute('class', 'chart-dates');
        this.mainSvgGroup.appendChild(this.timeLine.firstTopLabel);
        this.timeLine.notches = n;
        this.timeLine.dateLabels = d;
        this.timeLine.topLabels = tt;
        var nextNotchPosition = 0;
        var startPos = 0;
        this.timeLine.notchesPositions = [];
        do {
            this.timeLine.notchesPositions.push({ date: new Date(drawStartDate.getTime()), position: nextNotchPosition });
            var isFirst = drawStartDate.getDate() === 1;
            if (isFirst) {
                var mt = document.createElementNS(Gantt.SVG_NS, 'text');
                mt.textContent = TimeLine.monthTable[drawStartDate.getMonth()] + drawStartDate.getFullYear();
                mt.setAttribute('y', '20');
                mt.setAttribute('x', '' + (nextNotchPosition + 2));
                topTextGroup.appendChild(mt);
                tt.push(mt);
            }
            if (Gantt.weekendTable[drawStartDate.getDay()].isWeekend) {
                nextNotchPosition += Gantt.zoomTable[this.zoomLevel].weekendSpace;
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
                nextNotchPosition += Gantt.zoomTable[this.zoomLevel].notchDistance;
            }
            drawStartDate = Gantt.nextDay(drawStartDate);
            if (startDate.getTime() === drawStartDate.getTime()) {
                startPos = nextNotchPosition;
            }
        } while (nextNotchPosition < this.svgDrawingWidth);
        this.mainSvgGroup.appendChild(notchGroup);
        this.mainSvgGroup.appendChild(dateGroup);
        this.mainSvgGroup.appendChild(topTextGroup);
        this.svg.appendChild(this.mainSvgGroup);
        this.svgViewBox[0] = startPos - (delta != null ? delta : 0);
        this.svgViewBoxTmp = [this.svgViewBox[0], 0, this.containerWidth, this.currentHeight];
        this.updateFirstTopLabel();
        this.svg.setAttribute('viewBox', this.svgViewBox.join(' '));
    };
    TimeLine.monthTable = [
        'Jan\'', 'Feb\'', 'Mar\'', 'Apr\'', 'May', 'Jun\'', 'Jul\'', 'Aug\'', 'Sep\'', 'Oct\'', 'Nov\'', 'Dec\''
    ];
    return TimeLine;
}());
