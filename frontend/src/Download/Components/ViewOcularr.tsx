import React from 'react';
import Step from './Step';

interface ViewOcularrProps {
  number: number;
  isRemote?: boolean;
}

function ViewOcularr({ number, isRemote = true }: ViewOcularrProps) {
  return (
    <Step number={number} title="Open Ocularr">
      <p>
        Browse to <a href="http://localhost:8484">http://localhost:8484</a> to
        start using Ocularr.
        {isRemote
          ? ' Replace localhost with the server address if you are connecting from another machine.'
          : null}
      </p>
    </Step>
  );
}

export default ViewOcularr;
