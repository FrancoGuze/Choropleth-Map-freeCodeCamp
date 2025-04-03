import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as topojson from "https://cdn.jsdelivr.net/npm/topojson-client@3/+esm";
const infoURL =
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json";
const mapURL =
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json";

const w = 1000,
  h = 690,
  mt = 90,mi = 280;

// Se crea el SVG
const svg = d3
  .select("body")
  .append("svg")
  .attr("width", w + mi)
  .attr("height", h + mt / 2);

/* Se consigue el dataset completo del mapa */
const map = d3.json(mapURL).then((data) => data);

/* Se consigue el dataset completo de la info a utilizar */
const fetchInfo = d3.json(infoURL).then((data) => data);

const EEUU = await map;
const info = await fetchInfo;

/*Convierte el objeto topoJSON a GeoJSON, tomando los datos geograficos completos, y
      extrayendo el conjunto de datos de objects.states */
// const EEUUnation = topojson.feature(EEUU, EEUU.objects.nation);
const EEUUstates = topojson.feature(EEUU, EEUU.objects.states);
const EEUUcounties = topojson.feature(EEUU, EEUU.objects.counties);

console.log(EEUUstates); // valores separados de el objecto completo

/* Usamos geoidentity porque los datos geoespaciales ya estan en el formato correcto, y
       lo utilizamos para poder modificar las dimensiones del mapa */
const projection = d3.geoIdentity().fitSize([w, h - mt], EEUUcounties);

/* Define la posicion de cordenadas de cada elemento */
const path = d3.geoPath().projection(projection);

const colors = ["#bcb3dd", "#0000be"];

const banchelorsScale = d3.scaleSequential(
  [
    d3.min(info, (d) => d.bachelorsOrHigher),
    d3.max(info, (d) => d.bachelorsOrHigher),
  ],
  colors
);

const counties = svg
  .append("g")
  .attr("id", "counties")
  .attr("transform", `translate(${mi/3}, ${mt})`);

const states = svg
  .append("g")
  .attr("id", "states")
  .attr("transform", `translate(${mi/3}, ${mt})`);

/* Aca se agrega al svg los datos  */

states
  .selectAll("path")
  .data(EEUUstates.features)
  .enter()
  .append("path")
  .attr("class", "state")
  .attr("id", (d) => d.id)
  .attr("d", path);

counties
  .selectAll("path")
  .data(EEUUcounties.features)
  .enter()
  .append("path")
  .attr("class", "county")
  .attr("data-fips", (d) => {
    const county = info.find((county) => county.fips === d.id);
    if (county) {
      return county.fips;
    }
  })
  .attr("data-education", (d) => {
    const county = info.find((county) => county.fips === d.id);
    if (county) {
      return county.bachelorsOrHigher;
    }
  })
  .attr("id", (d) => d.id)
  .attr("fill", (d, i) => {
    const county = info.find((county) => county.fips === d.id);
    if (county) {
      return banchelorsScale(county.bachelorsOrHigher);
    }
  })
  .attr("d", path)
  .on("mouseover", () => {
    tooltip.attr("visibility", "visible");
  })
  .on("mousemove", (event, d) => {
    const county = info.find((county) => county.fips === d.id);
    if (!county) return;

    const textValue = `${county.area_name}, ${county.state}: ${county.bachelorsOrHigher}%`;
    tooltipText.text(textValue);

    // Obtener el tamaño del texto para ajustar el rect
    const bbox = tooltipText.node().getBBox();
console.log(bbox)
    tooltipRect
      .attr("x", event.offsetX - 5)
      .attr("y", event.offsetY - 30)
      .attr("width", bbox.width + 10)
      .attr("height", bbox.height + 12);

    tooltipText
      .attr("x", event.offsetX)
      .attr("y", event.offsetY - 17);

    tooltip.attr("data-education", county.bachelorsOrHigher);
  })
  .on("mouseout", () => {
    tooltip.attr("visibility", "hidden");
  });
/* 

Comienzo del armado del legend 

*/


const scaleXDomain = [
  d3.min(info, (d) => Math.round(d.bachelorsOrHigher)),

  d3.max(info, (d) => Math.round(d.bachelorsOrHigher)),
];

const axisRects = 6;
const legendWidth = 160;

const scaleValues = d3
  .range(
    d3.min(info, (d) => Math.round(d.bachelorsOrHigher) + 3),
    d3.max(info, (d) => Math.floor(d.bachelorsOrHigher)),
    12
  )
  .map((num) => num - 3)
  .concat(d3.max(info, (d) => Math.floor(d.bachelorsOrHigher)));
const scaleX = d3.scalePoint(scaleValues, [0, legendWidth]).padding(0);

const legendAxisX = d3
  .axisBottom(scaleX)

  .tickFormat((d) => d + "%")
  .tickSize(-20)
  .tickPadding(5);

const scaleColors = d3.scaleLinear([0, axisRects - 1], colors);

const legend = svg.append("g");
const legendXpos = w / 1.5;

legend
  .selectAll("rect")
  .data(d3.range(axisRects))
  .enter()
  .append("rect")
  .attr("width", legendWidth / axisRects)
  .attr("height", 20)
  .attr("fill", (d) => scaleColors(d))
  .attr("x", (d) => d * (legendWidth / axisRects))
  .attr("y", -20);

legend
  .attr("id", "legend")
  .attr("color", "white")
  .attr("transform", `translate(${legendXpos + (mi/2)},100)`)
  .call(legendAxisX);

/* 

Comienzo del armado del Tooltip 

*/

const tooltip = svg.append("g").attr("visibility", "hidden").attr("id","tooltip")

const tooltipRect = tooltip
  .append("rect")
  .attr("fill", "black")
  .attr("rx", 5)
  .attr("ry", 5)
  .attr("opacity", 0.7);

const tooltipText = tooltip
  .append("text")
  .attr("fill", "white")
  .attr("font-size", "12px")
  .attr("text-anchor", "start")
  .attr("dy", "0.35em");
