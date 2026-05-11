import { useState, useCallback } from "react";
import DataTable from "../../components/DataTable/DataTable";
import TableButton from "../../components/ui/TableButton";
import FormOne from "../../components/Forms/FormOne";
import AlertModal from "../../components/ui/AlertModal.jsx";
import { useDivisions } from "../../hooks/useDivisions.js";
import {
  createDivision,
  updateDivision,
  toggleDivisionStatus,
} from "../../api/division.api";
import { showToast } from "../../utils/toast.js";
import { AiFillEdit } from "react-icons/ai";
import { MdDelete, MdRestore } from "react-icons/md";

const Division = () => {
  const { divisions, setDivisions, loading, error } = useDivisions();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [editingDivision, setEditingDivision] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [alertModal, setAlertModal] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
    divId: null,
    isActive: null,
  });

  const handleEdit = (division) => {
    setEditingDivision(division);
    setFormError("");
    setIsModalOpen(true);
  };

  const openAlertModal = (divId, isActive) => {
    setAlertModal({
      open: true,
      title: isActive ? "Deactivate Division?" : "Reactivate Division?",
      message: isActive
        ? "This division will be marked as inactive."
        : "This division will be marked as active again.",
      onConfirm: () => handleToggleStatus(divId, isActive),
      divId,
      isActive,
    });
  };

  const handleToggleStatus = useCallback(
    async (divId, isActive) => {
      setActionLoading((prev) => ({ ...prev, [divId]: true }));
      try {
        await toggleDivisionStatus(divId);
        setDivisions((prev) =>
          prev.map((d) => (d.id === divId ? { ...d, isActive: !isActive } : d)),
        );
        showToast(
          isActive ? "Division deactivated!" : "Division reactivated!",
          "success",
        );
        setAlertModal((prev) => ({ ...prev, open: false }));
      } catch (error) {
        showToast("Operation failed", "error");
      } finally {
        setActionLoading((prev) => ({ ...prev, [divId]: false }));
      }
    },
    [setDivisions],
  );

  const handleSubmit = async (formData) => {
    setSaving(true);
    setFormError("");
    try {
      if (editingDivision) {
        const res = await updateDivision(editingDivision.id, formData);
        setDivisions((prev) =>
          prev.map((d) =>
            d.id === editingDivision.id ? res.data.division : d,
          ),
        );
        showToast("Division updated successfully!", "success");
      } else {
        const res = await createDivision({
          divisionName: formData.divisionName,
          divisionCode: formData.divisionCode,
          sector: formData.sector || undefined,
        });
        setDivisions((prev) => [...prev, res.data.division]);
        showToast("Division added successfully!", "success");
      }
      setIsModalOpen(false);
      setEditingDivision(null);
    } catch (error) {
      const errorMsg =
        error?.response?.data?.message || error.message || "Operation failed";
      setFormError(errorMsg);
      showToast(errorMsg, "error");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: "divisionName", label: "Division Name" },
    { key: "divisionCode", label: "Division Code" },
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
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => {
        const isLoading = actionLoading[row.id];
        return (
          <div className="flex gap-2">
            <button
              onClick={() => handleEdit(row)}
              disabled={isLoading}
              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors disabled:opacity-50"
              title="Edit">
              <AiFillEdit className="w-4 h-4" />
            </button>
            <button
              onClick={() => openAlertModal(row.id, row.isActive)}
              disabled={isLoading}
              className={`p-1.5 rounded transition-colors disabled:opacity-50 ${
                row.isActive
                  ? "text-red-600 hover:bg-red-100"
                  : "text-green-600 hover:bg-green-100"
              }`}
              title={row.isActive ? "Deactivate" : "Reactivate"}>
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : row.isActive ? (
                <MdDelete className="w-4 h-4" />
              ) : (
                <MdRestore className="w-4 h-4" />
              )}
            </button>
          </div>
        );
      },
    },
  ];

  // ✅ divisionCode disabled when editing
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
      required: !editingDivision,
      disabled: !!editingDivision,
    },
    {
      name: "sector",
      label: "Sector",
      type: "select",
      placeholder: "Select sector",
      options: [
        { label: "Council", value: "COUNCIL" },
        { label: "State", value: "STATE" },
      ],
    },
  ];

  return (
    <>
      <div className={`${isModalOpen ? "hidden" : "block"} p-6 space-y-6`}>
        <h1 className="font-unbounded text-3xl font-normal">
          Division Management
        </h1>

        {error && (
          <p className="text-red-600 text-sm">Failed to load divisions.</p>
        )}

        <DataTable
          data={Array.isArray(divisions) ? divisions : []}
          columns={columns}
          loading={loading}
          searchableKeys={["divisionName", "divisionCode", "sector"]}
          statusKey="isActive"
          pageSize={10}
          downloadFileName="divisions"
          printTitle="Division Report"
          actionSlot={
            <TableButton
              name="Add New Division"
              onClick={() => {
                setEditingDivision(null);
                setFormError("");
                setIsModalOpen(true);
              }}
            />
          }
        />
      </div>

      {isModalOpen && (
        <FormOne
          isOpen={isModalOpen}
          title={editingDivision ? "Edit Division" : "Add New Division"}
          fields={divisionFormFields}
          initialValues={editingDivision}
          loading={saving}
          error={formError}
          onClose={() => {
            setFormError("");
            setIsModalOpen(false);
            setEditingDivision(null);
          }}
          onSubmit={handleSubmit}
        />
      )}

      <AlertModal
        isOpen={alertModal.open}
        onClose={() => setAlertModal((prev) => ({ ...prev, open: false }))}
        onConfirm={alertModal.onConfirm}
        title={alertModal.title}
        message={alertModal.message}
        confirmText={alertModal.isActive ? "Deactivate" : "Reactivate"}
        loading={actionLoading[alertModal.divId]}
      />
    </>
  );
};

export default Division;
