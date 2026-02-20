import React, { useEffect, useState } from "react";
import Layout from "../../components/Shared/Form/layout/layout";
import API from "../../services/API";
import moment from "moment";

const ReceiverList = () => {
  const [data, setData] = useState([]);
 

  // Fetch receiver data
  const getReceivers = async () => {
    try {
      const { data } = await API.get("/admin/receiver-list");
      if (data?.success) {
        setData(data?.receiverData);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getReceivers();
  }, []);



  // Delete receiver record
  const handleDelete = async (id) => {
    try {
      let answer = window.prompt(
        "Are you sure you want to delete this receiver?",
        "Sure"
      );
      if (!answer) return;
      const { data } = await API.delete(`/admin/delete-receiver/${id}`);
      alert(data?.message);
      getReceivers(); // Refresh the list after deletion
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Layout>
      <h2 className="text-center">Receiver Records</h2>

      <table className="table ">
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Email</th>
            <th scope="col">Phone</th>
            <th scope="col">Date</th>
            <th scope="col">Blood Group</th>

            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((record) => (
            <tr key={record._id}>
              <td>{record.name}</td>
              <td>{record.email}</td>
              <td>{record.phone}</td>
              <td>{moment(record.createdAt).format("DD/MM/YYYY hh:mm A")}</td>
              
              <td>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDelete(record._id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Layout>
  );
};

export default ReceiverList;
