#!/usr/bin/env python3
"""Tell al-islam.org's generic drawn cover (patterned background, big title, a full-width dark-grey band with the
author's name, "Al-Islam.org" badge) from a real book cover.  Every such cover has that dark-grey band, which real
covers essentially never have, so: if a stretch of rows (>= 5% of the height) is mostly dark neutral grey across the
whole width, it is the generic one.
Usage:  python3 scripts/is_alislam_filler.py file.jpg [more.jpg ...]   -> prints "filler" or "real" per file
"""
import sys
import cv2
import numpy as np


def is_filler(path: str) -> bool:
    im = cv2.imread(path)
    if im is None:
        return False
    h, w = im.shape[:2]
    px = im.astype(int)
    grey = (np.abs(px[:, :, 0] - px[:, :, 1]) < 14) & (np.abs(px[:, :, 1] - px[:, :, 2]) < 14) & (px.mean(axis=2) < 85) & (px.mean(axis=2) > 25)
    rows = grey.mean(axis=1) > 0.3  # a good part of the row is dark grey (the band's big white text breaks it up)
    # find the longest run of such rows
    run = best = end = 0
    for i, r in enumerate(rows):
        run = run + 1 if r else 0
        if run > best:
            best, end = run, i
    top, bottom = end - best + 1, end
    if not (0.05 * h <= best <= 0.14 * h and 0.45 * h <= (top + bottom) / 2 <= 0.72 * h):
        return False  # real covers: no such narrow band at about the middle
    gray = im.mean(axis=2)
    above = gray[: max(1, top - 2), :].mean()   # the pale patterned paper above the band ...
    below = gray[bottom + 3 : int(h * 0.97), :].mean() if bottom + 3 < int(h * 0.97) else 0  # ... and below it
    return above > 150 and below > 150


if __name__ == "__main__":
    for p in sys.argv[1:]:
        print(p, "filler" if is_filler(p) else "real")
