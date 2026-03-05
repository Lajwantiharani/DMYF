import moment from "moment";
import React, { useEffect, useState } from "react";
import Layout from "../../components/Shared/Form/layout/layout";
import API from "../../services/API";
import { toast } from "react-toastify";
const HospitalList = () => {
  const [data, setData] = useState([]);
  //find donor records
  const getDonors = async () => {
    try {
      const { data } = await API.get("/admin/hospital-list");
      console.log(data);
      if (data?.success) {
        setData(data?.hospitalData);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getDonors();
  }, []);

  //DELETE FUNCTION
  const handelDelete = async (id) => {
    try {
      let answer = window.prompt(
        "Are You SUre Want To Delete This Hospital",
        "Sure"
      );
      if (!answer) return;
      const { data } = await API.delete(`/admin/delete-donor/${id}`);
      toast.success(data?.message || "Hospital deleted");
      setData((prev) => prev.filter((item) => item._id !== id));
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to delete hospital");
      console.log(error);
    }
  };

  return (
    <Layout>
      <div className="table-responsive">
        <table className="table ">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Email</th>
              <th scope="col">Phone</th>
              <th scope="col">Date</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((record) => (
              <tr key={record._id}>
                <td>{record.hospitalName}</td>
                <td>{record.email}</td>
                <td>{record.phone}</td>
                <td>{moment(record.createdAt).format("DD/MM/YYYY")}</td>
                <td>
                  <button
                    className="btn btn-danger"
                    onClick={() => handelDelete(record._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default HospitalList;
