# Dip-Buy BTC Bot v3

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

- **Entry:** the close is at least 2.50% below the highest close since
  the window opened (the all-time high). Buy with all cash, immediately
  — no bounce confirmation. No new position is opened in the final 100
  bars of the 1,440-bar window, because a dip there has no time to
  recover before the end-of-window flatten.
- **Exit:** sell the whole position when the close rises 2.75% above the
  entry close (take-profit) **or** falls 0.75% below the highest close
  since entry (trailing stop) **or** falls 2.00% below the entry close
  (hard stop).
- **Risk:** max slippage 200 bps on every order. No trade while warming up.

## Why v3 beats v2

v2 (dip 2.50% / 120-bar lookback / take-profit 2.75%) scored +$23.86 on
the dev window with a single round trip. v3 changes two things, each
measured on the frozen dev window:

1. **Dip against the all-time high, not a rolling 120-bar high:** the
   rolling high forgets the $65,086 peak once it slides out of the
   window, so v2 could not trade before bar 120 and missed the early dip
   to $63,366 (bar 69). The all-time high keeps that peak, so v3 buys
   the early dip too and re-enters on the bar-132 dip for the big rally
   to $65,190. Two round trips instead of one.
2. **No new position in the final 100 bars:** a dip late in the window
   (bar 1431, $63,592) has no time to recover before the flatten, so it
   is opened at a loss. Skipping the last 100 bars removes that loser.

## Files

- `main.ts` — the bot. `vendor/makefun-bars.ts` is a byte-identical copy
  of the kit's SDK shim.
- `LICENSE` — MIT.

## Local grade

```
node <kit>/cli/makefun.mjs grade-local --kit <kit> --bot . --driver process
```

Dev-window grade: net PnL **+$27.45**, 4 trades (2 round trips, win rate
1.0), max drawdown 1.18%.

## Ceiling

The dev window's price range is only 3.35% ($63,076 to $65,190). A
perfect-foresight search over every possible all-in long-only round trip
(14 optimal trades) puts the maximum achievable net PnL at about +$65.
The leaderboard's top-10 bar ($92.40) sits above that ceiling, so top 5
is not reachable on this window; v3 takes the best causal share of the
available moves.
