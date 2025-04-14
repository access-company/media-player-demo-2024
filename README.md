# 2024年度メディア研修で利用したソースコード

[株式会社ACCESS](https://www.access-company.com/)では、2024年度の新卒研修において「メディア」をテーマとした研修を実施しました。
その研修で使用したソースコードの一部を修正のうえ公開しています。

## 目次

- [2024年度メディア研修で利用したソースコード](#2024年度メディア研修で利用したソースコード)
- [研修課題の概要](#研修課題の概要)
- [依存関係](#依存関係)
- [研修用1080p動画の準備](#研修用1080p動画の準備)
- [作業ディレクトリのセットアップ](#作業ディレクトリのセットアップ)
- [1080p.mp4を複数の品質にエンコードし、セグメント分割する](#1080pmp4を複数の品質にエンコードしセグメント分割する)
  - [create_dash.sh が行う処理](#createdashsh-が行う処理)
  - [media-player-demo-2024/www/segments の構成](#media-player-demo-2024wwwsegments-の構成)
- [サーバーの起動手順](#サーバーの起動手順)
  - [課題1・2向けのセットアップ](#課題12向けのセットアップ)
  - [課題3向けのセットアップ](#課題3向けのセットアップ)
- [実装課題](#実装課題)
  - [課題1: buildSegmentRequestURLの実装](#課題1-buildsegmentrequesturlの実装)
  - [課題2: appendBufferの実装](#課題2-appendbufferの実装)
  - [課題3: getOptimalResolutionの実装](#課題3-getoptimalresolutionの実装)
- [解答](#解答)
- [参考](#参考)

## 研修課題の概要

5段階の解像度でストリーミング再生ができる動画プレイヤーの実装を目指します。  
そのために、`media-player-demo-2024/www/abr/task.js` 内の3つの関数を、後述する仕様に従って修正してもらいます。

## 依存関係

- ffmpeg  
  - 動作確認済みバージョン: 7.1.1
- bento4  
  - 動作確認済みバージョン: 1.6.0-641
- golang  
  - 動作確認済みバージョン: 1.22.1

動作確認は、MacBook Pro 2023（M3チップ搭載）および Google Chrome で行いました。

## 研修用1080p動画の準備

```sh
$ cd /tmp
$ curl -O https://download.blender.org/peach/bigbuckbunny_movies/big_buck_bunny_1080p_h264.mov
$ ffmpeg -i big_buck_bunny_1080p_h264.mov -ss 00:00:00 -to 00:03:00 -r 30 1080p.mp4
```

このプロジェクトでは、[Blender Foundation](https://peach.blender.org/about/) によって提供されている映像作品 **Big Buck Bunny**（`big_buck_bunny_1080p_h264.mov`）を使用します。  
この動画は [Creative Commons Attribution 3.0 ライセンス](https://creativecommons.org/licenses/by/3.0/) のもとで公開されています。  
著作権表記:  
`(c) copyright 2008, Blender Foundation / www.bigbuckbunny.org`

> ⚠️ 本プロジェクトには動画ファイルは含まれていません。  
> ユーザーが上記の手順で動画をダウンロードし、加工したものを使用する前提となっています。

## 作業ディレクトリのセットアップ

```sh
$ cd /path/to/media-player-demo-2024
$ git fetch
$ git pull origin main
```

## 1080p.mp4を複数の品質にエンコードし、セグメント分割する

```sh
$ cd media-player-demo-2024
$ ./script/create_dash.sh /tmp/1080p.mp4
…
DONE!
```

### `create_dash.sh` が行う処理

- `1080p.mp4` を5段階の解像度に再エンコード  
  この際、再生時間を示すテキストを動画に追加（出力先: `media-player-demo-2024/media/mp4/*`）  
  - 作成されるファイル:  
    `426x240.mp4`, `640x360.mp4`, `854x480.mp4`, `1280x720.mp4`, `1920x1080.mp4`

- それぞれの解像度の動画ファイルをフラグメント化  
  - 出力先: `media-player-demo-2024/media/fmp4/*`

- DASH ストリーミング用のマニフェストファイルとセグメントファイルを生成  
  - 出力先: `media-player-demo-2024/www/segments/*`

#### `media-player-demo-2024/www/segments` の構成

- `manifest.mpd`  
  - DASHストリーミング用のマニフェストファイル

- `video/avc1/0～4/{init.mp4 | seg-0~179.m4s}`  
  - 0: 426x240  
    1: 640x360  
    2: 854x480  
    3: 1280x720  
    4: 1920x1080 に対応  
  - 各ディレクトリには以下のセグメントが含まれる  
    - `init.mp4`: `seg-0~179.m4s` を再生するために必要な情報を含む
    - `seg-n.m4s`: 各ファイルは1秒分の映像データ

- `audio/en/mp4a.40.2/{init.mp4 | seg-0~180.m4s}`  
  - セグメント数は本来180個を想定していましたが、実際には181個作成されます（課題への影響はありません）


## サーバーの起動手順

#### 課題1・2向けのセットアップ

```sh
$ ./script/run_server.sh
Enable throttling mode? 0(disable) or 1(enable): 0
Start Server without throttling mode
Please access http://localhost:8080
```

### 課題3向けのセットアップ

```sh
$ ./script/run_server.sh # Ctrl+Cで一度停止後、再起動
Enable throttling mode? 0(disable) or 1(enable): 1
Start Server without throttling mode
Please access http://localhost:8080/?auto=1
...
/segments/video/avc1/0/seg-33.m4s : Sleep for 812ms
...
```

サーバログについての補足:
例えば以下のようなログを確認した場合。
> /segments/video/avc1/0/seg-33.m4s : Sleep for 812ms

これは、解像度 `426x240`の`seg-33.m4s`の取得に`812ms`かかる予定という意味です。
周期的にVideoセグメントの取得時間が変化します。取得時間が増加し続けているタイミングもあれば、減少し続けるタイミングもあります。

## 実装課題

実装課題の最終目的は「任意のタイミングで必要な音声・映像セグメントを取得し、解像度変更にも対応した滑らかな動画再生を行う」ことです。  
以下の3つの課題をクリアすれば、5段階の解像度を用いたストリーミングプレイヤーが完成します。  

実装演習課題に取り組む際のキーポイント:

- 必要なタイミングで必要な量のAudio・Videoセグメントをサーバーから取得する
  - 例: 1920x1080の動画を0〜5秒再生したい場合、`init.mp4`と`seg-0〜4.m4s`を取得する
  - 解像度を途中で変更する場合も、その解像度のセグメントを取得するだけでよい

- 取得したセグメントは MSE API を用いてブラウザへ渡す
  - 解像度を変更した場合は、対象の解像度の`init.mp4`を最初に渡す必要がある  
    - 例: `426x240`から`1920x1080`に切り替える場合は、まず`1920x1080`の`init.mp4`を渡した上で、`seg-n.m4s`を渡す。これを行わないと再生が乱れる。

### 課題1: buildSegmentRequestURLの実装

役割: 指示を受けたセグメント(Audio, Videoどちらも)を指すURLを生成する。
関数が呼ばれるタイミング: セグメントの取得が必要だと判断した時
`function buildSegmentRequestURL(isAudio, isInitialSegment, resolutionId, lastSegmentIndexBeingLoaded);`

- `isAudio (boolean)`
  - true: Audioセグメントの取得指示, false: Videoセグメントの取得指示
- `isInitialSegment (boolean)`
  - true: 初期セグメントの取得指示, false: 一般セグメントの取得指示
- `resolutionId (int, 0~4)`
  - 0: 426x240, 1: 640x360, 2: 854x480, 3: 1280x720, 4:1920x1080 に対応
  - 例えば、0が渡ってきた場合、426x240向けの解像度のセグメントを取得したいということ
- `lastSegmentIndexBeingLoaded (int: -1~179)`
  - -1: `isInitialSegment:true` 時の未定義値
  - 0~179: 取得したい一般セグメントのIndex
  - 例えば、0が渡ってきた場合、seg-0.m4sを取得したいということ
- 期待する返り値(string)
  - `segments/` で始まる、適切な相対パス
    - 例えば、解像度 426x240 の初期セグメントを指すURLを返したい場合は、`segments/video/avc1/0/init.mp4`を返せば良い

#### 実装前の動作

http://localhost:8080 にアクセスする。
Webサイトは表示されますが、動画再生は開始されません。

#### 実装後の期待動作

依然として動画再生は開始しません。
しかし、Google ChromeのDevtoolのNetworkタブを確認すると、選択した解像度に対応したセグメントの取得が行われていることを確認できます。

### 課題2: appendBufferの実装

役割: 引数に渡ってきたbufferをsourceBufferに渡す
関数が呼ばれるタイミング: セグメントの取得が完了した時
`function appendBuffer(sourceBuffer, buffer);`

- sourceBuffer([SourceBuffer](https://developer.mozilla.org/ja/docs/Web/API/SourceBuffer))
- buffer ([ArrayBuffer](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer))
  - `buildSegmentRequestURL()` の返り値を元に取得したセグメントデータ
- 期待する返り値 (void)

#### 実装後の期待動作

選択した動画解像度にスムーズに切り替わり、正常に動画再生がされるようになります。
ただし、解像度「自動」は機能しません。

### 課題3: getOptimalResolutionの実装

役割: ネットワーク状況やバッファの状況を踏まえて、自動モードで再生中の解像度を決定する。
関数が呼ばれるタイミング: 解像度選択のUIにて「自動」を選択している際に、新たなセグメントを取得しようとする直前
`function getOptimalResolution(playerState);`

- playerState (object)
  - playerState.currentTime ([HTMLMediaElement.currentTime](https://developer.mozilla.org/ja/docs/Web/API/HTMLMediaElement/currentTime)): 現在の再生時間
  - playerState.videoSource ([SourceBuffer](https://developer.mozilla.org/ja/docs/Web/API/SourceBuffer)): Video Source
  - playerState.audioSource ([SourceBuffer](https://developer.mozilla.org/ja/docs/Web/API/SourceBuffer)): Audio Source
  - playerState.lastSegmentIndexBeingLoaded (int, 0~179): 取得したい最新の一般セグメントのIndex
  - playerState.lastLoadedSegmentIndex (int, 0~179): ブラウザに渡した最新の一般セグメントのIndex
  - playerState.resolutionId: 0: 426x240, 1: 640x360, 2: 854x480, 3: 1280x720, 4:1920x1080 に対応
  - playerState.isOffline(boolean): true: 現在オフライン状態, false: 現在オンライン状態
  - activeRequests ([XMLHttpRequest オブジェクト](https://developer.mozilla.org/ja/docs/Web/API/SourceBuffer) list): Audio, Video セグメントの取得のためのHTTP Requestのうち、フェッチ中、もしくはフェッチ予定のリクエストの数リスト 
    - lengthを取得したい場合は、activeRequests.lengthとする。
- 期待する返り値(int: 0~4)
  - 現在の状況を踏まえた上で、指定したい解像度のID
  - 0: 426x240, 1: 640x360, 2: 854x480, 3: 1280x720, 4:1920x1080

#### 実装後の期待動作

課題3は、自由記述問題です。
動画再生を止めることなく、できる限り高解像度な動画再生を目指しましょう。

## 解答

解答は、`media-player-demo-2024/www/abr/solution.js`にあります。
このファイルに従い、`media-player-demo-2024/www/abr/task.js` を修正すると、期待される挙動の一例を確認できます。

## 参考

- Media Source Extensions に関する解説（2018年6月6日投稿: 鍋島 公章）  
  - https://tech.jstream.jp/blog/streaming/media-source-extensions/
