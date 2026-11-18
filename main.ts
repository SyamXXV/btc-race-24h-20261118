// Dip-Buy BTC Bot v3 — mean-reversion dip buyer for make.fun
// btc-race-24h-20261118-1444. Trades CBBTC on 1-minute bars, long only,
// all-in, one position at a time.
//
// v3 vs v2 (dip 2.50% / 120-bar lookback / take-profit 2.75% / trail
// 0.75% / hard 2.00%, dev +$23.86, one round trip): two changes, each
// measured on the frozen dev window.
//   1. The dip is measured against the ALL-TIME high so far (the highest
//      close since the window opened), not a rolling 120-bar high. A
//      rolling high forgets the $65,086 peak once it slides out of the
//      window, so a 120-bar lookback cannot trade before bar 120 and
//      misses the early dip to $63,366 (bar 69). The all-time high keeps
//      that peak, so v3 buys the early dip too and re-enters on the
//      bar-132 dip for the big rally to $65,190. Two round trips instead
//      of one: dev +$27.45.
//   2. No new position in the final 100 bars of the 1,440-bar window.
//      A dip late in the window (e.g. bar 1431, $63,592) has no time to
//      recover before the end-of-window flatten, so it is opened at a
//      loss. Skipping the last 100 bars removes that loser.
//
// Dev-window grade (grade-local, frozen 24h window): net PnL +$27.45,
// 4 trades (2 round trips), win rate 1.0, max drawdown 1.18%.
// A full-size round trip pays ~26-32 bps in fee, slippage and impact,
// so a trade has to catch a move larger than that; the 2.50% dip and
// 2.75% take-profit clear it with room to spare.
//
// Ceiling (measured, perfect foresight, all-in long-only, 14 optimal
// round trips): the dev window's price range is only 3.35% ($63,076 to
// $65,190), so the maximum achievable net PnL is about +$65. The
// leaderboard's top-10 bar ($92.40) sits above that ceiling, so top 5
// is not reachable on this window; v3 takes the best causal share of
// the available moves.

import { BPS, runBars, type BarsState, type BuyInput, type OrderInput } from './vendor/makefun-bars.ts';

const SYMBOL = 'CBBTC';
/** Buy when the close is at least this far below the all-time high (bps). */
const DIP_BPS = 250;
/** Sell when the close falls this far below the highest close since entry (bps). */
const TRAIL_BPS = 75;
/** Sell when the close falls this far below the entry close (bps). */
const HARD_BPS = 200;
/** Sell when the close rises this far above the entry close (bps). */
const TAKE_PROFIT_BPS = 275;
/** Orders are refused when the fill would move more than this from the latest close (bps). */
const MAX_SLIPPAGE_BPS = 200;
/** The window is 1,440 bars; do not open a new position in the final bars. */
const WINDOW_BARS = 1440;
/** Bars at the end of the window in which no new position is opened. */
const NO_BUY_LAST_BARS = 100;

/** Highest close seen so far in this window (all-time high). */
let allTimeHigh: bigint | null = null;
/** Number of scored bars seen so far. */
let barsSeen = 0;
/** Entry close and highest close since entry, while a position is held. */
let entryClose: bigint | null = null;
let peakClose: bigint | null = null;

/** True when the close is at least DIP_BPS below the all-time high. */
function dipped(close: bigint): boolean {
  if (allTimeHigh === null) return false;
  // close <= allTimeHigh * (1 - DIP_BPS / 10000), exactly.
  return close * BPS <= allTimeHigh * (BPS - BigInt(DIP_BPS));
}

await runBars({
  onBatch(state: BarsState, batch) {
    if (state.warmingUp) return [];
    const close = state.close(SYMBOL);
    if (close === null) return [];
    barsSeen += 1;
    if (allTimeHigh === null || close > allTimeHigh) allTimeHigh = close;

    const held = state.positions.get(SYMBOL);
    // --- exit: holding a position ---
    if (held !== undefined && entryClose !== null && peakClose !== null) {
      if (close > peakClose) peakClose = close;
      const takeProfit = close * BPS >= entryClose * (BPS + BigInt(TAKE_PROFIT_BPS));
      const trailed = close * BPS <= peakClose * (BPS - BigInt(TRAIL_BPS));
      const stopped = close * BPS <= entryClose * (BPS - BigInt(HARD_BPS));
      if (takeProfit || trailed || stopped) {
        const sell: OrderInput = { side: 'sell', symbol: SYMBOL, qty: held.qty, max_slippage_bps: MAX_SLIPPAGE_BPS };
        entryClose = null;
        peakClose = null;
        return [sell];
      }
      return [];
    }
    // Not holding (or a buy was rejected): clear stale entry state.
    if (held === undefined) {
      entryClose = null;
      peakClose = null;
    }
    // --- entry: flat, cash on hand, deep dip, and not in the final bars ---
    const lateWindow = barsSeen > WINDOW_BARS - NO_BUY_LAST_BARS;
    if (
      held === undefined &&
      !lateWindow &&
      state.cash >= BigInt(state.hello.fees.min_notional_quote_units) &&
      dipped(close)
    ) {
      const buy: BuyInput = { side: 'buy', symbol: SYMBOL, notional_quote_units: state.cash, max_slippage_bps: MAX_SLIPPAGE_BPS };
      entryClose = close;
      peakClose = close;
      return [buy];
    }
    return [];
  },
});
