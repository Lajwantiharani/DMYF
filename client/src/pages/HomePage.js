import React from 'react'
import { useSelector } from "react-redux";
import Spinner from '../components/Shared/Spinner';

const HomePage = () => {
  const { loading, error } = useSelector((state) => state.auth);
  return (
    <>
      {/* {error && <span> {alert(error)}</span>}
      {loading ? (
        <Spinner />
      ) : ( */}
        <>
          <h1>HomePage</h1>
        </>
     
    </>
  );
};

export default HomePage

