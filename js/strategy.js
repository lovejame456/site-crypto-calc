var Strategy = (function () {

  function calcMA(prices, period) {
    var result = [];
    for (var i = 0; i < prices.length; i++) {
      if (i < period - 1) { result.push(null); continue; }
      var sum = 0;
      for (var j = i - period + 1; j <= i; j++) sum += prices[j];
      result.push(sum / period);
    }
    return result;
  }

  function calcEMA(values, period) {
    var result = [values[0]];
    var k = 2 / (period + 1);
    for (var i = 1; i < values.length; i++) {
      result.push(values[i] * k + result[i - 1] * (1 - k));
    }
    return result;
  }

  function calcBOLL(prices, period) {
    var mid = calcMA(prices, period);
    var upper = [];
    var lower = [];
    for (var i = 0; i < prices.length; i++) {
      if (mid[i] === null) { upper.push(null); lower.push(null); continue; }
      var sumSq = 0;
      for (var j = i - period + 1; j <= i; j++) sumSq += Math.pow(prices[j] - mid[i], 2);
      var std = Math.sqrt(sumSq / period);
      upper.push(mid[i] + 2 * std);
      lower.push(mid[i] - 2 * std);
    }
    return { upper: upper, mid: mid, lower: lower };
  }

  function calcRSI(prices, period) {
    var result = [];
    var gains = 0, losses = 0, avgGain = 0, avgLoss = 0;
    result.push(null);
    for (var i = 1; i < prices.length; i++) {
      var change = prices[i] - prices[i - 1];
      if (i <= period) {
        if (change > 0) gains += change; else losses -= change;
        if (i < period) { result.push(null); continue; }
        avgGain = gains / period;
        avgLoss = losses / period;
      } else {
        avgGain = (avgGain * (period - 1) + (change > 0 ? change : 0)) / period;
        avgLoss = (avgLoss * (period - 1) + (change < 0 ? -change : 0)) / period;
      }
      result.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
    }
    return result;
  }

  function calcMACD(prices, fast, slow, signal) {
    var emaFast = calcEMA(prices, fast);
    var emaSlow = calcEMA(prices, slow);
    var dif = emaFast.map(function (v, i) { return v - emaSlow[i]; });
    var dea = calcEMA(dif, signal);
    var histogram = dif.map(function (v, i) { return (v - dea[i]) * 2; });
    return { dif: dif, dea: dea, histogram: histogram };
  }

  function calcATR(highs, lows, closes, period) {
    var tr = [highs[0] - lows[0]];
    for (var i = 1; i < highs.length; i++) {
      tr.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1])));
    }
    var atr = [];
    var sum = 0;
    for (var j = 0; j < tr.length; j++) {
      if (j < period) {
        sum += tr[j];
        atr.push(j === period - 1 ? sum / period : null);
      } else {
        atr.push((atr[j - 1] * (period - 1) + tr[j]) / period);
      }
    }
    return atr;
  }

  function fmtDate(dates, i) {
    if (!dates || !dates[i]) return '#' + i;
    var s = dates[i];
    return s.length > 10 ? s.substring(5, 16) : s;
  }

  function fmtPrice(p) {
    if (p >= 1000) return Math.round(p).toLocaleString();
    if (p >= 1) return p.toFixed(2);
    return p.toFixed(6);
  }

  function runBacktest(opts) {
    var prices = opts.prices;
    var highs = opts.highs || prices;
    var lows = opts.lows || prices;
    var dates = opts.dates || [];
    var bollPeriod = opts.maPeriod;
    var rsiOverbought = opts.rsiOverbought;
    var rsiOversold = opts.rsiOversold;
    var leverage = opts.leverage;
    var atrMultiplier = opts.atrMultiplier || 2;
    var initialCapital = opts.initialCapital || 10000;

    var boll = calcBOLL(prices, bollPeriod);
    var rsi = calcRSI(prices, 14);
    var macd = calcMACD(prices, 12, 26, 9);
    var atr = calcATR(highs, lows, prices, 14);

    var equity = [initialCapital];
    var capital = initialCapital;
    var inPosition = false;
    var entryPrice = 0;
    var entryBar = 0;
    var stopPrice = 0;
    var trades = [];
    var log = [];
    var peak = initialCapital;
    var maxDrawdown = 0;
    var atrStopCount = 0;
    var warmup = Math.max(bollPeriod, 27, 15) + 1;

    for (var i = 1; i < prices.length; i++) {
      var hasData = boll.upper[i] !== null && rsi[i] !== null && macd.histogram[i] !== null && atr[i] !== null;
      if (!hasData || i < warmup) { equity.push(capital); continue; }

      var price = prices[i];
      var low = lows[i];
      var bollUpper = boll.upper[i];
      var bollLower = boll.lower[i];
      var rsiVal = rsi[i];
      var macdHist = macd.histogram[i];
      var prevMacdHist = macd.histogram[i - 1];
      var atrVal = atr[i];

      if (!inPosition) {
        var lookback = 3;
        var belowLower = false;
        var rsiOversoldSignal = false;
        for (var lb = 0; lb <= lookback && (i - lb) >= warmup; lb++) {
          if (prices[i - lb] < boll.lower[i - lb]) belowLower = true;
          if (rsi[i - lb] < rsiOversold) rsiOversoldSignal = true;
        }
        var momentumReversal = prevMacdHist !== null && macdHist > prevMacdHist;
        if (belowLower && rsiOversoldSignal && momentumReversal) {
          inPosition = true;
          entryPrice = price;
          entryBar = i;
          stopPrice = price - atrMultiplier * atrVal;
          log.push({ type: 'open', date: fmtDate(dates, i), price: price, signals: (belowLower ? 'BOLL Lower Break ' : '') + (rsiOversoldSignal ? 'RSI Oversold ' : '') + (momentumReversal ? 'MACD Momentum Reversal' : '') });
        }
      }

      if (inPosition) {
        if (low <= stopPrice) {
          var pnlStop = ((stopPrice - entryPrice) / entryPrice) * leverage;
          capital = capital * (1 + pnlStop);
          trades.push({ entry: entryPrice, exit: stopPrice, return: pnlStop, reason: 'ATR_STOP' });
          log.push({ type: 'close-loss', date: fmtDate(dates, i), price: stopPrice, pnl: pnlStop, reason: 'ATR Stop-loss Triggered' });
          atrStopCount++;
          inPosition = false;
        } else if (price >= bollUpper || rsiVal > rsiOverbought) {
          var pnlTarget = ((price - entryPrice) / entryPrice) * leverage;
          capital = capital * (1 + pnlTarget);
          var exitReason = price >= bollUpper ? 'BOLL Upper Band Hit' : 'RSI Overbought';
          trades.push({ entry: entryPrice, exit: price, return: pnlTarget, reason: 'TARGET' });
          log.push({ type: pnlTarget >= 0 ? 'close-win' : 'close-loss', date: fmtDate(dates, i), price: price, pnl: pnlTarget, reason: exitReason });
          inPosition = false;
        } else {
          var newStop = price - atrMultiplier * atrVal;
          if (newStop > stopPrice) stopPrice = newStop;
        }
      }

      if (inPosition && entryPrice > 0) {
        equity.push(capital * (1 + ((price - entryPrice) / entryPrice) * leverage));
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
    for (var d = 1; d < equity.length; d++) dailyReturns.push((equity[d] - equity[d - 1]) / equity[d - 1]);
    var meanReturn = dailyReturns.reduce(function (a, b) { return a + b; }, 0) / dailyReturns.length;
    var variance = dailyReturns.reduce(function (s, r) { return s + Math.pow(r - meanReturn, 2); }, 0) / dailyReturns.length;
    var stdReturn = Math.sqrt(variance);
    var sharpe = stdReturn > 0 ? (meanReturn / stdReturn) * Math.sqrt(252) : 0;

    return {
      equity: equity, boll: boll, rsi: rsi, macd: macd, atr: atr, trades: trades, log: log,
      metrics: {
        totalReturn: totalReturn, winRate: winRate, maxDrawdown: maxDrawdown,
        sharpe: sharpe, totalTrades: trades.length, finalEquity: finalEquity,
        atrStopCount: atrStopCount, winTrades: winTrades.length
      }
    };
  }

  function runBacktestMACross(opts) {
    var prices = opts.prices;
    var highs = opts.highs || prices;
    var lows = opts.lows || prices;
    var dates = opts.dates || [];
    var shortPeriod = Math.max(5, Math.floor(opts.maPeriod / 2));
    var longPeriod = opts.maPeriod;
    var leverage = opts.leverage;
    var atrMultiplier = opts.atrMultiplier || 2;
    var initialCapital = opts.initialCapital || 10000;

    var shortMA = calcMA(prices, shortPeriod);
    var longMA = calcMA(prices, longPeriod);
    var atr = calcATR(highs, lows, prices, 14);

    var equity = [initialCapital];
    var capital = initialCapital;
    var inPosition = false;
    var entryPrice = 0;
    var stopPrice = 0;
    var trades = [];
    var log = [];
    var peak = initialCapital;
    var maxDrawdown = 0;
    var atrStopCount = 0;
    var warmup = longPeriod + 1;

    for (var i = 1; i < prices.length; i++) {
      if (shortMA[i] === null || longMA[i] === null || atr[i] === null || i < warmup) {
        equity.push(capital);
        continue;
      }

      var price = prices[i];
      var low = lows[i];

      if (!inPosition) {
        var goldenCross = shortMA[i] > longMA[i] && shortMA[i - 1] <= longMA[i - 1];
        if (goldenCross) {
          inPosition = true;
          entryPrice = price;
          stopPrice = price - atrMultiplier * atr[i];
          log.push({ type: 'open', date: fmtDate(dates, i), price: price, signals: 'MA' + shortPeriod + ' Golden Cross MA' + longPeriod });
        }
      }

      if (inPosition) {
        if (low <= stopPrice) {
          var pnlStop = ((stopPrice - entryPrice) / entryPrice) * leverage;
          capital = capital * (1 + pnlStop);
          trades.push({ entry: entryPrice, exit: stopPrice, return: pnlStop, reason: 'ATR_STOP' });
          log.push({ type: 'close-loss', date: fmtDate(dates, i), price: stopPrice, pnl: pnlStop, reason: 'ATR Stop-loss Triggered' });
          atrStopCount++;
          inPosition = false;
        } else {
          var deathCross = shortMA[i] < longMA[i] && shortMA[i - 1] >= longMA[i - 1];
          if (deathCross) {
            var pnlExit = ((price - entryPrice) / entryPrice) * leverage;
            capital = capital * (1 + pnlExit);
            trades.push({ entry: entryPrice, exit: price, return: pnlExit, reason: 'DEATH_CROSS' });
            log.push({ type: pnlExit >= 0 ? 'close-win' : 'close-loss', date: fmtDate(dates, i), price: price, pnl: pnlExit, reason: 'MA' + shortPeriod + ' Death Cross MA' + longPeriod });
            inPosition = false;
          } else {
            var newStop = price - atrMultiplier * atr[i];
            if (newStop > stopPrice) stopPrice = newStop;
          }
        }
      }

      if (inPosition && entryPrice > 0) {
        equity.push(capital * (1 + ((price - entryPrice) / entryPrice) * leverage));
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
    for (var d = 1; d < equity.length; d++) dailyReturns.push((equity[d] - equity[d - 1]) / equity[d - 1]);
    var meanReturn = dailyReturns.reduce(function (a, b) { return a + b; }, 0) / dailyReturns.length;
    var variance = dailyReturns.reduce(function (s, r) { return s + Math.pow(r - meanReturn, 2); }, 0) / dailyReturns.length;
    var stdReturn = Math.sqrt(variance);
    var sharpe = stdReturn > 0 ? (meanReturn / stdReturn) * Math.sqrt(252) : 0;

    var boll = calcBOLL(prices, longPeriod);
    var rsi = calcRSI(prices, 14);
    var macd = calcMACD(prices, 12, 26, 9);

    return {
      equity: equity, boll: boll, rsi: rsi, macd: macd, atr: atr, trades: trades, log: log,
      metrics: {
        totalReturn: totalReturn, winRate: winRate, maxDrawdown: maxDrawdown,
        sharpe: sharpe, totalTrades: trades.length, finalEquity: finalEquity,
        atrStopCount: atrStopCount, winTrades: winTrades.length
      }
    };
  }

  function runBacktestRSIRev(opts) {
    var prices = opts.prices;
    var highs = opts.highs || prices;
    var lows = opts.lows || prices;
    var dates = opts.dates || [];
    var rsiOverbought = opts.rsiOverbought;
    var rsiOversold = opts.rsiOversold;
    var leverage = opts.leverage;
    var atrMultiplier = opts.atrMultiplier || 2;
    var initialCapital = opts.initialCapital || 10000;

    var rsi = calcRSI(prices, 14);
    var atr = calcATR(highs, lows, prices, 14);
    var maFilter = calcMA(prices, opts.maPeriod || 20);

    var equity = [initialCapital];
    var capital = initialCapital;
    var inPosition = false;
    var entryPrice = 0;
    var stopPrice = 0;
    var trades = [];
    var log = [];
    var peak = initialCapital;
    var maxDrawdown = 0;
    var atrStopCount = 0;
    var warmup = 15;

    for (var i = 1; i < prices.length; i++) {
      if (rsi[i] === null || atr[i] === null || i < warmup) {
        equity.push(capital);
        continue;
      }

      var price = prices[i];
      var low = lows[i];
      var rsiVal = rsi[i];
      var prevRsi = rsi[i - 1];

      if (!inPosition) {
        var oversoldBounce = prevRsi < rsiOversold && rsiVal >= rsiOversold;
        var deepOversold = rsiVal < rsiOversold * 0.7;
        if (oversoldBounce || deepOversold) {
          inPosition = true;
          entryPrice = price;
          stopPrice = price - atrMultiplier * atr[i];
          var signalDesc = oversoldBounce ? 'RSI Oversold Bounce(' + prevRsi.toFixed(1) + '→' + rsiVal.toFixed(1) + ')' : 'RSI Deep Oversold(' + rsiVal.toFixed(1) + ')';
          log.push({ type: 'open', date: fmtDate(dates, i), price: price, signals: signalDesc });
        }
      }

      if (inPosition) {
        if (low <= stopPrice) {
          var pnlStop = ((stopPrice - entryPrice) / entryPrice) * leverage;
          capital = capital * (1 + pnlStop);
          trades.push({ entry: entryPrice, exit: stopPrice, return: pnlStop, reason: 'ATR_STOP' });
          log.push({ type: 'close-loss', date: fmtDate(dates, i), price: stopPrice, pnl: pnlStop, reason: 'ATR Stop-loss Triggered' });
          atrStopCount++;
          inPosition = false;
        } else if (rsiVal > rsiOverbought) {
          var pnlTarget = ((price - entryPrice) / entryPrice) * leverage;
          capital = capital * (1 + pnlTarget);
          trades.push({ entry: entryPrice, exit: price, return: pnlTarget, reason: 'OVERBOUGHT' });
          log.push({ type: pnlTarget >= 0 ? 'close-win' : 'close-loss', date: fmtDate(dates, i), price: price, pnl: pnlTarget, reason: 'RSI Overbought Exit(' + rsiVal.toFixed(1) + ')' });
          inPosition = false;
        } else {
          var newStop = price - atrMultiplier * atr[i];
          if (newStop > stopPrice) stopPrice = newStop;
        }
      }

      if (inPosition && entryPrice > 0) {
        equity.push(capital * (1 + ((price - entryPrice) / entryPrice) * leverage));
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
    for (var d = 1; d < equity.length; d++) dailyReturns.push((equity[d] - equity[d - 1]) / equity[d - 1]);
    var meanReturn = dailyReturns.reduce(function (a, b) { return a + b; }, 0) / dailyReturns.length;
    var variance = dailyReturns.reduce(function (s, r) { return s + Math.pow(r - meanReturn, 2); }, 0) / dailyReturns.length;
    var stdReturn = Math.sqrt(variance);
    var sharpe = stdReturn > 0 ? (meanReturn / stdReturn) * Math.sqrt(252) : 0;

    var boll = calcBOLL(prices, opts.maPeriod || 20);

    return {
      equity: equity, boll: boll, rsi: rsi, macd: calcMACD(prices, 12, 26, 9), atr: atr, trades: trades, log: log,
      metrics: {
        totalReturn: totalReturn, winRate: winRate, maxDrawdown: maxDrawdown,
        sharpe: sharpe, totalTrades: trades.length, finalEquity: finalEquity,
        atrStopCount: atrStopCount, winTrades: winTrades.length
      }
    };
  }

  return {
    calcMA: calcMA, calcEMA: calcEMA, calcBOLL: calcBOLL,
    calcRSI: calcRSI, calcMACD: calcMACD, calcATR: calcATR,
    runBacktest: runBacktest, runBacktestMACross: runBacktestMACross, runBacktestRSIRev: runBacktestRSIRev
  };
})();
