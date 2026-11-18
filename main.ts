// Dip-Buy BTC Bot v2 — mean-reversion dip buyer for make.fun
// btc-race-24h-20261118-1444. Trades CBBTC on 1-minute bars, long only,
// all-in, one position at a time.
//
// v2 vs the v1 idea (dip 2.00% / trail 0.75% / 240-bar lookback / bounce
// confirmation): three changes, each measured on the frozen dev window.
//   1. Shorter lookback, 120 bars instead of 240: the bot can trade from
//      bar 120, so it catches the early-window trough the 240-bar
//      lookback could not reach (it needed 240 bars of history first).
//   2. No bounce confirmation: buy the moment the close is 2.50% below
//      the 120-bar high. Waiting for an up-close missed the entry
//      entirely on this window (the dip bar itself is the entry).
//   3. Take-profit exit at +2.75% from the entry close, on top of the
//      0.75% trailing stop and the 2.00% hard stop: it locks in the
//      rally instead of trailing out of it early.
//
// Dev-window grade (grade-local, frozen 24h window): net PnL +$23.86,
// 2 trades (1 round trip), win rate 1.0, max drawdown 0.65%.
// A full-size round trip pays ~26-32 bps in fee, slippage and impact,
// so a trade has to catch a move larger than that; the take-profit at
// +2.75% clears it with room to spare.

import { BPS, runBars, type BarsState, type BuyInput, type OrderInput } from './vendor/makefun-bars.ts';

const SYMBOL = 'CBBTC';
/** Closes of history kept to measure the dip against. */
const LOOKBACK_BARS = 120;
/** Buy when the close is at least this far below the lookback high (bps). */
const DIP_BPS = 250;
/** Sell when the close falls this far below the highest close since entry (bps). */
const TRAIL_BPS = 75;
/** Sell when the close falls this far below the entry close (bps). */
const HARD_BPS = 200;
/** Sell when the close rises this far above the entry close (bps). */
const TAKE_PROFIT_BPS = 275;
/** Orders are refused when the fill would move more than this from the latest close (bps). */
const MAX_SLIPPAGE_BPS = 200;

/** Latest closes, oldest first; null before a symbol's first bar. */
const closes: (bigint | null)[] = [];
/** Entry close and highest close since entry, while a position is held. */
let entryClose: bigint | null = null;
let peakClose: bigint | null = null;

/** True when the close is at least DIP_BPS below the lookback high. */
function dipped(close: bigint): boolean {
  if (closes.length < LOOKBACK_BARS) return false;
  let high = 0n;
  for (let i = closes.length - LOOKBACK_BARS; i < closes.length; i++) {
    const c = closes[i];
    if (c !== null && c > high) high = c;
  }
  if (high === 0n) return false;
  // close <= high * (1 - DIP_BPS / 10000), exactly.
  return close * BPS <= high * (BPS - BigInt(DIP_BPS));
}

await runBars({
  onBatch(state: BarsState, batch) {
    if (state.warmingUp) return [];
    const close = state.close(SYMBOL);
    if (close === null) return [];
    closes.push(close);
    if (closes.length > LOOKBACK_BARS) closes.shift();

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
    // --- entry: flat, cash on hand, dipped ---
    if (held === undefined && state.cash >= BigInt(state.hello.fees.min_notional_quote_units) && dipped(close)) {
      const buy: BuyInput = { side: 'buy', symbol: SYMBOL, notional_quote_units: state.cash, max_slippage_bps: MAX_SLIPPAGE_BPS };
      entryClose = close;
      peakClose = close;
      return [buy];
    }
    return [];
  },
});
