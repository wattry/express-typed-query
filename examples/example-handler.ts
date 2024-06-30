import { Request, Response } from "express";

export const exampleHandler = (
  request: Request,
  response: Response
) => {
  const { query } = request;
  console.log('query.now is date?', query.now instanceof Date);
  console.log();
  console.log('query.id is?', typeof query.id);
  console.log('query.stringId is?', typeof query.stringId);
  console.log('query.q is?', typeof query.q);
  console.log('query.boolean is?', typeof query.boolean);

  response.send({ ...query, now: query.now?.toLocaleString() });
};