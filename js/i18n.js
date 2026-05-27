(function () {
  var translations = {
    en: {
      pageTitle: 'Quant Terminal — BOLL+MACD+ATR Triple Factor Backtester',
      headerBrand: 'QUANT',
      headerSub: 'TERMINAL',

      metricReturn: 'Total Return',
      metricWinrate: 'Win Rate',
      metricMdd: 'Max Drawdown (MDD)',
      metricSharpe: 'Sharpe Ratio',
      metricSubEquity: '',
      metricSubTrades: ' trades',
      metricSubPeakTrough: 'Peak to Trough',
      metricSubSharpe: 'Annualized Risk-Adj Return',

      configDataSource: 'Data Source',
      configToken: 'Token',
      configMaPeriod: 'MA Period',
      configRsiOb: 'RSI Overbought',
      configRsiOs: 'RSI Oversold',
      configLeverage: 'Leverage',
      configAtrMult: 'ATR Multiplier',
      configInitialBalance: 'Initial Balance (USD)',
      btnSave: '🔒 SAVE CONFIG TO CLOUD',
      btnSaveLoading: 'SYNCING...',
      btnSaveSuccess: '✓ CONFIG SAVED',
      btnSaveFail: '✗ SAVE FAILED',

      strategyTitle: 'Strategy Rules',
      strategyLong: 'Long: Bollinger lower breakout + RSI oversold + MACD histogram growing',
      strategyStop: 'ATR Stop: Force close when price < entry − ATR × multiplier',
      strategyExit: 'Exit: Bollinger upper band hit OR RSI overbought',

      chartMain: 'Strategy Equity Curve + Price Overlay',
      chartRsi: 'RSI Indicator',

      footer: 'QUANT TERMINAL v1.0 — Simulated data for reference only. Not financial advice. Past performance does not guarantee future results.',

      alertBinanceError: 'Binance API error: ',
      alertBinanceFallback: '\nAuto-switched to MOCK mode',

      langLabel: 'EN'
    },
    zh: {
      pageTitle: '量化终端 — 布林+MACD+ATR 三因子回测系统',
      headerBrand: 'QUANT',
      headerSub: 'TERMINAL',

      metricReturn: '累计收益率',
      metricWinrate: '开仓胜率',
      metricMdd: '最大回撤 MDD',
      metricSharpe: '夏普比率',
      metricSubEquity: '',
      metricSubTrades: ' 笔交易',
      metricSubPeakTrough: '峰值到谷底',
      metricSubSharpe: '年化风险调整收益',

      configDataSource: '数据源',
      configToken: '代币',
      configMaPeriod: 'MA 周期',
      configRsiOb: 'RSI 超买线',
      configRsiOs: 'RSI 超卖线',
      configLeverage: '杠杆倍数',
      configAtrMult: 'ATR 止损倍数',
      configInitialBalance: '初始本金 (USD)',
      btnSave: '🔒 保存配置到云端',
      btnSaveLoading: '同步中...',
      btnSaveSuccess: '✓ 配置已保存',
      btnSaveFail: '✗ 保存失败',

      strategyTitle: '策略规则',
      strategyLong: '开多：突破布林下轨 + RSI超卖 + MACD绿柱拉长',
      strategyStop: 'ATR止损：价格跌破 开仓价−ATR×倍数 强制平仓',
      strategyExit: '平仓：触及布林上轨 或 RSI超买',

      chartMain: '策略收益曲线 + 价格叠加',
      chartRsi: 'RSI 指标',

      footer: 'QUANT TERMINAL v1.0 — 模拟数据仅供参考，不构成投资建议。历史表现不代表未来收益。',

      alertBinanceError: '币安接口异常：',
      alertBinanceFallback: '\n自动切回 MOCK 模式',

      langLabel: '中文'
    }
  };

  var currentLang = localStorage.getItem('quant-lang') || 'en';

  function t(key) {
    return (translations[currentLang] && translations[currentLang][key]) || key;
  }

  function setLang(lang) {
    if (!translations[lang]) return;
    currentLang = lang;
    localStorage.setItem('quant-lang', lang);
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.title = t('pageTitle');

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var val = t(key);
      if (val) el.textContent = val;
    });

    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-html');
      var val = t(key);
      if (val) el.innerHTML = val;
    });

    var langBtn = document.getElementById('lang-toggle');
    if (langBtn) langBtn.textContent = t('langLabel');

    if (typeof window.onLangChange === 'function') window.onLangChange(lang);
  }

  function getLang() { return currentLang; }

  window.I18n = { t: t, setLang: setLang, getLang: getLang };
})();
