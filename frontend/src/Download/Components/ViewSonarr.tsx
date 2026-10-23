import React from 'react';
import Step from './Step';

interface ViewSonarrProps {
  number: number;
  isRemote?: boolean;
}

function ViewSonarr({ number, isRemote = true }: ViewSonarrProps) {
  return (
    <Step number={number} title="Open Sonarr">
      <p>
        Browse to <a href="http://localhost:8989">http://localhost:8989</a> to
        start using Sonarr.
        {isRemote
          ? ' Replace localhost with the server address if you are connecting from another machine.'
          : null}
      </p>
    </Step>
  );
}

export default ViewSonarr;
