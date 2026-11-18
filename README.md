# Dip-Buy BTC Bot v2

[![make.fun bounty](https://make.fun/badge/btc-race-24h-20261118-1444.svg)](https://make.fun/bounty/btc-race-24h-20261118-1444)
[![make.fun rank](https://make.fun/badge/btc-race-24h-20261118-1444/SyamXXV/btc-race-24h-20261118/rank.svg)](https://make.fun/bounty/btc-race-24h-20261118-1444/leaderboard)
[![make.fun reward](https://make.fun/badge/btc-race-24h-20261118-1444/SyamXXV/btc-race-24h-20261118/reward.svg)](https://make.fun/bounty/btc-race-24h-20261118-1444)

Referral: https://make.fun/r/ymfx8s8x

Entry for make.fun **btc-race-24h-20261118-1444** — "Race a BTC trading bot
live for 24 hours". Node 22, protocol `agent-fun/bars-replay/v1`.

## Strategy

Trades Coinbase Wrapped BTC (CBBTC) on 1-minute bars. Long only, one
position at a time, buys with all cash. Deterministic: no wall clock, no
randomness, every comparison in bigint over the closes.

- **Entry:** the close is at least 2.50% below the highest close of the
  last 120 bars. Buy with all cash, immediately — no bounce confirmation.
- **Exit:** sell the whole position when the close rises 2.75% above the
  entry close (take-profit) **or** falls 0.75% below the highest close
  since entry (trailing stop) **or** falls 2.00% below the entry close
  (hard stop).
- **Risk:** max slippage 200 bps on every order. No trade while warming up.

## Why v2 beats v1

v1 (dip 2.00% / trail 0.75% / 240-bar lookback / bounce confirmation)
scored +$11.95 on the dev window. v2 changes three things, each measured
on the frozen dev window:

1. **Shorter lookback (120 bars):** the bot can trade from bar 120, so it
   catches the early-window trough the 240-bar lookback could not reach.
2. **No bounce confirmation:** waiting for an up-close missed the entry
   entirely on this window — the dip bar itself is the entry.
3. **Take-profit at +2.75%:** locks in the rally instead of trailing out
   of it early.

## Files

- `main.ts` — the bot. `vendor/makefun-bars.ts` is a byte-identical copy
  of the kit's SDK shim.
- `LICENSE` — MIT.

## Local grade

```
node <kit>/cli/makefun.mjs grade-local --kit <kit> --bot . --driver process
```

Dev-window grade: net PnL **+$23.86**, 2 trades (1 round trip, win rate
1.0), max drawdown 0.65%.
