"use strict";

function charAt(string, index) {
  var first = string.charCodeAt(index);
  var second;
  if (first >= 55296 && first <= 56319 && string.length > index + 1) {
    second = string.charCodeAt(index + 1);
    if (second >= 56320 && second <= 57343) {
      return string.substring(index, index + 2);
    }
  }
  return string[index];
}

function slice(string, start, end) {
  var accumulator = "";
  var character;
  var stringIndex = 0;
  var unicodeIndex = 0;
  var length = string.length;

  while (stringIndex < length) {
    character = charAt(string, stringIndex);
    if (unicodeIndex >= start && unicodeIndex < end) {
      accumulator += character;
    }
    stringIndex += character.length;
    unicodeIndex += 1;
  }
  return accumulator;
}

function toNumber(value, fallback) {
  if (value === undefined) {
    return fallback;
  } else {
    return Number(value);
  }
}

module.exports = function (string, start, end) {
  var realStart = toNumber(start, 0);
  var realEnd = toNumber(end, string.length);
  if (realEnd == realStart) {
    return "";
  } else if (realEnd > realStart) {
    return slice(string, realStart, realEnd);
  } else {
    return slice(string, realEnd, realStart);
  }
};