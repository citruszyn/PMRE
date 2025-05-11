# 🗺️ Paradox Map Replication Engine

The **Paradox Map Replication Engine** is a tool designed to automate the processing and validation of map files for Paradox Interactive titles, with a primary focus on **Hearts of Iron IV (HOI4)**. It replicates the internal behavior of the game engine’s map compiler — handling `provinces.bmp`, `definition.csv`, and related map infrastructure — to help modders debug and validate their custom maps **outside of the HOI4 executable**.

It includes a simple interactive viewer powered by HTML and JavaScript, allowing you to inspect your processed map output directly in the browser.

---

## 🚀 Features

- 🖼 Parses and processes `provinces.bmp` and links it to `definition.csv`
- 🎯 Validates province color uniqueness, format correctness, and ID consistency
- 📊 Generates debug-friendly reports on invalid or missing province links
- ⚙️ Outputs tile-based PNGs for visual reference
- 🌐 Includes a lightweight web viewer to explore the output interactively

---

## 🛠️ How to Use

### 1. Run the Map Generator

Execute the `update.py` script to process your `provinces.bmp`, `definition.csv`, and state files. This will output:
- A `provinces.json` file
- Tiled PNGs of your map in the `tiles/` folder

    python update.py

This script also automatically removes any previous `provinces.json` and tiles before regeneration.

---

### 2. Start the Viewer

Use the `viewer.bat` script to launch a local web server:

    viewer.bat

This starts a local HTTP server at `localhost:8000`, allowing JavaScript in the viewer to access and render the generated map data.

---

### 3. Open the Viewer

In your web browser, navigate to:

    http://localhost:8000

You should now see your high-resolution, interactive map viewer running!

---

## 📦 Output Files

- `provinces.json`: JSON-formatted map of province IDs for JS-based rendering
- `/tiles/*.png`: Cropped and scaled tiles of your mod map, suitable for web display

---

## 🔍 Why Use This Tool?

Paradox games like HOI4 crash or fail silently when map files are invalid. This tool helps you:
- Preemptively catch map errors (invalid RGBs, orphaned provinces)
- Visualize your map interactively without launching the game
- Automate testing for large map mods or total conversions

---

## 🧠 Technical Notes

The core script processes `provinces.bmp` by:
- Mapping each RGB to a province ID from `definition.csv`
- Using `states/*.txt` to isolate valid provinces
- Cropping and scaling the image to show only relevant map regions
- Outputting a tiled and JSON representation of the processed map

Dependencies:
- Python 3.9+
- numpy
- Pillow
- scipy

Install with:

    pip install numpy Pillow scipy

---

## 📄 License

MIT License — Free to use, modify, and contribute.

---

## 🤝 Contributing

Pull requests are welcome! If you've added support for another game, improved validation, or extended the viewer, feel free to submit a PR or open an issue.

---

## 📬 Contact

For bugs, requests, or help, please open an issue on this repository.
