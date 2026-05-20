# Coin Pop Parade 譜面JSONメモ

## 解析結果

- Audio file: `Coin Pop Parade.mp3`
- Duration: 39.600 sec
- Estimated BPM: 152.0
- Beat interval: 0.395 sec
- First beat offset estimate: 0.363 sec
- Chart difficulty: Hard
- Lanes: 3
- Total rhythm cues: 111

## 仕様

現在のゲーム仕様に合わせて、`obstacles` を障害物ではなく **rhythm cue / performance target** として扱っています。

- lane 0: red character cue
- lane 1: yellow character cue
- lane 2: blue character cue

cue type:

- `music_note_red`
- `music_note_yellow`
- `music_note_blue`

## 調整方針

- intro: やや少なめ
- main: 4分ベース + 一部オフビート
- fever/high energy: 密度高め
- outro: 少し落として終了

## Codex向けメモ

実装では `obstacles` 配列を既存のまま利用してOKです。
ただし見た目は障害物ではなく、音符型のリズムキューとして描画してください。

画像アセット例:

- `tinytoy_cue_music_note_red_01.png`
- `tinytoy_cue_music_note_yellow_01.png`
- `tinytoy_cue_music_note_blue_01.png`

音ズレがある場合は、まず `globalOffsetSeconds` を `-0.05` 〜 `+0.10` の範囲で調整してください。
