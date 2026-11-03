import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const TsAssistantRedirect: React.FC = () => {
  const { search, hash, state } = useLocation();
  return <Navigate to={{ pathname: '/assistants', search, hash }} state={state} replace />;
};

export default TsAssistantRedirect;
