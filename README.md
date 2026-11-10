# Lamp Bible

A fast, installable Bible reader built as a Progressive Web App. It works offline, supports multiple translations, and keeps your highlights and bookmarks in sync across every version you read.

No frameworks, no build step. Plain HTML, CSS and JavaScript.

> **About the Bible text:** I did not write, translate or edit any of the Bible text in this project. The bundled translations were downloaded from public online sources and converted into the app's JSON format. GNT and NCV are not included in the repository at all; they are fetched live from API.Bible by each user. See [Bible text sources](#bible-text-sources) for the full list.

## Features

- **Seven translations.** Five public-domain versions ship with the app. Two copyrighted versions stream through API.Bible.
- **Lazy loading.** The app reads a small manifest first, then downloads only the translation the reader picks.
- **Offline reading.** Any translation you open once keeps working without a connection.
- **Installable.** Add it to the home screen on Android, iOS or desktop and it opens like a native app.
- **Compare view.** Tap a verse and see it in every translation side by side.
- **Search.** Full-text search within the current translation, filtered by Old or New Testament. Typing a reference like `ps 23` or `John 3:16` jumps straight to it.
- **Highlights and bookmarks.** Three highlight colors plus bookmarks, saved by canonical reference so they carry over when you switch translations.
- **Verse of the day** and a **Gospels reading plan** with progress tracking.
- **Reading comfort.** Adjustable text size, light and dark themes, keyboard navigation with the arrow keys.

## Translations

| Abbr | Name | Year | Source | License |
|------|------|------|--------|---------|
| BSB | Berean Standard Bible | 2022 | Bundled file | Public domain |
| WEB | World English Bible | 2020 | Bundled file | Public domain |
| KJV | King James Version | 1769 | Bundled file | Public domain |
| ASV | American Standard Version | 1901 | Bundled file | Public domain |
| BBE | Bible in Basic English | 1965 | Bundled file | Public domain |
| GNT | Good News Translation | 1992 | API.Bible | Copyright American Bible Society |
| NCV | New Century Version | 2005 | API.Bible or licensed file | Copyright Thomas Nelson |

BSB is the default.

## Quick start

Clone the repo and serve the folder with any static server. The app needs to be served over HTTP, because opening `index.html` directly from disk blocks the data files from loading.

```bash
git clone https://github.com/<your-username>/lamp-bible.git
cd lamp-bible

# any one of these
npx serve .
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

Service workers only run on `localhost` or over HTTPS, so offline mode and installation won't work from a LAN IP address during development.

## Project structure

```
lamp-bible/
├── index.html              App markup, styles and logic
├── manifest.webmanifest    PWA install metadata
├── sw.js                   Service worker for offline caching
├── icon.svg                App icon
├── README.md
├── LICENSE
└── data/
    ├── versions.json       List of available translations
    ├── bsb.json
    ├── web.json
    ├── kjv.json
    ├── asv.json
    └── bbe.json
```

## How translations are loaded

On startup the app fetches `data/versions.json`. Each entry describes one translation and says where its text comes from:

```json
{
  "default": "bsb",
  "versions": [
    {
      "id": "bsb",
      "abbreviation": "BSB",
      "name": "Berean Standard Bible",
      "year": 2022,
      "license": "Public domain",
      "source": { "type": "file", "url": "data/bsb.json" }
    },
    {
      "id": "gnt",
      "abbreviation": "GNT",
      "name": "Good News Translation",
      "year": 1992,
      "license": "Copyright American Bible Society. Streamed through API.Bible.",
      "source": { "type": "apibible", "abbreviation": "GNT", "bibleId": null }
    }
  ]
}
```

Source URLs are relative to the app's root, not to the manifest.

### Translation file format

Every bundled translation uses the same structure:

```json
{
  "id": "bsb",
  "abbreviation": "BSB",
  "name": "Berean Standard Bible",
  "year": 2022,
  "language": "en",
  "license": "Public domain",
  "books": [
    {
      "id": "GEN",
      "name": "Genesis",
      "chapters": [
        ["In the beginning God created the heavens and the earth.", "Now the earth was formless and void..."],
        ["..."]
      ]
    }
  ]
}
```

A few rules keep translations interchangeable:

- Books use standard [USFM codes](https://ubsicap.github.io/usfm/identification/books.html) such as `GEN`, `PSA`, `JHN` and `REV`.
- Each verse sits at index `verse number - 1` in its chapter array.
- A verse that a translation omits is stored as an empty string, so the numbering never shifts.
- All 66 books must be present, in canonical order.

Highlights and bookmarks are stored by reference (`JHN.3.16`), never by array position. That's what lets them follow the reader from one translation to another.

## Adding a translation

### From a file

Use this for public-domain text or text you hold a distribution license for.

1. Convert the text to the format above and save it as `data/<id>.json`.
2. Add an entry to `data/versions.json`:

   ```json
   {
     "id": "ylt",
     "abbreviation": "YLT",
     "name": "Young's Literal Translation",
     "year": 1898,
     "license": "Public domain",
     "source": { "type": "file", "url": "data/ylt.json" }
   }
   ```

3. Bump the `SHELL` cache name in `sw.js` so returning users pick up the new manifest.

### From API.Bible

Add an entry with `"type": "apibible"` and the translation's abbreviation. On first use the app looks up the matching Bible ID for the user's API key and caches it. If you already know the ID, set `bibleId` and the lookup is skipped.

```json
"source": { "type": "apibible", "abbreviation": "GNT", "bibleId": null }
```

### From another provider

Text sources are pluggable. In `index.html`, add an entry to the `sources` object with three functions:

| Function | Returns |
|----------|---------|
| `ready(version)` | `true` if the source can be used right now, for example when a required key is set |
| `chapter(version, bookIndex, chapterIndex)` | `{ verses: [...], copyright: "..." }` |
| `search(version, query, [startBook, endBook])` | `{ hits: [[book, chapter, verse, text], ...], total }` |

Then use the new name as `source.type` in `versions.json`. Per-book files, IndexedDB storage or your own backend API can all be added this way.

## Using GNT and NCV

**Good News Translation** is published by the American Bible Society, which runs API.Bible.

1. Create a free account at [api.bible](https://api.bible).
2. Request access to the Good News Translation from your dashboard.
3. In the app, tap the translation badge at the top, paste your key and choose **Save key**.

**New Century Version** is published by Thomas Nelson (HarperCollins Christian Publishing). Its free-use terms allow quoting a few hundred verses but never a complete book, so a full reader needs a written license. Once you have one, plug it in as a file source or through whatever API the publisher provides. The Everyday Bible and Sunday editions use the same NCV text.

### Production note on API keys

The starter stores the API.Bible key in the browser's local storage, which is fine for personal use and prototyping. For a public deployment, put a small server-side proxy in front of API.Bible so the key never reaches the client, and point the `apibible` source's `base` URL at your proxy.

## Offline behavior

The service worker uses a different strategy for each kind of request:

| Request | Strategy |
|---------|----------|
| App shell (`index.html`, icon, manifest) | Cached at install, served from cache |
| `data/versions.json` | Network first, falls back to cache |
| Translation files in `data/` | Cached on first open, served from cache after that |
| API.Bible requests | Always network, never cached |

API.Bible responses are left out of the cache on purpose. Storing licensed text on the device could conflict with the publishers' terms.

## Deployment

Any static host with HTTPS works:

- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages

Make sure the host serves `.json` files with gzip or brotli compression. Each translation drops from about 4 MB to about 1.2 MB over the wire.

### GitHub Pages

1. Push the repository to GitHub.
2. Go to **Settings > Pages**.
3. Set the source to the `main` branch and the root folder.
4. The app will be live at `https://<your-username>.github.io/lamp-bible/`.

All paths in the app are relative, so it works from a subfolder without changes.

## Browser support

Recent versions of Chrome, Edge, Firefox and Safari, on desktop and mobile. Installation prompts differ by platform:

- **Android and desktop Chrome or Edge:** use the install icon in the address bar or the browser menu.
- **iOS Safari:** tap Share, then **Add to Home Screen**.

## Data and privacy

Everything a reader creates stays on their device in local storage:

- Highlights
- Bookmarks
- Reading position
- Plan progress
- Settings

There are no accounts, no analytics and no tracking. Clearing site data in the browser removes all of it.

## Roadmap

- Notes attached to verses
- Export and import of highlights, bookmarks and notes
- More reading plans: whole Bible in a year, chronological, Psalms and Proverbs
- Text-to-speech with verse-by-verse highlighting
- Per-book data files for lighter first loads
- Shareable verse images
- Optional account sync

## Bible text sources

The Bible text in this project is not my own work. All of it comes from the publishers and open data projects listed below. My only contribution is converting the bundled files into a common JSON format so the app can read them.

### Bundled translations

| Translation | Original publisher | Downloaded from | License |
|-------------|--------------------|-----------------|---------|
| Berean Standard Bible (BSB) | Berean Bible Translation Committee | [bereanbible.com/bsb.txt](https://bereanbible.com/bsb.txt) | Public domain |
| World English Bible (WEB) | Michael Paul Johnson and volunteers, via eBible.org | [ebible.org/Scriptures/engwebp_vpl.zip](https://ebible.org/Scriptures/engwebp_vpl.zip) | Public domain |
| King James Version (KJV), 1769 Blayney edition | Originally commissioned by King James I, 1611 | [github.com/farskipper/kjv](https://github.com/farskipper/kjv) (`json/verses-1769.json`) | Public domain |
| American Standard Version (ASV), 1901 | Thomas Nelson & Sons, 1901 | [github.com/scrollmapper/bible_databases](https://github.com/scrollmapper/bible_databases) (`formats/json/ASV.json`) | Public domain |
| Bible in Basic English (BBE), 1965 | Samuel Henry Hooke | [github.com/scrollmapper/bible_databases](https://github.com/scrollmapper/bible_databases) (`formats/json/BBE.json`) | Public domain |

### Streamed translations

These are never stored in the repository or cached on the device. Each user loads them from API.Bible with their own key.

| Translation | Copyright holder | Accessed through |
|-------------|------------------|------------------|
| Good News Translation (GNT) | American Bible Society | [API.Bible](https://api.bible) |
| New Century Version (NCV) | Thomas Nelson / HarperCollins Christian Publishing | [API.Bible](https://api.bible), or another source once licensed |

### What was changed during conversion

The wording of the text was not changed. The conversion only touched formatting:

- Restructured each source into the same JSON layout, using USFM book codes.
- **KJV:** removed the square brackets that mark words added by the translators, and removed the `#` paragraph markers.
- **WEB:** kept only the 66 books of the Protestant canon and left out the Deuterocanonical books included in the source file.
- **BSB:** removed the header lines at the top of the source file and renamed "Psalm" to "Psalms" to match the other files.
- Collapsed repeated whitespace inside verses.
- Where a source has no text for a verse, stored an empty string so verse numbers stay aligned.

If you find an error in a verse, check it against the original source above first. If the original has the same text, the issue belongs to that source, not this app.

## License

The MIT License covers only the application code (HTML, CSS, JavaScript and the service worker). It does not cover the Bible texts. The bundled translations are in the public domain and belong to no one, including me. GNT and NCV text remains the property of their publishers and is not distributed with this project.
