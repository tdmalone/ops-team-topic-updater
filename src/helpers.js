/**
 * Contains assorted helper functions.
 *
 * @author Tim Malone <tdmalone@gmail.com>
 */

'use strict';

/**
 * Maybe pluralises a word, depending on whether or not the provided number should be referred to
 * as a plural - i.e. anything but 1 or -1.
 *
 * @param {integer} number   The number in question.
 * @param {string}  singular The word as a singular.
 * @param {string}  plural   Optional. The word as a plural. If not supplied, the singular word
 *                           will be used instead, but with an 's' on the end.
 * @returns {string} The number, followed by the correct string based on whether the number is
 *                   plural or not.
 */
const maybePluralise = ( number, singular, plural ) => {
  plural = plural || singular + 's';
  return number + ' ' + ( 1 !== Math.abs( number ) ? plural : singular );
};

module.exports = {
  maybePluralise
};
