class TimeLine {
    public static monthTable = [
        'Jan\'', 'Feb\'', 'Mar\'', 'Apr\'', 'May', 'Jun\'', 'Jul\'', 'Aug\'', 'Sep\'', 'Oct\'', 'Nov\'', 'Dec\''
    ];

    private mainSvgGroup: SVGGElement;
    private svg: SVGSVGElement;

    private containerWidth: number;
    private svgDrawingWidth: number;

    private zoomLevel: number = 2;
    private dragStartX: number | undefined;
    private timeLine: ITimeLine = {
        line: null,
        notches: null,
        topLabels: null,
        dateLabels: null,
        notchesPositions: [],
        firstTopLabel: null
    };

    private svgViewBox: number[] = [];
    private svgViewBoxTmp: number[] = [];

    private displayStartDate: Date;

    constructor(private container: HTMLElement, private currentHeight: number) {

    }

    public init () {
        this.displayStartDate = new Date;
        this.currentHeight = 60;
        this.svg = document.createElementNS(Gantt.SVG_NS, 'svg');
        this.svg.setAttribute('class', 'draggable');
        this.container.appendChild(this.svg);
        this.redraw();
        this.subscribeToEvents();
    }

    private redraw() {
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
    }

    private subscribeToEvents() {
        window.addEventListener('resize', () => {
            this.redraw();
        });

        document.addEventListener('mousemove', ev => {
            if (typeof this.dragStartX === 'number') {
                const dx = ev.clientX - this.dragStartX;
                if (Math.abs(dx) < 200) {
                    this.svgViewBoxTmp[0] = this.svgViewBox[0] - dx;
                    this.svg.setAttribute('viewBox', this.svgViewBoxTmp.join(' '));
                    this.updateFirstTopLabel();
                } else {
                    const closestDate = this.findClosestDate(this.svgViewBoxTmp[0]);
                    const delta = closestDate.position - this.svgViewBoxTmp[0];
                    this.dragStartX = ev.clientX;
                    this.mainSvgGroup.remove();
                    this.buildTimeLine(closestDate.date, delta);
                }
            }
        });
        document.addEventListener('mouseup', () => {
            if (typeof this.dragStartX === 'number') {
                this.dragStartX = undefined;
                this.displayStartDate = this.findClosestDate(this.svgViewBoxTmp[0]).date;
                this.redraw();
            }
        });
        this.svg.addEventListener('mousedown', ev => {
            if (!ev.button) {
                this.dragStartX = ev.clientX;
            }
        });
    }

    private updateFirstTopLabel(): void {
        this.timeLine.firstTopLabel.setAttribute('x', '' + (this.svgViewBoxTmp[0] + 2));
        const rect0 = this.timeLine.firstTopLabel.getBoundingClientRect();
        const rect1 = this.timeLine.topLabels[0].getBoundingClientRect();
        const cd = this.findClosestDate(this.svgViewBoxTmp[0]);
        this.timeLine.firstTopLabel.textContent = TimeLine.monthTable[cd.date.getMonth()] + cd.date.getFullYear();
        if (rect0.right >= rect1.left && rect1.right >= rect0.left) {
            if (rect1.left <= rect0.left) {
                this.timeLine.firstTopLabel.setAttribute('visibility', 'visible');
                this.timeLine.topLabels[0].setAttribute('visibility', 'hidden');
            } else {
                this.timeLine.firstTopLabel.setAttribute('visibility', 'hidden');
                this.timeLine.topLabels[0].setAttribute('visibility', 'visible');
            }
        } else {
            this.timeLine.firstTopLabel.setAttribute('visibility', 'visible');
            this.timeLine.topLabels[0].setAttribute('visibility', 'visible');
        }
    }

    private findClosestDate(point: number): IPositionAndDate {
        let minDist = Number.POSITIVE_INFINITY;
        let res: IPositionAndDate;
        for (let i = 0; i < this.timeLine.notchesPositions.length; ++i) {
            const cur = Math.abs( this.timeLine.notchesPositions[i].position - point);
            if (cur < minDist) {
                minDist = cur;
            } else {
                res = this.timeLine.notchesPositions[i - 1];
                break;
            }
        }
        return res;
    }

    private buildTimeLine(startDate: Date, delta: number = null) {
        this.mainSvgGroup = document.createElementNS(Gantt.SVG_NS, 'g');
        this.mainSvgGroup.setAttribute('class', 'main-group');

        const l = document.createElementNS(Gantt.SVG_NS, 'path');
        l.setAttribute('fill', 'black');
        l.setAttribute('d', 'M0 30 h' + this.svgDrawingWidth + ' v1 H0 z');
        this.mainSvgGroup.appendChild(l);
        this.timeLine.line = l;

        const approxDaysPerScreen = Math.ceil(/*this.containerWidth*/ 150 / (
            (Gantt.zoomTable[this.zoomLevel].notchDistance * (7 - Gantt.numWeekends) +
                Gantt.zoomTable[this.zoomLevel].weekendSpace * Gantt.numWeekends ) / 7
        )) + 3;

        let drawStartDate = new Date(startDate.getTime());
        drawStartDate.setDate(drawStartDate.getDate() - approxDaysPerScreen);

        const n = [];
        const notchGroup = document.createElementNS(Gantt.SVG_NS, 'g');
        const d = [];
        const dateGroup = document.createElementNS(Gantt.SVG_NS, 'g');
        dateGroup.setAttribute('class', 'chart-dates');
        const tt = [];
        const topTextGroup = document.createElementNS(Gantt.SVG_NS, 'g');
        topTextGroup.setAttribute('class', 'chart-dates');

        this.timeLine.firstTopLabel = document.createElementNS(Gantt.SVG_NS, 'text');
        this.timeLine.firstTopLabel.textContent = TimeLine.monthTable[startDate.getMonth()] + startDate.getFullYear();
        this.timeLine.firstTopLabel.setAttribute('y', '20');
        this.timeLine.firstTopLabel.setAttribute('class', 'chart-dates');
        this.mainSvgGroup.appendChild(this.timeLine.firstTopLabel);

        this.timeLine.notches = n;
        this.timeLine.dateLabels = d;
        this.timeLine.topLabels = tt;
        let nextNotchPosition = 0;
        let startPos = 0;
        this.timeLine.notchesPositions = [];
        do {
            this.timeLine.notchesPositions.push({date: new Date(drawStartDate.getTime()), position: nextNotchPosition});
            const isFirst = drawStartDate.getDate() === 1;
            if (isFirst) {
                const mt = document.createElementNS(Gantt.SVG_NS, 'text');
                mt.textContent = TimeLine.monthTable[drawStartDate.getMonth()] + drawStartDate.getFullYear();
                mt.setAttribute('y', '20');
                mt.setAttribute('x', '' + (nextNotchPosition + 2));
                topTextGroup.appendChild(mt);
                tt.push(mt);
            }
            if (Gantt.weekendTable[drawStartDate.getDay()].isWeekend) {
                nextNotchPosition += Gantt.zoomTable[this.zoomLevel].weekendSpace;
            } else {
                const p = document.createElementNS(Gantt.SVG_NS, 'path');
                p.setAttribute('d', 'M' + nextNotchPosition + ' 40 v-' + (isFirst ? 20 : 10) + ' h1 v' + (isFirst ? 20 : 10) + ' z');
                n.push(p);
                notchGroup.appendChild(p);

                const t = document.createElementNS(Gantt.SVG_NS, 'text');
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
        }
        while (nextNotchPosition < this.svgDrawingWidth);

        this.mainSvgGroup.appendChild(notchGroup);
        this.mainSvgGroup.appendChild(dateGroup);
        this.mainSvgGroup.appendChild(topTextGroup);
        this.svg.appendChild(this.mainSvgGroup);
        this.svgViewBox[0] = startPos - (delta != null ? delta : 0);
        this.svgViewBoxTmp = [this.svgViewBox[0], 0, this.containerWidth, this.currentHeight];
        this.updateFirstTopLabel();
        this.svg.setAttribute('viewBox', this.svgViewBox.join(' '));
    }
}

interface ITimeLine {
    line: SVGPathElement;
    notches: SVGPathElement[];
    topLabels: SVGTextElement[];
    firstTopLabel: SVGTextElement;
    dateLabels: SVGTextElement[];
    notchesPositions: IPositionAndDate[];
}

interface IPositionAndDate {
    date: Date;
    position: number;
}

