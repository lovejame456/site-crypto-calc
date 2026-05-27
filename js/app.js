(function () {
  var state = {
    token: 'BTC',
    maPeriod: 20,
    rsiOverbought: 70,
    rsiOversold: 30,
    leverage: 1
  };

  var rafId = null;

  var CLOUD_API = 'https://center-backend-eight.vercel.app/api/config';
  var CLOUD_TOKEN = 'Bearer KennyMoney2026';

  function $(id) { return document.getElementById(id); }

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
        leverage: state.leverage
      }
    };

    fetch(CLOUD_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': CLOUD_TOKEN
      },
      body: JSON.stringify(payload)
    })
    .then(function (res) { return res.json(); })
    .then(function (json) {
      if (json.success) {
        btn.classList.remove('loading');
        btn.classList.add('success');
        textEl.textContent = '✓ CONFIG SAVED';
        setTimeout(function () {
          btn.classList.remove('success');
          textEl.textContent = originalText;
        }, 2200);
      } else {
        throw new Error(json.error || 'Unknown error');
      }
    })
    .catch(function (err) {
      btn.classList.remove('loading');
      btn.classList.add('error');
      textEl.textContent = '✗ SAVE FAILED';
      setTimeout(function () {
        btn.classList.remove('error');
        textEl.textContent = originalText;
      }, 2800);
    });
  }

  function initSaveButton() {
    $('btn-save').addEventListener('click', saveConfigToCloud);
  }

  function animateValue(el, targetText) {
    el.style.transition = 'opacity 0.15s';
    el.style.opacity = '0.3';
    setTimeout(function () {
      el.textContent = targetText;
      el.style.opacity = '1';
    }, 80);
  }

  function formatPct(v) {
    var sign = v >= 0 ? '+' : '';
    return sign + (v * 100).toFixed(2) + '%';
  }

  function formatUSD(v) {
    return '$' + v.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }

  function updateMetrics(metrics) {
    var ret = metrics.totalReturn;
    var wr = metrics.winRate;
    var mdd = metrics.maxDrawdown;
    var sharpe = metrics.sharpe;

    var elReturn = $('m-return');
    elReturn.textContent = formatPct(ret);
    elReturn.className = 'metric-value ' + (ret >= 0 ? 'positive' : 'negative');

    animateValue($('m-equity'), formatUSD(metrics.finalEquity));

    var elWR = $('m-winrate');
    elWR.textContent = (wr * 100).toFixed(1) + '%';
    elWR.className = 'metric-value ' + (wr >= 0.5 ? 'positive' : 'negative');

    $('m-trades').textContent = metrics.totalTrades + ' 笔交易';

    var elMDD = $('m-mdd');
    elMDD.textContent = '-' + (mdd * 100).toFixed(2) + '%';
    elMDD.className = 'metric-value negative';

    var elSharpe = $('m-sharpe');
    elSharpe.textContent = sharpe.toFixed(2);
    elSharpe.className = 'metric-value ' + (sharpe >= 1 ? 'positive' : sharpe >= 0 ? 'neutral' : 'negative');
  }

  function runSimulation() {
    var data = MockData.get(state.token);
    var result = Strategy.runBacktest({
      prices: data.prices,
      maPeriod: state.maPeriod,
      rsiOverbought: state.rsiOverbought,
      rsiOversold: state.rsiOversold,
      leverage: state.leverage
    });

    updateMetrics(result.metrics);
    ChartManager.updateMainChart(data.dates, data.prices, result.ma, result.equity);
    ChartManager.updateRsiChart(data.dates, result.rsi, state.rsiOverbought, state.rsiOversold);
  }

  function debouncedSim() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(function () {
      runSimulation();
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
        debouncedSim();
      });
    });
  }

  function initSliders() {
    var maSlider = $('ma-slider');
    var obSlider = $('ob-slider');
    var osSlider = $('os-slider');

    maSlider.addEventListener('input', function () {
      state.maPeriod = parseInt(this.value);
      $('ma-val').textContent = this.value;
      debouncedSim();
    });

    obSlider.addEventListener('input', function () {
      state.rsiOverbought = parseInt(this.value);
      $('ob-val').textContent = this.value;
      debouncedSim();
    });

    osSlider.addEventListener('input', function () {
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
      var now = new Date();
      $('clock').textContent = now.toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
      });
    }
    tick();
    setInterval(tick, 1000);
  }

  function init() {
    ChartManager.initMainChart($('main-chart'));
    ChartManager.initRsiChart($('rsi-chart'));

    initTokenSelector();
    initSliders();
    initLeverage();
    initClock();
    initSaveButton();

    runSimulation();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
