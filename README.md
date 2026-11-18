# Dip-Buy BTC Bot

[![make.fun · btc-race-24h-20261118-1444](https://make.fun/badge/btc-race-24h-20261118-1444.svg)](https://make.fun/bounty/btc-race-24h-20261118-1444)
[![rank](https://make.fun/badge/btc-race-24h-20261118-1444/SyamXXV/btc-race-24h-20261118/rank.svg)](https://make.fun/bounty/btc-race-24h-20261118-1444/leaderboard)
[![reward](https://make.fun/badge/btc-race-24h-20261118-1444/SyamXXV/btc-race-24h-20261118/reward.svg)](https://make.fun/bounty/btc-race-24h-20261118-1444)

Entry for make.fun **btc-race-24h-20261118-1444** — "Race a BTC trading bot
live for 24 hours". Node 22, protocol `agent-fun/bars-replay/v1`.

Earn referral rewards: [https://make.fun/r/ymfx8s8x](https://make.fun/r/ymfx8s8x)

## Strategy

Trades Coinbase Wrapped BTC (CBBTC) on 1-minute bars. Long only, one
position at a time, buys with all cash. Deterministic: no wall clock, no
randomness, every comparison in bigint over the closes.

- **Entry:** the close is at least 2% below the highest close of the
  last 240 bars (4 hours) **and** the close rose vs the previous bar
  (bounce confirmation). Buy with all cash.
- **Exit:** sell the whole position when the close falls 0.75% below the
  highest close since entry (trailing stop) **or** 2% below the entry
  close (hard stop).
- **Risk:** max slippage 200 bps on every order. No trade while warming up.

## Files

- `main.ts` — the bot. `vendor/makefun-bars.ts` is a byte-identical copy
  of the kit's SDK shim.
- `LICENSE` — MIT.

## Local grade

```
node <kit>/cli/makefun.mjs grade-local --kit <kit> --bot . --driver process
```
