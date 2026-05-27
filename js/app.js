(function () {
  var state = {
    dataMode: 'MOCK',
    token: 'BTC',
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
      $('mode-label').style.color = '#00e5a0';

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
        initialBalance: state.initialBalance
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
    $('m-trades').textContent = metrics.totalTrades + t('metricSubTrades');

    $('m-mdd').textContent = '-' + (metrics.maxDrawdown * 100).toFixed(2) + '%';

    var elSharpe = $('m-sharpe');
    elSharpe.textContent = metrics.sharpe.toFixed(2);
    elSharpe.className = 'metric-value ' + (metrics.sharpe >= 1 ? 'positive' : metrics.sharpe >= 0 ? 'neutral' : 'negative');
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
      var result = Strategy.runBacktest({
        prices: data.prices,
        highs: data.highs,
        lows: data.lows,
        maPeriod: state.maPeriod,
        rsiOverbought: state.rsiOverbought,
        rsiOversold: state.rsiOversold,
        leverage: state.leverage,
        atrMultiplier: state.atrMultiplier,
        initialCapital: state.initialBalance
      });

      updateMetrics(result.metrics);
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
          syncUIFromState();
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
    initSliders();
    initLeverage();
    initBalance();
    initClock();
    initSaveButton();
    initLangToggle();

    window.onLangChange = function () {
      $('btn-save').querySelector('.save-btn-text').textContent = t('btnSave');
      runSimulation();
    };

    loadConfigFromCloud().then(function () { runSimulation(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
