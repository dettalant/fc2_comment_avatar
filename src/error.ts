export class CommentAvatarError implements Error {
  public name = "CommentAvatarError";

  constructor(public message: string) {}

  toString() {
    return this.name + ": " + this.message;
  }
}
