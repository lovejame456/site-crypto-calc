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
      configInterval: 'Interval',
      intervalMock: '365 days simulated',
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

      footer: 'QUANT TERMINAL v2.5 — Simulated data for reference only. Not financial advice. Past performance does not guarantee future results.',

      alertBinanceError: 'Binance API error: ',
      alertBinanceFallback: '\nAuto-switched to MOCK mode',

      langLabel: 'EN',

      tutorialTitle: 'How to Use Quant Terminal',
      tutorialPrev: 'Prev',
      tutorialNext: 'Next',
      tutorialDone: "Got it! Let's go",

      t_s0_title: 'What is this tool?',
      t_s0_body: 'A crypto strategy backtester. It replays historical price data and simulates trades using the Bollinger Bands + MACD + ATR triple-factor strategy. You adjust parameters, see how the strategy would have performed — without risking real money.',

      t_s1_title: 'Step 1: Pick a coin',
      t_s1_body: 'Click BTC / ETH / SOL to switch coins. By default it uses simulated 365-day data (MOCK mode).\n\nTo use real market data, click the MOCK/LIVE toggle in the header — it fetches live 15-minute candles from Binance. Switching coins in LIVE mode auto-refreshes.',

      t_s2_title: 'Step 2: Adjust parameters',
      t_s2_body: 'Drag the sliders or type values — everything updates in real-time. Each parameter controls a different part of the strategy:\n\n• MA Period → Bollinger Band width (smaller = more signals)\n• RSI Overbought/Oversold → market "extreme" thresholds\n• ATR Multiplier → stop-loss distance (bigger = wider stop)\n• Leverage → amplify gains AND losses\n• Initial Balance → starting capital in USD',

      t_s3_title: 'Step 3: Watch results update live',
      t_s3_body: 'Every slider drag and coin switch instantly re-runs the simulation — no buttons needed. The four metric cards flash blue to confirm. The charts (equity curve + RSI) update in real-time as you adjust.',

      t_s4_title: 'Step 4: Read the results',
      t_s4_body: '• Total Return — overall profit/loss %\n• Win Rate — % of trades that made money\n• Max Drawdown — worst peak-to-trough drop (risk gauge)\n• Sharpe Ratio — risk-adjusted return (above 1 = good)\n\nOn the main chart, the GOLD line is your equity curve. If it goes up, the strategy makes money.',

      t_s5_title: 'Strategy Logic',
      t_s5_body: 'BUY when ALL three are true:\n  ① Price below Bollinger lower band (cheap)\n  ② RSI signals oversold (market panic)\n  ③ MACD histogram growing (momentum reversing)\n\nSELL when ANY triggers:\n  • Price hits Bollinger upper band\n  • RSI goes overbought\n  • ATR stop-loss hit (price dropped too far)',

      t_s6_title: 'Pro Tips',
      t_s6_body: '• Try leverage 10x to see amplified results (and amplified risk)\n• Different coins have different volatility patterns — try all three\n• Click the MOCK/LIVE toggle to validate with real Binance data\n• Click 🔒 SAVE to store your config in the cloud\n• Click the ? button in the header to reopen this tutorial\n\n⚠️ This is a simulation tool — past results do not guarantee future performance.'
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
      configInterval: '周期',
      intervalMock: '模拟 365 天',
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

      footer: 'QUANT TERMINAL v2.5 — 模拟数据仅供参考，不构成投资建议。历史表现不代表未来收益。',

      alertBinanceError: '币安接口异常：',
      alertBinanceFallback: '\n自动切回 MOCK 模式',

      langLabel: '中文',

      tutorialTitle: '如何使用量化终端',
      tutorialPrev: '上一步',
      tutorialNext: '下一步',
      tutorialDone: '明白了，开始使用',

      t_s0_title: '这个工具是做什么的？',
      t_s0_body: '一个加密货币策略回测器。它会用历史价格数据模拟交易，使用布林带 + MACD + ATR 三因子策略。你调整参数，看策略的表现——不用冒真金白银的风险。',

      t_s1_title: '第一步：选择币种',
      t_s1_body: '点击 BTC / ETH / SOL 切换币种。默认使用模拟的 365 天数据（MOCK 模式）。\n\n想用真实行情数据？点击顶部的 MOCK/LIVE 开关——会自动从币安拉取 15 分钟 K 线。LIVE 模式下切币种也会自动刷新数据。',

      t_s2_title: '第二步：调节参数',
      t_s2_body: '拖动滑块或直接输入数值——所有变化实时生效，无需点任何按钮。每个参数控制策略的不同部分：\n\n• MA 周期 → 布林带宽度（越小信号越多）\n• RSI 超买/超卖线 → 市场"极端"的阈值\n• ATR 倍数 → 止损距离（越大止损越宽）\n• 杠杆倍数 → 放大收益和亏损\n• 初始本金 → 起始资金（美元）',

      t_s3_title: '第三步：实时查看结果',
      t_s3_body: '每次拖动滑块或切换币种，模拟自动重新运行——不需要点任何按钮。顶部四张指标卡会闪烁蓝色确认计算完成。图表（净值曲线 + RSI）也会实时更新。',

      t_s4_title: '第四步：查看结果',
      t_s4_body: '• 累计收益率 — 总盈亏百分比\n• 开仓胜率 — 盈利交易占比\n• 最大回撤 — 最严重的峰值到谷底跌幅（风险指标）\n• 夏普比率 — 风险调整后收益（大于 1 算及格）\n\n主图上的金色曲线就是你的净值曲线——上升代表赚钱。',

      t_s5_title: '策略逻辑',
      t_s5_body: '买入条件（三个同时满足）：\n  ① 价格跌破布林下轨（便宜了）\n  ② RSI 显示超卖（市场恐慌）\n  ③ MACD 绿柱拉长（动量开始反转）\n\n卖出条件（任一触发）：\n  • 价格触及布林上轨\n  • RSI 超买\n  • ATR 止损触发（价格跌破止损线）',

      t_s6_title: '进阶技巧',
      t_s6_body: '• 试试 10x 杠杆看放大效果（风险也放大了）\n• 不同币种波动规律不同，三个都试试\n• 点击顶部的 MOCK/LIVE 开关，用币安真实行情验证策略\n• 点击 🔒 SAVE 把参数存到云端\n• 点击右上角 ? 按钮随时重看本教程\n\n⚠️ 这是模拟工具——历史表现不代表未来收益。'
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
