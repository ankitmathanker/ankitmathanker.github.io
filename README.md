# ankitmathanker.github.io

Static academic portfolio for **Ankit Mathanker** (PhD Candidate, Chemical Engineering & Scientific Computing, University of Michigan). Hosted with [GitHub Pages](https://pages.github.com/) at [ankitmathanker.github.io](https://ankitmathanker.github.io).

## Structure

- `index.html` — Single-page layout (semantic HTML5)
- `css/style.css` — All styling (dark theme, glass cards, responsive grid)
- `js/main.js` — Particle background, mobile nav, photo toggle, smooth scrolling
- `img/` — Profile and simulation images (see below)
- `assets/CV_AnkitMathanker.pdf` — Curriculum vitae (replace when you update your CV)

No build step, frameworks, or npm — open `index.html` locally or push to GitHub.

## CV

Update the PDF at `assets/CV_AnkitMathanker.pdf` when your CV changes. Links are in the nav (**CV**), hero (**Download CV**), and Contact section.

## Images to add

Place these files in `img/`:

| File | Purpose |
|------|---------|
| `photo-real.png` | Default profile photo (hero) |
| `photo-ghibli.png` | Alternate photo (use the **Toggle photo** button) |
| `simulation.png` | Full-width simulation showcase |

If you rename files or switch to JPEG, update the `<img>` `src` in `index.html` and the `PHOTO_PATHS` array at the top of `js/main.js`.

## Social links

In `index.html`, search for `TODO: add` — replace the placeholder LinkedIn URL if needed. Google Scholar and GitHub links are set in the Contact section. Publication titles link to DOIs or arXiv where applicable.

## Deploy

Push to the `main` branch of `github.com/ankitmathanker/ankitmathanker.github.io`. GitHub Pages serves `index.html` from the repository root automatically.

## License

Site content © Ankit Mathanker. Code in this repository may be reused with attribution for personal academic sites.
