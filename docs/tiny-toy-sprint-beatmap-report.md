# Tiny Toy Sprint 譜面解析メモ

## 解析結果

- 音源: `Tiny Toy Sprint.mp3`
- 長さ: 約 43.88 秒
- 推定BPM: 約 107.67
- 推定ビート数: 80
- 生成した障害物数: 73
- 生成したアイテム数: 6
- レーン数: 3
- 想定画面: 縦固定 2.5D リズムランナー

## 生成ファイル

- `beatmap-tiny-toy-sprint-v0.json`

## 譜面方針

この譜面はガチ音ゲー用ではなく、  
「障害物を避けると自然に音が鳴って気持ちいい」ことを目的にした初期ドラフト。

## セクション

| Section | Time | Density | Intent |
|---|---:|---|---|
| intro | 0–10s | low | 操作に慣れる |
| groove | 10–25s | medium | 基本リズム |
| break | 25–30s | low | 呼吸ポイント |
| fever | 30–40s | high | 一番気持ちいい山場 |
| final | 40s–end | high | ラスト盛り上げ |

## JSON仕様

### obstacles

```json
{
  "time": 12.345,
  "lane": 1,
  "type": "block",
  "pattern": "single",
  "energy": 0.52,
  "soundOnDodge": "wood_tap"
}
```

- `time`: プレイヤー位置に障害物が到達する想定時間
- `lane`: 0 = 左 / 1 = 中央 / 2 = 右
- `type`: `block` or `jump_block`
- `pattern`: `single` or `gate`
- `soundOnDodge`: 回避成功時に鳴らすSE候補

### items

```json
{
  "time": 16.891,
  "lane": 1,
  "type": "fever_star",
  "sound": "powerup",
  "score": 300
}
```

## 実装時の注意

- 最初に `globalOffsetSeconds` を調整すること。
- 音と障害物がズレる場合は、JSON全体の `time` に同じ秒数を足し引きする。
- まずは判定を甘くする。
  - PERFECT: ±90ms
  - GOOD: ±150ms
  - MISS: ±230ms
- MVPでは `rhythmEvents` はデバッグ表示用でOK。
- 障害物の出現は `time - approachTime` でspawnする。

## Codex向け実装メモ

- Phaser 3で縦固定2.5D。
- `RhythmManager` がaudio currentTimeを管理。
- `ObstacleManager` がJSONの `obstacles` を読み込む。
- 各障害物は `hitTime = obstacle.time` を持つ。
- `spawnTime = hitTime - approachTime` で画面奥に生成。
- `hitTime` に近づくほど手前に来るように `y` と `scale` を補間。
- 回避成功時に `soundOnDodge` を鳴らす。
- コンボ継続でBGMに重ねるSE / visual pulseを強化。
