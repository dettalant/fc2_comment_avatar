FC2 Comment Avatar JS
======================

FC2ブログのコメントシステムで「サイトごとの独自アバター」を設定できるようにするスクリプト。

仕様上メールアドレス欄を占拠するので、このスクリプトを利用する場合はメールアドレス欄がほぼ使用不可になる。~~でもメールアドレス欄がまともに使われてること見たことないし大丈夫でしょ。~~

## 使い方

* 変化させたいアバター画像表示部分に`data-avatar-code`属性をつけて、メールアドレス欄に入力されたテキストがそこに入るようにする
* `data-avatar-code`がついた部分の内部にアバター画像要素を入れておくようにする

最低限必要なHTML要素だけ抜き出した例がこれ。

```html
<div class="comment_avatar" data-avatar-code="<%comment_mail>">
  <img class="comment_avatar_img" data-src="mofu_senkouin.png"/>
</div>

```

アバター要素内部の初めの画像要素を選択するようにしてるので、javascript無効時のフォールバックはその下に表示するとよろし。

lazyloadするため[lazysizes](https://github.com/aFarkas/lazysizes)用記述を加えて、`noscript`フォールバックも付け足したものが以下。

```html
<div class="comment_avatar" data-avatar-code="<%comment_mail>">
  <img class="comment_avatar_img lazyload" data-src="mofu_senkouin.png"/>
  <noscript>
    <img class="comment_avatar_img" src="mofu_senkouin.png"/>
  </noscript>
</div>
```

その後はよくある`<body>`終了直前で`<script>`として読み込み、インスタンス生成すればよろし。

```html
<script src="fc2_comment_avatar.min.js" async></script>
<script>
// このobjectのkeyとして登録された文字列を`keyStr`とするならば、
// `"[[" + keyStr  + "]]"`がアバター指定コードとなる
var avatarsList = {
  // `__default__`はemail未入力状態のデフォルト画像
  "__default__": "mofu_senkouin.png",
  // `__admin__`は管理者アバター画像
  "__admin__": "clerk_kitune.png",
  "ao": "ao.png",
  "hitotume": "hitotume.png",
  "miyoshi": "miyoshi.png",
  "yae": "yae.png",
  "shiro": "shiro.png",
  "kitune": "kitune.png",
  "mofu_kitune": "mofu_kitune.png"
}

var initArgs = {
  // アバター画像を格納する親要素でいて、
  // data-avatar-codeを記述した要素のクラス名
  avatarClassName: "comment_avatar",
  // アバター画像クラス名
  avatarImgClassName: "comment_avatar_img",
  // url書き換え先としてdata-src属性を使用するか否か
  // lazyloadなどでdata-srcを用いるならtrue、用いないならfalse
  isUseDataSrc: true,
  // 管理者コメントに管理者アバター画像を表示するか否か
  // avatarsListで`__admin__`をkeyとした値がなければ使用されない
  // 初期値はtrue
  isUseAdminAvatar: false,
  // アバター画像をまとめてobjectとして登録
  // key: アバター指定コード
  // value: アバター画像url
  avatarsList: avatarsList,
}

var fc2CommentAvatar = new fc2_comment_avatar.CommentAvatar(initArgs);
</script>
```
## 引数詳細

入れないとエラーになるやつは初期値について`N/A`で示す

**インスタンス生成時**

|名前|意味合い|初期値|
|---|---|---|
|avatarClassName|アバター画像を格納する親要素でいて、`data-avatar-code`を記述した要素のクラス名|N/A|
|avatarImgClassName|アバター画像要素クラス名|N/A|
|avatarSelectButtonId|アバター選択ボタンid|N/A|
|isUseDataSrc|url書き換え先として、src属性の代わりにdata-src属性を使用するか|`false`|
|isUseAdminAvatar|管理者が行ったコメントに管理者アバター画像を表示するか否か|`true`|
|avatarsList|アバター画像をまとめてobjectとして登録|N/A|

**avatarsListの特殊な値**

avatarListObjectの内容は`key`がアバター指定コード、`value`がアバター画像urlとして扱われる。

|名前|意味合い|備考|
|---|---|---|
|`__default__`|デフォルトアバター|入力がなければ`https://static.fc2.com/image/sh_design/no_image/no_image_300x300.png`を初期値として使用する|
|`__admin__`|管理者アバター|入力がなければ管理者アバター表示機能オフ|


## 以下個人的なメモ帳

仕様リスト（変更するかも）

* ユーザーがアイコンの中から好きなものを選択（選択中のものをハイライト、もしくは「アイコンを変更する」ボタンを付ける）
* アイコンが選択されているなら、そのアイコンと紐付けられた名前をメールアドレス欄に自動入力
* （FC2の確認画面では`[[kitune]]`といった感じで表示される）
* ページ読み込み時にjsで既存コメントメールアドレス欄をチェックして、特定の文字列であるなら画像リンクを書き換え。
* 特定文字列とマッチしなかった場合、またはメールアドレス欄が空の場合は画像リンクは書き換えず、デフォルト画像を用いる。
* 一度設定したアイコンはcookieに平文で保存されて、ページ読み込み時に自動入力される。
* アイコン選択画面から再設定した場合は、cookie情報とメールアドレス欄情報を同時に書き換える
* javascriptが無効化されてる際もデフォルト画像を表示
* 初期デフォルト画像はfc2公式のもの。カスタムデフォルト画像ももちろんOK。

## アバターの命名規則

* `[[]]`で囲う
* 例: `[[kitune]]`
