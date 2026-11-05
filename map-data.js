/*
 * Demonstration geography, NOT official CTS stop coordinates or road routing.
 * The source project contains stop names only. The anchors below are manually
 * placed, approximate Astana-area examples. Intermediate stop positions are
 * linearly interpolated between anchors, rather than geocoded or measured.
 * Do not use this dataset for navigation or claim that it is a verified route.
 */
(() => {
  "use strict";

  // Entries: [stop index in the original route list, latitude, longitude].
  const ROUTE_ANCHORS = {
    "10": {
      stopCount: 36,
      points: [[0, 51.1958, 71.4097], [4, 51.1810, 71.4180], [8, 51.1640, 71.4350],
        [12, 51.1440, 71.4370], [15, 51.1270, 71.4280], [18, 51.1180, 71.4070],
        [21, 51.1060, 71.4000], [23, 51.0900, 71.3980], [26, 51.0770, 71.4100],
        [29, 51.0610, 71.4320], [32, 51.0440, 71.4470], [35, 51.0260, 71.4670]]
    },
    "501": {
      stopCount: 18,
      points: [[0, 51.1880, 71.3770], [3, 51.1700, 71.3920], [5, 51.1530, 71.4150],
        [7, 51.1320, 71.4030], [10, 51.1160, 71.3990], [12, 51.0900, 71.3980],
        [14, 51.0680, 71.4260], [16, 51.0410, 71.4480], [17, 51.0260, 71.4670]]
    },
    "40": {
      stopCount: 10,
      points: [[0, 51.0750, 71.4240], [1, 51.0900, 71.4140], [3, 51.1080, 71.4260],
        [4, 51.1180, 71.3960], [5, 51.0900, 71.3980], [6, 51.1260, 71.4330],
        [7, 51.1580, 71.4560], [8, 51.1770, 71.4350], [9, 51.1958, 71.4097]]
    },
    "53": {
      stopCount: 11,
      points: [[0, 51.0750, 71.4240], [1, 51.0900, 71.4140], [3, 51.1080, 71.4260],
        [4, 51.1180, 71.3960], [5, 51.0900, 71.3980], [6, 51.1580, 71.4110],
        [7, 51.1680, 71.4500], [8, 51.1580, 71.4560], [9, 51.1820, 71.4280],
        [10, 51.1958, 71.4097]]
    }
  };

  function getCoordinates(routeId, stopCount) {
    const source = Object.hasOwn(ROUTE_ANCHORS, routeId) ? ROUTE_ANCHORS[routeId] : null;
    if (!source || !Number.isInteger(stopCount) || stopCount < 1) {
      throw new Error("No demonstration map data is available for this route.");
    }
    return Array.from({ length: stopCount }, (_, index) => {
      // Normalized progress keeps a changed stop count from indexing past data.
      const position = stopCount === 1 ? 0 : index * (source.stopCount - 1) / (stopCount - 1);
      let right = source.points.findIndex(point => point[0] >= position);
      if (right < 0) right = source.points.length - 1;
      const end = source.points[right];
      const start = source.points[Math.max(0, right - 1)];
      const ratio = end[0] === start[0] ? 0 : (position - start[0]) / (end[0] - start[0]);
      return [
        Number((start[1] + ratio * (end[1] - start[1])).toFixed(6)),
        Number((start[2] + ratio * (end[2] - start[2])).toFixed(6))
      ];
    });
  }

  window.SmartBusMapData = Object.freeze({
    bounds: [[51.005, 71.345], [51.215, 71.515]],
    description: "Approximate demo stop locations and straight route lines; not official CTS geography.",
    getCoordinates
  });
})();
