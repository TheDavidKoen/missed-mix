# Changelog

All notable changes to this application are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.0.0] - 2026-09-21

### Added

- Accounts with a username and password, hashed with PBKDF2 and held in a signed session cookie
- Profiles with a name, a quote, an avatar and six taste picks searched from the Spotify catalogue
- Mixers: every other profile, each showing the song its owner has marked as current
- Vibrations: one per pair, carrying a song, which the recipient accepts to open a conversation
- Private conversations between the two participants, with an unread badge in the navigation
- A dock that expands into a stack sheet describing what the app runs on, and a link out
- The Missed Mix mark across the header, favicon, install icons and link preview card
- Security headers with a nonce-based Content Security Policy, set at the edge on every response
- CI with type checks, Biome, unit tests, a performance budget, a dependency audit and Lighthouse, plus tagged GitHub releases
