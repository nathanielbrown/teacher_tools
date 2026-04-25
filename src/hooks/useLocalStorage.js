import { useState, useEffect } from 'react';

/**
 * A hook to manage state in localStorage.
 * @param {string} key The key to use in localStorage.
 * @param {any} initialValue The initial value if nothing is found in storage.
 * @returns {[any, Function]} A stateful value and a function to update it.
 */
export const useLocalStorage = (key, initialValue) => {
  const [state, setState] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`Error writing localStorage key "${key}":`, error);
    }
  }, [key, state]);

  return [state, setState];
};
