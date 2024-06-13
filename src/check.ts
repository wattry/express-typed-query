// export class Check {
//   public objectRegex = /{[\s\S]*}/m;
//   public arrayRegex = /\[[\s\S]*\]/m;
//   public qsArrayRegex: RegExp = /\[\]$/m;
//   public qsDeepObjectRegex: RegExp = /\[([a-zA-Z])\]$/;
//   public quoteMatcherRegex = /"|'/g;
//   public quoteReplacerRegex = /((\d+(\.\d+)?)|\w+)/g;

//   #logger;

//   constructor(logger: Logger) {
//     this.#logger = logger;
//   }

//   isQsArray(key: string) {
//     const name = this.isQsArray.name;

//     this.#logger.debug(name, key);

//     return this.qsArrayRegex.test(key);
//   }

//   isQsDeepObject(key: string) {
//     const name = this.isQsDeepObject.name;

//     this.#logger.debug(name, key);

//     return this.qsDeepObjectRegex.test(key);
//   }

//   isQsStructure(key: string) {
//     const name = this.isQsStructure.name;

//     this.#logger.debug(name, key);

//     return this.isQsArray(key) || this.isQsDeepObject(key);
//   }

//   isNumber(value: any) {
//     const name = this.isNumber.name;

//     this.#logger.debug(name, value);
//     const number = Number.parseFloat(value);

//     if (!Number.isNaN(number) && isFinite(value)) {
//       return true;
//     }

//     return false;
//   }

//   isString(value: any): boolean {
//     const name = this.isString.name;

//     this.#logger.debug(name, value);
//     return typeof value === 'string';
//   }

//   isBoolean(value: any): boolean {
//     const name = this.isBoolean.name;

//     this.#logger.debug(name, value);
//     if (this.isString(value)) {
//       return (value.toLowerCase() === 'true' || value.toLowerCase() === 'false')
//     } else {
//       return value === true || value === false;
//     }
//   }

//   isDate(value: any): boolean {
//     const name = this.isDate.name;

//     this.#logger.debug(name, value);
//     try {
//       new Date(value).toISOString();

//       return true
//     } catch (error: any) {
//       return false;
//     }
//   }

//   isFunction(value: any): boolean {
//     const name = this.isFunction.name;

//     this.#logger.debug(name, value);
//     return typeof value === 'function';
//   }

//   isArray(value: any): boolean {
//     const name = this.isArray.name;

//     this.#logger.debug(name, value);
//     return value instanceof Array || Object.prototype.toString.call(value) === '[object Array]' || Array.isArray(value);
//   }

//   isJson(value: any): boolean {
//     const name = this.isJson.name;

//     this.#logger.debug(name, value);
//     if (this.isString(value)) {
//       const trimmed = value.trim();

//       const isJson = this.objectRegex.test(trimmed) || this.arrayRegex.test(trimmed)

//       return isJson;
//     }

//     return false;
//   }

//   isObject(value: any): boolean {
//     const name = this.isObject.name;

//     this.#logger.debug(name, value);

//     return !(value === null) && value instanceof Object && Object.prototype.toString.call(value) === '[object Object]';
//   }
// }

export const objectRegex: RegExp = /{[\s\S]*}/m;
export const arrayRegex: RegExp = /\[[\s\S]*\]/m;
export const qsArrayRegex: RegExp = /\[\]$/m;
export const qsDeepObjectRegex: RegExp = /\[([a-zA-Z])\]$/;
export const quoteMatcherRegex: RegExp = /"|'/g;
export const quoteReplacerRegex: RegExp = /((\d+(\.\d+)?)|\w+)/g;

function isQsArray(key: string) {
  return qsArrayRegex.test(key);
}

function isQsDeepObject(key: string) {
  return qsDeepObjectRegex.test(key);
}

function isQsStructure(key: string) {
  return isQsArray(key) || isQsDeepObject(key);
}

function isNumber(value: any) {
  const number = Number.parseFloat(value);

  if (!Number.isNaN(number) && isFinite(value)) {
    return true;
  }

  return false;
}

function isString(value: any): boolean {
  return typeof value === 'string';
}

function isBoolean(value: any): boolean {
  if (isString(value)) {
    return (value.toLowerCase() === 'true' || value.toLowerCase() === 'false')
  } else {
    return value === true || value === false;
  }
}

function isDate(value: any): boolean {
  try {
    new Date(value).toISOString();

    return true
  } catch (error: any) {
    return false;
  }
}

function isFunction(value: any): boolean {
  return typeof value === 'function';
}

function isArray(value: any): boolean {
  return value instanceof Array || Object.prototype.toString.call(value) === '[object Array]' || Array.isArray(value);
}

function isJson(value: any): boolean {
  if (isString(value)) {
    const trimmed = value.trim();

    return objectRegex.test(trimmed) || arrayRegex.test(trimmed);
  }

  return false;
}

function isObject(value: any): boolean {
  return !(value === null) && value instanceof Object && Object.prototype.toString.call(value) === '[object Object]';
}

export default {
  objectRegex,
  arrayRegex,
  qsArrayRegex,
  qsDeepObjectRegex,
  quoteMatcherRegex,
  quoteReplacerRegex,
  isQsArray,
  isQsDeepObject,
  isQsStructure,
  isNumber,
  isString,
  isBoolean,
  isDate,
  isFunction,
  isArray,
  isObject,
  isJson
};