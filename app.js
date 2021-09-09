const imageUri = 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@d5c68edec1f5eaec59ac77ff2b48144679cebca1/128/color/';

let newChart = [],
    chartUpdateTimer;

let symbolInput,
    symbolIdx,
    lastSymbol;

const getLocalStorageSymbols = () => {
  if (localStorage.getItem('_symbols') === null){
    localStorage.setItem('_symbols', [0, 'btc', 'eth', 'doge', 'ada', 'sol', 'algo']);
  }
  return localStorage.getItem('_symbols').split(',');
}

const numberWithCommas = n => {
  return n.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
}

const clearPriceData = symbolIdx => {
  document.getElementById('Chart' + symbolIdx + 'Price').textContent = '\u00A0';
  document.getElementById('Chart' + symbolIdx + 'PriceDiff').textContent = '\u00A0';
}

const disableEditableContent = () => {
  document.querySelectorAll('.chart-symbol').forEach(el => el.setAttribute('contenteditable', false))
}

const enableEditableContent = () => {
  document.querySelectorAll('.chart-symbol').forEach(el => el.setAttribute('contenteditable', true))
}

const populateSymbols = () => {
  for (let i = 1; i < symbols.length; i++){
    document.getElementById('Chart' + i + 'Image').src = imageUri + symbols[i] + ".png";
    document.getElementById('Chart' + i + 'Symbol').innerText = symbols[i].toUpperCase();
  }
}

const validateSymbol = async s => {
  let status = await fetch(imageUri + s + '.png');
  return status.status;
}

const ChartData = async s => {
  const response = await fetch('./server.php?symbol=' + s);
  const json = await response.json();
  const data = json.Data.Data
  const times = data.map(obj => obj.time)
  const prices = data.map(obj => obj.high)    
  return {
    times,
    prices
  }
}

const renderCharts = async () => {

  for (let i = 1; i < symbols.length; i++){

    let { times, prices } = await ChartData(symbols[i])
    let chartColor;

    let firstPrice = Array.from(prices)[0],
        lastPrice = Array.from(prices)[prices.length - 1],
        lowPrice = Math.max.apply(Math, prices),
        highPrice = Math.min.apply(Math, prices);
    document.getElementById("Chart" + i + "Price").innerHTML = "$" + numberWithCommas(parseFloat(lastPrice));

    if (firstPrice > lastPrice){
      chartColor = 'rgba(255,0,0,';
    } else {
      chartColor = 'rgba(0,255,0,';
    }

    let canvas = document.getElementById('Chart'+i).getContext('2d');

    Chart.defaults.global.defaultFontFamily = 'Red Hat Text';
    Chart.defaults.global.defaultFontSize = 12;

    newChart[i] = new Chart(canvas, {
      type: 'line',
      data: {
        labels: times,
        datasets: [{
          label: '$',
          data: prices,
          backgroundColor: chartColor + '.07)',
          borderColor: chartColor+'.75)',
          borderWidth: 3,
          pointRadius: 0,
          pointHitRadius: 3,
          lineTension: .2,
        }]
      },

      options: {
        title: {
          display: false,
          fontSize: 35
        },

        legend: {
          display: false
        },

        layout: {
          padding: {
            left: -10,
            right: 0,
            top: 0,
            bottom: 0
          },
        },

        scales: {
          xAxes: [{
            display: false,
            gridLines: {}
          }],
          yAxes: [{
            display: true,
            gridLines: {
              display: true, 
              color: '#111', 
              // min: Math.min.apply(this, prices) - Math.abs(Math.min.apply(this, prices) * 1),
              // max: Math.max.apply(this, prices) + Math.abs(Math.max.apply(this, prices) * 1),
            },
                ticks: {
                  fontSize: 24,
                  fontColor: '#fff',
                  mirror: true,
                  callback: function (value, index, values){
                    if (index === values.length - 1) return ' $' + numberWithCommas(Math.min.apply(this, prices));
                      else if (index === 0) return ' $' + numberWithCommas(Math.max.apply(this, prices));
                      else return '';
                  }
              }
          }]
        },

        tooltips: {
          enabled: true,
          callbacks: {
          title: function(){}
           },
          displayColors: false,
          yPadding: 10,
          xPadding: 10,
          position: 'nearest',
          caretSize: 10,
          backgroundColor: 'rgba(255,255,255,.9)',
          bodyFontSize: 15,
          bodyFontColor: '#303030' 
        }
      }
    });
  }
}

const updatePrices = async (symbolIdx) => {
  
  let { times, prices } = await ChartData(symbols[symbolIdx])

  let chartPrice = document.getElementById('Chart' + symbolIdx + 'Price');
  let chartPriceDiff = document.getElementById('Chart' + symbolIdx + 'PriceDiff');
  let chartColor;

  let firstPrice = Array.from(prices)[0],
    lastPrice = Array.from(prices)[prices.length - 1],
    lowPrice = Math.max.apply(Math, prices),
    highPrice = Math.min.apply(Math, prices);

  if (firstPrice > lastPrice){
    chartColor = 'rgba(255,0,0,';
  } else {
    chartColor = 'rgba(0,255,0,';
  }
  newChart[symbolIdx].data.datasets[0].borderColor = chartColor + '.9)';
  newChart[symbolIdx].data.datasets[0].backgroundColor = chartColor + '.07)';

  let oldPrice = parseFloat(chartPrice.textContent.substring(1).replace(',', ''));
  let currentPrice = parseFloat(prices[prices.length - 1]).toFixed(6);

  if (Math.abs(parseFloat(currentPrice - oldPrice)).toString() == 'NaN'){
    return;
  }
  if (currentPrice - oldPrice != 0){
    chartPriceDiff.textContent = Math.abs(parseFloat(currentPrice - oldPrice).toFixed(6));
  }

  if (currentPrice > oldPrice && oldPrice !== ''){
    chartPrice.style.color = 'green';
    chartPriceDiff.style.color = 'green';
    chartPriceDiff.textContent = chartPriceDiff.textContent.replace(/^/, '+$');
  } else if (oldPrice > currentPrice && oldPrice !== ''){
    chartPrice.style.color = 'red';
    chartPriceDiff.style.color = 'red';
    chartPriceDiff.textContent = chartPriceDiff.textContent.replace(/^/, '-$');
  }

  if (prices.toString() != newChart[symbolIdx].data.datasets[0].data.toString()){
    newChart[symbolIdx].data.labels = times;
    newChart[symbolIdx].data.datasets.forEach((dataset) => {
      dataset.data = prices;
    });
    await updateChart(newChart[symbolIdx], symbolIdx)
    await newChart[symbolIdx].update();
  }
  chartPrice.innerHTML = "$" + numberWithCommas(parseFloat(currentPrice));
}

const updateChart = async (chart, symbolIdx) => {

  let { prices } = await ChartData(symbols[symbolIdx]);

  let xScale = chart.scales.x;
  let yScale = chart.scales.y;
  chart.options.scales = {
    newId: {
      display: true
    },
    y: {
      display: true,
      type: 'logarithmic',
      grid: {
        display: false,
      }
    },
    xAxes: [{
      display: false
    }],
    yAxes: [{
      display: true,
      gridLines: {
        display: true,
        color: '#111',
        min: Math.min.apply(this, prices) - Math.abs(Math.min.apply(this, prices) * .007),
        max: Math.max.apply(this, prices) + Math.abs(Math.max.apply(this, prices) * .007),
      },
      ticks: {
        fontSize: 24,
        fontColor: '#fff',
        mirror: true,
        callback: function (value, index, values){
          if (index === values.length - 1) return ' $' + numberWithCommas(Math.min.apply(this, prices));
          else if (index === 0) return ' $' + numberWithCommas(Math.max.apply(this, prices));
          else return '';
        }
      }
    }]
  };
  // await chart.update();
  xScale = chart.scales.newId;
  yScale = chart.scales.y;
}

document.addEventListener('DOMContentLoaded', async () => {
  
  symbols = getLocalStorageSymbols();

  populateSymbols();
  
  await renderCharts();

  document.getElementById('main-content').style.display = 'block';
  document.querySelector('.splash-loader').remove();

  setInterval(() => {
    document.querySelectorAll('.asset-price').forEach((val, idx) => {
      val.style.color = '#fff';
    })
  }, 3500)
  
  document.querySelectorAll('.chart-symbol').forEach(el => el.addEventListener('click', async (e) => {
    lastSymbol = e.target.textContent.toLowerCase();
  }))

  document.querySelectorAll('.chart-symbol').forEach(async el => el.addEventListener('keyup', async (e) => {
    
    if (e.key === 'Enter'){
      e.preventDefault();

      disableEditableContent();

      symbolInput = e.target.textContent.toLowerCase().trim();
      symbolIdx = symbols.indexOf(symbolInput);
      let validation = await validateSymbol(symbolInput);
      let lastsymbolIdx = symbols.indexOf(lastSymbol);

      e.target.textContent = symbolInput;

      if (symbolInput === lastSymbol){
        enableEditableContent();
        return;
      }

      if (validation === 404){
        enableEditableContent();
        document.getElementById('Chart' + lastsymbolIdx + 'Symbol').textContent = '\u00A0';
        document.getElementById('Chart' + lastsymbolIdx + 'Symbol').focus();
        alert('Symbol not found!');
        return;
      }

      if (symbols.includes(symbolInput)){
        enableEditableContent();
        document.getElementById('Chart' + lastsymbolIdx + 'Symbol').textContent = '\u00A0';
        document.getElementById('Chart' + lastsymbolIdx + 'Symbol').focus();
        alert("You cannot set multiple symbols of the same crypto.");
        return;
      }      

      symbolIdx = symbols.indexOf(lastSymbol);

      document.getElementById('Chart' + symbolIdx).style.visibility = 'hidden';
      document.getElementById('Chart' + symbolIdx + 'Loader').style.display = 'block';

      clearPriceData(symbolIdx);
      clearInterval(chartUpdateTimer);

      await symbols.splice(symbolIdx, 1, symbolInput);
      localStorage.setItem('_symbols', symbols);

      let { prices } = await ChartData(symbols[symbolIdx]);
      let currentPrice = parseFloat(prices[prices.length - 1]).toFixed(6);
      document.getElementById('Chart' + symbolIdx + 'Price').textContent = "$" + numberWithCommas(parseFloat(currentPrice));
      document.getElementById('Chart' + symbolIdx + 'PriceDiff').textContent = '\u00A0';
      populateSymbols();
      await updatePrices(symbolIdx);

      document.getElementById('Chart' + symbolIdx).style.visibility = 'visible';
      document.getElementById('Chart' + symbolIdx + 'Loader').style.display = 'none';

      symbols = getLocalStorageSymbols();
      enableEditableContent();

      setTimeout(() => {
        chartUpdateTimer = setInterval(async () => {
          for (let i = 1; i < symbols.length; i++){
            await updatePrices(i);
          }
        }, 5000)
      }, 1000)
    }
  }))

  chartUpdateTimer = setInterval(async () => {
    for (let i = 1; i < symbols.length; i++){
      await updatePrices(i);
    }
  }, 5000)

})
