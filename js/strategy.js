var Strategy = (function () {

  function calcMA(prices, period) {
    var result = [];
    for (var i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        result.push(null);
        continue;
      }
      var sum = 0;
      for (var j = i - period + 1; j <= i; j++) {
        sum += prices[j];
      }
      result.push(sum / period);
    }
    return result;
  }

  function calcRSI(prices, period) {
    var result = [];
    var gains = 0;
    var losses = 0;

    result.push(null);

    for (var i = 1; i < prices.length; i++) {
      var change = prices[i] - prices[i - 1];
      if (i <= period) {
        if (change > 0) gains += change;
        else losses -= change;
        if (i < period) {
          result.push(null);
          continue;
        }
        var avgGain = gains / period;
        var avgLoss = losses / period;
      } else {
        var gain = change > 0 ? change : 0;
        var loss = change < 0 ? -change : 0;
        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;
      }

      if (avgLoss === 0) {
        result.push(100);
      } else {
        var rs = avgGain / avgLoss;
        result.push(100 - 100 / (1 + rs));
      }
    }
    return result;
  }

  function runBacktest(opts) {
    var prices = opts.prices;
    var maPeriod = opts.maPeriod;
    var rsiOverbought = opts.rsiOverbought;
    var rsiOversold = opts.rsiOversold;
    var leverage = opts.leverage;
    var initialCapital = 10000;

    var ma = calcMA(prices, maPeriod);
    var rsi = calcRSI(prices, 14);

    var equity = [initialCapital];
    var capital = initialCapital;
    var inPosition = false;
    var entryPrice = 0;
    var trades = [];
    var peak = initialCapital;
    var maxDrawdown = 0;

    for (var i = 1; i < prices.length; i++) {
      if (ma[i] === null || rsi[i] === null) {
        equity.push(capital);
        continue;
      }

      var prevMA = ma[i - 1];
      var currMA = ma[i];
      var prevPrice = prices[i - 1];
      var currPrice = prices[i];
      var currRSI = rsi[i];

      if (!inPosition) {
        if (prevPrice <= prevMA && currPrice > currMA && currRSI < rsiOversold) {
          inPosition = true;
          entryPrice = currPrice;
        }
      } else {
        var pnl = ((currPrice - entryPrice) / entryPrice) * leverage;
        var exitSignal = false;

        if (prevPrice >= prevMA && currPrice < currMA) exitSignal = true;
        if (currRSI > rsiOverbought) exitSignal = true;

        if (exitSignal) {
          var tradeReturn = pnl;
          capital = capital * (1 + tradeReturn);
          trades.push({
            entry: entryPrice,
            exit: currPrice,
            return: tradeReturn,
            pnl: capital - (capital / (1 + tradeReturn))
          });
          inPosition = false;
        }
      }

      if (inPosition && entryPrice > 0) {
        var unrealized = ((currPrice - entryPrice) / entryPrice) * leverage;
        equity.push(capital * (1 + unrealized));
      } else {
        equity.push(capital);
      }

      if (equity[equity.length - 1] > peak) peak = equity[equity.length - 1];
      var dd = (peak - equity[equity.length - 1]) / peak;
      if (dd > maxDrawdown) maxDrawdown = dd;
    }

    var finalEquity = equity[equity.length - 1];
    var totalReturn = (finalEquity - initialCapital) / initialCapital;
    var winTrades = trades.filter(function (t) { return t.return > 0; });
    var winRate = trades.length > 0 ? winTrades.length / trades.length : 0;

    var dailyReturns = [];
    for (var d = 1; d < equity.length; d++) {
      dailyReturns.push((equity[d] - equity[d - 1]) / equity[d - 1]);
    }
    var meanReturn = dailyReturns.reduce(function (a, b) { return a + b; }, 0) / dailyReturns.length;
    var variance = dailyReturns.reduce(function (s, r) { return s + Math.pow(r - meanReturn, 2); }, 0) / dailyReturns.length;
    var stdReturn = Math.sqrt(variance);
    var sharpe = stdReturn > 0 ? (meanReturn / stdReturn) * Math.sqrt(252) : 0;

    return {
      equity: equity,
      ma: ma,
      rsi: rsi,
      trades: trades,
      metrics: {
        totalReturn: totalReturn,
        winRate: winRate,
        maxDrawdown: maxDrawdown,
        sharpe: sharpe,
        totalTrades: trades.length,
        finalEquity: finalEquity
      }
    };
  }

  return {
    calcMA: calcMA,
    calcRSI: calcRSI,
    runBacktest: runBacktest
  };
})();
