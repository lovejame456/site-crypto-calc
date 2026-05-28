(function () {
  var state = {
    dataMode: 'MOCK',
    token: 'BTC',
    interval: '1h',
    strategy: 'triple',
    maPeriod: 20,
    rsiOverbought: 70,
    rsiOversold: 30,
    leverage: 1,
    atrMultiplier: 2,
    initialBalance: 10000,
    liveData: null
  };

  var CLOUD_API = 'https://center-backend-eight.vercel.app/api/config';
  var CLOUD_TOKEN = 'Bearer KennyMoney2026';
  var BINANCE_BASE = 'https://api.binance.com/api/v3/klines';

  function $(id) { return document.getElementById(id); }

  function t(key) { return window.I18n ? I18n.t(key) : key; }

  function getCurrentData() {
    if (state.dataMode === 'LIVE' && state.liveData) return state.liveData;
    return MockData.get(state.token);
  }

  function fetchBinanceData(token) {
    var symbol = token + 'USDT';
    var url = BINANCE_BASE + '?symbol=' + symbol + '&interval=' + state.interval + '&limit=500';
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
      $('mode-label').style.color = '#00e5a0';

    updateIntervalCoverage();
    setModeLoading(true);
    fetchBinanceData(state.token)
      .then(function (data) {
        state.liveData = data;
        setModeLoading(false);
        runSimulation();
      })
      .catch(function (err) {
        setModeLoading(false);
        alert(t('alertBinanceError') + (err.message || 'timeout') + t('alertBinanceFallback'));
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
    $('mode-label').style.color = '#6b7a8d';
    updateIntervalCoverage();
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
    var originalText = t('btnSave');

    btn.classList.add('loading');
    btn.classList.remove('success', 'error');
    textEl.innerHTML = '<span class="save-spinner"></span>' + t('btnSaveLoading');

    var payload = {
      siteId: 'crypto-calc',
      config: {
        token: state.token,
        maPeriod: state.maPeriod,
        rsiOverbought: state.rsiOverbought,
        rsiOversold: state.rsiOversold,
        leverage: state.leverage,
        dataMode: state.dataMode,
        atrMultiplier: state.atrMultiplier,
        initialBalance: state.initialBalance,
        interval: state.interval,
        strategy: state.strategy
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
        textEl.textContent = t('btnSaveSuccess');
        setTimeout(function () { btn.classList.remove('success'); textEl.textContent = t('btnSave'); }, 2200);
      } else { throw new Error(json.error || 'Unknown error'); }
    })
    .catch(function () {
      btn.classList.remove('loading');
      btn.classList.add('error');
      textEl.textContent = t('btnSaveFail');
      setTimeout(function () { btn.classList.remove('error'); textEl.textContent = t('btnSave'); }, 2800);
    });
  }

  function initSaveButton() {
    $('btn-save').addEventListener('click', saveConfigToCloud);
  }

  function getStateParams() {
    return {
      token: state.token,
      strategy: state.strategy,
      interval: state.interval,
      ma: state.maPeriod,
      ob: state.rsiOverbought,
      os: state.rsiOversold,
      atr: state.atrMultiplier,
      lev: state.leverage,
      bal: state.initialBalance
    };
  }

  function applyParams(p) {
    if (p.token) state.token = p.token;
    if (p.strategy) state.strategy = p.strategy;
    if (p.interval) state.interval = p.interval;
    if (p.ma) state.maPeriod = parseInt(p.ma);
    if (p.ob) state.rsiOverbought = parseInt(p.ob);
    if (p.os) state.rsiOversold = parseInt(p.os);
    if (p.atr) state.atrMultiplier = parseFloat(p.atr);
    if (p.lev) state.leverage = parseInt(p.lev);
    if (p.bal) state.initialBalance = parseFloat(p.bal);
    syncUIFromState();
    updateIntervalCoverage();
    runSimulation();
  }

  function buildShareURL() {
    var p = getStateParams();
    var base = window.location.origin + window.location.pathname;
    var q = '?token=' + p.token + '&strategy=' + p.strategy + '&ma=' + p.ma + '&ob=' + p.ob + '&os=' + p.os + '&atr=' + p.atr + '&lev=' + p.lev + '&bal=' + p.bal;
    return base + q;
  }

  function buildConfigCode() {
    var p = getStateParams();
    var json = JSON.stringify(p);
    var encoded = btoa(unescape(encodeURIComponent(json)));
    return 'KENNY-QUANT-' + encoded;
  }

  function parseConfigCode(code) {
    code = code.trim();
    if (!code.startsWith('KENNY-QUANT-')) return null;
    var encoded = code.substring('KENNY-QUANT-'.length);
    try {
      var json = decodeURIComponent(escape(atob(encoded)));
      return JSON.parse(json);
    } catch (e) { return null; }
  }

  function flashBtn(btn) {
    btn.classList.add('flash');
    setTimeout(function () { btn.classList.remove('flash'); }, 1200);
  }

  function initShareButtons() {
    $('btn-copy-link').addEventListener('click', function () {
      var url = buildShareURL();
      navigator.clipboard.writeText(url).then(function () {
        flashBtn($('btn-copy-link'));
      }).catch(function () {
        var ta = document.createElement('textarea');
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        flashBtn($('btn-copy-link'));
      });
    });

    $('btn-config-code').addEventListener('click', function () {
      $('config-code-out').value = buildConfigCode();
      $('config-code-in').value = '';
      $('config-modal').classList.add('open');
    });

    $('config-modal-close').addEventListener('click', function () {
      $('config-modal').classList.remove('open');
    });

    $('config-modal').addEventListener('click', function (e) {
      if (e.target === $('config-modal')) $('config-modal').classList.remove('open');
    });

    $('btn-copy-code').addEventListener('click', function () {
      var code = $('config-code-out').value;
      navigator.clipboard.writeText(code).then(function () {
        flashBtn($('btn-copy-code'));
      }).catch(function () {
        $('config-code-out').select();
        document.execCommand('copy');
        flashBtn($('btn-copy-code'));
      });
    });

    $('btn-load-code').addEventListener('click', function () {
      var code = $('config-code-in').value;
      var p = parseConfigCode(code);
      if (p) {
        applyParams(p);
        $('config-modal').classList.remove('open');
        flashBtn($('btn-load-code'));
      } else {
        $('config-code-in').style.borderColor = '#ff4757';
        setTimeout(function () { $('config-code-in').style.borderColor = ''; }, 1500);
      }
    });

    $('config-code-in').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') $('btn-load-code').click();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && $('config-modal').classList.contains('open')) {
        $('config-modal').classList.remove('open');
      }
    });
  }

  function loadFromURLParams() {
    var params = new URLSearchParams(window.location.search);
    var p = {};
    if (params.has('token')) p.token = params.get('token');
    if (params.has('strategy')) p.strategy = params.get('strategy');
    if (params.has('interval')) p.interval = params.get('interval');
    if (params.has('ma')) p.ma = params.get('ma');
    if (params.has('ob')) p.ob = params.get('ob');
    if (params.has('os')) p.os = params.get('os');
    if (params.has('atr')) p.atr = params.get('atr');
    if (params.has('lev')) p.lev = params.get('lev');
    if (params.has('bal')) p.bal = params.get('bal');
    if (Object.keys(p).length > 0) {
      applyParams(p);
      window.history.replaceState({}, '', window.location.pathname);
      return true;
    }
    return false;
  }

  function animateValue(el, targetText) {
    el.style.transition = 'opacity 0.15s';
    el.style.opacity = '0.3';
    setTimeout(function () { el.textContent = targetText; el.style.opacity = '1'; }, 80);
  }

  function formatPct(v) { return (v >= 0 ? '+' : '') + (v * 100).toFixed(2) + '%'; }
  function formatUSD(v) { return '$' + v.toLocaleString(undefined, { maximumFractionDigits: 0 }); }
  function fmtPriceJS(p) { if (p >= 1000) return Math.round(p).toLocaleString(); if (p >= 1) return p.toFixed(2); return p.toFixed(6); }

  function updateMetrics(metrics) {
    var elReturn = $('m-return');
    elReturn.textContent = formatPct(metrics.totalReturn);
    elReturn.className = 'metric-value ' + (metrics.totalReturn >= 0 ? 'positive' : 'negative');
    animateValue($('m-equity'), formatUSD(metrics.finalEquity));

    var elWR = $('m-winrate');
    elWR.textContent = (metrics.winRate * 100).toFixed(1) + '%';
    elWR.className = 'metric-value ' + (metrics.winRate >= 0.5 ? 'positive' : 'negative');
    $('m-trades').textContent = metrics.totalTrades + t('metricSubTrades');

    $('m-mdd').textContent = '-' + (metrics.maxDrawdown * 100).toFixed(2) + '%';

    var elSharpe = $('m-sharpe');
    elSharpe.textContent = metrics.sharpe.toFixed(2);
    elSharpe.className = 'metric-value ' + (metrics.sharpe >= 1 ? 'positive' : metrics.sharpe >= 0 ? 'neutral' : 'negative');

    var winCount = metrics.winTrades || 0;
    var loseCount = metrics.totalTrades - winCount;
    $('m-wintrades').textContent = winCount;
    $('m-winloss').textContent = winCount + 'W / ' + loseCount + 'L';
    $('m-atrstops').textContent = metrics.atrStopCount || 0;
  }

  function updateTradeLog(log) {
    var container = $('trade-log');
    if (!container) return;
    if (!log || log.length === 0) {
      container.innerHTML = '<div class="trade-log-empty">' + t('tradeLogEmpty') + '</div>';
      return;
    }
    var html = '';
    for (var i = 0; i < log.length; i++) {
      var entry = log[i];
      var rowClass = 'trade-log-row ' + entry.type;
      var priceStr = fmtPriceJS(entry.price);
      if (entry.type === 'open') {
        html += '<div class="' + rowClass + '">▸ ' + entry.date + '  OPEN @ ' + priceStr + '  [' + entry.signals + ']</div>';
      } else {
        var pnlStr = (entry.pnl >= 0 ? '+' : '') + (entry.pnl * 100).toFixed(2) + '%';
        html += '<div class="' + rowClass + '">  ' + entry.date + '  ' + (entry.type === 'close-win' ? '✓' : '✗') + ' CLOSE @ ' + priceStr + '  ' + pnlStr + '  [' + entry.reason + ']</div>';
      }
    }
    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
  }

  function flashSimIndicator() {
    var el = $('sim-flash');
    if (el) { el.style.opacity = '1'; setTimeout(function () { el.style.opacity = '0'; }, 600); }
    var cards = document.querySelectorAll('.metric-card');
    cards.forEach(function (card) {
      card.style.transition = 'box-shadow 0.15s';
      card.style.boxShadow = '0 0 16px rgba(0,212,255,0.15), inset 0 0 8px rgba(0,212,255,0.05)';
      setTimeout(function () { card.style.boxShadow = ''; }, 500);
    });
  }

  function runSimulation() {
    try {
      var data = getCurrentData();
      var opts = {
        prices: data.prices,
        highs: data.highs,
        lows: data.lows,
        dates: data.dates,
        maPeriod: state.maPeriod,
        rsiOverbought: state.rsiOverbought,
        rsiOversold: state.rsiOversold,
        leverage: state.leverage,
        atrMultiplier: state.atrMultiplier,
        initialCapital: state.initialBalance
      };

      var result;
      if (state.strategy === 'macross') {
        result = Strategy.runBacktestMACross(opts);
      } else if (state.strategy === 'rsirev') {
        result = Strategy.runBacktestRSIRev(opts);
      } else {
        result = Strategy.runBacktest(opts);
      }

      updateMetrics(result.metrics);
      updateTradeLog(result.log);
      ChartManager.updateMainChart(data.dates, data.prices, result.boll, result.equity);
      ChartManager.updateRsiChart(data.dates, result.rsi, state.rsiOverbought, state.rsiOversold);
      flashSimIndicator();
    } catch (err) {
      console.error('[QuantTerminal] runSimulation error:', err);
      var el = $('sim-flash');
      if (el) { el.textContent = '✗ ERROR'; el.style.color = '#ff4757'; el.style.opacity = '1'; }
    }
  }

  function debouncedSim() {
    if (state.dataMode === 'LIVE') {
      setModeLoading(true);
      fetchBinanceData(state.token)
        .then(function (data) { state.liveData = data; setModeLoading(false); runSimulation(); })
        .catch(function () { setModeLoading(false); switchToMOCK(); });
    } else {
      runSimulation();
    }
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

  function updateIntervalCoverage() {
    var coverageMap = {
      '5m': '~42h', '15m': '~5d', '1h': '~21d', '4h': '~83d', '1d': '~1.4y'
    };
    var el = $('interval-coverage');
    var btns = $('interval-group').querySelectorAll('.interval-btn');
    if (state.dataMode === 'LIVE') {
      if (el) {
        el.textContent = '500 bars · ' + (coverageMap[state.interval] || '');
        el.style.color = '#00e5a0';
      }
      btns.forEach(function (b) { b.disabled = false; b.style.opacity = '1'; });
    } else {
      if (el) {
        el.textContent = t('intervalMockOnly') || 'LIVE mode only';
        el.style.color = '#4a5568';
      }
      btns.forEach(function (b) { b.disabled = true; b.style.opacity = '0.35'; });
    }
  }

  function initIntervalSelector() {
    var btns = $('interval-group').querySelectorAll('.interval-btn');
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        btns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        state.interval = btn.dataset.interval;
        state.liveData = null;
        updateIntervalCoverage();
        debouncedSim();
      });
    });
    updateIntervalCoverage();
  }

  function initStrategySelector() {
    var btns = $('strategy-group').querySelectorAll('.strategy-btn');
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        btns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        state.strategy = btn.dataset.strategy;
        var descEl = $('strategy-desc');
        descEl.textContent = t('strategy' + btn.dataset.strategy.charAt(0).toUpperCase() + btn.dataset.strategy.slice(1) + 'Desc') || '';
        debouncedSim();
      });
    });
  }

  function initCustomToken() {
    var input = $('custom-token');
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var val = input.value.trim().toUpperCase();
        if (!val) return;
        var presetBtns = $('token-group').querySelectorAll('.token-btn');
        presetBtns.forEach(function (b) { b.classList.remove('active'); });
        state.token = val;
        state.liveData = null;
        if (state.dataMode === 'MOCK') switchToLIVE();
        debouncedSim();
      }
    });
  }

  function updateSliderFill(slider) {
    var min = parseFloat(slider.min);
    var max = parseFloat(slider.max);
    var val = parseFloat(slider.value);
    var pct = ((val - min) / (max - min)) * 100;
    var fill = getComputedStyle(slider).getPropertyValue('--fill-color').trim() || '#12b5c5';
    slider.style.background =
      'linear-gradient(to right, ' + fill + ' 0%, ' + fill + ' ' + pct + '%, rgba(255,255,255,0.06) ' + pct + '%, rgba(255,255,255,0.06) 100%)';
  }

  function initSliders() {
    var sliders = [
      { el: $('ma-slider'), stateKey: 'maPeriod', display: $('ma-val') },
      { el: $('ob-slider'), stateKey: 'rsiOverbought', display: $('ob-val') },
      { el: $('os-slider'), stateKey: 'rsiOversold', display: $('os-val') }
    ];
    sliders.forEach(function (s) {
      updateSliderFill(s.el);
      function onSlide() {
        state[s.stateKey] = parseInt(s.el.value);
        s.display.textContent = s.el.value;
        updateSliderFill(s.el);
        debouncedSim();
      }
      s.el.addEventListener('input', onSlide);
      s.el.addEventListener('change', onSlide);
    });

    var atrSlider = $('atr-slider');
    updateSliderFill(atrSlider);
    function onAtrSlide() {
      state.atrMultiplier = parseFloat(atrSlider.value);
      $('atr-val').textContent = parseFloat(atrSlider.value).toFixed(1);
      updateSliderFill(atrSlider);
      debouncedSim();
    }
    atrSlider.addEventListener('input', onAtrSlide);
    atrSlider.addEventListener('change', onAtrSlide);
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

  function formatBalanceShort(v) {
    if (v >= 1000000) return '$' + (v / 1000000).toFixed(1) + 'M';
    if (v >= 1000) return '$' + (v / 1000).toFixed(v % 1000 === 0 ? 0 : 1) + 'K';
    return '$' + v.toLocaleString();
  }

  function initBalance() {
    var balInput = $('bal-input');
    balInput.addEventListener('input', function () {
      var v = parseFloat(this.value);
      if (isNaN(v) || v < 1) v = 1;
      state.initialBalance = v;
      $('bal-val').textContent = formatUSD(v);
      debouncedSim();
    });
    document.querySelectorAll('.bal-preset').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var v = parseInt(btn.dataset.bal);
        balInput.value = v;
        state.initialBalance = v;
        $('bal-val').textContent = formatUSD(v);
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
    var intBtns = $('interval-group').querySelectorAll('.interval-btn');
    intBtns.forEach(function (b) { b.classList.toggle('active', b.dataset.interval === state.interval); });
    var stratBtns = $('strategy-group').querySelectorAll('.strategy-btn');
    stratBtns.forEach(function (b) { b.classList.toggle('active', b.dataset.strategy === state.strategy); });
    $('ma-slider').value = state.maPeriod; $('ma-val').textContent = state.maPeriod; updateSliderFill($('ma-slider'));
    $('ob-slider').value = state.rsiOverbought; $('ob-val').textContent = state.rsiOverbought; updateSliderFill($('ob-slider'));
    $('os-slider').value = state.rsiOversold; $('os-val').textContent = state.rsiOversold; updateSliderFill($('os-slider'));
    $('atr-slider').value = state.atrMultiplier; $('atr-val').textContent = parseFloat(state.atrMultiplier).toFixed(1); updateSliderFill($('atr-slider'));
    $('lev-input').value = state.leverage; $('lev-val').textContent = state.leverage + 'x';
    $('bal-input').value = state.initialBalance; $('bal-val').textContent = formatUSD(state.initialBalance);

    if (state.dataMode === 'LIVE') {
      var toggle = $('mode-toggle');
      toggle.classList.add('live');
      toggle.querySelector('[data-mode="MOCK"]').classList.remove('active');
      toggle.querySelector('[data-mode="LIVE"]').classList.add('active');
      $('mode-label').textContent = 'LIVE ⚡';
    $('mode-label').style.color = '#00e5a0';
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
          if (c.initialBalance) state.initialBalance = c.initialBalance;
          if (c.atrMultiplier) state.atrMultiplier = c.atrMultiplier;
          if (c.interval) state.interval = c.interval;
          if (c.strategy) state.strategy = c.strategy;
          syncUIFromState();
          updateIntervalCoverage();
          if (c.dataMode === 'LIVE') switchToLIVE();
        }
      })
      .catch(function () {});
  }

  function initLangToggle() {
    $('lang-toggle').addEventListener('click', function () {
      var next = I18n.getLang() === 'en' ? 'zh' : 'en';
      I18n.setLang(next);
    });
  }

  function init() {
    I18n.setLang(I18n.getLang());

    ChartManager.initMainChart($('main-chart'));
    ChartManager.initRsiChart($('rsi-chart'));
    initModeToggle();
    initTokenSelector();
    initIntervalSelector();
    initStrategySelector();
    initCustomToken();
    initSliders();
    initLeverage();
    initBalance();
    initClock();
    initSaveButton();
    initShareButtons();
    initLangToggle();

    window.onLangChange = function () {
      $('btn-save').querySelector('.save-btn-text').textContent = t('btnSave');
      runSimulation();
    };

    if (!loadFromURLParams()) {
      loadConfigFromCloud().then(function () { runSimulation(); });
    } else {
      runSimulation();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
