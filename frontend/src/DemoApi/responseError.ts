import { JsonValue } from './DemoTypes';

export class ResponseError extends Error {
  public status: number;

  public body: JsonValue;

  public constructor(status: number, body: JsonValue) {
    super(`Request failed with ${status}`);
    this.status = status;
    this.body = body;
  }
}
