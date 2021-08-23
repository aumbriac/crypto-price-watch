let newChart = [];
let symbolInput,
  symbolIndex;

const imageUri = 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@d5c68edec1f5eaec59ac77ff2b48144679cebca1/128/color/';

const getLocalStorageSymbols = () => {
  if (localStorage.getItem('_symbols') === null){
    localStorage.setItem('_symbols', [0, 'btc', 'eth', 'doge', 'ada', 'sol', 'algo'])
  }
  return localStorage.getItem('_symbols').split(',');
}

const numberWithCommas = n => {
  return n.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
}

const rgbaToHex = (r, g, b, a) => {
  if (r > 255 || g > 255 || b > 255 || a > 255) {
    return '';
  }
  return (256 + r).toString(16).substr(1) + ((1 << 24) + (g << 16) | (b << 8) | a).toString(16).substr(1);
}

const hexToRgba = c => {
  if (/^#([a-f0-9]{3}){1,2}$/.test(c)) {
    if (c.length == 4) {
      c = '#' + [c[1], c[1], c[2], c[2], c[3], c[3]].join('');
    }
    c = '0x' + c.substring(1);
    return 'rgb(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + '';
  }
  return '';
}

const populateSymbols = () => {
  for (let i = 1; i < symbols.length; i++){
    document.getElementById('Chart' + i + 'Image').src = imageUri + symbols[i] + ".png";
    document.getElementById('Chart' + i + 'Symbol').innerText = symbols[i].toUpperCase();
  }
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

async function renderChart() {

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
                  callback: function (value, index, values) {
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
          title: function() {}
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

const updateChart = async (symbolIndex) => {
  
  let { times, prices } = await ChartData(symbols[symbolIndex])

  let chartPrice = document.getElementById('Chart' + symbolIndex + 'Price');
  let chartPriceDiff = document.getElementById('Chart' + symbolIndex + 'PriceDiff');

  let chartColor;

  let firstPrice = Array.from(prices)[0],
    lastPrice = Array.from(prices)[prices.length - 1],
    lowPrice = Math.max.apply(Math, prices),
    highPrice = Math.min.apply(Math, prices);

  if (firstPrice > lastPrice) {
    chartColor = 'rgba(255,0,0,';
  } else {
    chartColor = 'rgba(0,255,0,';
  }
  newChart[symbolIndex].data.datasets[0].borderColor = chartColor + '.9)';
  newChart[symbolIndex].data.datasets[0].backgroundColor = chartColor + '.07)';

  let oldPrice = parseFloat(chartPrice.textContent.substring(1).replace(',', ''));
  let currentPrice = parseFloat(prices[prices.length - 1]).toFixed(6);

  if (Math.abs(parseFloat(currentPrice - oldPrice)).toString() == 'NaN') {
    return;
  }
  if (currentPrice - oldPrice != 0) {
    chartPriceDiff.textContent = Math.abs(parseFloat(currentPrice - oldPrice).toFixed(6));
  }

  if (currentPrice > oldPrice && oldPrice !== '') {
    chartPrice.style.color = 'green';
    chartPriceDiff.style.color = 'green';
    chartPriceDiff.textContent = chartPriceDiff.textContent.replace(/^/, '+$');
  } else if (oldPrice > currentPrice && oldPrice !== '') {
    chartPrice.style.color = 'red';
    chartPriceDiff.style.color = 'red';
    chartPriceDiff.textContent = chartPriceDiff.textContent.replace(/^/, '-$');
  }

  if (prices.toString() != newChart[symbolIndex].data.datasets[0].data.toString()) {
    newChart[symbolIndex].data.labels = times;
    newChart[symbolIndex].data.datasets.forEach((dataset) => {
      dataset.data = prices;
    });
    await updateScales(newChart[symbolIndex], symbolIndex)
    await newChart[symbolIndex].update();
  }

  chartPrice.innerHTML = "$" + numberWithCommas(parseFloat(currentPrice));

}

const updateScales = async (chart, symbolIndex) => {
  let { prices } = await ChartData(symbols[symbolIndex]);

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
        callback: function (value, index, values) {
          if (index === values.length - 1) return ' $' + numberWithCommas(Math.min.apply(this, prices));
          else if (index === 0) return ' $' + numberWithCommas(Math.max.apply(this, prices));
          else return '';
        }
      }
    }]
  };
  await chart.update();
  xScale = chart.scales.newId;
  yScale = chart.scales.y;
}


let chartUpdateTimer;

document.addEventListener('DOMContentLoaded', async () => {
  
  symbols = getLocalStorageSymbols();

  populateSymbols();
  
  await renderChart()
  // await updateChart();
  document.getElementById('main-content').style.display = 'block';
  $('.loader').remove();
  

  setInterval(() => {
    document.querySelectorAll('.asset-price').forEach((val, idx) => {
      val.style.color = '#fff';
    })
  }, 3500)

  $('.chart-symbol').click((e) => {
    symbolInput = $(e.target).text().toLowerCase();
    symbolIndex = symbols.indexOf(symbolInput);
  })
  $('.chart-symbol').keyup(async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      $('.chart-symbol').attr('contenteditable', false);

      clearInterval(chartUpdateTimer)

      symbolInput = $(e.target).text().toLowerCase();
      $(e.target).text(symbolInput.trim())
      symbols.splice(symbolIndex, 1, symbolInput);
      localStorage.setItem('_symbols', [...symbols]);

      $('#Chart' + symbolIndex).css('visibility', 'hidden');
      $('#Chart' + symbolIndex + 'Loader').show();

      let { prices } = await ChartData(symbols[symbolIndex])
      let currentPrice = parseFloat(prices[prices.length - 1]).toFixed(6);
      document.getElementById('Chart' + symbolIndex + 'Price').textContent = "$" + numberWithCommas(parseFloat(currentPrice));
      document.getElementById('Chart' + symbolIndex + 'PriceDiff').textContent = '\u00A0';
      populateSymbols()
      await updateChart(symbolIndex)

      $('#loading').remove();
      $('#Chart' + symbolIndex).css('visibility', 'visible');
      $('.chart-symbol').attr('contenteditable', true);
      $('#Chart' + symbolIndex + 'Loader').hide();
      setTimeout(() => {
        chartUpdateTimer = setInterval(async () => {
          for (let i = 1; i < symbols.length; i++) {
            await updateChart(i)
          }
        }, 5000)
      }, 1000)
    }
  })

  chartUpdateTimer = setInterval(async () => {
    for (let i = 1; i < symbols.length; i++) {
      await updateChart(i)
    }
  }, 5000)
})