define(["require", "exports", "./gantt"], function (require, exports, gantt_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Graph {
        constructor(container) {
            this.container = container;
            this.zoomLevel = 2;
            this.svgViewBox = [];
            this.tasksFlatArr = [];
        }
        destruct() {
            if (this.svg) {
                this.svg.remove();
                this.svg = null;
            }
        }
        init(notches, displayStartDate, tasks, svgDrawingWidth) {
            this.containerWidth = this.container.offsetWidth;
            this.svgDrawingWidth = svgDrawingWidth;
            this.svg = document.createElementNS(gantt_1.Gantt.SVG_NS, 'svg');
            this.svg.setAttribute('class', 'draggable');
            this.svg.setAttribute('height', this.container.offsetHeight
                - gantt_1.Gantt.timeLineHeight + 'px');
            this.svg.setAttribute('width', this.containerWidth + 'px');
            this.svgViewBox = [0, 0, this.containerWidth, this.container.offsetHeight
                    - gantt_1.Gantt.timeLineHeight];
            this.container.appendChild(this.svg);
            this.redraw(notches, displayStartDate, tasks);
        }
        redraw(notches, displayStartDate, tasks, delta = 0) {
            if (this.mainSvgGroup) {
                this.mainSvgGroup.remove();
                this.mainSvgGroup = null;
            }
            this.buildGraph(notches, displayStartDate, tasks, delta);
        }
        buildGraph(notches, startDate, tasks, delta = null) {
            this.mainSvgGroup = document.createElementNS(gantt_1.Gantt.SVG_NS, 'g');
            this.mainSvgGroup.setAttribute('class', 'main-group');
            const horizontalLines = document.createElementNS(gantt_1.Gantt.SVG_NS, 'g');
            const verticalLines = document.createElementNS(gantt_1.Gantt.SVG_NS, 'g');
            this.buildTasksFlatArr(tasks);
            const numTasks = this.tasksFlatArr.length;
            const weekendDayWidth = gantt_1.Gantt.zoomTable[this.zoomLevel].weekendSpace;
            const height = this.container.offsetHeight - gantt_1.Gantt.timeLineHeight;
            let startPos = 0;
            for (const n of notches) {
                if (gantt_1.Gantt.weekendTable[n.date.getDay()].isWeekend) {
                    const line = document.createElementNS(gantt_1.Gantt.SVG_NS, 'path');
                    line.setAttribute('fill', 'black');
                    line.setAttribute('fill-opacity', '0.1');
                    line.setAttribute('d', `M${n.position} 0 h${weekendDayWidth} v${height} h-${weekendDayWidth} z`);
                    verticalLines.appendChild(line);
                }
                if (n.date.getTime() === startDate.getTime()) {
                    startPos = n.position;
                }
            }
            for (let i = 1; i <= numTasks; ++i) {
                const line = document.createElementNS(gantt_1.Gantt.SVG_NS, 'path');
                line.setAttribute('fill', 'black');
                line.setAttribute('d', `M0 ${i * 20} h${this.svgDrawingWidth} v1 H0 z`);
                horizontalLines.appendChild(line);
            }
            this.mainSvgGroup.appendChild(verticalLines);
            this.mainSvgGroup.appendChild(horizontalLines);
            try {
                this.mainSvgGroup.appendChild(this.buildTasks(notches));
            }
            catch (e) { }
            this.svg.appendChild(this.mainSvgGroup);
            this.svgViewBox[0] = startPos
                - (delta != null ? delta : 0);
            this.svg.setAttribute('viewBox', this.svgViewBox.join(' '));
        }
        onMouseMove(visibleStart) {
            this.svg.setAttribute('viewBox', [visibleStart, ...this.svgViewBox.slice(1)].join(' '));
        }
        buildTasksFlatArr(tasks) {
            this.tasksFlatArr = [];
            this.recBuildTasksFlatArr(tasks);
        }
        recBuildTasksFlatArr(tasks) {
            for (const t of tasks) {
                this.tasksFlatArr.push(t);
                if (t.tasks) {
                    this.recBuildTasksFlatArr(t.tasks);
                }
            }
        }
        buildTasks(notches) {
            const tasksGroup = document.createElementNS(gantt_1.Gantt.SVG_NS, 'g');
            for (let j = 0; j < this.tasksFlatArr.length; ++j) {
                const t = this.tasksFlatArr[j];
                const g = document.createElementNS(gantt_1.Gantt.SVG_NS, 'g'), p = document.createElementNS(gantt_1.Gantt.SVG_NS, 'path');
                let start, end, dur = t.duration;
                for (let i = 0; i < notches.length; ++i) {
                    if (notches[i].date.getTime() === t.start.getTime()) {
                        start = notches[i];
                        for (; dur; ++i) {
                            if (notches[i]) {
                                if (!notches[i].isWeekend) {
                                    --dur;
                                }
                            }
                            else {
                                break;
                            }
                        }
                        end = notches[i];
                        break;
                    }
                }
                if (!start && notches[0].date < t.start) {
                    start = notches[0];
                }
                if (!end) {
                    end = notches[notches.length - 1];
                }
                let c;
                p.setAttribute('fill', t.color || '#8cb6ce');
                if (!t.tasks) {
                    p.setAttribute('stroke', 'black');
                    p.setAttribute('stroke-width', '1');
                    p.setAttribute('d', `M${start.position} ${(j * 20) + 4} H${end.position} v13 H${start.position} z`);
                    if (t.complete) {
                        c = document.createElementNS(gantt_1.Gantt.SVG_NS, 'path');
                        c.setAttribute('fill', 'black');
                        c.setAttribute('d', `M${start.position} ${(j * 20) + 9} h${(end.position - start.position) / 100 * t.complete} v2 H${start.position} z`);
                    }
                }
                else {
                    p.setAttribute('d', `M${start.position} ${(j * 20) + 4} H${end.position} v12 l-7 -7 L${start.position + 7} ${(j * 20) + 9} l-7 7 z`);
                }
                g.appendChild(p);
                if (c) {
                    g.appendChild(c);
                }
                tasksGroup.appendChild(g);
            }
            return tasksGroup;
        }
    }
    exports.Graph = Graph;
});
//# sourceMappingURL=graph.js.map