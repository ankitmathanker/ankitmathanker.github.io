#!/usr/bin/env python3
"""Generate the GitHub profile README from the website's shared content."""

from __future__ import annotations

import argparse
from pathlib import Path

import yaml


def load_profile(repo_root: Path) -> dict:
    with (repo_root / "profile.yaml").open(encoding="utf-8") as stream:
        return yaml.safe_load(stream)


def render(data: dict) -> str:
    links = data["links"]
    lines = [
        "<!-- Generated from profile.yaml in ankitmathanker/ankitmathanker.github.io. -->", "",
        f"# {data['name']}", "", f"**{data['title']}**  ", data["affiliation"], "",
        f"[Website]({links['website']}) · [CV (PDF)]({links['cv']}) · "
        f"[Google Scholar]({links['scholar']}) · [Email](mailto:{links['email']})", "",
        *[paragraph + "\n" for paragraph in data["about_paragraphs"][:2]],
        "## Research", "",
    ]
    for area in data["research_areas"]:
        lines.append(f"- **{area['title']}.** {area['description']}")
    lines.extend(["", "## Recent publications", ""])
    for paper in data["publications"][:3]:
        citation = f", {paper['citation']}" if paper.get("citation") else ""
        lines.append(f"- [{paper['title']}]({paper['url']}). "
                     f"*{paper['venue']}*{citation} ({paper['year']}).")
    lines.extend(["", f"[Full publication list]({links['website']}#publications)", "", "## Theses", ""])
    for thesis in data["theses"]:
        title = (f"[{thesis['title']}]({thesis['url']})"
                 if thesis.get("url") else thesis["title"])
        lines.append(f"- **{thesis['label']}:** {title}. "
                     f"{thesis['institution']} ({thesis['year']}).")
    lines.extend(["", "## Education", ""])
    for row in data["education"]:
        lines.append(f"- **{row['degree']}** — {row['institution']}, {row['dates']}")
    lines.extend(["", "## Academic service", ""])
    for row in data["service"]:
        lines.append(f"- **{row['role']}** — {row['organization']}, {row['dates']}")
    return "\n".join(lines).rstrip() + "\n"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", "-o", type=Path)
    parser.add_argument("--repo-root", type=Path)
    args = parser.parse_args()
    root = args.repo_root or Path(__file__).resolve().parent.parent
    text = render(load_profile(root))
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        with args.output.open("w", encoding="utf-8", newline="\n") as stream:
            stream.write(text)
    else:
        print(text, end="")


if __name__ == "__main__":
    main()
