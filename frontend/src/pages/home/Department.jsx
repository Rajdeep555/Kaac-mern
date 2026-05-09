import React, { useState } from "react";
import DataTable from "../../components/DataTable/DataTable";
import TableButton from "../../components/ui/TableButton";
import FormOne from "../../components/Forms/FormOne";
import { useAllDepartments } from "../../hooks/useAllDepartments";
import { createDepartment } from "../../api/department.api";

const Department = () => {
  const { departments, loading, error } = useAllDepartments(); // ← use hook

  const columns = [
    { key: "name", label: "Name" },
    { key: "code", label: "Code" },
    { key: "sector", label: "Sector" },
    {
      key: "isActive",
      label: "Status",
      render: (value) => (
        <span
          className={`px-2 py-1 rounded text-sm font-medium ${
            value ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}>
          {value ? "active" : "inactive"}
        </span>
      ),
    },
  ];

  const departmentFormFields = [
    { name: "name", label: "Name", type: "text", placeholder: "Enter name" },
    { name: "code", label: "Code", type: "text", placeholder: "Enter Code" },
    {
      name: "sector",
      label: "Sector",
      type: "text",
      placeholder: "Enter Sector",
    },
  ];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  return (
    <>
      <div className={`${isModalOpen ? "hidden" : "block"} p-6 space-y-6`}>
        <h1 className="font-unbounded text-3xl font-normal">
          Department Management
        </h1>

        {error && (
          <p className="text-red-600 text-sm">Failed to load departments.</p>
        )}

        <DataTable
          data={departments} // ← real data
          columns={columns}
          searchableKeys={["name", "code", "sector"]}
          statusKey="isActive" // ← matches Prisma field name
          pageSize={10}
          loading={loading} // ← pass loading if DataTable supports it
          actionSlot={
            <TableButton
              name="Add New Department"
              onClick={() => setIsModalOpen(true)}
            />
          }
        />
      </div>

      {isModalOpen && (
        <FormOne
          isOpen={isModalOpen}
          fields={departmentFormFields}
          onClose={() => {
            setFormError("");
            setIsModalOpen(false);
          }}
          title="Add New Department"
          loading={saving}
          error={formError}
          onSubmit={async (data) => {
            setSaving(true);
            setFormError("");
            try {
              const res = await createDepartment(data);
              console.log("backend res", res.data);
              setIsModalOpen(false);
            } catch (error) {
              setFormError(error?.response?.data?.message || error.message);
            } finally {
              setSaving(false);
            }
          }}
        />
      )}
    </>
  );
};

export default Department;
