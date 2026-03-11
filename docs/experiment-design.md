# Experiment Design: Paper Pipeline Image Quality Comparison

## Overview

Pairwise comparison experiment using Bradley-Terry model to rank 10 pipeline image generation methods across 435 papers.

## Methods (10)

`ae`, `co`, `cs`, `gpt`, `nbp`, `orig`, `ours`, `pany`, `pbn`, `poster`

## Trial Design

- **500 trials per participant**: 495 regular + 5 catch
- **Regular trial**: randomly select 1 paper, then 2 different methods from that paper; participant picks the better image
- **Catch trial**: 1 low-quality catch image vs 1 random main image; used to filter inattentive participants
- Trial count is not displayed to participants (only a progress bar)

## Randomization

1. Fisher-Yates shuffle all 435 papers → use all once (435 trials)
2. Shuffle again → take 60 more → total 495 regular trials (every paper appears at least once)
3. For each paper, randomly sample 2 methods (without replacement) from available methods
4. Generate 5 catch trials from `catch_data/` images
5. Insert catch trials at 5 random positions among the 500 slots

## Analysis

Bradley-Terry model on pairwise outcomes to produce a ranking of the 10 methods.

## Sample Size

With C(10,2) = 45 unique pairs and 495 trials/participant, each participant covers ~11 comparisons per pair on average. With 30+ participants, each pair gets 330+ observations — sufficient for reliable BT estimation.

## Data Recorded Per Trial

### Regular Trial

- `paperId`, `method1`, `method2`, `selectedMethod`
- `reaction_time`, timestamps

### Catch Trial

- `catchFile`, `mainPaperId`, `mainMethod`
- `catch_trial_correct` (whether participant selected the main image over the catch)

## Image Sources

- Main images: `public/main_data/{paperId}_{method}.jpg` (4343 files)
- Catch images: `public/catch_data/catch_{paperId}.jpg` (5 files)
- 7 papers have 9 methods (missing one); handled gracefully by sampling from available methods only
