# Track 02 Beatmap Report

## Source
- File: `2.mp3`
- Duration: `87.72s`
- Estimated BPM: `123.05`
- Beat interval: `0.488s`
- Difficulty: `hard`
- Controls: `left-right-only`
- Lanes: `3`

## Output
- Beatmap JSON: `beatmap-2-hard-items.json`

## Event Summary
- Total events: `332`
- Obstacles: `325`
- Items: `7`

## Design Notes
- ジャンプ動作は使わない。
- 3レーンの左右移動だけで避ける前提。
- 高エネルギー区間では、2レーン同時ブロックやハーフビート配置を増やして難易度を上げた。
- アイテムは基本的に安全レーン側に置いて、避けながら取れるようにしている。
- アイテム取得時は `se` キーを見て、その曲に合う短いSEを鳴らす想定。

## JSON Event Format

```json
{
  "time": 12.345,
  "lane": 1,
  "type": "item",
  "item": "beat_chip",
  "se": "toy_chime",
  "effect": "fever_gain"
}
```

```json
{
  "time": 12.800,
  "lane": 0,
  "type": "obstacle",
  "obstacle": "toy_block",
  "pattern": "safe-lane"
}
```

## Phaser Implementation Notes
- BGM再生開始時刻を基準に `elapsedSeconds` を計算する。
- `event.time - elapsedSeconds <= spawnLeadTime` になったら奥側からスポーン。
- 最初は `spawnLeadTime = 1.6` 秒程度がおすすめ。
- 音ズレは `globalOffsetSeconds` で調整。
- 目安: 早く来るなら `+0.03`、遅く来るなら `-0.03` ずつ調整。

## Recommended First Test
1. このJSONを読み込む。
2. 障害物だけ出す。
3. アイテムを出す。
4. アイテム取得時に `se` をconsoleに出す。
5. 最後にSE音源と紐付ける。
