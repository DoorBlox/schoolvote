export function json(res, status, obj) {
  res.status(status).setHeader('content-type','application/json').end(JSON.stringify(obj));
}
export function ok(res, obj={}) { json(res, 200, { ok:true, ...obj }); }
export function bad(res, msg='Bad request') { json(res, 400, { ok:false, error: msg }); }
export function server(res, msg='Server error') { json(res, 500, { ok:false, error: msg }); }