# Dip-Buy BTC Bot v3 — dev dossier

Competition: btc-race-24h-20261118-1444 ("Race a BTC trading bot live for
24 hours"). Dev window: frozen 24h, 1,440 one-minute CBBTC/USDC bars.

## Parameters

- Symbol: CBBTC. Long only, all-in, one position at a time.
- Entry: close at least 2.50% below the highest close since the window
  opened (the all-time high). Buy immediately with all cash — no bounce
  confirmation. No new position is opened in the final 100 bars of the
  1,440-bar window (a dip there has no time to recover before the
  end-of-window flatten).
- Exit: sell the whole position when the close rises 2.75% above the
  entry close (take-profit) OR falls 0.75% below the highest close since
  entry (trailing stop) OR falls 2.00% below the entry close (hard stop).
- Max slippage: 200 bps on every order.

## Grade-local (kit, --driver process)

- Net PnL: **+27.444428 USDC** (return +2.744%; v2: +$23.86, v1: +$11.95)
- Trades: **4** (2 round trips), win rate **1.000**
- Max drawdown: **0.011840 (1.18%)** (guardrail: <= 25%)
- Exposure: 0.285; Sharpe (per bar): 0.040; rejected orders: 0
- Fees: 1.614110 USDC; net PnL at 2x fees: +25.805042 USDC
- Guardrails: met (trades ok, symbols ok, drawdown ok)
- Dev gate: PASS (net PnL > $0)
- L1 regrade: reproduced byte for byte
- action_log_sha256: c18f48edd9f8f7c8d3acb71471ab39ffd1fece4f84f67e7fe4f9c319c1857096
- result_sha256: 102aca8fe5f2f4b9abccb31f68cfa221b3ac2e8406fb1f1a96c58dd11b489386
  (note: local Node v24.22.1 vs server v26.13.1, so the server's
  result_sha256 will differ; the score reproduces.)

## The two trades (scratch backtest, matches grade-local exactly)

- Trade 1: BUY decided bar 68, fill bar 69 ~$63,514.9 → SELL decided
  bar 102, fill bar 103 ~$63,788.7. Net +$3.51. (Early dip to $63,366;
  the 0.75% trailing stop exits on the pullback from the $64,394 peak.)
- Trade 2: BUY decided bar 132, fill bar 133 ~$63,536.1 → SELL decided
  bar 508, fill bar 509 ~$65,103.8. Net +$23.91. (The big rally to
  $65,190; take-profit +2.75% from entry.)
- Total: +$27.45 net after ~$1.61 of fees.

## Ceiling (measured, not assumed)

- The dev window's price range is only 3.35% (min close $63,076 at bar
  1436, max close $65,190 at bar 508; the window opens $65,083 and
  closes $63,261 — a net down window).
- Perfect-foresight search over every possible all-in long-only round
  trip (full O(n^2) dynamic program, exact fill model incl. 4 bps fee,
  2 bps slippage and pool-depth price impact): the optimal chain is 14
  round trips totalling **about +$64.79 net**. The single best round
  trip is +$25.13 (buy bar 70, sell bar 508).
- The leaderboard's top-10 bar is $92.40 and top 5 needs far more, so
  top 5 is NOT reachable on this dev window — the ceiling (~$65) sits
  below it. v3 at +$27.45 takes the best causal share of the available
  moves: it is +15% over v2 (+$23.86) and should climb from #276
  (v2) to roughly the low-200s (the board is dense near $24 — v2's
  next place was only $23.90 — so +$3.58 clears a meaningful block of
  entries; the exact place is only known from the live board).

## Sweep notes

- v2 params (dip 2.50 / 120-bar lookback / TP 2.75%) = +$23.86, 1 trade.
- Shorter lookbacks (20-60) with the same dip miss the bar-132 trade:
  their rolling high forgets the $65,086 peak, so the dip at bar 132
  reads only ~1.5% and never triggers.
- Smaller dips (0.5-2.0%) overtrade in this choppy window and lose
  money (e.g. dip 1.0% = -$18.30; dip 1.5% = -$7.81): the bot buys
  into still-falling prices and pays ~30 bps per round trip.
- Tighter trailing stops (20-50 bps) also lose (exit on noise, churn);
  the 75 bps trail is just loose enough to survive the big rally's
  0.62-0.65% pullbacks.
- Dip measured against the all-time high + no-buy-in-final-100-bars =
  +$27.45 (2 trades). The final-100-bars rule removes a late loser
  (buy bar 1431, $63,592, flattened at a loss); without it the same
  strategy scores +$21.69.
- A reversal exit (sell on a drop below the recent 3-bar high) adds
  nothing over the trailing stop; a smaller take-profit (1.50%) sells
  the big rally too early (bar 406, +$13.76 instead of +$23.91).
