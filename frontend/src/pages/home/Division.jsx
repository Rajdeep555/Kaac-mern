import React, { useState } from "react";
import DataTable from "../../components/DataTable/DataTable";
import TableButton from "../../components/ui/TableButton";
import FormOne from "../../components/Forms/FormOne";
import { useDivisions } from "../../hooks/useDivisions.js";
import { createDivision } from "../../api/division.api";

const Division = () => {
  const { divisions, loading } = useDivisions();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const columns = [
    { key: "divisionName", label: "Division Name" },
    { key: "divisionCode", label: "Division Code" },
    { key: "sector", label: "Sector" },
  ];

  const divisionFormFields = [
    {
      name: "divisionName",
      label: "Division Name",
      type: "text",
      placeholder: "Enter division name",
      required: true,
    },
    {
      name: "divisionCode",
      label: "Division Code",
      type: "text",
      placeholder: "Enter division code",
      required: true,
    },
    {
      name: "sector",
      label: "Sector",
      type: "text",
      placeholder: "Enter sector",
    },
  ];

  return (
    <>
      <div className={`${isModalOpen ? "hidden" : "block"} p-6 space-y-6`}>
        <h1 className="font-unbounded text-3xl font-normal">
          Division Management
        </h1>

        <DataTable
          data={Array.isArray(divisions) ? divisions : []}
          columns={columns}
          loading={loading}
          searchableKeys={["divisionName", "divisionCode"]}
          pageSize={10}
          actionSlot={
            <TableButton
              name="Add New Division"
              onClick={() => setIsModalOpen(true)}
            />
          }
        />
      </div>

      {isModalOpen && (
        <FormOne
          isOpen={isModalOpen}
          title="Add New Division"
          fields={divisionFormFields}
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
                divisionName: data.divisionName,
                divisionCode: data.divisionCode,
                sector: data.sector,
              };

              await createDivision(payload);

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

export default Division;
