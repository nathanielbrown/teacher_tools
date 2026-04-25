import React from 'react';

/**
 * Formatting utility functions.
 */

/**
 * Formats a number as currency.
 * @param {number} amount 
 * @param {string} symbol 
 * @returns {string}
 */
export const formatCurrency = (amount, symbol = '$') => {
  return `${symbol}${Number(amount).toFixed(2)}`;
};

/**
 * Formats a chemical formula with subscripts for numbers.
 * @param {string} formula 
 * @returns {JSX.Element[]}
 */
export const formatFormula = (formula) => {
  if (!formula) return '';
  return formula.split('').map((char, i) => {
    if (/[0-9]/.test(char)) {
      return <sub key={i} className="text-[0.6em]">{char}</sub>;
    }
    return char;
  });
};

/**
 * Formats seconds into MM:SS format.
 * @param {number} totalSeconds 
 * @returns {string}
 */
export const formatTime = (totalSeconds) => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
/**
 * Formats milliseconds into MM:SS.CC format.
 * @param {number} ms 
 * @returns {string}
 */
export const formatStopwatchTime = (ms) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const centiseconds = Math.floor((ms % 1000) / 10);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
};
