var MockData = (function () {
  function seededRandom(seed) {
    var s = seed;
    return function () {
      s = (s * 16807 + 0) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  function gaussianRandom(rng) {
    var u1 = rng();
    var u2 = rng();
    while (u1 === 0) u1 = rng();
    return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  }

  function generatePriceSeries(config) {
    var rng = seededRandom(config.seed);
    var prices = [config.startPrice];
    var volatility = config.baseVol;
    var trend = 0;

    var events = config.events || [];

    for (var i = 1; i < config.days; i++) {
      var eventActive = false;
      for (var e = 0; e < events.length; e++) {
        if (i >= events[e].start && i <= events[e].end) {
          volatility = config.baseVol * events[e].volMult;
          trend = events[e].trend;
          eventActive = true;
          break;
        }
      }
      if (!eventActive) {
        volatility += (config.baseVol - volatility) * 0.05;
        trend *= 0.97;
      }

      var volOfVol = 1 + Math.abs(gaussianRandom(rng)) * 0.3;
      var dailyVol = volatility * volOfVol;
      var shock = gaussianRandom(rng) * dailyVol + trend;
      var newPrice = prices[i - 1] * (1 + shock);
      newPrice = Math.max(newPrice, config.startPrice * 0.15);
      prices.push(parseFloat(newPrice.toFixed(2)));
    }
    return prices;
  }

  function generateDates(days) {
    var dates = [];
    var start = new Date('2024-06-01');
    for (var i = 0; i < days; i++) {
      var d = new Date(start);
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }

  var DAYS = 365;
  var dates = generateDates(DAYS);

  var btcPrices = generatePriceSeries({
    seed: 42,
    startPrice: 42150,
    baseVol: 0.022,
    days: DAYS,
    events: [
      { start: 15, end: 80, volMult: 1.4, trend: 0.004 },
      { start: 85, end: 110, volMult: 2.2, trend: -0.008 },
      { start: 130, end: 155, volMult: 3.5, trend: -0.015 },
      { start: 155, end: 165, volMult: 5.0, trend: -0.035 },
      { start: 165, end: 200, volMult: 2.0, trend: 0.006 },
      { start: 210, end: 275, volMult: 1.6, trend: 0.005 },
      { start: 280, end: 310, volMult: 2.8, trend: -0.007 },
      { start: 320, end: 345, volMult: 1.3, trend: 0.002 },
      { start: 350, end: 365, volMult: 1.8, trend: -0.004 }
    ]
  });

  var ethPrices = generatePriceSeries({
    seed: 137,
    startPrice: 2280,
    baseVol: 0.028,
    days: DAYS,
    events: [
      { start: 15, end: 80, volMult: 1.5, trend: 0.005 },
      { start: 85, end: 115, volMult: 2.4, trend: -0.010 },
      { start: 130, end: 160, volMult: 3.8, trend: -0.018 },
      { start: 155, end: 168, volMult: 5.5, trend: -0.042 },
      { start: 168, end: 205, volMult: 2.2, trend: 0.008 },
      { start: 210, end: 275, volMult: 1.7, trend: 0.006 },
      { start: 280, end: 315, volMult: 3.0, trend: -0.009 },
      { start: 320, end: 350, volMult: 1.4, trend: 0.003 },
      { start: 352, end: 365, volMult: 2.0, trend: -0.005 }
    ]
  });

  var solPrices = generatePriceSeries({
    seed: 999,
    startPrice: 105,
    baseVol: 0.038,
    days: DAYS,
    events: [
      { start: 10, end: 75, volMult: 1.8, trend: 0.007 },
      { start: 80, end: 120, volMult: 3.0, trend: -0.014 },
      { start: 125, end: 155, volMult: 4.5, trend: -0.022 },
      { start: 150, end: 168, volMult: 6.5, trend: -0.050 },
      { start: 168, end: 210, volMult: 2.8, trend: 0.010 },
      { start: 215, end: 280, volMult: 2.0, trend: 0.008 },
      { start: 285, end: 320, volMult: 3.5, trend: -0.012 },
      { start: 325, end: 355, volMult: 1.6, trend: 0.004 },
      { start: 355, end: 365, volMult: 2.5, trend: -0.008 }
    ]
  });

  var data = {
    BTC: { label: 'BTC / USDT', prices: btcPrices, dates: dates },
    ETH: { label: 'ETH / USDT', prices: ethPrices, dates: dates },
    SOL: { label: 'SOL / USDT', prices: solPrices, dates: dates }
  };

  return {
    get: function (token) { return data[token] || data.BTC; },
    tokens: function () { return Object.keys(data); }
  };
})();
