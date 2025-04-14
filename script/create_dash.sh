#!/bin/bash

set -eux;

TARGET_PATH=media/target
MP4_PATH=media/mp4
FMP4_PATH=media/fmp4
MPD_PATH=www/segments

INPUT="$1"

mkdir -p $TARGET_PATH
mkdir -p $MP4_PATH
mkdir -p $FMP4_PATH

cp $INPUT $TARGET_PATH

declare -a resolutions=("426x240" "640x360" "854x480" "1280x720" "1920x1080")
RESOLUTIONS_COUNT=${#resolutions[*]}

for i in "${!resolutions[@]}"; do
  RESOLUTION=${resolutions[$i]}
  ffmpeg -y -i $TARGET_PATH/`basename $INPUT` -ss 00:00:00 -to 00:03:00 -vf "drawtext=text='[$RESOLUTION] %{pts\:hms}': x=30: y=30: fontsize=100: fontcolor=white: box=1: boxcolor=black@0.5: boxborderw=5" -keyint_min 30 -g 30 -sc_threshold 0 -r 30 -s "$RESOLUTION" "$MP4_PATH/$RESOLUTION.mp4"
  mp4fragment --fragment-duration 1000 "$MP4_PATH/$RESOLUTION.mp4" "$FMP4_PATH/$RESOLUTION.frag"
done

for i in "${!resolutions[@]}"; do
  resolutions[$i]="$FMP4_PATH/${resolutions[$i]}.frag"
done

MANIFEST_FILE_NAME=manifest.mpd
mp4dash --mpd-name="$MANIFEST_FILE_NAME" --o "$MPD_PATH" "${resolutions[@]}"

SEGMENTS_DIR_PATH=www/segments
VIDEO_CODEC=avc1
VIDEO_SEGMENTS_PATH=$SEGMENTS_DIR_PATH/video/$VIDEO_CODEC

pushd $VIDEO_SEGMENTS_PATH
for i in `seq $RESOLUTIONS_COUNT`; do
  pushd $i
  max_segments_number=`ls -1 seg-* | wc -l`
  for j in `seq $max_segments_number`; do
    mv "seg-$j.m4s" "seg-$(($j - 1)).m4s"
  done
  popd
done

for i in `seq $RESOLUTIONS_COUNT`; do
  mv "$i" $((i - 1))
done
popd

AUDIO_CODEC=mp4a.40.2
AUDIO_SEGMENTS_PATH=$SEGMENTS_DIR_PATH/audio/en/$AUDIO_CODEC

pushd $AUDIO_SEGMENTS_PATH
max_segments_number=`ls -1 seg-* | wc -l`
for i in `seq $max_segments_number`; do
  mv "seg-$i.m4s" "seg-$(($i - 1)).m4s"
done
popd

MANIFEST_FILE_PATH=$SEGMENTS_DIR_PATH/$MANIFEST_FILE_NAME
sed -i '' -e 's/startNumber="1"/startNumber="0"/g' "$MANIFEST_FILE_PATH"

for i in `seq $RESOLUTIONS_COUNT`; do
  j=$((i - 1))
  sed -i '' -e "s/video\/$VIDEO_CODEC\/$i/video\/$VIDEO_CODEC\/$j/g" "$MANIFEST_FILE_PATH"
done

echo 'DONE!'
