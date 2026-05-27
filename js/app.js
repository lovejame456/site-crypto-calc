(function () {
  var state = {
    dataMode: 'MOCK',
    token: 'BTC',
    maPeriod: 20,
    rsiOverbought: 70,
    rsiOversold: 30,
    leverage: 1,
    atrMultiplier: 2,
    liveData: null
  };

  var rafId = null;
  var CLOUD_API = 'https://center-backend-eight.vercel.app/api/config';
  var CLOUD_TOKEN = 'Bearer KennyMoney2026';
  var BINANCE_BASE = 'https://api.binance.com/api/v3/klines';

  function $(id) { return document.getElementById(id); }

  function getCurrentData() {
    if (state.dataMode === 'LIVE' && state.liveData) return state.liveData;
    return MockData.get(state.token);
  }

  function fetchBinanceData(token) {
    var symbol = token + 'USDT';
    var url = BINANCE_BASE + '?symbol=' + symbol + '&interval=15m&limit=500';
    return fetch(url).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }).then(function (klines) {
      if (!Array.isArray(klines) || klines.length === 0) throw new Error('Empty data');
      var dates = [], prices = [], highs = [], lows = [];
      klines.forEach(function (k) {
        var ts = new Date(k[0]);
        dates.push((ts.getMonth() + 1) + '/' + ts.getDate() + ' ' + ts.toTimeString().slice(0, 5));
        prices.push(parseFloat(k[4]));
        highs.push(parseFloat(k[2]));
        lows.push(parseFloat(k[3]));
      });
      return { dates: dates, prices: prices, highs: highs, lows: lows };
    });
  }

  function setModeLoading(loading) {
    var toggle = $('mode-toggle');
    if (loading) { toggle.classList.add('loading'); }
    else { toggle.classList.remove('loading'); }
  }

  function switchToLIVE() {
    state.dataMode = 'LIVE';
    var toggle = $('mode-toggle');
    toggle.classList.add('live');
    toggle.querySelector('[data-mode="MOCK"]').classList.remove('active');
    toggle.querySelector('[data-mode="LIVE"]').classList.add('active');
    $('mode-label').textContent = 'LIVE ⚡';
    $('mode-label').style.color = '#228b22';

    setModeLoading(true);
    fetchBinanceData(state.token)
      .then(function (data) {
        state.liveData = data;
        setModeLoading(false);
        runSimulation();
      })
      .catch(function (err) {
        setModeLoading(false);
        alert('币安接口异常：' + (err.message || 'timeout') + '\n自动切回 MOCK 模式');
        switchToMOCK();
      });
  }

  function switchToMOCK() {
    state.dataMode = 'MOCK';
    state.liveData = null;
    var toggle = $('mode-toggle');
    toggle.classList.remove('live', 'loading');
    toggle.querySelector('[data-mode="LIVE"]').classList.remove('active');
    toggle.querySelector('[data-mode="MOCK"]').classList.add('active');
    $('mode-label').textContent = 'MOCK';
    $('mode-label').style.color = '#3d4656';
    runSimulation();
  }

  function initModeToggle() {
    $('mode-toggle').addEventListener('click', function () {
      if (state.dataMode === 'MOCK') switchToLIVE();
      else switchToMOCK();
    });
  }

  function saveConfigToCloud() {
    var btn = $('btn-save');
    var textEl = btn.querySelector('.save-btn-text');
    var originalText = textEl.textContent;

    btn.classList.add('loading');
    btn.classList.remove('success', 'error');
    textEl.innerHTML = '<span class="save-spinner"></span>SYNCING...';

    var payload = {
      siteId: 'crypto-calc',
      config: {
        token: state.token,
        maPeriod: state.maPeriod,
        rsiOverbought: state.rsiOverbought,
        rsiOversold: state.rsiOversold,
        leverage: state.leverage,
        dataMode: state.dataMode,
        atrMultiplier: state.atrMultiplier
      }
    };

    fetch(CLOUD_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': CLOUD_TOKEN },
      body: JSON.stringify(payload)
    })
    .then(function (res) { return res.json(); })
    .then(function (json) {
      if (json.success) {
        btn.classList.remove('loading');
        btn.classList.add('success');
        textEl.textContent = '✓ CONFIG SAVED';
        setTimeout(function () { btn.classList.remove('success'); textEl.textContent = originalText; }, 2200);
      } else { throw new Error(json.error || 'Unknown error'); }
    })
    .catch(function () {
      btn.classList.remove('loading');
      btn.classList.add('error');
      textEl.textContent = '✗ SAVE FAILED';
      setTimeout(function () { btn.classList.remove('error'); textEl.textContent = originalText; }, 2800);
    });
  }

  function initSaveButton() {
    $('btn-save').addEventListener('click', saveConfigToCloud);
  }

  function animateValue(el, targetText) {
    el.style.transition = 'opacity 0.15s';
    el.style.opacity = '0.3';
    setTimeout(function () { el.textContent = targetText; el.style.opacity = '1'; }, 80);
  }

  function formatPct(v) { return (v >= 0 ? '+' : '') + (v * 100).toFixed(2) + '%'; }
  function formatUSD(v) { return '$' + v.toLocaleString(undefined, { maximumFractionDigits: 0 }); }

  function updateMetrics(metrics) {
    var elReturn = $('m-return');
    elReturn.textContent = formatPct(metrics.totalReturn);
    elReturn.className = 'metric-value ' + (metrics.totalReturn >= 0 ? 'positive' : 'negative');
    animateValue($('m-equity'), formatUSD(metrics.finalEquity));

    var elWR = $('m-winrate');
    elWR.textContent = (metrics.winRate * 100).toFixed(1) + '%';
    elWR.className = 'metric-value ' + (metrics.winRate >= 0.5 ? 'positive' : 'negative');
    $('m-trades').textContent = metrics.totalTrades + ' 笔交易';

    $('m-mdd').textContent = '-' + (metrics.maxDrawdown * 100).toFixed(2) + '%';

    var elSharpe = $('m-sharpe');
    elSharpe.textContent = metrics.sharpe.toFixed(2);
    elSharpe.className = 'metric-value ' + (metrics.sharpe >= 1 ? 'positive' : metrics.sharpe >= 0 ? 'neutral' : 'negative');
  }

  function runSimulation() {
    var data = getCurrentData();
    var result = Strategy.runBacktest({
      prices: data.prices,
      highs: data.highs,
      lows: data.lows,
      maPeriod: state.maPeriod,
      rsiOverbought: state.rsiOverbought,
      rsiOversold: state.rsiOversold,
      leverage: state.leverage,
      atrMultiplier: state.atrMultiplier
    });

    updateMetrics(result.metrics);
    ChartManager.updateMainChart(data.dates, data.prices, result.boll, result.equity);
    ChartManager.updateRsiChart(data.dates, result.rsi, state.rsiOverbought, state.rsiOversold);
  }

  function debouncedSim() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(function () {
      if (state.dataMode === 'LIVE') {
        setModeLoading(true);
        fetchBinanceData(state.token)
          .then(function (data) { state.liveData = data; setModeLoading(false); runSimulation(); })
          .catch(function () { setModeLoading(false); switchToMOCK(); });
      } else {
        runSimulation();
      }
      rafId = null;
    });
  }

  function initTokenSelector() {
    var btns = $('token-group').querySelectorAll('.token-btn');
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        btns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        state.token = btn.dataset.token;
        state.liveData = null;
        debouncedSim();
      });
    });
  }

  function initSliders() {
    $('ma-slider').addEventListener('input', function () {
      state.maPeriod = parseInt(this.value);
      $('ma-val').textContent = this.value;
      debouncedSim();
    });
    $('ob-slider').addEventListener('input', function () {
      state.rsiOverbought = parseInt(this.value);
      $('ob-val').textContent = this.value;
      debouncedSim();
    });
    $('os-slider').addEventListener('input', function () {
      state.rsiOversold = parseInt(this.value);
      $('os-val').textContent = this.value;
      debouncedSim();
    });
  }

  function initLeverage() {
    var levInput = $('lev-input');
    levInput.addEventListener('input', function () {
      var v = parseInt(this.value);
      if (isNaN(v) || v < 1) v = 1;
      if (v > 100) v = 100;
      state.leverage = v;
      $('lev-val').textContent = v + 'x';
      debouncedSim();
    });
    document.querySelectorAll('.lev-preset').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var v = parseInt(btn.dataset.lev);
        levInput.value = v;
        state.leverage = v;
        $('lev-val').textContent = v + 'x';
        debouncedSim();
      });
    });
  }

  function initClock() {
    function tick() {
      $('clock').textContent = new Date().toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      });
    }
    tick();
    setInterval(tick, 1000);
  }

  function syncUIFromState() {
    var btns = $('token-group').querySelectorAll('.token-btn');
    btns.forEach(function (b) { b.classList.toggle('active', b.dataset.token === state.token); });
    $('ma-slider').value = state.maPeriod; $('ma-val').textContent = state.maPeriod;
    $('ob-slider').value = state.rsiOverbought; $('ob-val').textContent = state.rsiOverbought;
    $('os-slider').value = state.rsiOversold; $('os-val').textContent = state.rsiOversold;
    $('lev-input').value = state.leverage; $('lev-val').textContent = state.leverage + 'x';

    if (state.dataMode === 'LIVE') {
      var toggle = $('mode-toggle');
      toggle.classList.add('live');
      toggle.querySelector('[data-mode="MOCK"]').classList.remove('active');
      toggle.querySelector('[data-mode="LIVE"]').classList.add('active');
      $('mode-label').textContent = 'LIVE ⚡';
      $('mode-label').style.color = '#228b22';
    }
  }

  function loadConfigFromCloud() {
    return fetch(CLOUD_API + '?siteId=crypto-calc')
      .then(function (res) { return res.json(); })
      .then(function (json) {
        if (json.success && json.data && json.data.config) {
          var c = json.data.config;
          if (c.token) state.token = c.token;
          if (c.maPeriod) state.maPeriod = c.maPeriod;
          if (c.rsiOverbought) state.rsiOverbought = c.rsiOverbought;
          if (c.rsiOversold) state.rsiOversold = c.rsiOversold;
          if (c.leverage) state.leverage = c.leverage;
          if (c.atrMultiplier) state.atrMultiplier = c.atrMultiplier;
          syncUIFromState();
          if (c.dataMode === 'LIVE') switchToLIVE();
        }
      })
      .catch(function () {});
  }

  function init() {
    ChartManager.initMainChart($('main-chart'));
    ChartManager.initRsiChart($('rsi-chart'));
    initModeToggle();
    initTokenSelector();
    initSliders();
    initLeverage();
    initClock();
    initSaveButton();
    loadConfigFromCloud().then(function () { runSimulation(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
