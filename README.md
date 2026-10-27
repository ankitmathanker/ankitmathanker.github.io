# Ankit Mathanker — academic website

Personal academic website for Ankit Mathanker, Postdoctoral Scholar at the University of Chicago / Argonne National Laboratory. Published at [ankitmathanker.github.io](https://ankitmathanker.github.io/).

The site uses static HTML, CSS, and a small script for the mobile menu. Visitors need no JavaScript to read the content, follow links, or access the CV. There are no runtime dependencies, external fonts, or build requirements for GitHub Pages.

## Updating content

`profile.yaml` contains the biography, appointments, education, publications, presentations, teaching, service, awards, and links. Both the website and GitHub profile README use this file.

```sh
python3 -m pip install -r requirements-generate.txt
python3 scripts/generate_site.py
python3 scripts/generate_profile_readme.py --output profile_readme.md
python3 scripts/generate_site.py --check
```

Commit `profile.yaml` and the regenerated `index.html`. The profile sync workflow generates the README for [ankitmathanker/ankitmathanker](https://github.com/ankitmathanker/ankitmathanker) when content changes land on `main`. It requires the existing `PROFILE_REPO_TOKEN` repository secret with content write access to that profile repository.

Publication entries distinguish preprints and in-press articles; the master's thesis is listed separately. Use publisher or arXiv author lists when a citation in the CV is abbreviated or differs from the public record. Source details for the October 2026 update are in [CONTENT_NOTES.md](CONTENT_NOTES.md).

## Replacing the CV

Replace `assets/CV_AnkitMathanker.pdf` in place. All website and profile README links use that stable path. Update `profile.yaml` to reflect any changed role, dates, contact details, or publications, then regenerate the HTML. The PDF itself is not rewritten by the generators.

## Design and files

| File | Purpose |
| --- | --- |
| `profile.yaml` | Shared public content |
| `templates/index.html` | Page structure and metadata |
| `scripts/generate_site.py` | Generates the checked-in `index.html` |
| `scripts/generate_profile_readme.py` | Generates the GitHub profile README |
| `css/style.css` | Responsive layout, typography, and print styles |
| `js/main.js` | Accessible mobile navigation |
| `img/photo-real.png` | Existing portrait |
| `assets/CV_AnkitMathanker.pdf` | Current CV |

The previous background script, alternate portrait, simulation image, and graphical abstracts remain in the repository as unused assets. The current page does not load them.

## Preview and deployment

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open [the local preview](http://127.0.0.1:4173/). Check desktop and mobile layouts, navigation, publication links, and the CV before publishing. Run the generator with `--check` to verify that the HTML matches the shared content and template. Push the generated files to `main`; GitHub Pages serves the repository root.

## License

Site content © Ankit Mathanker. Code may be reused with attribution for personal academic sites.
