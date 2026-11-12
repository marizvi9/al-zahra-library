#!/usr/bin/env python3
"""Work out how each author photo should be framed in its round badge.

For every author with a photo in data/authors.json this:
  1. finds the face with OpenCV's YuNet detector (model file: --model),
  2. widens the face box to the whole head: forehead and headwear above, beard and chin below,
  3. stores that head box ("head": x0, y0, x1, y1, in percent of the image) and, from it,
     the focal point and zoom: "focus": {"x", "y", "zoom"}  (x, y = centre of the head; zoom 1 = the
     photo's shorter side fills the circle, above 1 = closer in, below 1 = reaches past the photo's edge).

The site then draws the badge so the whole head fits inside the circle with some breathing room
(see badgeStyle in src/lib/authorPhotos.ts). A "head" box that is already in the file is kept, so
boxes checked or corrected by hand are never overwritten, unless you pass --redo.

Needs:  python3 -m venv v && v/bin/pip install opencv-python-headless numpy
        and the YuNet model (face_detection_yunet_2023mar.onnx from github.com/opencv/opencv_zoo).
Run:    v/bin/python scripts/frame_author_photos.py --model path/to/yunet.onnx [--redo]
"""
import argparse
import json
import os
import sys

import cv2

FILE = "data/authors.json"
# How much of the circle's width/height the head may fill (leaves breathing room all round).
HEAD_H_IN_CIRCLE = 0.84
HEAD_W_IN_CIRCLE = 0.78
MAX_ZOOM = 4.0
# Below 1 the circle reaches past the photo's edge (the site fills that with a soft blur of the same photo),
# which is the only way to fit a head that already fills the whole picture.
MIN_ZOOM = 0.62


def detect(det, img):
    h, w = img.shape[:2]
    scale = 1.0
    if max(w, h) > 1200:  # keep the detector fast on big photos
        scale = 1200 / max(w, h)
        img = cv2.resize(img, (int(w * scale), int(h * scale)))
    det.setInputSize((img.shape[1], img.shape[0]))
    det.setScoreThreshold(0.5)
    _, faces = det.detect(img)
    if faces is None or len(faces) == 0:
        return None
    f = max(faces, key=lambda r: r[2] * r[3] * r[-1])  # biggest, most confident face
    return [float(v) / scale for v in f[:4]]  # x, y, w, h in pixels of the original


def head_box(face, W, H):
    """Face box -> whole head (headwear, beard, chin), as a fraction of the image."""
    x, y, w, h = face
    cx = x + w / 2
    x0, x1 = cx - w * 0.68, cx + w * 0.68
    y0, y1 = y - h * 0.5, y + h * 1.42  # room for turban/cap above, a beard below
    return [max(0.0, x0 / W), max(0.0, y0 / H), min(1.0, x1 / W), min(1.0, y1 / H)]


def focus_from_head(box, W, H):
    x0, y0, x1, y1 = box
    hw, hh = (x1 - x0) * W, (y1 - y0) * H
    need = max(hh / HEAD_H_IN_CIRCLE, hw / HEAD_W_IN_CIRCLE)  # side of the square we want to show
    zoom = max(MIN_ZOOM, min(MAX_ZOOM, min(W, H) / need))
    return {"x": round((x0 + x1) / 2 * 100, 1), "y": round((y0 + y1) / 2 * 100, 1), "zoom": round(zoom, 2)}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", required=True)
    ap.add_argument("--redo", action="store_true", help="detect again even where a head box is stored")
    args = ap.parse_args()
    data = json.load(open(FILE, encoding="utf-8"))
    det = cv2.FaceDetectorYN.create(args.model, "", (320, 320))
    missing = []
    for name, e in data["authors"].items():
        if not e.get("photo"):
            continue
        path = os.path.join("public", (e.get("photoLarge") or e["photo"]).lstrip("/"))
        img = cv2.imread(path)
        if img is None:
            print("cannot read", path, file=sys.stderr)
            continue
        H, W = img.shape[:2]
        if args.redo or "head" not in e:
            face = detect(det, img)
            if face is None:
                missing.append(name)
                continue
            b = head_box(face, W, H)
            e["head"] = {"x0": round(b[0] * 100, 1), "y0": round(b[1] * 100, 1), "x1": round(b[2] * 100, 1), "y1": round(b[3] * 100, 1)}
        h = e["head"]
        e["focus"] = focus_from_head([h["x0"] / 100, h["y0"] / 100, h["x1"] / 100, h["y1"] / 100], W, H)
    json.dump(data, open(FILE, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    open(FILE, "a").write("\n")
    print("no face found for:", missing or "none")


if __name__ == "__main__":
    main()
