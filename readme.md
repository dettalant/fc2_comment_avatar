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

アバター要素内部における、一番目の画像要素を書き換え対象とする仕様なのでjavascript無効時のフォールバックは二番目以降とすることを推奨。

lazyloadするため[lazysizes](https://github.com/aFarkas/lazysizes)用記述を加えて、`noscript`フォールバックも付け足したものが以下。

```html
<div class="comment_avatar" data-avatar-code="<%comment_mail>">
  <img class="comment_avatar_img lazyload" data-src="mofu_senkouin.png"/>
  <noscript>
    <img class="comment_avatar_img" src="mofu_senkouin.png"/>
  </noscript>
</div>
```

その後はよくある`<body>`終了直前で`<script>`として読み込み、インスタンス生成すればよろし

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
  // `__secret__`は非公開コメントアバター画像
  "__secret__": "secret.png",
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
  // 非公開コメントに専用アバター画像を表示するか否か
  // avatarsListで`__secret__`をkeyとした値がなければ使用されない
  // 初期値はtrue
  isUseSecretAvatar: false,
  // アバター画像をまとめてobjectとして登録
  // key: アバター指定コード
  // value: アバター画像url
  avatarsList: avatarsList,
}

var fc2CommentAvatar = new fc2_comment_avatar.CommentAvatar(initArgs);
</script>
```
## 引数詳細

**CommentAvatarArgs**

インスタンス生成時に必要なのがこれ。

|名前|意味合い|初期値|
|---|---|---|
|`options`|スクリプト全体の設定値まとめ|`CommentAvatarOptions`の項を参照|
|`targetSrc`|操作対象要素を取得するためのクラス名やid名まとめ|`CommentAvatarTargetsSrc`の項を参照|
|`avatarsList`|アバター画像をまとめてobjectとして登録したもの|省略不可|

&nbsp;

**CommentAvatarOptions**

|名前|意味合い|初期値|
|---|---|---|
|`isUseLazysizes`|[lazysizes](https://github.com/aFarkas/lazysizes)に対応したlazyload処理を行うか否か|`false`|
|`isUseAdminAvatar`|管理者が行ったコメントに管理者アバター画像を表示するか否か|`true`|
|`isUseSecretAvatar`|非公開コメントに専用アバターを付与するか否か|`true`|
|`isUseCustomDefaultImg`|独自のデフォルト画像(`__default__`として指定した値)を使用するか否か|`__default__`が指定されていれば`true`|
|`isCommentAvatarOverwrite`|投稿コメントアバター書き換え機能を有効にするか否か|`true`|
|`isAvatarSelect`|アバター選択ボタン生成機能を有効にするか否か|`true`|
|`isDebug`|デバッグモードとして各種警告をconsoleに出力するか否か|`false`|

※ lazysizesが導入されていない環境で`isUseLazysizes`を`true`にした場合は画像が表示されなくなるので注意

&nbsp;

**CommentAvatarTargetsSrc**

|名前|意味合い|初期値|
|---|---|---|
|`avatarClassName`|アバター画像を格納する親要素でいて、`data-avatar-code`を記述した要素のクラス名|`comment_avatar`|
|`avatarImgClassName`|アバター画像要素クラス名|`comment_avatar_img`|
|`avatarSelectButtonId`|アバター選択ボタンid|`commentAvatarSelectButton`|
|`emailInputId`|メールアドレス入力欄id|`commentFormMail`|

&nbsp;

**avatarsList**

avatarListの内容は`key`がアバター指定コード、`value`がアバター画像urlとして扱われる。

以下の表は特殊な値。

|名前|意味合い|備考|
|---|---|---|
|`__default__`|デフォルトアバター|入力がなければ`https://static.fc2.com/image/sh_design/no_image/no_image_300x300.png`を初期値として使用する|
|`__admin__`|管理者アバター|入力がなければ管理者アバター表示機能オフとなる|
|`__secret__`|非公開コメントのアバター|入力がなければ非公開コメントアバター表示機能はオフとなる|
