import { useState } from "react";
import DataTable from "../../components/DataTable/DataTable.jsx";
import TableButton from "../../components/ui/TableButton.jsx";
import FormOne from "../../components/Forms/FormOne.jsx";
import { createCashier } from "../../api/cashier.api.js";

const Cashier = () => {
  const cashiers = [
    {
      id: 1,
      name: "Rajdeep",
      email: "rajdeep@mail.com",
      phone: "9876543210",
      code: "123",
      ddo: "12-D",
      status: "active",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      code: "123",
      ddo: "12-D",
      status: "inactive",
    },
    {
      id: 3,
      name: "Kangkan",
      email: "kng@mail.com",
      phone: "9123456789",
      code: "123",
      ddo: "12-D",
      status: "active",
    },
    {
      id: 3,
      name: "Kangkan",
      email: "kng@mail.com",
      phone: "9123456789",
      code: "123",
      ddo: "12-D",
      status: "active",
    },
    {
      id: 3,
      name: "Kangkan",
      email: "kng@mail.com",
      phone: "9123456789",
      code: "123",
      ddo: "12-D",
      status: "active",
    },
    {
      id: 3,
      name: "Kangkan",
      email: "kng@mail.com",
      phone: "9123456789",
      code: "123",
      ddo: "12-D",
      status: "active",
    },
    {
      id: 3,
      name: "Kangkan",
      email: "kng@mail.com",
      phone: "9123456789",
      code: "123",
      ddo: "12-D",
      status: "active",
    },
    {
      id: 3,
      name: "Kangkan",
      email: "kng@mail.com",
      phone: "9123456789",
      code: "123",
      ddo: "12-D",
      status: "active",
    },
    {
      id: 3,
      name: "Kangkan",
      email: "kng@mail.com",
      phone: "9123456789",
      code: "123",
      ddo: "12-D",
      status: "active",
    },
    {
      id: 3,
      name: "Kangkan",
      email: "kng@mail.com",
      phone: "9123456789",
      code: "123",
      ddo: "12-D",
      status: "active",
    },
    {
      id: 3,
      name: "Kangkan",
      email: "kng@mail.com",
      phone: "9123456789",
      code: "123",
      ddo: "12-D",
      status: "active",
    },
  ];

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "code", label: "Code" },
    { key: "ddo", label: "DDO" },
    {
      key: "status",
      label: "Status",
      render: (value) => (
        <span
          className={`px-2 py-1 rounded text-sm font-medium ${
            value === "active"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}>
          {value}
        </span>
      ),
    },
  ];

  const cashierFormFields = [
    { name: "name", label: "Name", type: "text", placeholder: "Enter name" },
    {
      name: "email",
      label: "Email",
      type: "email",
      placeholder: "Enter email",
    },
    { name: "phone", label: "Phone", type: "text", placeholder: "Enter phone" },
    { name: "code", label: "Code", type: "text", placeholder: "Enter code" },
    { name: "ddo", label: "DDO", type: "text", placeholder: "Enter DDO" },
  ];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  return (
    <>
      <div className={`${isModalOpen ? "hidden" : "block"} p-6 space-y-6`}>
        {/* Page Heading */}
        <h1 className="font-unbounded text-3xl font-normal">
          Cashier Management
        </h1>

        {/*  Table */}
        <DataTable
          data={cashiers}
          columns={columns}
          searchableKeys={["name", "email", "phone"]}
          statusKey="status"
          pageSize={10}
          actionSlot={
            <TableButton
              name="Add New Cashier"
              onClick={() => setIsModalOpen(true)}
            />
          }
        />
      </div>
      {isModalOpen && (
        <FormOne
          isOpen={isModalOpen}
          fields={cashierFormFields}
          onClose={() => {
            setFormError("");
            setIsModalOpen(false);
          }}
          title="Add New Cashier"
          loading={saving}
          error={formError}
          onSubmit={async (data) => {
            setSaving(true);
            setFormError("");
            try {
              const res = await createCashier(data);
              console.log("backend res", res.data);
              setIsModalOpen(false);
            } catch (error) {
              setFormError(error?.response?.data?.message || error.message);
              console.error(
                "Create cashier failed:",
                error?.response?.data || error.message
              );
            } finally {
              setSaving(false);
            }
          }}
        />
      )}
    </>
  );
};

export default Cashier;
