import React from 'react';
import ReactCountryFlag from 'react-country-flag';

export const FlagIcon = ({ country, className = "" }: { country: string, className?: string }) => {
  return (
    <ReactCountryFlag
      countryCode={country}
      svg
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
      }}
      title={country}
    />
  );
};
