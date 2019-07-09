class CommentAvatarError implements Error {
  public name = "NavManagerError";

  constructor(public message: string) {}

  toString() {
    return this.name + ": " + this.message;
  }
}

/**
 * 初期化時に要求するオブジェクト。これで諸々の設定を変更する
 */
interface CommentAvatarArgs {
  // アバター画像を格納する親要素でいて、
  // data-avatar-codeを記述した要素のクラス名
  avatarClassName: string;
  // アバター画像クラス名
  avatarImgClassName: string;
  // url書き換え先としてdata-src属性を使用するか否か
  // lazyloadなどでdata-srcを用いるならtrue、用いないならfalse
  isUseDataSrc?: boolean;
  // アバター画像をまとめてobjectとして登録
  // key: アバター指定コード
  // value: アバター画像url
  avatarsList: AvatarsList;
  // アバター選択ボタンのid
  avatarSelectButtonId: string;
}

/**
 * 画像指定アバターコードと、その画像URLの組み合わせ。
 * key側の中身を文字列をアバターコードとして使用して、
 * value側の中身を画像URLとして使用する。
 */
interface AvatarsList {
  [s: string]: string
}

/**
 * アバターのimg要素、アバター名、アバター画像URLをセットにしたobject
 * scanAvatarCodes()で配列に入れて生成し、avatarsImgOverWrite()で書き換える
 */
interface AvatarData {
  imgEl: HTMLImageElement | null;
  name: string;
  url: string;
}

export class CommentAvatar implements CommentAvatarArgs {
  avatarContainers: HTMLCollectionOf<HTMLElement>;
  avatarClassName: string;
  avatarImgClassName: string;
  avatarSelectButton: HTMLElement;
  avatarSelectButtonId: string;
  avatarSelectButtonImg: HTMLImageElement;
  // 初期値ではdata-src属性を使用しない
  isUseDataSrc: boolean = false;
  avatarsList: AvatarsList;
  constructor(initArgs?: CommentAvatarArgs) {
    if (initArgs === undefined) {
      throw new CommentAvatarError("初期化に必要な情報が入力されませんでした。CommentAvatarクラスの初期化引数には必要情報が格納されたobjectを入れてください");
    }

    const avatars = document.getElementsByClassName(initArgs.avatarClassName);
    if (avatars.length === 0) {
      // lengthが0 = avatar要素が取得できなかった
      throw new CommentAvatarError("アバター要素の取得に失敗しました");
    }

    const avatarSelectButton = document.getElementById(initArgs.avatarSelectButtonId);
    if (avatarSelectButton === null) {
      throw new CommentAvatarError("アバター選択ボタン要素の取得に失敗しました");
    }

    // キャストは怖いがこればかりは仕方がない
    this.avatarContainers = avatars as HTMLCollectionOf<HTMLElement>;
    this.avatarClassName = initArgs.avatarClassName;
    this.avatarImgClassName = initArgs.avatarImgClassName;
    this.avatarsList = initArgs.avatarsList;
    this.avatarSelectButton = avatarSelectButton;
    this.avatarSelectButtonId = initArgs.avatarSelectButtonId;
    if (initArgs.isUseDataSrc) {
      // useDataSrc項目がtrueである場合のみ上書き
      this.isUseDataSrc = initArgs.isUseDataSrc;
    }

    // アバター選択ボタンにデフォルト画像を追加
    this.avatarSelectButtonImg = this.avatarSelectButtonInit(this.avatarSelectButton)


    // アバターコードに合わせて画像書き換え
    // NOTE: promiseを用いたコードにしてもいいかも。
    const avatarsArray = this.scanAvatarCodes();
    this.avatarsImgOverWrite(avatarsArray);

  }

  /**
   * アバター選択ボタンを初期化する変数
   * @param  el アバター選択ボタンとなる空要素
   * @return 現在選択中のアバター画像を表示するimg要素
   */
  avatarSelectButtonInit(el: HTMLElement): HTMLImageElement {
    const avatarImg = document.createElement("img");
    avatarImg.className = "comment_avatar_img lazyload";

    // デフォルトアバターを生成
    const avatarData = this.genDefaultAvatarData();

    // TODO: この部分でCookie情報を取得して、
    // 以前設定していたアバターに戻す

    // 画像情報を書き換える
    avatarData.imgEl = avatarImg;
    this.avatarImgOverWrite(avatarData)

    const avatarImgWrapper = document.createElement("div");
    avatarImgWrapper.className = "comment_form_avatar_img_wrapper";
    avatarImgWrapper.appendChild(avatarImg);

    // アバター選択ボタン内に画像を配置
    el.appendChild(avatarImgWrapper);

    const buttonText = el.dataset.buttonText;
    if (buttonText !== undefined) {
      // `data-button-text`が空欄でなければspan要素として追加する
      const avatarButtonText = document.createElement("span");
      avatarButtonText.className = "comment_form_avatar_button_text";
      avatarButtonText.innerText = buttonText;
      el.appendChild(avatarButtonText);
    }

    return avatarImg;
  }

  /**
   * avatar要素全てのdata-avatar-code部分を確認して、
   * 存在するavatar名と一致したavatarDataの配列を返す
   * @return [description]
   */
  scanAvatarCodes(): AvatarData[] {
    const avatarContainersLen = this.avatarContainers.length;
    const avatarsData = [];
    for (let i = 0; i < avatarContainersLen; i++) {
      const avatar = this.avatarContainers[i];
      const code = avatar.dataset.avatarCode;
      if (code === undefined) {
        continue;
      } else if (code.indexOf("[[") === -1 && code.indexOf("]]") === -1) {
        // アバターコードを示す両端の文字烈が見つからなかった場合は次の周回へ
        continue;
      }

      // # 正規表現マッチ条件
      // * "[["と"]]"に囲われた最初の対象にマッチ
      // * 空白と"["と"]"を含めない文字列を
      // * `[[ foo ]]`のように空白をつけた記述をされていても取り出す
      // * 空白は半角/全角両方を対象とする
      const regex = /\[\[[\s　]*?([^\[\]\s　]+?)[\s　]*?\]\]/;

      const avatarNameArray = regex.exec(code);
      // マッチしなければ次周回へ
      if (avatarNameArray === null) {
        continue;
      }

      const avatarName = avatarNameArray[1];
      if (this.isMatchAvatarName(avatarName)) {
        // 切り出したアバターネームが登録されていた場合は、
        // アバターデータを生成して配列に入れる
        const avatarData = this.genDefaultAvatarData();

        // querySelectorでクラス名検索しているので"."を忘れないこと
        avatarData.imgEl = avatar.querySelector("." + this.avatarImgClassName);
        avatarData.name = avatarName;
        avatarData.url = this.avatarsList[avatarName];

        avatarsData.push(avatarData);
      }
    }

    return avatarsData;
  }

  /**
   * 入力されたアバターネームが、avatarsListに登録されているかを判定する。登録されていたらtrue。
   * @param  avatarName 判別に用いるemail欄テキスト
   * @return アバターネームが登録されていたかどうかのbool
   */
  isMatchAvatarName(avatarName: string): boolean {
    return !!(this.avatarsList[avatarName]);
  }

  /**
   * 初期状態のアバターコードを生成する。
   * 手っ取り早いから関数にしてるけれど、一つのクラスにしてもよかったかも。
   * @return 生成した初期状態アバターコード
   */
  genDefaultAvatarData(): AvatarData {
    const defaultAvatarName = "__default__";
    let avatarUrl = "//static.fc2.com/image/sh_design/no_image/no_image_300x300.png"
    if (this.avatarsList[defaultAvatarName]) {
      avatarUrl = this.avatarsList[defaultAvatarName];
    }

    return {
      imgEl: null,
      name: defaultAvatarName,
      url: avatarUrl
    }
  }

  /**
   * 単一のアバターデータを入力して、一つの画像URLを書き換える
   * @param  avatarData 書き換えを行いたいアバターデータ
   */
  avatarImgOverWrite(avatarData: AvatarData) {
    // imgElがnullであったなら次周回へ
    if (avatarData.imgEl === null) {
      return;
    }

    if (this.isUseDataSrc) {
      // data-src要素を書き換え
      // ここのキャストも致し方なし
      avatarData.imgEl.dataset.src = avatarData.url;
    } else {
      // src要素を書き換え
      avatarData.imgEl.src = avatarData.url;
    }
  }

  /**
   * アバターデータ配列を入力して、ことごとくの画像URLを書き換える
   * @param  avatarsArray 画像書き換えが必要なアバターデータ配列
   */
  avatarsImgOverWrite(avatarsArray: AvatarData[]) {
    const avatarsDataLen = avatarsArray.length;
    for (let i = 0; i < avatarsDataLen; i++) {
      this.avatarImgOverWrite(avatarsArray[i]);
    }
  }
}
