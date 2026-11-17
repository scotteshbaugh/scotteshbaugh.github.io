#!/usr/bin/env python3
"""
md-to-json.py — rebuild resume.json and coverletter.json from their .md sources.

Usage:
  python3 data/resume/md-to-json.py          # convert only files whose .md changed
  python3 data/resume/md-to-json.py --force  # convert everything

FROM (source):  02 Portfolio/source-content/      resume.md, coverletter.md
TO   (target):  this folder (data/resume/)        resume.json, coverletter.json

The .md files in source-content are what you edit; the .json files here are
generated output. Never hand-edit the .json. A file is skipped when its .json
is already newer than its .md, so it's safe to run any time.

If the repo or source-content folder moves, update FROM_DIR below.
"""
import json, os, re, sys

TO_DIR = os.path.dirname(os.path.abspath(__file__))  # data/resume/ in the repo
REPO_ROOT = os.path.dirname(os.path.dirname(TO_DIR))
# Repo lives at 02 Portfolio/github/scotteshbaugh; source-content sits at 02 Portfolio/source-content.
# The second candidate covers setups where both folders sit side by side (e.g. Claude's mounts).
_CANDIDATES = [
    os.path.join(REPO_ROOT, "..", "..", "source-content"),
    os.path.join(REPO_ROOT, "..", "source-content"),
]
FROM_DIR = next((os.path.normpath(c) for c in _CANDIDATES if os.path.isdir(c)),
                os.path.normpath(_CANDIDATES[0]))

RESUME_SECTIONS = {  # "## heading" -> (json key, field that holds the ### text)
    "About me": ("aboutMe", None),
    "Experience": ("experience", "company"),
    "Education": ("education", "school"),
    "Publications": ("publications", "title"),
    "Skills": ("skills", None),
    "Selected projects": ("selectedProjects", "title"),
}
FIELD = re.compile(r"^([A-Z][A-Za-z]*):\s*(.*)$")  # one-word labels only


def strip_comments(text):
    return re.sub(r"<!--.*?-->", "", text, flags=re.S)


def split_frontmatter(text):
    m = re.match(r"^---\n(.*?)\n---\n", text, flags=re.S)
    if not m:
        return {}, text
    meta = {}
    for line in m.group(1).splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            meta[k.strip()] = v.strip()
    return meta, text[m.end():]


def blocks(text, marker):
    """Split text on lines starting with marker; returns [(title, body)]."""
    out, title, buf = [], None, []
    for line in text.splitlines():
        if line.startswith(marker + " "):
            if title is not None:
                out.append((title, "\n".join(buf)))
            title, buf = line[len(marker) + 1:].strip(), []
        elif title is not None:
            buf.append(line)
    if title is not None:
        out.append((title, "\n".join(buf)))
    return out


def parse_body(body):
    """Return (fields, paragraphs, named_lists, bullets) for an entry or section body."""
    fields, paras, lists, bullets = {}, [], {}, []
    para, current = [], None
    for line in body.splitlines() + [""]:
        s = line.strip()
        if not s:
            if para:
                paras.append(" ".join(para)); para = []
            continue
        if s.startswith("- "):
            (lists[current] if current else bullets).append(s[2:].strip())
            continue
        m = FIELD.match(s)
        if m and not para:
            key = m.group(1)[0].lower() + m.group(1)[1:].replace(" ", "")
            if m.group(2):
                fields[key] = m.group(2)
            else:  # "Coursework:" starts a named list
                current = key; lists[key] = []
            continue
        current = None
        para.append(s)
    return fields, paras, lists, bullets


def convert_resume(md):
    header, rest = split_frontmatter(strip_comments(md))
    out = {"header": header}
    for heading, body in blocks(rest, "##"):
        if heading not in RESUME_SECTIONS:
            sys.exit(f"resume.md: unknown section '## {heading}'")
        key, name_field = RESUME_SECTIONS[heading]
        top = body.split("\n### ")[0]
        fields, paras, _, bullets = parse_body(top)
        if key == "aboutMe":
            out[key] = {"heading": heading, "body": paras}
        elif key == "skills":
            out[key] = [{"key": b.split(":", 1)[0].strip(), "label": b.split(":", 1)[1].strip()} for b in bullets]
        else:
            section = {"heading": heading, **fields}
            items = []
            for title, ebody in blocks(body, "###"):
                f, p, l, b = parse_body(ebody)
                item = {name_field: title, **f}
                if "skills" in item:
                    item["skills"] = [s.strip() for s in item["skills"].split(",")]
                if p:
                    item["description"] = " ".join(p)
                item.update(l)
                if b:
                    item["list"] = b
                items.append(item)
            section["list"] = items
            out[key] = section
    return out


def convert_coverletter(md):
    args = []
    for title, body in blocks(strip_comments(md), "###"):
        _, paras, _, _ = parse_body(body)
        args.append({"claim": title, "proofPoint": " ".join(paras)})
    return {"arguments": args}


def run(name, converter, force):
    src, dst = os.path.join(FROM_DIR, name + ".md"), os.path.join(TO_DIR, name + ".json")
    if not os.path.exists(src):
        print(f"{name}: no {name}.md found in {FROM_DIR}")
        return
    if not force and os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src):
        print(f"{name}: up to date")
        return
    with open(src, encoding="utf-8") as f:
        data = converter(f.read())
    with open(dst, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"{name}: synced {name}.md -> {name}.json")


if __name__ == "__main__":
    force = "--force" in sys.argv
    run("resume", convert_resume, force)
    run("coverletter", convert_coverletter, force)
