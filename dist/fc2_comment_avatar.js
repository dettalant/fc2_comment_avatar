var fc2_comment_avatar = (function (exports) {
  'use strict';

  var CommentAvatarError = function CommentAvatarError(message) {
      this.message = message;
      this.name = "NavManagerError";
  };
  CommentAvatarError.prototype.toString = function toString () {
      return this.name + ": " + this.message;
  };
  var CommentAvatar = function CommentAvatar(initArgs) {
      // 初期値ではdata-src属性を使用しない
      this.isUseDataSrc = false;
      if (initArgs === undefined) {
          throw new CommentAvatarError("初期化に必要な情報が入力されませんでした。CommentAvatarクラスの初期化引数には必要情報が格納されたobjectを入れてください");
      }
      var avatars = document.getElementsByClassName(initArgs.avatarClassName);
      if (avatars.length === 0) {
          // lengthが0 = avatar要素が取得できなかった
          throw new CommentAvatarError("アバター要素の取得に失敗しました");
      }
      // キャストは怖いがこればかりは仕方がない
      this.avatarContainers = avatars;
      this.avatarClassName = initArgs.avatarClassName;
      this.avatarImgClassName = initArgs.avatarImgClassName;
      this.avatarsList = initArgs.avatarsList;
      if (initArgs.isUseDataSrc) {
          // useDataSrc項目がtrueである場合のみ上書き
          this.isUseDataSrc = initArgs.isUseDataSrc;
      }
      // アバターコードに合わせて画像書き換え
      // NOTE: promiseを用いたコードにしてもいいかも。
      var avatarsArray = this.scanAvatarCodes();
      this.avatarsImageOverWrite(avatarsArray);
  };
  /**
   * avatar要素全てのdata-avatar-code部分を確認して、
   * 存在するavatar名と一致したavatarDataの配列を返す
   * @return [description]
   */
  CommentAvatar.prototype.scanAvatarCodes = function scanAvatarCodes () {
      var avatarContainersLen = this.avatarContainers.length;
      var avatarsData = [];
      for (var i = 0; i < avatarContainersLen; i++) {
          var avatar = this.avatarContainers[i];
          var code = avatar.dataset.avatarCode;
          if (code === undefined) {
              continue;
          }
          else if (code.indexOf("[[") === -1 && code.indexOf("]]") === -1) {
              // アバターコードを示す両端の文字烈が見つからなかった場合は次の周回へ
              continue;
          }
          // # 正規表現マッチ条件
          // * "[["と"]]"に囲われた最初の対象にマッチ
          // * 空白と"["と"]"を含めない文字列を
          // * `[[ foo ]]`のように空白をつけた記述をされていても取り出す
          // * 空白は半角/全角両方を対象とする
          var regex = /\[\[[\s　]*?([^\[\]\s　]+?)[\s　]*?\]\]/;
          var avatarNameArray = regex.exec(code);
          // マッチしなければ次周回へ
          if (avatarNameArray === null) {
              continue;
          }
          var avatarName = avatarNameArray[1];
          if (this.isMatchAvatarName(avatarName)) {
              // 切り出したアバターネームが登録されていた場合は、
              // アバターデータを生成して配列に入れる
              var avatarData = this.genDefaultAvatarData();
              // querySelectorでクラス名検索しているので"."を忘れないこと
              avatarData.imgEl = avatar.querySelector("." + this.avatarImgClassName);
              avatarData.name = avatarName;
              avatarData.url = this.avatarsList[avatarName];
              avatarsData.push(avatarData);
          }
      }
      return avatarsData;
  };
  /**
   * 入力されたアバターネームが、avatarsListに登録されているかを判定する。登録されていたらtrue。
   * @param  avatarName 判別に用いるemail欄テキスト
   * @return アバターネームが登録されていたかどうかのbool
   */
  CommentAvatar.prototype.isMatchAvatarName = function isMatchAvatarName (avatarName) {
      return !!(this.avatarsList[avatarName]);
  };
  /**
   * 初期状態のアバターコードを生成する。
   * 手っ取り早いから関数にしてるけれど、一つのクラスにしてもよかったかも。
   * @return 生成した初期状態アバターコード
   */
  CommentAvatar.prototype.genDefaultAvatarData = function genDefaultAvatarData () {
      var defaultAvatarName = "__default__";
      var avatarUrl = "//static.fc2.com/image/sh_design/no_image/no_image_300x300.png";
      if (this.avatarsList[defaultAvatarName]) {
          avatarUrl = this.avatarsList[defaultAvatarName];
      }
      return {
          imgEl: null,
          name: defaultAvatarName,
          url: avatarUrl
      };
  };
  /**
   * アバターデータ配列を入力して、ことごとくの画像URLを書き換える
   * @param  avatarsArray 画像書き換えが必要なアバターデータ配列
   */
  CommentAvatar.prototype.avatarsImageOverWrite = function avatarsImageOverWrite (avatarsArray) {
      var avatarsDataLen = avatarsArray.length;
      for (var i = 0; i < avatarsDataLen; i++) {
          var avatarData = avatarsArray[i];
          // imgElがnullであったなら次周回へ
          if (avatarData.imgEl === null) {
              continue;
          }
          if (this.isUseDataSrc) {
              // data-src要素を書き換え
              // ここのキャストも致し方なし
              avatarData.imgEl.dataset.src = avatarData.url;
          }
          else {
              // src要素を書き換え
              avatarData.imgEl.src = avatarData.url;
          }
      }
  };

  exports.CommentAvatar = CommentAvatar;

  return exports;

}({}));
