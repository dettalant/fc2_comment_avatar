/*!
 *   fc2_comment_avatar.js
 * See {@link https://github.com/dettalant/fc2_comment_avatar}
 *
 * @author dettalant
 * @version v0.2.4
 * @license MIT License
 */
var fc2_comment_avatar = (function (exports) {
  'use strict';

  var CommentAvatarError = function CommentAvatarError(message) {
      this.message = message;
      this.name = "CommentAvatarError";
  };
  CommentAvatarError.prototype.toString = function toString () {
      return this.name + ": " + this.message;
  };

  // comment avatar constants
  var caConst;
  (function (caConst) {
      // PCでは"click"を、SPでは"touchend"をクリックイベント指定部分に用いる
      caConst.DEVICE_CLICK_EVENT_TYPE = (window.ontouchend === null) ? "touchend" : "click";
      // defaultアバターを指し示す名前
      caConst.DEFAULT_AVATAR_KEY = "__default__";
      // 管理者アバターを指し示す名前
      caConst.ADMIN_AVATAR_KEY = "__admin__";
      caConst.SECRET_AVATAR_KEY = "__secret__";
      // ローカルストレージ登録に使用するkey name
      caConst.LOCALSTORAGE_AVATAR_CODE_KEY = "avatarCode";
      // ページ上に表示するステート名
      caConst.STATE_VISIBLE = "is_visible";
  })(caConst || (caConst = {}));

  var CommentAvatar = function CommentAvatar(args) {
      if (typeof args === "undefined") {
          throw new CommentAvatarError("初期化に必要な情報が入力されませんでした。CommentAvatarクラスの初期化引数には必要情報が格納されたobjectを入れてください");
      }
      else if (typeof args.avatarsList === "undefined") {
          throw new CommentAvatarError("初期化引数にavatarsList要素がありません！");
      }
      // 値が与えられているならその値を、与えられていないなら初期値を用いる
      var options = this.defaultCommentAvatarOptions;
      if (typeof args.options !== "undefined") {
          Object.assign(options, args.options);
      }
      var targetsSrc = this.defaultCommentAvatarTargetSrc;
      if (typeof args.targetsSrc !== "undefined") {
          Object.assign(targetsSrc, args.targetsSrc);
      }
      this.caArgs = {
          avatarsList: {},
          options: options,
          targetsSrc: targetsSrc,
      };
      var targets = {
          avatars: null,
          avatarSelectButton: null,
          avatarSelectButtonImg: null,
          emailInput: null,
      };
      // HTMLElementなどの取得
      var avatars = document.getElementsByClassName(this.caArgs.targetsSrc.avatarClassName);
      if (avatars.length === 0) {
          // lengthが0 = avatar要素が取得できなかったらコメントアバター書き換え機能を無効化
          this.caArgs.options.isCommentAvatarOverwrite = false;
          this.printDebugMessage("アバター要素の取得失敗。コメント欄アバター書き換え機能無効化", true);
      }
      else {
          targets.avatars = avatars;
      }
      var avatarSelectButton = document.getElementById(this.caArgs.targetsSrc.avatarSelectButtonId);
      if (avatarSelectButton === null) {
          this.caArgs.options.isAvatarSelect = false;
          this.printDebugMessage("アバター選択ボタン要素の取得失敗。コメント入力欄アバター選択機能無効化");
      }
      else {
          targets.avatarSelectButton = avatarSelectButton;
      }
      if (this.caArgs.options.isAvatarSelect) {
          // アバター選択機能が有効な際にのみ追加要素を読み込む
          var emailInput = document.getElementById(this.caArgs.targetsSrc.emailInputId);
          if (emailInput === null || !(emailInput instanceof HTMLInputElement)) {
              this.caArgs.options.isAvatarSelect = false;
              this.printDebugMessage("email入力欄要素の取得失敗。コメント入力欄アバター選択機能無効化");
          }
          else {
              targets.emailInput = emailInput;
          }
      }
      this.caArgs.avatarsList = this.avatarListFormat(args.avatarsList);
      this.caArgs.targets = targets;
      if (this.caArgs.options.isCommentAvatarOverwrite) {
          // アバターコードに合わせて画像書き換え
          // NOTE: promiseを用いたコードにしてもいいかも。
          this.printDebugMessage("コメントアバター書き換え処理実行", false);
          var avatarsArray = this.scanAvatarCodes();
          this.avatarImgsOverwrite(avatarsArray);
      }
      if (this.caArgs.options.isAvatarSelect && this.caArgs.targets.avatarSelectButton !== null) {
          this.printDebugMessage("アバター選択ボタン設置処理実行", true);
          this.avatarSelectButtonInit(this.caArgs.targets.avatarSelectButton);
      }
  };

  var prototypeAccessors = { defaultAvatarData: { configurable: true },userAvatarsData: { configurable: true },defaultCommentAvatarTargetSrc: { configurable: true },defaultCommentAvatarOptions: { configurable: true } };
  /**
   * アバター選択ボタンを初期化・生成する変数
   * @param  el アバター選択ボタンとなる空要素
   * @return 現在選択中のアバター画像を表示するimg要素
   */
  CommentAvatar.prototype.avatarSelectButtonInit = function avatarSelectButtonInit (el) {
          var this$1 = this;

      // type guard処理
      if (typeof this.caArgs.targets === "undefined" ||
          this.caArgs.targets.emailInput === null) {
          return null;
      }
      // 引数で取ったElement内へと追加する要素をこの配列に入れる
      var elAppendQueueArray = [];
      // 配列内の全てのHTMLElementをel内にぶっこむ
      var elAppendChilds = function (el, elArray) {
          var elArrayLen = elArray.length;
          for (var i = 0; i < elArrayLen; i++) {
              el.appendChild(elArray[i]);
          }
      };
      /**
       * 初期設定アバターを特定のアバターで書き換える
       * @param  avatarCode 書き換える対象とするavatarCode
       * @return        書き換えが成功したならtrueを返す
       */
      var replaceInitialAvatar = function (avatarCode) {
          var isSuccessAvatarReplace = false;
          if (typeof this$1.caArgs.targets === "undefined" || this$1.caArgs.targets.emailInput === null) {
              return isSuccessAvatarReplace;
          }
          // アバターコードからアバター名を取り出す
          var avatarName = this$1.avatarCodeParse(avatarCode);
          // 念の為アバターとして登録されているか確認してから処理を始める
          if (this$1.isMatchAvatarName(avatarName)) {
              // メールアドレス欄にアバターコードを入力
              this$1.caArgs.targets.emailInput.value = avatarCode;
              isSuccessAvatarReplace = true;
              this$1.printDebugMessage(avatarName + "アバターを初期アバターとして使用", false);
              // アバター選択ボタン画像の表示対象を書き換え
              this$1.avatarDataOverWrite(avatarData, avatarImg, avatarName, this$1.getAvatarSrcUrl(avatarName));
          }
          return isSuccessAvatarReplace;
      };
      /**
       * アバター選択ボタンをまとめてぶっこむ
       * @param  el アバター選択ボタンをぶっこむHTML要素
       */
      var elAppendAvatarSelectButtons = function (el) {
          var userAvatars = this$1.userAvatarsData;
          var userAvatarsLen = userAvatars.length;
          var loop = function ( i ) {
              var avatar = userAvatars[i];
              // ボタン要素の用意
              var buttonEl = document.createElement("button");
              buttonEl.type = "button";
              buttonEl.className = "comment_form_avatar_select_button";
              // アバターがクリック選択された際の処理
              buttonEl.addEventListener(caConst.DEVICE_CLICK_EVENT_TYPE, function () {
                  // type guard処理
                  if (typeof this$1.caArgs.targets === "undefined" ||
                      this$1.caArgs.targets.emailInput === null ||
                      this$1.caArgs.targets.avatarSelectButtonImg === null) {
                      this$1.printDebugMessage("個別アバター選択ボタンクリック処理に必要要素が不足。処理を中止", true);
                      return;
                  }
                  // メールアドレス欄ジャック処理
                  var emailValue = "";
                  if (avatar.name !== caConst.DEFAULT_AVATAR_KEY) {
                      // デフォルト画像以外の場合のみアバターコードを入れる
                      emailValue = "[[" + avatar.name + "]]";
                  }
                  // email欄の書き換え
                  this$1.caArgs.targets.emailInput.value = emailValue;
                  // TODO: ここでローカルストレージ欄の書き換え
                  localStorage.setItem(caConst.LOCALSTORAGE_AVATAR_CODE_KEY, emailValue);
                  // 直接画像src欄を書き換え
                  this$1.caArgs.targets.avatarSelectButtonImg.src = avatar.url;
              });
              // ボタン要素に入れる画像の用意
              var imgEl = document.createElement("img");
              imgEl.className = "comment_avatar_img lazyload";
              avatar.imgEl = imgEl;
              this$1.avatarImgOverwrite(avatar);
              // ボタン要素に画像を追加
              buttonEl.appendChild(avatar.imgEl);
              // 親要素にボタン要素を追加
              el.appendChild(buttonEl);
          };

              for (var i = 0; i < userAvatarsLen; i++) loop( i );
      };
      // アバター選択ボタンに表示するアバター画像
      var avatarImg = document.createElement("img");
      avatarImg.className = this.caArgs.targetsSrc.avatarClassName;
      // デフォルトアバターを生成
      var avatarData = this.defaultAvatarData;
      // data-initial-avatar属性を取得する: 主にコメント編集画面用
      var initialAvatarCode = el.dataset.initialAvatar;
      // initialAvatarでの書き換えに成功したらlocalStorage側の値は使わない
      var isSuccessAvatarReplace = false;
      if (typeof initialAvatarCode !== "undefined" && initialAvatarCode !== "") {
          isSuccessAvatarReplace = replaceInitialAvatar(initialAvatarCode);
      }
      // localStorageに記録していたアバターコードを取得して、
      // ユーザーが以前設定していたアバターに戻す
      if (!isSuccessAvatarReplace) {
          var storeAvatarCode = localStorage.getItem(caConst.LOCALSTORAGE_AVATAR_CODE_KEY);
          if (storeAvatarCode !== null && storeAvatarCode !== "") {
              replaceInitialAvatar(storeAvatarCode);
          }
      }
      // 画像情報を書き換える
      avatarData.imgEl = avatarImg;
      this.avatarImgOverwrite(avatarData);
      // 画像要素をargsオブジェクトに登録しておく
      this.caArgs.targets.avatarSelectButtonImg = avatarImg;
      var avatarImgWrapper = document.createElement("div");
      avatarImgWrapper.className = "comment_form_avatar_img_wrapper";
      avatarImgWrapper.appendChild(avatarImg);
      // アバター選択ボタン内に画像を配置
      elAppendQueueArray.push(avatarImgWrapper);
      // ボタンテキストを配置
      var buttonText = el.dataset.buttonText;
      if (typeof buttonText !== "undefined") {
          // `data-button-text`が空欄でなければspan要素として追加する
          var avatarButtonText = document.createElement("span");
          avatarButtonText.className = "comment_form_avatar_button_text";
          avatarButtonText.innerText = buttonText;
          elAppendQueueArray.push(avatarButtonText);
      }
      var avatarSelectContainer = document.createElement("div");
      avatarSelectContainer.className = "comment_form_avatar_select_container";
      // avatarSelectContainer内へとavatar画像を一気に放り込む
      elAppendAvatarSelectButtons(avatarSelectContainer);
      elAppendQueueArray.push(avatarSelectContainer);
      // 配列内の要素を順番にelへと入れる
      elAppendChilds(el, elAppendQueueArray);
      // 親要素をクリックしたらavatarSelectContainer表示の切り替えを行う
      el.addEventListener(caConst.DEVICE_CLICK_EVENT_TYPE, function () {
          avatarSelectContainer.classList.toggle(caConst.STATE_VISIBLE);
      });
      // avatarSelectContainerが展開されている際に範囲外をクリックすると閉じる
      document.addEventListener(caConst.DEVICE_CLICK_EVENT_TYPE, function (e) {
          if (avatarSelectContainer.className.indexOf(caConst.STATE_VISIBLE) === -1) {
              // アバター選択ウィンドウが展開されていなければ処理終了
              return;
          }
          // Jqueryのclosest的な挙動の関数。引数にとったtagNameと一致する、一番近い親要素を返す。
          // もしdocumentまで遡ってしまったらdocumentを返す。
          var closestElement = function (el, name) {
              var elTagName = el.tagName.toUpperCase();
              var tagName = name.toUpperCase();
              if (elTagName === tagName) {
                  return el;
              }
              else if (elTagName !== tagName && el.parentElement !== null) {
                  return closestElement(el.parentElement, tagName);
              }
              return el;
          };
          if (e.target instanceof Element) {
              var parentButton = closestElement(e.target, "button");
              var isOtherAreaClick = parentButton.className.indexOf("comment_form_avatar_select_button") === -1 &&
                  parentButton.className.indexOf("comment_form_avatar_button") === -1;
              if (isOtherAreaClick) {
                  avatarSelectContainer.classList.remove(caConst.STATE_VISIBLE);
              }
          }
      });
      return avatarImg;
  };
  /**
   * avatar要素全てのdata-avatar-code部分を確認して、
   * 存在するavatar名と一致したavatarDataの配列を返す
   * @return [description]
   */
  CommentAvatar.prototype.scanAvatarCodes = function scanAvatarCodes () {
      if (typeof this.caArgs.targets === "undefined" || this.caArgs.targets.avatars === null) {
          return [];
      }
      var avatarsLen = this.caArgs.targets.avatars.length;
      var avatarImgClassName = this.caArgs.targetsSrc.avatarImgClassName;
      var avatarsData = [];
      for (var i = 0; i < avatarsLen; i++) {
          var avatar = this.caArgs.targets.avatars[i];
          if (!(avatar instanceof HTMLElement)) {
              continue;
          }
          var code = avatar.dataset.avatarCode;
          var isAdminAvatar = avatar.dataset.isAdminAvatar;
          // 非公開コメントかどうかを検知するためのコメント件名
          var commentSubject = (typeof avatar.dataset.commentSubject !== "undefined") ? avatar.dataset.commentSubject : "";
          // 非公開コメントの場合はコメント件名がこの文字列になる
          var secretCommentSubject = "管理人のみ閲覧できます";
          if (this.caArgs.options.isUseAdminAvatar && isAdminAvatar) {
              // 管理者アバターを使用する設定でいて、
              // 管理者コメントの場合は無条件で管理者アバターを使用する
              var adminAvatarName = caConst.ADMIN_AVATAR_KEY;
              var avatarData = this.avatarDataOverWrite(
              // avatarData
              this.defaultAvatarData, 
              // imgEl
              avatar.querySelector("." + avatarImgClassName), 
              // names
              adminAvatarName, 
              // url
              this.getAvatarSrcUrl(adminAvatarName));
              avatarsData.push(avatarData);
              continue;
          }
          else if (this.caArgs.options.isUseSecretAvatar && commentSubject.indexOf(secretCommentSubject) !== -1) {
              // 非公開アバターを使用する設定でいて、
              // コメント件名が"管理人のみ閲覧できます"の場合は非公開コメントと判定し、
              // 非公開アバターに差し替える
              var secretAvatarName = caConst.SECRET_AVATAR_KEY;
              var avatarData$1 = this.avatarDataOverWrite(this.defaultAvatarData, avatar.querySelector("." + avatarImgClassName), secretAvatarName, this.getAvatarSrcUrl(secretAvatarName));
              avatarsData.push(avatarData$1);
              continue;
          }
          if (typeof code === "undefined" ||
              code.indexOf("[[") === -1 && code.indexOf("]]") === -1) {
              if (this.caArgs.options.isUseCustomDefaultImg) {
                  // custom default画像フラグが有効なら書き換え
                  var avatarData$2 = this.avatarDataOverWrite(this.defaultAvatarData, avatar.querySelector("." + avatarImgClassName));
                  avatarsData.push(avatarData$2);
              }
              continue;
          }
          // 取得したアバターコードからアバター名を切り出す
          var avatarName = this.avatarCodeParse(code);
          if (avatarName === "") {
              // マッチしなかった場合は次周回へ
              continue;
          }
          else if (this.isMatchAvatarName(avatarName)) {
              // アバターとして登録されているものだったなら、
              // アバターデータを生成して配列に入れる
              var avatarData$3 = this.avatarDataOverWrite(this.defaultAvatarData, 
              // querySelectorでクラス名検索しているので"."を忘れないこと
              avatar.querySelector("." + avatarImgClassName), avatarName, this.getAvatarSrcUrl(avatarName));
              avatarsData.push(avatarData$3);
          }
      }
      return avatarsData;
  };
  /**
   * avatarListを内部で扱いやすく整形する
   * @param  avatarList 外部から入力されたavatarsList
   * @return         整形後のavatarList
   */
  CommentAvatar.prototype.avatarListFormat = function avatarListFormat (avatarList) {
      if (typeof avatarList[caConst.DEFAULT_AVATAR_KEY] === "undefined") {
          // default画像が設定されていないなら追加する
          avatarList[caConst.DEFAULT_AVATAR_KEY] = "https://static.fc2.com/image/sh_design/no_image/no_image_300x300.png";
      }
      else if (typeof this.caArgs.options.isUseCustomDefaultImg === "undefined") {
          // default画像が設定されていて、
          // なおかつoptionsから直接指定されていなければ、
          // `__default__`として指定された値をデフォルト画像に用いるフラグをtrueに
          this.caArgs.options.isUseCustomDefaultImg = true;
      }
      if (typeof avatarList[caConst.ADMIN_AVATAR_KEY] === "undefined") {
          // 管理者アバター画像が設定されていないなら管理者アバター表示機能を切る
          this.caArgs.options.isUseAdminAvatar = false;
      }
      if (typeof avatarList[caConst.SECRET_AVATAR_KEY] === "undefined") {
          this.caArgs.options.isUseSecretAvatar = false;
      }
      return avatarList;
  };
  /**
   * アバターコードを読み取って内包されるアバター名を返す
   * @param  avatarCode アバター指定コード
   * @return        アバター名
   */
  CommentAvatar.prototype.avatarCodeParse = function avatarCodeParse (avatarCode) {
      // # 正規表現マッチ条件
      // * "[["と"]]"に囲われた最初の対象にマッチ
      // * 空白と"["と"]"を含めない文字列を
      // * `[[ foo ]]`のように空白をつけた記述をされていても取り出す
      // * 空白は半角/全角両方を対象とする
      var regex = /\[\[[\s　]*?([^\[\]\s　]+?)[\s　]*?\]\]/;
      var avatarNameArray = regex.exec(avatarCode);
      if (avatarNameArray === null || avatarNameArray.length < 2) {
          // マッチしなかった場合、もしくは何らかの問題で部分取得ができなかった場合は空欄を返す
          return "";
      }
      return avatarNameArray[1];
  };
  /**
   * 入力されたアバターネームが、avatarsListに登録されているかを判定する。登録されていたらtrue。
   * @param  avatarName 判別に用いるemail欄テキスト
   * @return アバターネームが登録されていたかどうかのbool
   */
  CommentAvatar.prototype.isMatchAvatarName = function isMatchAvatarName (avatarName) {
      return !!this.caArgs.avatarsList[avatarName];
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
      if (typeof name !== "undefined") {
          avatarData.name = name;
      }
      if (typeof url !== "undefined") {
          avatarData.url = url;
      }
      return avatarData;
  };
  /**
   * 単一のアバターデータを入力して、一つの画像URLを書き換える
   * @param  avatarData 書き換えを行いたいアバターデータ
   */
  CommentAvatar.prototype.avatarImgOverwrite = function avatarImgOverwrite (avatarData) {
      // 受け取ったデータのimgElがnullであったなら早期リターン
      if (avatarData.imgEl === null) {
          return;
      }
      if (this.caArgs.options.isUseLazysizes) {
          // data-src要素を書き換え
          avatarData.imgEl.dataset.src = avatarData.url;
          // lazysizesに書き換えてもらうためにクラス名を付け替える
          avatarData.imgEl.className = this.caArgs.targetsSrc.avatarImgClassName + " lazyload";
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
  CommentAvatar.prototype.avatarImgsOverwrite = function avatarImgsOverwrite (avatarsArray) {
      var avatarsDataLen = avatarsArray.length;
      for (var i = 0; i < avatarsDataLen; i++) {
          this.avatarImgOverwrite(avatarsArray[i]);
      }
  };
  /**
   * デバッグモード有効状態で、もろもろの事柄を出力する
   * @param  text   コンソールに出力するテキスト
   * @param  isWarn 警告としてコンソール出力するならtrue
   */
  CommentAvatar.prototype.printDebugMessage = function printDebugMessage (text, isWarn) {
      if (!this.caArgs.options.isDebug) {
          // デバッグモードでないなら即終了
          return;
      }
      if (isWarn) {
          console.warn(text);
      }
      else {
          console.log(text);
      }
  };
  /**
   * avatarsListが内包するUrlを返す。もしアバター名でurlが引き出せなければ空欄を返す
   * @param  avatarName urlを取り出したいアバター名
   * @return        アバター名と紐付けられた画像url
   */
  CommentAvatar.prototype.getAvatarSrcUrl = function getAvatarSrcUrl (avatarName) {
      var url = this.caArgs.avatarsList[avatarName];
      return (typeof url === "undefined") ? "" : url;
  };
  /**
   * 初期状態のアバターコードを生成する。
   * 手っ取り早いから関数にしてるけれど、一つのクラスにしてもよかったかも。
   * @return 生成した初期状態アバターコード
   */
  prototypeAccessors.defaultAvatarData.get = function () {
      var defaultAvatarName = caConst.DEFAULT_AVATAR_KEY;
      return {
          imgEl: null,
          name: defaultAvatarName,
          url: this.getAvatarSrcUrl(defaultAvatarName),
      };
  };
  /**
   * 表示できる全てのアバターを取得する。
   * 管理者アバターだけは特別な値として取得しない。
   * @return 管理者アバターを除くアバターデータ一覧
   */
  prototypeAccessors.userAvatarsData.get = function () {
      var userAvatars = [];
      var avatarNames = Object.keys(this.caArgs.avatarsList);
      var avatarsListLen = avatarNames.length;
      // デフォルトアバターは配列0番であってほしいので初めに追加
      userAvatars.push(this.defaultAvatarData);
      for (var i = 0; i < avatarsListLen; i++) {
          var avatarName = avatarNames[i];
          if (avatarName === caConst.DEFAULT_AVATAR_KEY ||
              avatarName === caConst.ADMIN_AVATAR_KEY ||
              avatarName === caConst.SECRET_AVATAR_KEY) {
              // デフォルトアバターと管理者アバターと非公開コメントアバターは除外
              continue;
          }
          var avatar = {
              imgEl: null,
              name: avatarName,
              url: this.getAvatarSrcUrl(avatarName)
          };
          userAvatars.push(avatar);
      }
      return userAvatars;
  };
  /**
   * CommentAvatarTargetsSrcの初期値を返す
   * @return commentAvatarTargetsSrc初期値
   */
  prototypeAccessors.defaultCommentAvatarTargetSrc.get = function () {
      return {
          avatarClassName: "comment_avatar",
          // アバター画像クラス名
          avatarImgClassName: "comment_avatar_img",
          // アバター選択ボタンid
          avatarSelectButtonId: "commentAvatarSelectButton",
          // メールアドレス入力欄id
          emailInputId: "commentFormMail",
      };
  };
  /**
   * [defaultCommentAvatarOptions description]
   * @return [description]
   */
  prototypeAccessors.defaultCommentAvatarOptions.get = function () {
      return {
          // url書き換え先としてdata-src属性を使用するか否か
          isUseLazysizes: false,
          // 管理者コメントに管理者アバター画像を表示するか否か
          isUseAdminAvatar: true,
          // 非公開コメントに専用アバターを付与するか否か
          isUseSecretAvatar: true,
          // 投稿コメントのアバターを書き換え機能の有効化設定
          isCommentAvatarOverwrite: true,
          // アバター選択ボタン機能の有効化設定
          isAvatarSelect: true,
          // デバッグモードの有効化設定
          isDebug: false,
      };
  };

  Object.defineProperties( CommentAvatar.prototype, prototypeAccessors );

  exports.CommentAvatar = CommentAvatar;

  return exports;

}({}));
