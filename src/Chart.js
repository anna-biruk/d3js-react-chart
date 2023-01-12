import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import rawData from './data.json'
import './chart.css'


const Chart = () => {
    const [color, setColor] = useState('#ffff')
    const [selectedItems, setSelectedItems] = useState([])
    const [loading, setLoading] = useState(true)

    const data = rawData.map((d) => {
        return {
            id: d.id,
            x: d.x,
            y: d.y,
            target: d.target,
            prediction: d.prediction,
            diagnosisGroupId: d.diagnosisGroupId
        };
    })

    useEffect(() => {
        setTimeout(() => {
            setLoading(false)
        }, 3000)
    }, [])
    const svgRef = useRef();

    useEffect(function () {
        const w = 500
        const h = 250;
        const x = d3.scaleLinear().range([0, w]);
        const y = d3.scaleLinear().range([h, 0]);
        const svg = d3.select(svgRef.current)
            .attr('width', w)
            .attr('height', h)
            .style('background', color)
            .style('margin-top', "50px")
            .style('overflow', 'visible')

        const xScale = d3.scaleLinear()
            .domain(d3.extent(data, (d) => d.x))
            .range([0, w]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, (d) => d.y)])
            .range([h, 0]);

        const generateScaledLine = d3.line()
            .x((d) => xScale(d.x))
            .y((d) => yScale(d.y))
            .curve(d3.curveCardinal);

        const xAxis = d3.axisBottom(xScale)
            .ticks(data.length)
            .tickFormat(i => i + 1)

        const yAxis = d3.axisLeft(yScale)
            .ticks(5)

        svg.append('g')
            .attr('transform', 'translate(0,' + h + ')')
            .call(xAxis)


        svg.append('g')
            .call(yAxis)

        const valueline = d3
            .line()
            .x((d) => { return x(d.x); })
            .y((d) => { return y(d.y); })
            .curve(d3.curveCardinal);

        const linePath = svg
            .append("path")
            .data([data])
            .attr("class", "line")
            .attr("d", valueline)

        const pathLength = linePath.node().getTotalLength();

        linePath
            .attr("stroke-dasharray", pathLength)
            .attr("stroke-dashoffset", pathLength)
            .attr("stroke-width", 3)
            .transition()
            .duration(1000)
            .attr("stroke-width", 0)
            .attr("stroke-dashoffset", 0);

        const focus = svg
            .append("g")
            .attr("class", "focus")
            .style("display", "none");

        // append the x line
        focus
            .append("line")
            .attr("class", "x")
            .style("stroke-dasharray", "3,3")
            .style("opacity", 0.5)
            .attr("y1", 0)
            .attr("y2", h);

        // append the y line
        focus
            .append("line")
            .attr("class", "y")
            .style("stroke-dasharray", "3,3")
            .style("opacity", 0.5)
            .attr("x1", w)
            .attr("x2", w);

        // append the circle at the intersection
        focus
            .append("circle")
            .attr("class", "y")
            .style("fill", "none")
            .attr("r", 4); // radius

        // place the value at the intersection
        focus.append("text").attr("class", "y1").attr("dx", 8).attr("dy", "-.3em");
        focus.append("text").attr("class", "y2").attr("dx", 8).attr("dy", "-.3em");

        // place the date at the intersection
        focus.append("text").attr("class", "y3").attr("dx", 8).attr("dy", "1em");
        focus.append("text").attr("class", "y4").attr("dx", 8).attr("dy", "1em");


        function mouseMove(event) {
            const bisect = d3.bisector((d) => d.x).left;
            const x0 = event.target.__data__.x //x.invert(d3.pointer(event, this)[0]);
            const i = bisect(data, x0, 1);
            const d0 = data[i - 1];
            const d1 = data[i];
            const d = x0 - d0.x > d1.x - x0 ? d1 : d0;

            focus
                .select("circle.y")
                .attr("transform", "translate(" + xScale(d.x) + "," + yScale(d.y) + ")");

            focus
                .select(".x")
                .attr("transform", "translate(" + xScale(d.x) + "," + yScale(d.y) + ")")
                .attr("y2", h - yScale(d.y));

            focus
                .select(".y")
                .attr("transform", "translate(" + w * -1 + "," + yScale(d.y) + ")")
                .attr("x2", w + w);

        }

        svg.selectAll(".dot")
            .attr('fill', (d) => {
                if (selectedItems.some((item) => item.x === d.x && item.y === d.y)) {
                    return 'red'
                }
                return 'blue'
            })


        if (!loading) {
            svg.selectAll(".dot")
                .data(data)
                .enter().append("circle")
                .attr("class", "dot")
                .attr("cx", generateScaledLine.x())
                .attr("cy", generateScaledLine.y())
                .attr("r", 3.5)
                .attr('fill', 'blue')
                .style("pointer-events", "all")
                .on("mouseover", () => {
                    focus.style("display", null);
                })
                .on("mouseout", () => {
                    focus.style("display", "none");
                })
                .on("touchmove mousemove", mouseMove)
                .on("click", (event) => {
                    setSelectedItems((prevItems) => {
                        const currentPoint = event.target.__data__
                        const isExists = prevItems.some((item) => item.x === currentPoint.x && item.y === currentPoint.y)
                        if (isExists) {
                            const filteredItems = prevItems.filter(item => item.x !== currentPoint.x && item.y !== currentPoint.y)
                            return filteredItems
                        }

                        return prevItems.concat(currentPoint)
                    })
                })
        }
        if (!loading) {
            svg.selectAll('.line')
                .data([data])
                .join('path')
                .attr('d', d => generateScaledLine(d))
                .attr('fill', 'none')
                .attr('stroke', 'black')
        }



    }, [data, color, selectedItems])



    const handleChangeColorClick = () => {
        setColor("hsl(" + Math.random() * 360 + ",100%,50%)")
    }

    const removeElementByClick = (id) => {
        const items = selectedItems.filter((item) => item.id !== id);
        setSelectedItems(items);
    }

    return (
        <div className="container">
            <div className="chart">
                <div>
                    <svg ref={svgRef}>
                        {loading &&
                            <svg class="spinner" viewBox="0 0 50 50">
                                <circle class="path" cx="25" cy="25" r="5" fill="none" stroke-width="1"></circle>
                            </svg>
                        }
                    </svg>
                </div>
                <div>
                    <button onClick={handleChangeColorClick} className='changeColorButton'>CHANGE COLOR</button>
                </div>
            </div>

            <div>
                {selectedItems.map((item) => {
                    return (
                        <div key={item.id} className="information">
                            <div>X: {item.x}</div>
                            <div>Y: {item.y}</div>
                            <div>Target: {item.target}</div>
                            <div>Prediction: {item.prediction}</div>
                            <div> DiagnosisGroupId: {item.diagnosisGroupId}</div>
                            <a href="/#" className="close" onClick={() => removeElementByClick(item.id)} />
                        </div>
                    )
                })}
            </div>
        </div>
    );
}

export default Chart