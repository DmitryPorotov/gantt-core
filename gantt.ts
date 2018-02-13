class Gantt {
    public static SVG_NS: 'http://www.w3.org/2000/svg' = 'http://www.w3.org/2000/svg';

    private static monthTable = [
        'Jan\'', 'Feb\'', 'Mar\'', 'Apr\'', 'May', 'Jun\'', 'Jul\'', 'Aug\'', 'Sep\'', 'Oct\'', 'Nov\'', 'Dec\''
    ];

    private svg: SVGSVGElement;
    private container: HTMLElement;
    private containerWidth: number;
    private svgDrawingWidth: number;
    private currentHeight: number;
    private zoomLevel: number = 2;
    private dragStartX: number | undefined;
    private timeLine: ITimeLine = {
        line: null,
        notches: null,
        topTexts: null,
        dates: null,
        notchesPositions: []
    };
    private svgViewBox: number[] = [];
    private svgViewBoxTmp: number[] = [];
    private zoomTable: { notchDistance: number, weekendSpace: number }[] = [
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
    private weekendTable = [
        { isWeekend: true },
        { isWeekend: false },
        { isWeekend: false },
        { isWeekend: false },
        { isWeekend: false },
        { isWeekend: false },
        { isWeekend: true }
    ];

    private displayStartDate: Date;

    get numWeekends(): number {
        return this.weekendTable.reduce((a, d) => a + (d.isWeekend ? 1 : 0), 0);
    }

    public constructor (container: string) {
        this.container = document.getElementById(container);
        this.init();
    }

    private static nextDay(date: Date): Date {
        date.setDate(date.getDate() + 1);
        return date;
    }

    public init () {
        this.displayStartDate = new Date;
        this.redraw();
        this.subscribeToEvents();
    }

    private redraw() {
        if (this.svg) {
            this.svg.remove();
            this.svg = null;
        }
        this.containerWidth = this.container.offsetWidth;
        this.svgDrawingWidth = window.innerWidth *  3.2;
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
        this.svg.addEventListener('mousedown', ev => {
            if (!ev.button) {
                this.dragStartX = ev.clientX;
            }
        });
    }

    private subscribeToEvents() {
        window.addEventListener('resize', () => {
            this.redraw();
        });

        document.addEventListener('mousemove', ev => {
            if (typeof this.dragStartX === 'number') {
                const dx = ev.clientX - this.dragStartX;
                // this.svgViewBoxTmp = [];
                this.svgViewBoxTmp[0] = this.svgViewBox[0] - dx;
                // this.svgViewBoxTmp[2] = this.svgViewBox[2] - dx;
                this.svg.setAttribute('viewBox', this.svgViewBoxTmp.join(' '));
            }
        });
        document.addEventListener('mouseup', () => {
            if (typeof this.dragStartX === 'number') {
                this.dragStartX = undefined;
                // for (const i of this.svgViewBoxTmp) {
                //     this.svgViewBox[i] = this.svgViewBoxTmp[i];
                // }
                this.displayStartDate = this.findClosestDate(this.svgViewBoxTmp[0]);
                this.redraw();
            }
        });
    }

    private findClosestDate(point: number): Date {
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
        return res.date;
    }

    private buildTimeLine(zoomLevel: number, startDate: Date) {
        const l = document.createElementNS(Gantt.SVG_NS, 'path');
        l.setAttribute('fill', 'black');
        l.setAttribute('d', 'M0 30 h' + this.svgDrawingWidth + ' v1 H0 z');
        this.svg.appendChild(l);
        this.timeLine.line = l;

        const approxDaysPerScreen = Math.ceil(this.containerWidth / (
            (this.zoomTable[this.zoomLevel].notchDistance * (7 - this.numWeekends) +
            this.zoomTable[this.zoomLevel].weekendSpace * this.numWeekends ) / 7
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
        this.timeLine.notches = n;
        this.timeLine.dates = d;
        this.timeLine.topTexts = tt;
        let nextNotchPosition = 0;
        let startPos = 0;
        this.timeLine.notchesPositions = [];
        do {
            this.timeLine.notchesPositions.push({date: new Date(drawStartDate.getTime()), position: nextNotchPosition});
            const isFirst = drawStartDate.getDate() === 1;
            if (isFirst) {
                const mt = document.createElementNS(Gantt.SVG_NS, 'text');
                mt.textContent = Gantt.monthTable[drawStartDate.getMonth()] + drawStartDate.getFullYear();
                mt.setAttribute('y', '20');
                mt.setAttribute('x', '' + (nextNotchPosition + 2));
                topTextGroup.appendChild(mt);
                tt.push(mt);
            }
            if (this.weekendTable[drawStartDate.getDay()].isWeekend) {
                nextNotchPosition += this.zoomTable[this.zoomLevel].weekendSpace;
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
                nextNotchPosition += this.zoomTable[this.zoomLevel].notchDistance;
            }
            drawStartDate = Gantt.nextDay(drawStartDate);
            if (startDate.getTime() === drawStartDate.getTime()) {
                startPos = nextNotchPosition;
            }
        }
        while (nextNotchPosition < this.svgDrawingWidth);

        this.svg.appendChild(notchGroup);
        this.svg.appendChild(dateGroup);
        this.svg.appendChild(topTextGroup);
        this.svgViewBox[0] = startPos;
        this.svg.setAttribute('viewBox', this.svgViewBox.join(' '));
    }
}

// class TimeLine {
//
// }

interface ITimeLine {
    line: SVGPathElement;
    notches: SVGPathElement[];
    topTexts: SVGTextElement[];
    dates: SVGTextElement[];
    notchesPositions: IPositionAndDate[];
}

interface IPositionAndDate {
    date: Date;
    position: number;
}
