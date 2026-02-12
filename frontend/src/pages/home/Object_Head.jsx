import { useState } from "react";
import DataTable from "../../components/DataTable/DataTable.jsx";
import TableButton from "../../components/ui/TableButton.jsx";
import FormOne from "../../components/Forms/FormOne.jsx";
import { createObjectHead } from "../../api/objectHead.api.js";
import { useObjectHead } from "../../hooks/useObjectHead";

const Object_Head = () => {
  const { objectHeads, loading } = useObjectHead();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const columns = [
    { key: "name", label: "Name" },
    { key: "sector", label: "Sector" },
    {
      key: "isActive",
      label: "Status",
      render: (value) => (
        <span
          className={`px-2 py-1 rounded text-sm font-medium ${
            value ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}>
          {value ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  const objectHeadFormFields = [
    {
      name: "name",
      label: "Name",
      type: "text",
      placeholder: "Enter object head name",
      required: true,
    },
    {
      name: "sector",
      label: "Sector",
      type: "text",
      placeholder: "Enter sector (optional)",
    },
  ];

  return (
    <>
      <div className={`${isModalOpen ? "hidden" : "block"} p-6 space-y-6`}>
        <h1 className="font-unbounded text-3xl font-normal">
          Object Head Management
        </h1>

        <DataTable
          data={objectHeads}
          columns={columns}
          loading={loading}
          searchableKeys={["name", "sector"]}
          pageSize={10}
          actionSlot={
            <TableButton
              name="Add New Object Head"
              onClick={() => setIsModalOpen(true)}
            />
          }
        />
      </div>

      {isModalOpen && (
        <FormOne
          isOpen={isModalOpen}
          title="Add New Object Head"
          fields={objectHeadFormFields}
          loading={saving}
          error={formError}
          onClose={() => {
            setFormError("");
            setIsModalOpen(false);
          }}
          onSubmit={async (data) => {
            setSaving(true);
            setFormError("");

            try {
              const payload = {
                name: data.name,
                sector: data.sector || null,
                isActive: true,
              };

              await createObjectHead(payload);
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

export default Object_Head;
