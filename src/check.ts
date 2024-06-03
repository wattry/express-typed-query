const objectRegex = /{[\s\S]*}/gm;
const arrayRegex = /\[[\s\S]*\]/gm;

export function isString(value: any) {
  return typeof value === 'string';
}

export function isBoolean(value: any) {
  if (isString(value)) {
    return (value.toLowerCase() === 'true' || value.toLowerCase() === 'false')
  } else {
    return value === true || value === false;
  }
}

export function isDate(value: any) {
  try {
    new Date(value).toISOString();
    return true
  } catch (error: any) {
    return false;
  }
}

export function isArray(value: any) {
  return value instanceof Array || Object.prototype.toString.call(value) === '[object Array]';
}

export function isJsonString(value: any) {
  return isString(value) && (objectRegex.test(value) || arrayRegex.test(value));
}

export function isJsonObject(value: any) {
  return !(value === null) && value instanceof Object && Object.prototype.toString.call(value) === '[object Object]';
}

export default { isString, isBoolean, isJsonObject, isJsonString, isArray, isDate };
