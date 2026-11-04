// src/pages/shipper/dashboard/ShipperHome.jsx
import { useContext } from "react";
import { AuthContext } from "../../../contexts/AuthContext";
import LSP01Home from "./LSP01Home";
import LSP02Home from "./LSP02Home";
import LSP03Home from "./LSP03Home";

const ShipperHome = () => {
  const { user } = useContext(AuthContext);

  // Switch component theo lsp_ma (business key)
  switch (user?.lsp_ma) {
    case "LSP02":
      return <LSP02Home />;
    case "LSP03":
      return <LSP03Home />;
    case "LSP01":
    default:
      return <LSP01Home />;
  }
};

export default ShipperHome;
