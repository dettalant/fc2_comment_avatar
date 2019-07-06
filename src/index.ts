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

    // キャストは怖いがこればかりは仕方がない
    this.avatarContainers = avatars as HTMLCollectionOf<HTMLElement>;
    this.avatarClassName = initArgs.avatarClassName;
    this.avatarImgClassName = initArgs.avatarImgClassName;
    this.avatarsList = initArgs.avatarsList;
    if (initArgs.isUseDataSrc) {
      // useDataSrc項目がtrueである場合のみ上書き
      this.isUseDataSrc = initArgs.isUseDataSrc;
    }

    // アバターコードに合わせて画像書き換え
    // NOTE: promiseを用いたコードにしてもいいかも。
    const avatarsArray = this.scanAvatarCodes();
    this.avatarsImageOverWrite(avatarsArray);

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

      // アバターネーム候補を切り出す
      const avatarName = code.slice(2, -2);
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
   * アバターデータ配列を入力して、ことごとくの画像URLを書き換える
   * @param  avatarsArray 画像書き換えが必要なアバターデータ配列
   */
  avatarsImageOverWrite(avatarsArray: AvatarData[]) {
    const avatarsDataLen = avatarsArray.length;
    for (let i = 0; i < avatarsDataLen; i++) {
      const avatarData = avatarsArray[i];

      // imgElがnullであったなら次周回へ
      if (avatarData.imgEl === null) {
        continue;
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
  }
}
