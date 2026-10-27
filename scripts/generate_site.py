#!/usr/bin/env python3
"""Render a buildless academic website from profile.yaml and an HTML template."""

from __future__ import annotations

import argparse
from html import escape
import json
from pathlib import Path
from string import Template

from generate_profile_readme import load_profile


def e(value: object) -> str:
    return escape(str(value), quote=True)


def render(data: dict, template: str) -> str:
    def link(url: str, label: str) -> str:
        return f'<a href="{e(url)}">{e(label)}</a>'

    def record(title: str, subtitle: str, dates: str) -> str:
        return (f'<li class="record"><div><h3>{e(title)}</h3><p>{e(subtitle)}</p></div>'
                f'<span class="record__date">{e(dates)}</span></li>')

    research = []
    for area in data["research_areas"]:
        reference = (f'<p class="research__link">{link(area["link"], area["link_label"])}</p>'
                     if area.get("link") else "")
        research.append(f'<article class="research-item"><p class="eyebrow">{e(area["context"])}</p>'
                        f'<h3>{e(area["title"])}</h3><p>{e(area["description"])}</p>{reference}</article>')

    publications = []
    for paper in data["publications"]:
        authors = e(paper["authors"]).replace("Mathanker, A.", "<strong>Mathanker, A.</strong>")
        citation = f', {e(paper["citation"])}' if paper.get("citation") else ""
        status = f' · {e(paper["status"])}' if paper.get("status") else ""
        publications.append(
            f'<li class="publication" id="{e(paper["id"])}">'
            f'<h3>{link(paper["url"], paper["title"])}</h3>'
            f'<p class="publication__authors">{authors}</p>'
            f'<p class="publication__venue"><em>{e(paper["venue"])}</em>{citation} '
            f'({e(paper["year"])}){status}.</p></li>'
        )
    theses = "\n".join(
        f'<div class="thesis" id="{e(row["id"])}"><h3>{e(row["label"])}</h3>'
        f'<p>{link(row["url"], row["title"]) if row.get("url") else e(row["title"])}</p>'
        f'<p class="muted">{e(row["institution"])}, {e(row["year"])}.</p></div>'
        for row in data["theses"]
    )
    presentations = "\n".join(
        f'<li class="presentation"><h3>{e(row["title"])}</h3><p>{e(row["event"])}<br>'
        f'{e(row["location"])} · {e(row["year"])}</p></li>' for row in data["presentations"]
    )
    awards = "\n".join(
        f'<li><span>{link(row["url"], row["name"]) if row.get("url") else e(row["name"])}</span>'
        f'<span class="award__organization">{e(row["organization"])}</span></li>'
        for row in data["awards"]
    )
    person = {
        "@context": "https://schema.org", "@type": "Person", "name": data["name"],
        "url": data["links"]["website"], "jobTitle": data["title"],
        "image": data["site"]["base_url"] + "/" + data["profile_image"],
        "affiliation": [
            {"@type": "Organization", "name": "University of Chicago"},
            {"@type": "Organization", "name": "Argonne National Laboratory"},
        ],
        "sameAs": [data["links"]["scholar"], data["links"]["github"]],
    }
    values = {
        "name": e(data["name"]), "title": e(data["title"]), "affiliation": e(data["affiliation"]),
        "location": e(data["location"]), "description": e(data["description"]),
        "tagline": e(data["tagline"]), "image": e(data["profile_image"]),
        "base_url": e(data["site"]["base_url"]), "updated": e(data["site"]["updated"]),
        "year": e(data["site"]["updated"].split()[-1]),
        "bio": "\n".join(f"<p>{e(p)}</p>" for p in data["about_paragraphs"]),
        "research": "\n".join(research), "publications": "\n".join(publications),
        "theses": theses,
        "appointments": "\n".join(record(r["role"], r["institution"], r["dates"]) for r in data["appointments"]),
        "education": "\n".join(record(r["degree"], r["institution"], r["dates"]) for r in data["education"]),
        "presentations": presentations,
        "teaching": "\n".join(record(r["course"], r["role"] + " · " + r["institution"], r["dates"]) for r in data["teaching"]),
        "service": "\n".join(record(r["role"], r["organization"], r["dates"]) for r in data["service"]),
        "awards": awards,
        "person_json": json.dumps(person, ensure_ascii=False).replace("<", "\\u003c"),
        **{key: e(value) for key, value in data["links"].items()},
    }
    return Template(template).substitute(values)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Fail if checked-in HTML is out of date")
    args = parser.parse_args()
    root = Path(__file__).resolve().parent.parent
    output = render(load_profile(root), (root / "templates/index.html").read_text(encoding="utf-8"))
    target = root / "index.html"
    if args.check:
        if target.read_text(encoding="utf-8") != output:
            raise SystemExit("index.html is out of date. Run python scripts/generate_site.py")
        print("index.html matches profile.yaml and templates/index.html")
    else:
        with target.open("w", encoding="utf-8", newline="\n") as stream:
            stream.write(output)
        print("Generated index.html")


if __name__ == "__main__":
    main()
