# Dip-Buy BTC Bot v2 — dev dossier

Competition: btc-race-24h-20261118-1444 ("Race a BTC trading bot live for
24 hours"). Dev window: frozen 24h, 1,440 one-minute CBBTC/USDC bars.

## Parameters

- Symbol: CBBTC. Long only, all-in, one position at a time.
- Lookback: 120 closes (v1: 240).
- Entry: close at least 2.50% below the highest close of the last 120
  bars. Buy immediately with all cash — no bounce confirmation
  (v1 waited for an up-close and missed the entry entirely).
- Exit: sell the whole position when the close rises 2.75% above the
  entry close (take-profit) OR falls 0.75% below the highest close since
  entry (trailing stop) OR falls 2.00% below the entry close (hard stop).
- Max slippage: 200 bps on every order.

## Grade-local (kit, --driver process)

- Net PnL: **+23.863534 USDC** (return +2.386%; v1: +$11.95)
- Trades: **2** (1 round trip), win rate **1.000**
- Max drawdown: **0.006518 (0.65%)** (guardrail: <= 25%)
- Exposure: 0.261; Sharpe (per bar): 0.043; rejected orders: 0
- Fees: 0.809710 USDC; net PnL at 2x fees: +23.045058 USDC
- Guardrails: met (trades ok, symbols ok, drawdown ok)
- Dev gate: PASS (net PnL > $0)
- L1 regrade: reproduced byte for byte
- action_log_sha256: b753b12f55e5ce9fe572af2665695a637673cd6007d15554842316268a226d92
- result_sha256: 665c4c4ae1596e34443ed46f405877e6670bd5d0b791ed007953a884f0888d48
  (note: local Node v24.22.1 vs server v26.13.1, so the server's
  result_sha256 will differ; the score reproduces.)

## The winning trade (scratch backtest, matches grade-local)

- BUY bar 133, fill ~$63,535.8 (dip 2.5% from the 120-bar high).
- SELL bar 509, fill ~$65,104.1 (take-profit +2.75% from entry).
- One round trip, +$23.86 net after ~$0.81 of fees.

## Sweep notes

- v1 params (dip 2.00 / trail 0.75 / 240-bar / bounce) = +$11.95.
- Shorter lookback (120) + no confirmation + take-profit 2.75% = +$23.86.
- Take-profit plateau 2.60–2.75% all give ~$23.20–23.86; 2.80%+ falls
  back to the trail exit (+$15.85). Dip 2.50% is the entry that catches
  the bar-133 trough; 2.60% misses it (0 trades). The trade is the same
  for lookback 90 and 120 (same bar, same prices) — a real market move,
  not a lookback artifact.
- Max slippage 100–1000 bps makes no difference (gaps are small).
