#!/usr/bin/env bash

set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 /path/to/BLine-Web/assets/readme/bline-web-demo.gif" >&2
  exit 2
fi

source_gif=$1
repo_root=$(cd "$(dirname "$0")/../.." && pwd)
output_gif="$repo_root/docs/assets/gifs/web/homepage-simulation.gif"
start_poster="$repo_root/docs/assets/images/gif-posters/homepage-simulation-start.png"
end_poster="$repo_root/docs/assets/images/gif-posters/homepage-simulation-end.png"
temporary_gif=$(mktemp "${TMPDIR:-/tmp}/bline-homepage-simulation.XXXXXX.gif")

trap 'rm -f "$temporary_gif"' EXIT

# Preserve the full README sequence. Crop only the machine-specific status bar,
# keep the source's near-12 fps cadence, and use the spec's compact 960 px width.
ffmpeg -y -loglevel error -i "$source_gif" -filter_complex \
  "[0:v]crop=960:540:0:0,fps=12,split[s0][s1];[s0]palettegen=max_colors=256:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle" \
  -loop 0 "$temporary_gif"

gifsicle -O3 "$temporary_gif" -o "$output_gif"

frame_count=$(ffprobe -v error -count_frames -select_streams v:0 \
  -show_entries stream=nb_read_frames -of default=nw=1:nk=1 "$output_gif")
last_frame=$((frame_count - 1))

ffmpeg -y -loglevel error -i "$output_gif" \
  -vf "select='eq(n,0)'" -frames:v 1 "$start_poster"
ffmpeg -y -loglevel error -i "$output_gif" \
  -vf "select='eq(n,$last_frame)'" -frames:v 1 "$end_poster"

echo "Generated full-length homepage GIF and posters from $source_gif"
