# VestPayouts

VestPayouts is an independent record of payouts from [Vest](https://www.vestmarkets.com/), published at [vestpayouts.com](https://vestpayouts.com). The name is the topic the site ranks for: Vest payouts. It is not "Vest Official", and it does not use Vest's logo, wordmark, or a lone V.

Because the name contains "Vest", the independence line is part of the brand, not a footnote. The header of every page says "Independent tracker. Not affiliated with or endorsed by Vest." The same sentence leads the footer and the about page.

## Mark

The mark is a receipt with a folded corner and two mint amount lines, on an ink square. It reads as a payout record, not as Vest's logo and not as a menu icon.

- Icon: [`public/brand/vestpayouts-mark.svg`](public/brand/vestpayouts-mark.svg) (also `src/app/icon.svg`)
- Lockup: [`public/brand/vestpayouts-logo.svg`](public/brand/vestpayouts-logo.svg)
- Wordmark: **Vest** in paper white, **Payouts** in mint. Space Grotesk, semibold, tight tracking. One word, VestPayouts.

Don't redraw the mark as Vest's logo, a shield, a checkmark, or a dollar sign. Don't set the wordmark in all caps. Don't put the word "official" next to it.

## Color

The site is dark. Mint is reserved for money, proof and the primary action. Amber is reserved for warnings and for anything that is sample data. Coral is for errors.

| Token | Hex | Use |
| --- | --- | --- |
| Ink 950 | `#07090a` | Page background |
| Ink 900 | `#0d1112` | Cards, header |
| Ink 850 | `#12181a` | Raised panels |
| Ink 800 | `#1a2225` | Hover, chips |
| Ink 700 | `#263135` | Hairline borders, inputs |
| Paper | `#eef3f1` | Text |
| Fog | `#94a3a0` | Secondary text (muted is `#9aaaa6`) |
| Mint | `#3ee0a1` | Payout amounts, primary buttons, links |
| Mint 300 | `#8ff0c6` | Mint on code |
| Mint 600 | `#1fae78` | Pressed mint |
| Amber | `#f6bd4f` | Independence notice, sample data, reported (unverified) payouts |
| Coral | `#ff7a6b` | Errors, destructive actions |
| Base blue | `#9bbcff` | The Base chain badge |
| Arbitrum blue | `#8fd0ff` | The Arbitrum chain badge |

Primary buttons are mint with ink text (`#04140d`), not white text on mint. Don't introduce a second accent.

## Type

- **Space Grotesk** for headings. Weights 500–700. Tight tracking.
- **Inter** for body. 16–17px, relaxed line height.
- **JetBrains Mono** for amounts, addresses, transaction hashes and any number a reader might compare. Always `tabular-nums`.

Amounts that are payouts are mint and prefixed with `+` in the live feed. Totals are mint only when they are the headline figure.

## Voice

Plain, specific, a little dry. Write like a person who has read the transaction, not like a prop-firm landing page.

- Say "Vest paid $1,250 in USDC to 0x1a65…1736". Don't say "traders are crushing it".
- Name the mechanism. "Claim Profit, then withdraw" is better than "fast payouts".
- When a number is live, show the window ("last 30 days") next to it.
- When a number is sample data, say so in the same breath. Never let a placeholder sit next to a real-looking wallet.
- Short sentences. No exclamation marks. No "welcome to".
- Refer to Vest by name and link their docs when a rule comes from them. Don't paste their terms.

Words we don't use: "official", "guaranteed", "risk-free", "the #1 prop firm", "to the moon".

## Disclaimers

The independence line is in the sticky header, in an amber panel in the footer, and at the top of About. The affiliate line sits in the footer legal block and on `/disclosure`.

**Not affiliated.** VestPayouts is an independent tracker. It is not affiliated with, endorsed by, or operated by Vest, Vest Markets, Vest Labs or Vest Exchange. "Vest" is used only to describe the platform whose public payout data we track.

**Affiliate disclosure.** Some links on this site are referral links. If you sign up to Vest through them, we may earn a commission at no extra cost to you. It never changes the payout data we show.

A risk line sits under those: leveraged trading can wipe out the fee, most evaluations are not passed, and past payouts to other traders don't predict yours. Nothing on the site is financial advice.

The full versions live at `/disclosure`, `/terms` and `/privacy`.
