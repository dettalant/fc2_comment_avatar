/**
 * 初期化時に要求するオブジェクト。これで諸々の設定を変更する
 */
export interface CommentAvatarArgs {
  options: CommentAvatarOptions,
  targetsSrc: CommentAvatarTargetsSrc,
  targets?: CommentAvatarTargets
  // アバター画像をまとめてobjectとして登録
  // key: アバター指定コード
  // value: アバター画像url
  avatarsList: AvatarList;

}

/**
 * スクリプト全体の設定値まとめオブジェクト
 */
export interface CommentAvatarOptions {
  // lazysizes.js対応処理を行うか否か
  isUseLazysizes?: boolean;
  // 管理者コメントに専用アバターを付与するか否か
  isUseAdminAvatar?: boolean;
  // 非公開コメントに専用アバターを付与するか否か
  isUseSecretAvatar?: boolean;
  // 独自のデフォルト画像を使用するか否か
  isUseCustomDefaultImg?: boolean;
  // 投稿コメントのアバターを書き換える機能を有効にするか否か
  // 投稿コメント要素を取得できなければ機能を切る
  isCommentAvatarOverwrite?: boolean;
  // アバター選択ボタン機能を有効にするか否か
  // アバター選択ボタン要素を取得できなければ機能を切る
  isAvatarSelect?: boolean;
  // デバッグモードの設定
  // デバッグモードでは要素読み込み失敗などでwarnを発する
  isDebug?: boolean;
}

/**
 * 操作対象要素を取得するためのクラス名やid名まとめ
 */
export interface CommentAvatarTargetsSrc {
  // アバター画像を格納する親要素でいて、
  // data-avatar-codeを記述した要素のクラス名
  avatarClassName: string;
  // アバター画像クラス名
  avatarImgClassName: string;
  // メールアドレス入力欄クラス名
  emailInputId: string;
  // アバター選択ボタンのid
  avatarSelectButtonId: string;
}

/**
 * 操作対象となる要素をまとめるオブジェクト
 */
export interface CommentAvatarTargets {
  avatars: HTMLCollectionOf<Element> | null;
  avatarSelectButton: HTMLElement | null;
  avatarSelectButtonImg: HTMLImageElement | null;
  emailInput: HTMLInputElement | null;
}

/**
 * 画像指定アバターコードと、その画像URLの組み合わせ。
 * key側の中身を文字列をアバターコードとして使用して、
 * value側の中身を画像URLとして使用する。
 */
export interface AvatarList {
  [s: string]: string
}

/**
 * アバターのimg要素、アバター名、アバター画像URLをセットにしたobject
 * scanAvatarCodes()で配列に入れて生成し、avatarsImgOverWrite()で書き換える
 */
export interface AvatarData {
  imgEl: HTMLImageElement | null;
  name: string;
  url: string;
}
