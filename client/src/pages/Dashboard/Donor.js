// const Donor = () => {
  //   const [data, setData] = useState([]);
  //   //find donor records
  //   const getDonors = async () => {
    //     try {
      //       const { data } = await API.get("/inventory/get-donors");
      //       //console.log(data);
      //       if (data?.success) {
        //         setData(data?.donors);
//       }
//     } catch (error) {
//       console.log(error);
//     }
//   };
//   useEffect(() => {
  //     getDonors();
  //   }, []);
  //   return (
    //     <Layout>
    //       <h1>Donor Page </h1>
    //       <table className="table">
    //         <thead>
    //           <tr>
//             <th scope="col">Name</th>
//             <th scope="col">Email</th>
//             <th scope="col">Phone</th>
//             <th scope="col">Date</th>
//           </tr>
//         </thead>
//         <tbody>
//           {data?.map((record) => (
//             <tr key={record._id}>
//               <td>{record.name || record.organizationName + "(ORG)"}</td>
//               <td>{record.email}</td>
//               <td>{record.phone}</td>
//               <td>{moment(record.createdAt).format("DD/MM/YYYY hh:mm A")}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </Layout>
//   );
// };

// export default Donor;


import Layout from "../../components/Shared/Form/layout/layout";
import { useSelector } from "react-redux";

const DonorProfile = () => {
  const { user } = useSelector((state) => state.auth);
  
  return (
    <Layout>
      <h2 className="mb-4">Donor Profile</h2>
      {user ? (
        <div className="card shadow p-4">
          <div className="row mb-3">
            <div className="col-md-6 mb-3">
              <strong>Name:</strong> {user.name}
            </div>
            <div className="col-md-6 mb-3">
              <strong>Email:</strong> {user.email}
            </div>
            <div className="col-md-6 mb-3">
              <strong>Phone:</strong> {user.phone}
            </div>
            <div className="col-md-6 mb-3">
              <strong>Address:</strong> {user.current_address || "N/A"}
            </div>
            <div className="col-md-6 mb-3">
              <strong>Blood Group:</strong> {user.bloodGroup || "N/A"}
            </div>
            <div className="col-md-6 mb-3">
              <strong>Nukh:</strong> {user.nukh || "N/A"}
            </div>
            <div className="col-md-6 mb-3">
              <strong>Native Town:</strong> {user.native_town || "N/A"}
            </div>
          </div>
        </div>
      ) : (
        <p>Loading profile...</p>
      )}
    </Layout>
  );
};

export default DonorProfile;
