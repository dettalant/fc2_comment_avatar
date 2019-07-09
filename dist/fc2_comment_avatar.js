/*!
 * @file fc2_comment_avatar.js
 * See {@link https://github.com/dettalant/fc2_comment_avatar| dettalant/fc2_comment_avatar}
 *
 * @author dettalant
 * @version v0.2.0
 * @license MIT License
 */
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
      // 独自のデフォルト画像を使用する場合はtrue
      this.isUseCustomDefaultImg = false;
      this.isUseAdminAvatar = true;
      if (initArgs === undefined) {
          throw new CommentAvatarError("初期化に必要な情報が入力されませんでした。CommentAvatarクラスの初期化引数には必要情報が格納されたobjectを入れてください");
      }
      var avatars = document.getElementsByClassName(initArgs.avatarClassName);
      if (avatars.length === 0) {
          // lengthが0 = avatar要素が取得できなかった
          throw new CommentAvatarError("アバター要素の取得に失敗しました");
      }
      var avatarSelectButton = document.getElementById(initArgs.avatarSelectButtonId);
      if (avatarSelectButton === null) {
          throw new CommentAvatarError("アバター選択ボタン要素の取得に失敗しました");
      }
      // キャストは怖いがこればかりは仕方がない
      this.avatarContainers = avatars;
      this.avatarClassName = initArgs.avatarClassName;
      this.avatarImgClassName = initArgs.avatarImgClassName;
      this.avatarsList = this.avatarsListFormat(initArgs.avatarsList);
      this.avatarSelectButton = avatarSelectButton;
      this.avatarSelectButtonId = initArgs.avatarSelectButtonId;
      if (initArgs.isUseDataSrc) {
          // useDataSrc項目がtrueである場合のみ上書き
          this.isUseDataSrc = initArgs.isUseDataSrc;
      }
      if (initArgs.isUseAdminAvatar === false) {
          // 管理者コメントを無効化する設定がなされている場合のみ上書き
          this.isUseAdminAvatar = initArgs.isUseAdminAvatar;
      }
      // アバター選択ボタンにデフォルト画像を追加
      this.avatarSelectButtonImg = this.avatarSelectButtonInit(this.avatarSelectButton);
      // アバターコードに合わせて画像書き換え
      // NOTE: promiseを用いたコードにしてもいいかも。
      var avatarsArray = this.scanAvatarCodes();
      this.avatarsImgOverWrite(avatarsArray);
  };
  /**
   * avatarsListを内部で扱いやすく整形する
   * @param  avatarsList 外部から入力されたavatarsList
   * @return         整形後のavatarsList
   */
  CommentAvatar.prototype.avatarsListFormat = function avatarsListFormat (avatarsList) {
      var defaultName = "__default__";
      var adminName = "__admin__";
      if (avatarsList[defaultName] === undefined) {
          // default画像が設定されていないなら追加する
          avatarsList[defaultName] = "https://static.fc2.com/image/sh_design/no_image/no_image_300x300.png";
      }
      else {
          // default画像が設定されていたら書き換え対象を増やすフラグをtrueに
          this.isUseCustomDefaultImg = true;
      }
      if (avatarsList[adminName] === undefined) {
          // 管理者アバター画像が設定されていないなら管理者アバター表示機能を切る
          this.isUseAdminAvatar = false;
      }
      return avatarsList;
  };
  /**
   * アバター選択ボタンを初期化する変数
   * @param  el アバター選択ボタンとなる空要素
   * @return 現在選択中のアバター画像を表示するimg要素
   */
  CommentAvatar.prototype.avatarSelectButtonInit = function avatarSelectButtonInit (el) {
      var elArray = [];
      // 配列内の全てのHTMLElementをel内にぶっこむ
      var elAppendChilds = function (el, elArray) {
          var elArrayLen = elArray.length;
          for (var i = 0; i < elArrayLen; i++) {
              el.appendChild(elArray[i]);
          }
      };
      var avatarImg = document.createElement("img");
      avatarImg.className = "comment_avatar_img lazyload";
      // デフォルトアバターを生成
      var avatarData = this.genDefaultAvatarData();
      // TODO: この部分でlocalStorage情報を取得して、
      // ユーザーが以前設定していたアバターに戻す
      // 画像情報を書き換える
      avatarData.imgEl = avatarImg;
      this.avatarImgOverWrite(avatarData);
      var avatarImgWrapper = document.createElement("div");
      avatarImgWrapper.className = "comment_form_avatar_img_wrapper";
      avatarImgWrapper.appendChild(avatarImg);
      // アバター選択ボタン内に画像を配置
      elArray.push(avatarImgWrapper);
      // ボタンテキストを配置
      var buttonText = el.dataset.buttonText;
      if (buttonText !== undefined) {
          // `data-button-text`が空欄でなければspan要素として追加する
          var avatarButtonText = document.createElement("span");
          avatarButtonText.className = "comment_form_avatar_button_text";
          avatarButtonText.innerText = buttonText;
          elArray.push(avatarButtonText);
      }
      var avatarSelectContainer = document.createElement("div");
      avatarSelectContainer.className = "comment_form_avatar_select_container";
      elArray.push(avatarSelectContainer);
      // 配列内の要素を順番にelへと入れる
      elAppendChilds(el, elArray);
      return avatarImg;
  };
  /**
   * アバターデータを上書きして返す関数
   * 引数のnameとurlは省略可能。その場合はデフォルトの値を使用する
   * @param  avatarData 書き換えるアバターデータ
   * @param  imgEl  アバターデータと紐付ける画像要素
   * @param  name   アバターネーム
   * @param  url    アバター画像url
   * @return        書き換え後のアバターデータ
   */
  CommentAvatar.prototype.avatarDataOverWrite = function avatarDataOverWrite (avatarData, imgEl, name, url) {
      if (imgEl instanceof HTMLImageElement) {
          avatarData.imgEl = imgEl;
      }
      if (name !== undefined) {
          avatarData.name = name;
      }
      if (url !== undefined) {
          avatarData.url = url;
      }
      return avatarData;
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
          var isAdminAvatar = avatar.dataset.isAdminAvatar;
          if (this.isUseAdminAvatar && isAdminAvatar) {
              // 管理者アバターを使用する設定でいて、
              // 管理者コメントの場合は無条件で管理者アバターを使用する
              var adminAvatarName = "__admin__";
              var avatarData = this.avatarDataOverWrite(
              // avatarData
              this.genDefaultAvatarData(), 
              // imgEl
              avatar.querySelector("." + this.avatarImgClassName), 
              // names
              adminAvatarName, 
              // url
              this.avatarsList[adminAvatarName]);
              avatarsData.push(avatarData);
              continue;
          }
          if (code === undefined ||
              code.indexOf("[[") === -1 && code.indexOf("]]") === -1) {
              if (this.isUseCustomDefaultImg) {
                  // custom default画像フラグが有効なら書き換え
                  var avatarData$1 = this.avatarDataOverWrite(this.genDefaultAvatarData(), avatar.querySelector("." + this.avatarImgClassName));
                  avatarsData.push(avatarData$1);
              }
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
              var avatarData$2 = this.avatarDataOverWrite(this.genDefaultAvatarData(), 
              // querySelectorでクラス名検索しているので"."を忘れないこと
              avatar.querySelector("." + this.avatarImgClassName), avatarName, this.avatarsList[avatarName]);
              avatarsData.push(avatarData$2);
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
      return !!this.avatarsList[avatarName];
  };
  /**
   * 初期状態のアバターコードを生成する。
   * 手っ取り早いから関数にしてるけれど、一つのクラスにしてもよかったかも。
   * @return 生成した初期状態アバターコード
   */
  CommentAvatar.prototype.genDefaultAvatarData = function genDefaultAvatarData () {
      var defaultAvatarName = "__default__";
      return {
          imgEl: null,
          name: defaultAvatarName,
          url: this.avatarsList[defaultAvatarName],
      };
  };
  /**
   * 単一のアバターデータを入力して、一つの画像URLを書き換える
   * @param  avatarData 書き換えを行いたいアバターデータ
   */
  CommentAvatar.prototype.avatarImgOverWrite = function avatarImgOverWrite (avatarData) {
      // imgElがnullであったなら次周回へ
      if (avatarData.imgEl === null) {
          return;
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
  };
  /**
   * アバターデータ配列を入力して、ことごとくの画像URLを書き換える
   * @param  avatarsArray 画像書き換えが必要なアバターデータ配列
   */
  CommentAvatar.prototype.avatarsImgOverWrite = function avatarsImgOverWrite (avatarsArray) {
      var avatarsDataLen = avatarsArray.length;
      for (var i = 0; i < avatarsDataLen; i++) {
          this.avatarImgOverWrite(avatarsArray[i]);
      }
  };

  exports.CommentAvatar = CommentAvatar;

  return exports;

}({}));
