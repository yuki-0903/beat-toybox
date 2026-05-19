#!/usr/bin/env python3
import os
import struct
import zlib


ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
CHARACTER_DIR = os.path.join(ROOT, "public/assets/themes/tiny_toy_sprint/characters")
SOURCES = {
    "red": "source/runner_red_sheet.png",
    "yellow": "source/runner_yellow_sheet.png",
    "blue": "source/runner_blue_sheet.png",
}
ACTIONS = ("run", "jump", "land", "miss")


def paeth(left, up, up_left):
    predictor = left + up - up_left
    pa = abs(predictor - left)
    pb = abs(predictor - up)
    pc = abs(predictor - up_left)
    if pa <= pb and pa <= pc:
        return left
    if pb <= pc:
        return up
    return up_left


def read_png(path):
    with open(path, "rb") as file:
        data = file.read()

    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError(f"{path} is not a PNG")

    offset = 8
    width = height = color_type = None
    idat = bytearray()

    while offset < len(data):
        length = struct.unpack(">I", data[offset : offset + 4])[0]
        chunk_type = data[offset + 4 : offset + 8]
        chunk_data = data[offset + 8 : offset + 8 + length]
        offset += 12 + length

        if chunk_type == b"IHDR":
            width, height, bit_depth, color_type, _, _, _ = struct.unpack(">IIBBBBB", chunk_data)
            if bit_depth != 8 or color_type not in (2, 6):
                raise ValueError(f"Unsupported PNG format in {path}: bit_depth={bit_depth}, color_type={color_type}")
        elif chunk_type == b"IDAT":
            idat.extend(chunk_data)
        elif chunk_type == b"IEND":
            break

    channels = 4 if color_type == 6 else 3
    stride = width * channels
    raw = zlib.decompress(bytes(idat))
    rows = []
    position = 0
    previous = [0] * stride

    for _ in range(height):
        filter_type = raw[position]
        position += 1
        scanline = list(raw[position : position + stride])
        position += stride
        reconstructed = [0] * stride

        for index, value in enumerate(scanline):
            left = reconstructed[index - channels] if index >= channels else 0
            up = previous[index]
            up_left = previous[index - channels] if index >= channels else 0
            if filter_type == 0:
                reconstructed[index] = value
            elif filter_type == 1:
                reconstructed[index] = (value + left) & 255
            elif filter_type == 2:
                reconstructed[index] = (value + up) & 255
            elif filter_type == 3:
                reconstructed[index] = (value + ((left + up) // 2)) & 255
            elif filter_type == 4:
                reconstructed[index] = (value + paeth(left, up, up_left)) & 255
            else:
                raise ValueError(f"Unsupported PNG filter: {filter_type}")

        previous = reconstructed
        row = []
        for x in range(width):
            pixel = reconstructed[x * channels : x * channels + channels]
            if color_type == 6:
                row.append(tuple(pixel))
            else:
                row.append((pixel[0], pixel[1], pixel[2], 255))
        rows.append(row)

    return width, height, rows


def write_png(path, width, height, rows):
    def chunk(chunk_type, payload):
        return (
            struct.pack(">I", len(payload))
            + chunk_type
            + payload
            + struct.pack(">I", zlib.crc32(chunk_type + payload) & 0xFFFFFFFF)
        )

    raw = bytearray()
    for row in rows:
        raw.append(0)
        for r, g, b, a in row:
            raw.extend((r, g, b, a))

    payload = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", payload) + chunk(b"IDAT", zlib.compress(bytes(raw), 9)) + chunk(b"IEND", b"")
    with open(path, "wb") as file:
        file.write(png)


def is_background(pixel):
    r, g, b, _ = pixel
    whiteness = (r + g + b) / 3
    delta = max(abs(r - g), abs(g - b), abs(r - b))
    return whiteness > 242 and delta < 18


def soften_alpha(pixel):
    r, g, b, a = pixel
    whiteness = (r + g + b) / 3
    delta = max(abs(r - g), abs(g - b), abs(r - b))
    if whiteness > 244 and delta < 18:
        return (255, 255, 255, 0)
    if whiteness > 232 and delta < 22:
        return (r, g, b, max(0, min(a, int((244 - whiteness) * 18))))
    return pixel


def resize_to_square(crop):
    source_height = len(crop)
    source_width = len(crop[0])
    output_size = 512
    target_max = 420
    scale = min(target_max / source_width, target_max / source_height)
    draw_width = max(1, int(source_width * scale))
    draw_height = max(1, int(source_height * scale))
    offset_x = (output_size - draw_width) // 2
    offset_y = (output_size - draw_height) // 2
    output = [[(255, 255, 255, 0) for _ in range(output_size)] for _ in range(output_size)]

    for y in range(draw_height):
        source_y = min(source_height - 1, int(y / scale))
        for x in range(draw_width):
            source_x = min(source_width - 1, int(x / scale))
            output[offset_y + y][offset_x + x] = crop[source_y][source_x]

    return output


def extract_frames(color, source_file):
    source_path = os.path.join(CHARACTER_DIR, source_file)
    width, height, rows = read_png(source_path)
    frame_width = width // 4
    outputs = []

    for frame_index, action in enumerate(ACTIONS):
        x0 = frame_width * frame_index
        frame = [row[x0 : x0 + frame_width] for row in rows]
        min_x, min_y = frame_width, height
        max_x, max_y = 0, 0

        for y, row in enumerate(frame):
            for x, pixel in enumerate(row):
                if not is_background(pixel):
                    min_x = min(min_x, x)
                    min_y = min(min_y, y)
                    max_x = max(max_x, x)
                    max_y = max(max_y, y)

        pad = int(max(frame_width, height) * 0.035)
        min_x = max(0, min_x - pad)
        min_y = max(0, min_y - pad)
        max_x = min(frame_width - 1, max_x + pad)
        max_y = min(height - 1, max_y + pad)

        crop = []
        for y in range(min_y, max_y + 1):
            crop.append([soften_alpha(pixel) for pixel in frame[y][min_x : max_x + 1]])

        sprite = resize_to_square(crop)
        output_name = f"tinytoy_character_runner_{color}_{action}_01.png"
        output_path = os.path.join(CHARACTER_DIR, output_name)
        write_png(output_path, 512, 512, sprite)
        outputs.append(output_name)

    return outputs


def main():
    all_outputs = []
    for color, source in SOURCES.items():
        all_outputs.extend(extract_frames(color, source))
    print("\n".join(all_outputs))


if __name__ == "__main__":
    main()
