# SplitVault 💰

A personal finance mobile app built with React Native and Expo, designed to help users manage their money by splitting funds between a Savings wallet and an Expense wallet.

---

## Overview

SplitVault is built around a simple but powerful concept — your money lives in two separate wallets:

- 🐷 **Savings** — where all income lands first. This is your protected fund.
- 💳 **Expense** — where you intentionally move money when you're ready to spend.

This structure encourages mindful spending by forcing users to be deliberate about how much they allocate for expenses, rather than spending from a single pool.

---

## Features

- **Dual Wallet System** — Separate Savings and Expense wallets with real-time balances
- **Add Income** — All income goes directly to Savings
- **Add Expense** — Deduct from either wallet with category tagging
- **Transfer Funds** — Move money between wallets in either direction with live preview
- **Transaction History** — Full history with filtering by type and wallet
- **Savings Goals** — Create goals with target amounts and track progress against your Savings balance
- **Low Balance Warnings** — Visual alerts when your Expense wallet is empty or running low
- **Persistent Storage** — All data is stored locally on-device via AsyncStorage
- **Settings** — Reset app, clear transaction history, or clear goals

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile Framework | Expo (SDK 54) + React Native |
| Language | JavaScript (JSX) |
| Navigation | @react-navigation/native + @react-navigation/bottom-tabs + @react-navigation/stack |
| Storage | AsyncStorage |
| Icons | @expo/vector-icons (Ionicons) |
| Biometrics (planned) | expo-local-authentication |
| Secure Storage (planned) | expo-secure-store |

---

## Design Decisions

- Income always goes to **Savings first** — users transfer to Expense when ready to spend
- Currency is set to **Philippine Peso (₱)**
- Dark theme UI optimized for mobile readability
- Categories: Food, Games, Transport, Shopping, Needs, Wants, Health, Other

---

## Status

🚧 **Currently in active development** — core features are complete and functional. The following are planned for upcoming releases:

- PIN / biometric lock screen
- Budget limits per category
- Recurring transactions
- Monthly analytics and charts
- Data export (CSV / JSON)
- Google Drive backup
- Light mode toggle
- Play Store release via EAS Build

---

## Author

**Kurt Carcueva** — [@Icession](https://github.com/Icession)
