var ChartManager = (function () {
  var mainChart = null;
  var rsiChart = null;

  var darkTheme = {
    backgroundColor: 'transparent',
    textStyle: { color: '#6a7282', fontFamily: 'JetBrains Mono, monospace' },
    title: { textStyle: { color: '#c0c8d8', fontSize: 13, fontWeight: 600 } },
    grid: {
      top: 40, right: 16, bottom: 24, left: 60,
      borderColor: 'rgba(255,255,255,0.04)'
    },
    xAxis: {
      type: 'category',
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
      axisTick: { show: false },
      axisLabel: { color: '#4a5568', fontSize: 10, interval: 59 },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#4a5568', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.03)' } }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(10,14,23,0.95)',
      borderColor: 'rgba(18,181,197,0.15)',
      borderWidth: 1,
      textStyle: { color: '#c0c8d8', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' },
      axisPointer: { lineStyle: { color: 'rgba(18,181,197,0.10)' } }
    },
    dataZoom: [{
      type: 'inside',
      start: 0,
      end: 100,
      zoomLock: false
    }],
    animation: true,
    animationDuration: 600,
    animationEasing: 'cubicOut'
  };

  function initMainChart(dom) {
    mainChart = echarts.init(dom, null, { renderer: 'canvas' });
    window.addEventListener('resize', function () { mainChart && mainChart.resize(); });
    return mainChart;
  }

  function initRsiChart(dom) {
    rsiChart = echarts.init(dom, null, { renderer: 'canvas' });
    window.addEventListener('resize', function () { rsiChart && rsiChart.resize(); });
    return rsiChart;
  }

  function updateMainChart(dates, prices, boll, equity) {
    if (!mainChart) return;

    var priceData = prices.map(function (p, i) { return [dates[i], p]; });
    var upperData = boll.upper.map(function (v, i) { return v !== null ? [dates[i], v] : null; }).filter(Boolean);
    var lowerData = boll.lower.map(function (v, i) { return v !== null ? [dates[i], v] : null; }).filter(Boolean);
    var midData = boll.mid.map(function (v, i) { return v !== null ? [dates[i], v] : null; }).filter(Boolean);

    var option = JSON.parse(JSON.stringify(darkTheme));
    option.grid.top = 40;
    option.grid.bottom = 24;
    option.legend = {
      data: ['价格', 'BOLL上轨', 'BOLL下轨', 'BOLL中轨', '策略净值'],
      top: 6,
      textStyle: { color: '#6a7282', fontSize: 11 },
      itemWidth: 14,
      itemHeight: 2
    };
    option.yAxis = [
      {
        type: 'value', scale: true,
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: '#6a7282', fontSize: 10, formatter: function (v) { return '$' + v.toLocaleString(); } },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.03)' } }
      },
      {
        type: 'value', scale: true,
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: '#b0a67d', fontSize: 10, formatter: function (v) { return '$' + v.toLocaleString(undefined, { maximumFractionDigits: 0 }); } },
        splitLine: { show: false }
      }
    ];
    option.series = [
      {
        name: '价格', type: 'line', data: priceData, symbol: 'none',
        lineStyle: { color: '#12b5c5', width: 1.5 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(18,181,197,0.08)' },
            { offset: 1, color: 'rgba(18,181,197,0)' }
          ])
        }
      },
      {
        name: 'BOLL上轨', type: 'line', data: upperData, symbol: 'none',
        lineStyle: { color: 'rgba(46,125,50,0.40)', width: 1, type: 'dashed',
          shadowColor: 'rgba(46,125,50,0.25)', shadowBlur: 4 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(46,125,50,0.02)' },
            { offset: 0.5, color: 'rgba(46,125,50,0)' },
            { offset: 1, color: 'rgba(46,125,50,0.02)' }
          ])
        }
      },
      {
        name: 'BOLL下轨', type: 'line', data: lowerData, symbol: 'none',
        lineStyle: { color: 'rgba(46,125,50,0.40)', width: 1, type: 'dashed',
          shadowColor: 'rgba(46,125,50,0.25)', shadowBlur: 4 }
      },
      {
        name: 'BOLL中轨', type: 'line', data: midData, symbol: 'none',
        lineStyle: { color: 'rgba(169,68,66,0.50)', width: 1, type: 'dotted' }
      },
      {
        name: '策略净值', type: 'line', yAxisIndex: 1, symbol: 'none',
        data: equity.map(function (v, i) { return [dates[i], v]; }),
        lineStyle: { color: '#b0a67d', width: 1.8 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(176,166,125,0.06)' },
            { offset: 1, color: 'rgba(176,166,125,0)' }
          ])
        }
      }
    ];

    mainChart.setOption(option, true);
  }

  function updateRsiChart(dates, rsi, overbought, oversold) {
    if (!rsiChart) return;

    var rsiData = rsi.map(function (v, i) { return v !== null ? [dates[i], v] : null; }).filter(Boolean);
    var obLine = dates.map(function (d) { return [d, overbought]; });
    var osLine = dates.map(function (d) { return [d, oversold]; });

    var option = JSON.parse(JSON.stringify(darkTheme));
    option.grid.top = 28;
    option.grid.bottom = 24;
    option.yAxis = {
      type: 'value',
      min: 0,
      max: 100,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#4a5568', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.03)' } }
    };
    option.legend = {
      data: ['RSI', '超买', '超卖'],
      top: 4,
      textStyle: { color: '#6a7282', fontSize: 10 },
      itemWidth: 14,
      itemHeight: 2
    };
    option.series = [
      {
        name: 'RSI',
        type: 'line',
        data: rsiData,
        symbol: 'none',
        lineStyle: { color: '#b0a67d', width: 1.2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(176,166,125,0.06)' },
            { offset: 1, color: 'rgba(176,166,125,0)' }
          ])
        }
      },
      {
        name: '超买',
        type: 'line',
        data: obLine,
        symbol: 'none',
        lineStyle: { color: 'rgba(129,48,48,0.50)', width: 1, type: 'dashed' }
      },
      {
        name: '超卖',
        type: 'line',
        data: osLine,
        symbol: 'none',
        lineStyle: { color: 'rgba(129,48,48,0.50)', width: 1, type: 'dashed' }
      }
    ];

    rsiChart.setOption(option, true);
  }

  function resize() {
    mainChart && mainChart.resize();
    rsiChart && rsiChart.resize();
  }

  return {
    initMainChart: initMainChart,
    initRsiChart: initRsiChart,
    updateMainChart: updateMainChart,
    updateRsiChart: updateRsiChart,
    resize: resize
  };
})();
