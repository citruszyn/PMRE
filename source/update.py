
import numpy as np
from PIL import Image
from pathlib import Path
import csv, json, os, re
from scipy.ndimage import binary_dilation

TILE_SIZE = 1024
SCALE_FACTOR = 2  # high-definition multiplier

def load_definition(def_path):
    rgb_to_pid = {}
    with open(def_path, newline='', encoding='utf-8') as f:
        for row in csv.reader(f, delimiter=';'):
            if row and row[0].isdigit():
                rgb = tuple(map(int, row[1:4]))
                rgb_to_pid[rgb] = int(row[0])
    return rgb_to_pid

def load_state_provinces(states_dir):
    state_pids = set()
    for file in Path(states_dir).glob("*.txt"):
        text = file.read_text(encoding='utf-8')
        match = re.search(r'provinces\s*=\s*\{([^}]*)\}', text)
        if match:
            pids = re.findall(r'\d+', match.group(1))
            state_pids.update(map(int, pids))
    return state_pids

def main():
    base = Path(__file__).resolve().parent
    bmp_path = base / '..' / 'map' / 'provinces.bmp'
    def_path = base / '..' / 'map' / 'definition.csv'
    states_path = base / '..' / 'history' / 'states'
    out_dir = base

    prov_json = out_dir / "provinces.json"
    tiles_dir = out_dir / "tiles"

    if prov_json.exists():
        print("🗑️ Deleting existing provinces.json...")
        prov_json.unlink()

    if tiles_dir.exists() and tiles_dir.is_dir():
        print("🧹 Cleaning up tiles directory...")
        for file in tiles_dir.glob("*.png"):
            file.unlink()

    print("🖼️ Loading image...")
    img = Image.open(bmp_path).convert("RGB")
    data = np.array(img)
    h, w, _ = data.shape
    base = Path(__file__).resolve().parent
    bmp_path = base / '..' / 'map' / 'provinces.bmp'
    def_path = base / '..' / 'map' / 'definition.csv'
    states_path = base / '..' / 'history' / 'states'
    out_dir = base

    print("🖼️ Loading image...")
    img = Image.open(bmp_path).convert("RGB")
    data = np.array(img)
    h, w, _ = data.shape

    print("📖 Loading definitions and states...")
    rgb_to_pid = load_definition(def_path)
    valid_pids = load_state_provinces(states_path)

    print("⚡ Mapping all pixels to province IDs...")
    flat_rgb = data.reshape(-1, 3)
    flat_pid_array = np.array([rgb_to_pid.get(tuple(rgb), 0) for rgb in flat_rgb], dtype=int)
    pid_map = flat_pid_array.reshape(h, w)

    print("🎯 Finding relevant mask...")
    state_mask = np.isin(pid_map, list(valid_pids))
    expanded_mask = binary_dilation(state_mask, iterations=30)

    print("✂️ Cropping to province area...")
    y_coords, x_coords = np.where(expanded_mask)
    y_min, y_max = max(0, y_coords.min()-1), min(h, y_coords.max()+2)
    x_min, x_max = max(0, x_coords.min()-1), min(w, x_coords.max()+2)

    cropped_pid_map = pid_map[y_min:y_max, x_min:x_max]
    cropped_img = img.crop((x_min, y_min, x_max, y_max))

    print(f"🔍 Scaling output x{SCALE_FACTOR} for high-def...")
    scaled_img = cropped_img.resize((cropped_img.width * SCALE_FACTOR, cropped_img.height * SCALE_FACTOR), Image.NEAREST)
    scaled_pid_map = np.kron(cropped_pid_map, np.ones((SCALE_FACTOR, SCALE_FACTOR), dtype=int))

    print("💾 Saving provinces.json...")
    (out_dir / "tiles").mkdir(exist_ok=True)
    with open(out_dir / "provinces.json", "w") as f:
        json.dump({ "pid_map": scaled_pid_map.tolist(), "bounds": [int(x_min), int(y_min)] }, f)

    print("🖼️ Generating high-def tiles...")
    h2, w2 = scaled_pid_map.shape
    for y in range(0, h2, TILE_SIZE):
        for x in range(0, w2, TILE_SIZE):
            tile_data = scaled_pid_map[y:y+TILE_SIZE, x:x+TILE_SIZE]
            if np.any(tile_data):
                crop = scaled_img.crop((x, y, x+TILE_SIZE, y+TILE_SIZE))
                crop.save(out_dir / "tiles" / f"{x}_{y}.png")

    print("✅ High-definition map generation complete!")

if __name__ == "__main__":
    main()
