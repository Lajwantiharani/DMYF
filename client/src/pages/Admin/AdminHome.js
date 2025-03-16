import React from "react";
import Layout from "../../components/Shared/Form/layout/layout";
import { useSelector } from "react-redux";
const AdminHome = () => {
  const { user } = useSelector((state) => state.auth);
  return (
    <Layout>
      <div className="container">
        <div className="d-felx flex-column mt-4">
          <h1>
            Welcome Admin <i className="text-success">{user?.name}</i>
          </h1>
          <h3>Manage Blood Bank App </h3>
          <hr />
          <p>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Ad
            explicabo animi blanditiis incidunt dicta quia, quibusdam facere
            corporis! Dolores, reprehenderit cum sed repellat laudantium
            architecto natus est nostrum accusamus, odio aspernatur minima
            fugiat quam molestiae nisi. Temporibus impedit dolorem quia.
            Distinctio modi non excepturi illo odio voluptatum quae nostrum a
            temporibus sequi! Explicabo, quasi consequatur ad qui quos labore
            distinctio voluptates alias nostrum ab dicta aspernatur molestias
            adipisci quibusdam error ipsa.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default AdminHome;