let data = {
  bucket: 30,
  height: 300,
  width: 600,
  candleWick: 1,
  candleBody: 5,
  spacing: 5,
  distribution: function () {
    return this.spacing + this.candleBody;
  },
  points: function () {
    let int = Math.floor(this.width / (this.candleBody + this.spacing));
    let remain = this.width % (this.candleBody + this.spacing);
    if (remain >= this.candleBody) {
      int++;
    }
    return int;
  },
  prevPoint: 0,
  decimals: 0,
};

// Объявляем главные элементы
let chartHome = document.getElementById("candlesChart");
let chartSVG, group;
let saveButton = document.getElementById("saveButton"); // Объявляет кнопку сохранения графика
let regenerateButton = document.getElementById("saveButton"); // Объявляет кнопку генерации графика

// Объявляем поля ввода для редактирования значений
let bucketInput = document.getElementById("bucketInput");
let heightInput = document.getElementById("heightInput");
let widthInput = document.getElementById("widthInput");
let candleWickInput = document.getElementById("candleWickInput");
let candleBodyInput = document.getElementById("candleBodyInput");

// Добавляем прослушку полей ввода для редактирования значений
bucketInput.addEventListener("input", function () {
  data.bucket = parseInt(bucketInput.value);
  build();
});

heightInput.addEventListener("input", function () {
  data.height = parseInt(heightInput.value);
  build();
});

widthInput.addEventListener("input", function () {
  data.width = parseInt(widthInput.value);
  build();
});

candleWickInput.addEventListener("input", function () {
  data.candleWick = parseInt(candleWickInput.value);
  build();
});

candleBodyInput.addEventListener("input", function () {
  data.candleBody = parseInt(candleBodyInput.value);
  build();
});

function rndRange(min, max) {
  return Math.random() * (max - min) + min;
}

function boxMuller(mean, stdev) {
  let x = 0,
    y = 0,
    rds,
    c;
  do {
    x = Math.random() * 2 - 1;
    y = Math.random() * 2 - 1;
    rds = x * x + y * y;
  } while (rds >= 1);
  c = Math.sqrt((-2 * Math.log(rds)) / rds);
  return x * c * stdev + mean;
}

function round(value, decimals) {
  return Number(Math.round(value + "e" + decimals) + "e-" + decimals);
}

function removeItem(item, list) {
  return list.filter((e) => {
    return e != item;
  });
}

Array.prototype.max = function () {
  return Math.max.apply(null, this);
};

Array.prototype.min = function () {
  return Math.min.apply(null, this);
};

function mapRange(value, a, b, c, d) {
  value = (value - a) / (b - a);
  return c + value * (d - c);
}

function craftData() {
  let dataArray = [];
  let startingYPoint = rndRange(0, data.height);
  let startingXPoint = data.candleBody / 2;
  let dataBucket = [];
  let dataBucketFormatted = [];
  let xPlace = startingXPoint;
  for (let i = 0; i < data.points() * data.bucket; i++) {
    if (i === 0) {
      dataBucket.push(startingYPoint);
      data.prevPoint = startingYPoint;
    } else {
      let point = boxMuller(0, 10) + data.prevPoint;
      dataBucket.push(point);
      data.prevPoint = point;
    }
  }
  let minY = dataBucket.min();
  let maxY = dataBucket.max();
  for (let i = 0; i < dataBucket.length; i++) {
    dataBucketFormatted.push(
      mapRange(dataBucket[i], minY, maxY, 0, data.height)
    );
  }
  for (let i = 0; i < data.points(); i++) {
    let candlestick = {
      high: 0,
      low: 0,
      open: 0,
      close: 0,
      positive: false,
      x: xPlace,
    };
    let groupPoints = dataBucketFormatted.slice(0, data.bucket);
    candlestick.high = groupPoints.max();
    candlestick.low = groupPoints.min();
    candlestick.open = groupPoints[0];
    candlestick.close = groupPoints[data.bucket - 1];
    if (
      Math.abs(Math.abs(candlestick.open) - Math.abs(candlestick.close)) < 1
    ) {
      candlestick.open++;
    }
    candlestick.high = round(candlestick.high, data.decimals);
    candlestick.low = round(candlestick.low, data.decimals);
    candlestick.open = round(candlestick.open, data.decimals);
    candlestick.close = round(candlestick.close, data.decimals);
    dataArray.push(candlestick);
    xPlace += data.distribution();
    dataBucketFormatted.splice(0, data.bucket);
  }
  for (let i = 0; i < data.points(); i++) {
    if (dataArray[i].close < dataArray[i].open) {
      dataArray[i].positive = true;
    }
  }
  return dataArray;
}

// Описываем функцию генерации графика
function build() {
  chartHome.innerHTML = "";
  let chartData = craftData();
  chartSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  chartSVG.setAttribute("width", data.width);
  chartSVG.setAttribute("height", data.height);
  chartSVG.setAttribute("fill", "none");
  chartSVG.setAttributeNS(
    "http://www.w3.org/2000/xmlns/",
    "xmlns:xlink",
    "http://www.w3.org/1999/xlink"
  );
  group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  for (let i = 0; i < data.points(); i++) {
    let cWick = document.createElementNS("http://www.w3.org/2000/svg", "path");
    let color = "#F44747";
    if (chartData[i].positive) {
      color = "#18BF69";
    }
    cWick.setAttribute("stroke", "#676767");
    cWick.setAttribute("stroke-width", data.candleWick);
    cWick.setAttribute(
      "d",
      `M ${chartData[i].x},${chartData[i].high},${chartData[i].x},${chartData[i].low}`
    );
    group.appendChild(cWick);
    let cBody = document.createElementNS("http://www.w3.org/2000/svg", "path");
    cBody.setAttribute("stroke", color);
    cBody.setAttribute("stroke-width", data.candleBody);
    cBody.setAttribute(
      "d",
      `M ${chartData[i].x},${chartData[i].open},${chartData[i].x},${chartData[i].close}`
    );
    group.appendChild(cBody);
  }
  chartSVG.appendChild(group);
  chartHome.appendChild(chartSVG);
}

// Описываем функцию сохранения графика в SVG
function saveChart() {
  const svgData = new XMLSerializer().serializeToString(chartSVG);
  const blob = new Blob([svgData], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "chart.svg";
  link.click();
  URL.revokeObjectURL(url);
}

// Инициируем билд свечного графика при загрузке страницы
build();

// Вызываем билд для генерации нового графика
function regenerateChart() {
  build();
}
